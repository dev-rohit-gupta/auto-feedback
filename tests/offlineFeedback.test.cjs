const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

// Transpile local domain modules for Node tests without adding a test runner.
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(output.outputText, filename);
};

const { ScoredRatingStrategy } = require("../src/automation/RatingStrategy.ts");
const { FeedbackCoordinator } = require("../src/automation/FeedbackCoordinator.ts");
const { MockFeedbackFormAdapter } = require("../src/mocks/MockFeedbackFormAdapter.ts");
const { MOCK_FEEDBACK_FORM } = require("../src/mocks/mockFeedbackFixture.ts");

const ratingOptions = MOCK_FEEDBACK_FORM.questions[0].options;

test("excellent, average and poor respect scores, not HTML option positions", () => {
  const strategy = new ScoredRatingStrategy();
  const reversed = [...ratingOptions].reverse();
  assert.equal(strategy.choose("excellent", reversed).label, "Excellent");
  assert.equal(strategy.choose("average", reversed).label, "Average");
  assert.equal(strategy.choose("poor", reversed).label, "Poor");
});

test("random mode chooses a valid rating and supports deterministic testing", () => {
  const strategy = new ScoredRatingStrategy(() => 0.99);
  assert.equal(strategy.choose("random", ratingOptions).label, "Poor");
  assert.throws(() => new ScoredRatingStrategy(() => 1).choose("random", ratingOptions));
});

test("coordinator fills the mock and reads back all answers", async () => {
  const adapter = new MockFeedbackFormAdapter();
  const coordinator = new FeedbackCoordinator(adapter, new ScoredRatingStrategy());
  const draft = await coordinator.fillAndReview("average");
  assert.equal(draft.answers.length, MOCK_FEEDBACK_FORM.questions.length);
  assert(draft.answers.every((answer) => answer.optionLabel === "Average"));
  const stored = await adapter.readAnswers();
  assert.deepEqual(stored, draft.answers);
  await coordinator.reset();
  assert.deepEqual(await adapter.readAnswers(), []);
});

test("adapter rejects an invalid answer atomically", async () => {
  const adapter = new MockFeedbackFormAdapter();
  const coordinator = new FeedbackCoordinator(adapter, new ScoredRatingStrategy());
  const original = await coordinator.fillAndReview("excellent");
  const invalid = {
    ...original,
    answers: original.answers.map((a, i) => i ? a : { ...a, optionValue: "999" }),
  };
  await assert.rejects(adapter.applyDraft(invalid), /Invalid rating/);
  assert.deepEqual(await adapter.readAnswers(), original.answers);
});

test("coordinator rejects a form with duplicate question IDs", async () => {
  const duplicate = {
    ...MOCK_FEEDBACK_FORM,
    questions: [MOCK_FEEDBACK_FORM.questions[0], MOCK_FEEDBACK_FORM.questions[0]],
  };
  const adapter = new MockFeedbackFormAdapter(duplicate);
  const coordinator = new FeedbackCoordinator(adapter, new ScoredRatingStrategy());
  await assert.rejects(coordinator.prepare("excellent"), /duplicate/);
});

test("feedback adapter contract has no submission operation", () => {
  const adapter = new MockFeedbackFormAdapter();
  assert.equal("submit" in adapter, false);
  assert.equal("send" in adapter, false);
});
