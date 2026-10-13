import { createFeedbackInspectorScript } from "./feedbackInspectorScript";
import {
  parseFeedbackInspectionResponse,
  type FeedbackFormSnapshot,
} from "./feedbackInspection";

/** Only the injection capability is required, not the WebView itself. */
export type InjectScript = (script: string) => void;

/** Correlates read-only inspections and discards replies from previous documents. */
export class LiveErpFeedbackProbe {
  private sequence = 0;
  private pendingId: string | null = null;

  request(inject: InjectScript): void {
    const id = String(++this.sequence);
    this.pendingId = id;
    inject(createFeedbackInspectorScript(id));
  }

  accept(payload: unknown): FeedbackFormSnapshot | null {
    const response = parseFeedbackInspectionResponse(payload);
    if (!response || this.pendingId !== response.requestId) return null;
    this.pendingId = null;
    return response.snapshot;
  }

  invalidate(): void {
    this.pendingId = null;
  }
}
