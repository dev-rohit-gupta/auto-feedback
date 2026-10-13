import type { FeedbackFieldName, FeedbackFormSnapshot } from "./feedbackInspection";

export type FeedbackAvailability = Readonly<{
  step: "closed" | "session" | "feedbackType" | "subject" | "questions" | "needsVerification";
  title: string;
  description: string;
}>;

/** Pure interpretation of observed markup; never assumes closed forms are open. */
export function getFeedbackAvailability(snapshot: FeedbackFormSnapshot): FeedbackAvailability {
  if (snapshot.scanFailed || !snapshot.detected) {
    return {
      step: "closed",
      title: "Feedback form not available",
      description: "The current ERP page does not expose a feedback form. It may be closed or you may be on another page.",
    };
  }

  const field = (name: FeedbackFieldName) => snapshot.fields.find((item) => item.field === name);
  const required: { name: FeedbackFieldName; step: FeedbackAvailability["step"]; title: string }[] = [
    { name: "session", step: "session", title: "Select an academic session" },
    { name: "feedbackType", step: "feedbackType", title: "Select a feedback type" },
    { name: "subject", step: "subject", title: "Select a subject" },
  ];

  for (const item of required) {
    const current = field(item.name);
    if (!current?.present || !current.enabled || current.optionCount === 0) {
      return {
        step: item.step,
        title: item.title,
        description: "This dropdown is missing, disabled or has no available choices. Check the ERP page again when feedback opens.",
      };
    }
    if (!current.selectedValid) {
      return {
        step: item.step,
        title: item.title,
        description: "Select an available option directly in the ERP. We do not change ERP selections during inspection.",
      };
    }
  }

  if (snapshot.ratingSelectCount === 0 && snapshot.ratingRadioGroupCount === 0) {
    return {
      step: "questions",
      title: "Waiting for rating questions",
      description: "No rating controls are visible yet. They may load after an ERP postback or when feedback becomes available.",
    };
  }

  return {
    step: "needsVerification",
    title: "Candidate ratings found — live filling locked",
    description: "The form is visible, but we must verify its rating labels, scores and validation rules before enabling live filling.",
  };
}
