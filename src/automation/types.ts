/** Domain types shared by demo and future live-ERP adapters. */
export type FeedbackMode = "excellent" | "average" | "poor" | "random";

export type RatingOption = Readonly<{
  value: string;
  label: string;
  /** Verified quality order, not the dropdown position or underlying value. */
  score: number;
}>;

export type FeedbackQuestion = Readonly<{
  id: string;
  prompt: string;
  options: readonly RatingOption[];
}>;

export type FeedbackForm = Readonly<{
  id: string;
  title: string;
  session: string;
  feedbackType: string;
  subject: string;
  questions: readonly FeedbackQuestion[];
}>;

export type FeedbackAnswer = Readonly<{
  questionId: string;
  optionValue: string;
  optionLabel: string;
}>;

export type FeedbackDraft = Readonly<{
  formId: string;
  mode: FeedbackMode;
  answers: readonly FeedbackAnswer[];
}>;

/** Interface kept narrow: filling is separate from any future submit operation. */
export interface FeedbackFormAdapter {
  readForm(): Promise<FeedbackForm>;
  applyDraft(draft: FeedbackDraft): Promise<void>;
  readAnswers(): Promise<readonly FeedbackAnswer[]>;
  reset(): Promise<void>;
}

export interface RatingStrategy {
  choose(mode: FeedbackMode, options: readonly RatingOption[]): RatingOption;
}
