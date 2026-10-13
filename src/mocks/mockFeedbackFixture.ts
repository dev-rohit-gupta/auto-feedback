import type { FeedbackForm, RatingOption } from "../automation/types";

const RATINGS: readonly RatingOption[] = [
  { value: "5", label: "Excellent", score: 5 },
  { value: "4", label: "Very good", score: 4 },
  { value: "3", label: "Average", score: 3 },
  { value: "2", label: "Below average", score: 2 },
  { value: "1", label: "Poor", score: 1 },
];

/** Synthetic data only; not assumed to match the current ERP markup. */
export const MOCK_FEEDBACK_FORM: FeedbackForm = {
  id: "offline-demo-form-v1",
  title: "Sample Faculty Feedback",
  session: "Demo Academic Session",
  feedbackType: "Faculty Feedback (Demo)",
  subject: "Sample Subject",
  questions: [
    { id: "teaching", prompt: "Clarity of teaching", options: RATINGS },
    { id: "materials", prompt: "Usefulness of course materials", options: RATINGS },
    { id: "doubts", prompt: "How well questions are answered", options: RATINGS },
    { id: "practical", prompt: "Quality of practical sessions", options: RATINGS },
  ],
};
