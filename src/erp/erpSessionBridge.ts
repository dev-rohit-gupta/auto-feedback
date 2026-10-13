export type ErpSessionStatus = "checking" | "logged_in" | "logged_out" | "unknown";

/** Detect session from page structure, never read password/OTP or cookies. */
export const ERP_SESSION_SCRIPT = `
(function () {
  var status = "unknown";
  try {
    if (location.protocol === "https:" && location.hostname === "erp.mitra.ac.in") {
      var feedbackForm = document.querySelector(
        "#ctl00_ContentPlaceHolder1_ddlSession, " +
        "#ctl00_ContentPlaceHolder1_ddlFeedbackTyp, " +
        "#ctl00_ContentPlaceHolder1_ddlSubjectType"
      );

      var authenticatedMenu = Array.from(
        document.querySelectorAll("a, button, [role='menuitem']")
      ).some(function (element) {
        return /feedback submission|course exit feedback|log\\s*out|sign\\s*out/i.test(
          element.textContent || ""
        );
      });

      var loginForm = document.querySelector(
        "#txt_username, #txt_password, #btnLogin, " +
        "input[type='password'], input[autocomplete='username']"
      );

      status = feedbackForm || authenticatedMenu
        ? "logged_in"
        : loginForm
          ? "logged_out"
          : "unknown";
    }
  } catch (error) {
    status = "unknown";
  }

  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: "ERP_SESSION", status: status
    }));
  }
})();
true;
`;

/** Only accepts the three session results the injected detector emits. */
export function parseErpSessionMessage(value: unknown): ErpSessionStatus | null {
  if (typeof value !== "object" || value === null || !("type" in value) ||
      value.type !== "ERP_SESSION" || !("status" in value)) return null;
  return value.status === "logged_in" || value.status === "logged_out" ||
    value.status === "unknown" ? value.status : null;
}
