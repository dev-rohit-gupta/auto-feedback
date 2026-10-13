const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(compiled.outputText, filename);
};

const { LiveErpFeedbackProbe } = require("../src/erp/LiveErpFeedbackProbe.ts");
const { getFeedbackAvailability } = require("../src/erp/feedbackAvailability.ts");
const {
  createErpPageObserverScript, parseErpFormChange,
} = require("../src/erp/erpPageObserverScript.ts");
const { FEEDBACK_FIELDS } = require("../src/erp/feedbackSelectors.ts");

const blank = (field) => ({ field, present: false, enabled: false, selectedValid: false, optionCount: 0, optionLabels: [] });
const available = (field, selectedValid = true) => ({ field, present: true, enabled: true, selectedValid, optionCount: 2, optionLabels: ["First", "Second"] });
const snapshot = (fields, count = 0) => ({
  detected: fields.some((f) => f.present), scanFailed: false, fields,
  ratingSelectCount: count, ratingRadioGroupCount: 0, submitButtonPresent: false,
});
const fields = (a, b, c) => [a, b, c];

test("live probe correlates requests and rejects replies from old page", () => {
  const probe = new LiveErpFeedbackProbe();
  const scripts = [];
  probe.request((script) => scripts.push(script));
  assert.match(scripts[0], /ERP_FEEDBACK_INSPECTION/);
  probe.invalidate();
  const data = { type: "ERP_FEEDBACK_INSPECTION", requestId: "1", snapshot: snapshot(fields(blank("session"), blank("feedbackType"), blank("subject"))) };
  assert.equal(probe.accept(data), null);
  probe.request((script) => scripts.push(script));
  assert.equal(probe.accept(data), null);
  const fresh = { ...data, requestId: "2" };
  assert.deepEqual(probe.accept(fresh), fresh.snapshot);
  assert.equal(probe.accept(fresh), null);
  assert.equal(probe.accept({ ...fresh, requestId: "3" }), null);
});

test("malformed response is not accepted as form data", () => {
  const probe = new LiveErpFeedbackProbe();
  probe.request(() => {});
  const bad = { type: "ERP_FEEDBACK_INSPECTION", requestId: "1", snapshot: { ...snapshot(fields(blank("session"), blank("feedbackType"), blank("subject"))), fields: [blank("session")] } };
  assert.equal(probe.accept(bad), null);
});

test("readiness moves through closed, session, type, subject, questions and verification", () => {
  const empty = fields(blank("session"), blank("feedbackType"), blank("subject"));
  assert.equal(getFeedbackAvailability(snapshot(empty)).step, "closed");
  const first = fields(available("session", false), blank("feedbackType"), blank("subject"));
  assert.equal(getFeedbackAvailability(snapshot(first)).step, "session");
  const second = fields(available("session"), available("feedbackType", false), blank("subject"));
  assert.equal(getFeedbackAvailability(snapshot(second)).step, "feedbackType");
  const third = fields(available("session"), available("feedbackType"), available("subject", false));
  assert.equal(getFeedbackAvailability(snapshot(third)).step, "subject");
  const done = fields(available("session"), available("feedbackType"), available("subject"));
  assert.equal(getFeedbackAvailability(snapshot(done)).step, "questions");
  assert.equal(getFeedbackAvailability(snapshot(done, 4)).step, "needsVerification");
});

test("live inspection script reads only labels and selected state", () => {
  const probe = new LiveErpFeedbackProbe();
  let script = "";
  probe.request((value) => { script = value; });
  const posted = [];
  const fakeOptions = [
    { value: "", textContent: "-- Select --", disabled: false },
    { value: "62", textContent: "2026", disabled: false },
  ];
  const selections = new Map(FEEDBACK_FIELDS.map(({ id }) => [id, {
    id, tagName: "SELECT", disabled: false, options: fakeOptions, selectedIndex: 1,
  }]));
  vm.runInNewContext(script, {
    location: { protocol: "https:", hostname: "erp.mitra.ac.in" },
    window: { ReactNativeWebView: { postMessage(message) { posted.push(JSON.parse(message)); } } },
    document: {
      getElementById(id) { return selections.get(id) || null; },
      querySelectorAll(query) { return query === "table select" ? [{ id: "rating1" }] : []; },
    },
  });
  assert.equal(posted.length, 1);
  assert.equal(posted[0].snapshot.fields[0].selectedValid, true);
  assert.equal(posted[0].snapshot.ratingSelectCount, 1);
  assert.equal(posted[0].snapshot.fields[0].optionCount, 1);
  assert.equal(posted[0].snapshot.fields[0].optionLabels[0], "2026");
  assert.equal(probe.accept(posted[0]).ratingSelectCount, 1);
});

test("change observer detects known select changes and ASP.NET async postbacks", () => {
  const posted = [];
  const listeners = [];
  const callbacks = [];
  const window = {
    ReactNativeWebView: { postMessage(message) { posted.push(JSON.parse(message)); } },
    Sys: { WebForms: { PageRequestManager: { getInstance() { return { add_endRequest(callback) { callbacks.push(callback); } }; } } } },
  };
  const code = createErpPageObserverScript();
  const context = {
    window,
    location: { protocol: "https:", hostname: "erp.mitra.ac.in" },
    document: { addEventListener(type, callback) { if (type === "change") listeners.push(callback); } },
  };
  vm.runInNewContext(code, context);
  vm.runInNewContext(code, context);
  assert.equal(listeners.length, 1);
  assert.equal(callbacks.length, 1);
  listeners[0]({ target: { id: "not-feedback" } });
  assert.equal(posted.length, 0);
  listeners[0]({ target: { id: FEEDBACK_FIELDS[0].id } });
  callbacks[0]();
  assert.deepEqual(posted.map((event) => parseErpFormChange(event)), ["selection", "partial_postback"]);
  assert.equal(parseErpFormChange({ type: "ERP_FEEDBACK_PAGE_CHANGED", reason: "submit" }), null);
});

test("observer and inspection refuse unknown origins", () => {
  const posted = [];
  const script = createErpPageObserverScript();
  vm.runInNewContext(script, {
    location: { protocol: "https:", hostname: "not-erp.example" },
    window: { ReactNativeWebView: { postMessage(message) { posted.push(message); } } },
    document: { addEventListener() { throw new Error("must not register"); } },
  });
  assert.equal(posted.length, 0);
});
