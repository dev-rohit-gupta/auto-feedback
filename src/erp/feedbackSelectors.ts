/** Legacy ERP identifiers, centralized for inspection and future adapters. */
export const FEEDBACK_FIELDS = [
  { field: "session", id: "ctl00_ContentPlaceHolder1_ddlSession" },
  { field: "feedbackType", id: "ctl00_ContentPlaceHolder1_ddlFeedbackTyp" },
  { field: "subject", id: "ctl00_ContentPlaceHolder1_ddlSubjectType" },
] as const;

export const FEEDBACK_SUBMIT_IDS = [
  "ctl00_ContentPlaceHolder1_btnFinalSubmit",
  "ctl00_ContentPlaceHolder1_btnSubmit",
] as const;
