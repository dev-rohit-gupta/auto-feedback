/**
 * Install before page scripts: some ERP OTP alerts occur before load completes.
 * Only intercept alerts on the approved ERP origin; never touch other sites.
 */
export const ERP_ALERT_SCRIPT = `
(function () {
  if (location.protocol !== "https:" || location.hostname !== "erp.mitra.ac.in") return;
  if (window.__erpAlertBridgeInstalled) return;
  window.__erpAlertBridgeInstalled = true;

  var originalAlert = window.alert.bind(window);
  window.alert = function (message) {
    try {
      if (!window.ReactNativeWebView) return originalAlert(message);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "ERP_ALERT", message: String(message ?? "")
      }));
    } catch (error) {
      originalAlert(message);
    }
  };
})();
true;
`;

export function parseErpAlertMessage(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("type" in value) ||
      value.type !== "ERP_ALERT" || !("message" in value) ||
      typeof value.message !== "string") return null;
  return value.message.slice(0, 2000);
}
