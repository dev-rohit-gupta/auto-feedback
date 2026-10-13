import { FEEDBACK_FIELDS } from "./feedbackSelectors";

export type ErpFormChangeReason = "selection" | "partial_postback";

/** Does not collect form values, cookies, tokens or student data. */
export function createErpPageObserverScript(): string {
  const ids = JSON.stringify(FEEDBACK_FIELDS.map((field) => field.id));
  return `
(function () {
  if (location.protocol !== "https:" || location.hostname !== "erp.mitra.ac.in") return;
  if (!window.ReactNativeWebView || window.__autoFeedbackChangeObserver) return;
  window.__autoFeedbackChangeObserver = true;

  var watchedIds = ${ids};
  function report(reason) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "ERP_FEEDBACK_PAGE_CHANGED", reason: reason
    }));
  }

  document.addEventListener("change", function (event) {
    var target = event.target;
    if (target && watchedIds.indexOf(target.id) !== -1) report("selection");
  }, true);

  try {
    var forms = window.Sys && window.Sys.WebForms;
    var manager = forms && forms.PageRequestManager && forms.PageRequestManager.getInstance();
    if (manager && typeof manager.add_endRequest === "function") {
      manager.add_endRequest(function () { report("partial_postback"); });
    }
  } catch (error) {
    // ERP may not use the ASP.NET AJAX PageRequestManager on this page.
  }
})();
true;
`;
}

export function parseErpFormChange(payload: unknown): ErpFormChangeReason | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  if (record.type !== "ERP_FEEDBACK_PAGE_CHANGED") return null;
  return record.reason === "selection" || record.reason === "partial_postback"
    ? record.reason : null;
}
