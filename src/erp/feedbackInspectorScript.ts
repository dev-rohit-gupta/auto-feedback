import { FEEDBACK_FIELDS, FEEDBACK_SUBMIT_IDS } from "./feedbackSelectors";

/**
 * Generates a single read-only WebView inspection request.
 * Never reads password/OTP fields, session cookies, or form tokens.
 */
export function createFeedbackInspectorScript(requestId: string): string {
  if (!/^\d{1,10}$/.test(requestId)) {
    throw new Error("Invalid feedback inspection request ID");
  }

  const selectors = JSON.stringify(FEEDBACK_FIELDS);
  const submitIds = JSON.stringify(FEEDBACK_SUBMIT_IDS);
  const id = JSON.stringify(requestId);

  return `
(function () {
  if (location.protocol !== "https:" || location.hostname !== "erp.mitra.ac.in") return;
  if (!window.ReactNativeWebView) return;

  var fieldDefs = ${selectors};
  var submitIds = ${submitIds};
  var result;

  try {
    var fields = fieldDefs.map(function (def) {
      var element = document.getElementById(def.id);
      var select = element && element.tagName === "SELECT" ? element : null;
      var options = select ? Array.from(select.options) : [];
      var actualLabels = options.filter(function (option) {
        var label = (option.textContent || "").trim();
        return !option.disabled && option.value !== "" &&
          !/^(?:--\\s*)?(?:select|choose)\\b/i.test(label);
      });

      var selected = select && select.selectedIndex >= 0
        ? select.options[select.selectedIndex] : null;
      var selectedLabel = selected ? (selected.textContent || "").trim() : "";
      var selectedValid = Boolean(selected && !selected.disabled &&
        selected.value !== "" && !/^(?:--\\s*)?(?:select|choose)\\b/i.test(selectedLabel));

      return {
        field: def.field,
        selectedValid: selectedValid,
        present: Boolean(select),
        enabled: Boolean(select && !select.disabled),
        optionCount: actualLabels.length,
        optionLabels: actualLabels.slice(0, 8).map(function (option) {
          return (option.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 80);
        })
      };
    });

    var fieldIds = fieldDefs.map(function (def) { return def.id; });
    var ratingSelectCount = Array.from(document.querySelectorAll("table select"))
      .filter(function (element) { return fieldIds.indexOf(element.id) === -1; }).length;
    var radioNames = Array.from(document.querySelectorAll("table input[type='radio']"))
      .map(function (element) { return element.name || element.id; })
      .filter(Boolean);
    var ratingRadioGroupCount = Array.from(new Set(radioNames)).length;

    result = {
      detected: fields.some(function (field) { return field.present; }),
      scanFailed: false,
      fields: fields,
      ratingSelectCount: ratingSelectCount,
      ratingRadioGroupCount: ratingRadioGroupCount,
      submitButtonPresent: submitIds.some(function (buttonId) {
        return Boolean(document.getElementById(buttonId));
      })
    };
  } catch (error) {
    result = {
      detected: false,
      scanFailed: true,
      fields: fieldDefs.map(function (def) {
        return {field: def.field, present: false, enabled: false, selectedValid: false, optionCount: 0, optionLabels: []};
      }),
      ratingSelectCount: 0,
      ratingRadioGroupCount: 0,
      submitButtonPresent: false
    };
  }

  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: "ERP_FEEDBACK_INSPECTION",
    requestId: ${id},
    snapshot: result
  }));
})();
true;
`;
}
