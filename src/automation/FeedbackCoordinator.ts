import type {
  FeedbackAnswer,
  FeedbackDraft,
  FeedbackForm,
  FeedbackFormAdapter,
  FeedbackMode,
  RatingStrategy,
} from "./types";

/** No WebView, UI, storage or submit dependency. */
export class FeedbackCoordinator {
  constructor(
    private readonly adapter: FeedbackFormAdapter,
    private readonly strategy: RatingStrategy,
  ) {}

  readForm(): Promise<FeedbackForm> {
    return this.adapter.readForm();
  }

  async prepare(mode: FeedbackMode): Promise<FeedbackDraft> {
    const form = await this.adapter.readForm();
    if (!form.id || form.questions.length === 0) {
      throw new Error("The feedback form has no available questions.");
    }
    const ids = new Set<string>();
    const answers: FeedbackAnswer[] = form.questions.map((question) => {
      if (!question.id || ids.has(question.id)) {
        throw new Error("The form contains duplicate or missing question IDs.");
      }
      ids.add(question.id);
      const option = this.strategy.choose(mode, question.options);
      return {
        questionId: question.id,
        optionValue: option.value,
        optionLabel: option.label,
      };
    });
    return { formId: form.id, mode, answers };
  }

  async fillAndReview(mode: FeedbackMode): Promise<FeedbackDraft> {
    const planned = await this.prepare(mode);
    await this.adapter.applyDraft(planned);
    const actual = await this.adapter.readAnswers();
    if (actual.length !== planned.answers.length ||
        planned.answers.some((answer) => !actual.some((value) =>
          value.questionId === answer.questionId &&
          value.optionValue === answer.optionValue))) {
      throw new Error("Some demo answers could not be verified after filling.");
    }
    return { ...planned, answers: actual };
  }

  reset(): Promise<void> {
    return this.adapter.reset();
  }
}
