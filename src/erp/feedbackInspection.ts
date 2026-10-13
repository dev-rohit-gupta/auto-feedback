/** Read-only, intentionally small snapshot of ERP feedback controls. */
export type FeedbackFieldName = "session" | "feedbackType" | "subject";

export type FeedbackFieldSnapshot = {
  field: FeedbackFieldName;
  present: boolean;
  enabled: boolean;
  selectedValid: boolean;
  optionCount: number;
  optionLabels: string[];
};

export type FeedbackFormSnapshot = {
  detected: boolean;
  scanFailed: boolean;
  fields: FeedbackFieldSnapshot[];
  ratingSelectCount: number;
  ratingRadioGroupCount: number;
  submitButtonPresent: boolean;
};

export type FeedbackInspectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "stale" }
  | { status: "ready"; snapshot: FeedbackFormSnapshot }
  | { status: "error"; message: string };

type InspectionResponse = {
  requestId: string;
  snapshot: FeedbackFormSnapshot;
};

const FIELD_NAMES: FeedbackFieldName[] = [
  "session", "feedbackType", "subject",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Parse only our known bridge shape; never trust arbitrary webpage messages. */
export function parseFeedbackInspectionResponse(
  payload: unknown,
): InspectionResponse | null {
  if (!isRecord(payload) || payload.type !== "ERP_FEEDBACK_INSPECTION") {
    return null;
  }
  if (typeof payload.requestId !== "string" || !/^\d{1,10}$/.test(payload.requestId)) {
    return null;
  }

  const snapshot = payload.snapshot;
  if (!isRecord(snapshot) || typeof snapshot.detected !== "boolean" ||
      typeof snapshot.scanFailed !== "boolean" ||
      !Array.isArray(snapshot.fields) || snapshot.fields.length !== 3 ||
      typeof snapshot.submitButtonPresent !== "boolean") {
    return null;
  }

  const validCount = (n: unknown): n is number =>
    typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 10000;

  if (!validCount(snapshot.ratingSelectCount) ||
      !validCount(snapshot.ratingRadioGroupCount)) {
    return null;
  }

  const fields: FeedbackFieldSnapshot[] = [];
  for (let i = 0; i < FIELD_NAMES.length; i += 1) {
    const item = snapshot.fields[i];
    if (!isRecord(item) || item.field !== FIELD_NAMES[i] ||
        typeof item.present !== "boolean" ||
        typeof item.enabled !== "boolean" ||
        typeof item.selectedValid !== "boolean" ||
        !validCount(item.optionCount) ||
        !Array.isArray(item.optionLabels) || item.optionLabels.length > 8 ||
        !item.optionLabels.every((label) =>
          typeof label === "string" && label.length <= 80)) {
      return null;
    }
    fields.push({
      field: FIELD_NAMES[i],
      present: item.present,
      enabled: item.enabled,
      selectedValid: item.selectedValid,
      optionCount: item.optionCount,
      optionLabels: item.optionLabels,
    });
  }

  return {
    requestId: payload.requestId,
    snapshot: {
      detected: snapshot.detected,
      scanFailed: snapshot.scanFailed,
      fields,
      ratingSelectCount: snapshot.ratingSelectCount,
      ratingRadioGroupCount: snapshot.ratingRadioGroupCount,
      submitButtonPresent: snapshot.submitButtonPresent,
    },
  };
}
