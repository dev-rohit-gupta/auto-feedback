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

const { FEATURES } = require("../src/config/features.ts");
const { isErpUrl } = require("../src/config/erp.ts");
const { ERP_ALERT_SCRIPT, parseErpAlertMessage } = require("../src/erp/erpAlertBridge.ts");
const { ERP_SESSION_SCRIPT, parseErpSessionMessage } = require("../src/erp/erpSessionBridge.ts");

test("offline demo is disabled by default, but mock engine stays available", () => {
  assert.equal(FEATURES.offlineDemo, false);
  assert.equal(FEATURES.customErpAlerts, true);
  assert.equal(typeof require("../src/mocks/createOfflineFeedbackCoordinator.ts").createOfflineFeedbackCoordinator, "function");
});

test("only the exact HTTPS ERP origin is trusted", () => {
  assert.equal(isErpUrl("https://erp.mitra.ac.in/"), true);
  assert.equal(isErpUrl("https://erp.mitra.ac.in/Feedback.aspx?x=1"), true);
  assert.equal(isErpUrl("http://erp.mitra.ac.in/"), false);
  assert.equal(isErpUrl("https://erp.mitra.ac.in.evil.example/"), false);
  assert.equal(isErpUrl("https://evil.example/?redirect=erp.mitra.ac.in"), false);
});

test("alert injection intercepts ERP alerts but not unrelated websites", () => {
  const posted = [];
  const context = {
    location: { protocol: "https:", hostname: "erp.mitra.ac.in" },
    window: {
      alert: () => { throw new Error("Native alert should not run"); },
      ReactNativeWebView: { postMessage(raw) { posted.push(JSON.parse(raw)); } },
    },
  };
  vm.runInNewContext(ERP_ALERT_SCRIPT, context);
  vm.runInNewContext(ERP_ALERT_SCRIPT, context);
  context.window.alert("OTP sent");
  assert.deepEqual(posted, [{ type: "ERP_ALERT", message: "OTP sent" }]);
  assert.equal(parseErpAlertMessage(posted[0]), "OTP sent");
  assert.equal(parseErpAlertMessage({ type: "ERP_ALERT", message: 2 }), null);

  let untouched = false;
  const foreign = {
    location: { protocol: "https:", hostname: "evil.example" },
    window: { alert: () => { untouched = true; } },
  };
  vm.runInNewContext(ERP_ALERT_SCRIPT, foreign);
  foreign.window.alert("Original");
  assert.equal(untouched, true);
  assert.equal(foreign.window.__erpAlertBridgeInstalled, undefined);
});

test("session check returns logged-out on login forms without reading inputs", () => {
  const posted = [];
  const context = {
    location: { protocol: "https:", hostname: "erp.mitra.ac.in" },
    window: { ReactNativeWebView: { postMessage(raw) { posted.push(JSON.parse(raw)); } } },
    document: {
      querySelector(selector) { return selector.includes("input[type='password']") ? { tagName: "INPUT" } : null; },
      querySelectorAll() { return []; },
    },
  };
  vm.runInNewContext(ERP_SESSION_SCRIPT, context);
  assert.equal(parseErpSessionMessage(posted[0]), "logged_out");
  assert.equal(parseErpSessionMessage({ type: "ERP_SESSION", status: "checking" }), null);
});

test("session check recognizes authenticated menu without passwords or OTP", () => {
  const posted = [];
  const context = {
    location: { protocol: "https:", hostname: "erp.mitra.ac.in" },
    window: { ReactNativeWebView: { postMessage(raw) { posted.push(JSON.parse(raw)); } } },
    document: {
      querySelector() { return null; },
      querySelectorAll() { return [{ textContent: "Feedback Submission" }]; },
    },
  };
  vm.runInNewContext(ERP_SESSION_SCRIPT, context);
  assert.equal(parseErpSessionMessage(posted[0]), "logged_in");
  assert.deepEqual(Object.keys(posted[0]).sort(), ["status", "type"]);
});
