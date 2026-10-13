import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { FeedbackInspectionState } from "../erp/feedbackInspection";
import { getFeedbackAvailability } from "../erp/feedbackAvailability";

type Props = {
  inspection: FeedbackInspectionState;
  onInspect: () => void;
};

const LABELS = {
  session: "Session",
  feedbackType: "Feedback type",
  subject: "Subject",
};

/** Only presents the inspector's result; knows nothing about WebView or DOM. */
export default function FeedbackInspectionPanel({ inspection, onInspect }: Props) {
  const availability = inspection.status === "ready"
    ? getFeedbackAvailability(inspection.snapshot) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Feedback Form Inspector</Text>
      <Text style={styles.help}>
        Navigate to Feedback Submission inside ERP, then inspect the open page.
        This does not change or submit any answers.
      </Text>

      <Pressable
        style={[styles.button, inspection.status === "loading" && styles.disabledButton]}
        onPress={onInspect}
        disabled={inspection.status === "loading"}
        accessibilityRole="button"
      >
        {inspection.status === "loading" ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Inspect Current ERP Page</Text>
        )}
      </Pressable>

      {inspection.status === "stale" && (
        <Text style={styles.warning}>
          The ERP form changed after the last inspection. Tap Inspect again for fresh results.
        </Text>
      )}

      {inspection.status === "error" && (
        <Text style={styles.warning}>{inspection.message}</Text>
      )}

      {inspection.status === "ready" && (
        <View style={styles.results}>
          <Text style={styles.fieldTitle}>{availability?.title}</Text>
          <Text style={styles.help}>{availability?.description}</Text>
          {inspection.snapshot.detected && (
            <>
              <Text style={styles.success}>Feedback form detected</Text>
          {inspection.snapshot.fields.map((field) => (
            <View key={field.field} style={styles.field}>
              <Text style={styles.fieldTitle}>{LABELS[field.field]}</Text>
              <Text style={styles.fieldDetails}>
                {field.present
                  ? `${field.optionCount} available option(s) · ${field.selectedValid ? "selected" : "selection needed"}${field.enabled ? "" : " · disabled"}`
                  : "Not on this page yet"}
              </Text>
              {field.optionLabels.length > 0 && (
                <Text style={styles.options}>
                  {field.optionLabels.join(" · ")}
                  {field.optionCount > field.optionLabels.length ? " · …" : ""}
                </Text>
              )}
            </View>
          ))}
          <Text style={styles.fieldDetails}>
            Candidate rating dropdowns: {inspection.snapshot.ratingSelectCount}
          </Text>
          <Text style={styles.fieldDetails}>
            Candidate rating radio groups: {inspection.snapshot.ratingRadioGroupCount}
          </Text>
          <Text style={styles.fieldDetails}>
            Submit button: {inspection.snapshot.submitButtonPresent ? "Found" : "Not found yet"}
          </Text>
          <Text style={styles.help}>
            Dependent options may only appear after you select an earlier dropdown in ERP.
          </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  heading: { fontSize: 16, fontWeight: "700", color: "#111827" },
  help: { marginTop: 7, fontSize: 12, lineHeight: 18, color: "#64748b" },
  button: {
    marginTop: 12, backgroundColor: "#0f172a", paddingVertical: 12,
    alignItems: "center", borderRadius: 12, minHeight: 44, justifyContent: "center",
  },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: "#ffffff", fontWeight: "600", fontSize: 13 },
  warning: { fontSize: 12, lineHeight: 18, marginTop: 10, color: "#b45309" },
  results: { marginTop: 12, gap: 7 },
  success: { fontWeight: "700", color: "#15803d", fontSize: 13 },
  field: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 10, gap: 3 },
  fieldTitle: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  fieldDetails: { fontSize: 12, lineHeight: 17, color: "#475569" },
  options: { fontSize: 11, lineHeight: 17, color: "#64748b" },
});
