import type {
  FeedbackAnswer,
  FeedbackDraft,
  FeedbackForm,
  FeedbackFormAdapter,
} from "../automation/types";
import { MOCK_FEEDBACK_FORM } from "./mockFeedbackFixture";

/** In-memory implementation. Makes no ERP/network/WebView calls. */
export class MockFeedbackFormAdapter implements FeedbackFormAdapter {
  private answers: FeedbackAnswer[] = [];

  constructor(private readonly form: FeedbackForm = MOCK_FEEDBACK_FORM) {}

  async readForm(): Promise<FeedbackForm> {
    return this.form;
  }

  async applyDraft(draft: FeedbackDraft): Promise<void> {
    if (draft.formId !== this.form.id ||
        draft.answers.length !== this.form.questions.length) {
      throw new Error("The selected answers do not match the demo form.");
    }

    const answersById = new Map<string, FeedbackAnswer>();
    for (const answer of draft.answers) {
      if (answersById.has(answer.questionId)) {
        throw new Error("Duplicate feedback answer.");
      }
      answersById.set(answer.questionId, answer);
    }

    // Validate all answers before changing any state (atomic mock update).
    const nextAnswers = this.form.questions.map((question) => {
      const answer = answersById.get(question.id);
      const option = question.options.find(
        (candidate) => candidate.value === answer?.optionValue,
      );
      if (!answer || !option || option.label !== answer.optionLabel) {
        throw new Error(`Invalid rating for ${question.prompt}.`);
      }
      return { ...answer };
    });
    this.answers = nextAnswers;
  }

  async readAnswers(): Promise<readonly FeedbackAnswer[]> {
    return this.answers.map((answer) => ({ ...answer }));
  }

  async reset(): Promise<void> {
    this.answers = [];
  }
}
