import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { FeedbackDraft, FeedbackForm, FeedbackMode } from "../automation/types";
import { createOfflineFeedbackCoordinator } from "../mocks/createOfflineFeedbackCoordinator";

type Props = {
  mode: FeedbackMode;
  onModeChange: (mode: FeedbackMode) => void;
  onBack: () => void;
};

const MODES: readonly FeedbackMode[] = ["excellent", "average", "poor", "random"];

/** UI only: talks to the coordinator, never directly to a form or WebView. */
export default function OfflineFeedbackDemo({ mode, onModeChange, onBack }: Props) {
  const coordinator = useMemo(createOfflineFeedbackCoordinator, []);
  const [form, setForm] = useState<FeedbackForm | null>(null);
  const [draft, setDraft] = useState<FeedbackDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    coordinator.readForm()
      .then((result) => { if (mounted) setForm(result); })
      .catch(() => { if (mounted) setError("Could not load the offline form."); });
    return () => { mounted = false; };
  }, [coordinator]);

  const changeMode = async (next: FeedbackMode) => {
    if (busy) return;
    onModeChange(next);
    setDraft(null);
    setError(null);
    try {
      await coordinator.reset();
    } catch {
      setError("Unable to reset the offline form.");
    }
  };

  const fillDemo = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setDraft(null);
    try {
      const verified = await coordinator.fillAndReview(mode);
      setDraft(verified);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Demo filling failed.");
    } finally {
      setBusy(false);
    }
  };

  const resetDemo = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await coordinator.reset();
      setDraft(null);
      setError(null);
    } catch {
      setError("Unable to reset the offline form.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Offline Demo</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.demoBanner}>
          <Text style={styles.bannerTitle}>Safe test environment</Text>
          <Text style={styles.bannerText}>
            Synthetic questions and ratings only. No ERP session, network calls, or submissions.
          </Text>
        </View>
        {!form ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <>
            <Text style={styles.formTitle}>{form.title}</Text>
            <Text style={styles.metadata}>
              {form.session} · {form.feedbackType} · {form.subject}
            </Text>
            <Text style={styles.sectionTitle}>Rating mode</Text>
            <View style={styles.modes}>
              {MODES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => void changeMode(item)}
                  disabled={busy}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: item === mode }}
                  style={[styles.modeButton, item === mode && styles.activeMode]}
                >
                  <Text style={[styles.modeText, item === mode && styles.activeModeText]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.sectionTitle}>
              {draft ? "Review filled demo answers" : "Sample questions"}
            </Text>
            {form.questions.map((question, index) => {
              const answer = draft?.answers.find((item) => item.questionId === question.id);
              return (
                <View key={question.id} style={styles.question}>
                  <Text style={styles.questionText}>{index + 1}. {question.prompt}</Text>
                  <Text style={[styles.answer, answer && styles.filledAnswer]}>
                    {answer ? `Selected: ${answer.optionLabel}` : "Not filled"}
                  </Text>
                </View>
              );
            })}
          </>
        )}
        {error !== null && <Text style={styles.error}>{error}</Text>}
        {draft !== null && (
          <Text style={styles.success}>
            All {draft.answers.length} simulated answers were filled and verified. Nothing was submitted.
          </Text>
        )}
        <Pressable
          style={[styles.fillButton, (!form || busy) && styles.disabledButton]}
          onPress={() => void fillDemo()}
          disabled={!form || busy}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.fillText}>{draft ? "Fill Demo Again" : "Fill Demo Form"}</Text>
          )}
        </Pressable>
        {draft !== null && (
          <Pressable onPress={() => void resetDemo()} style={styles.resetButton} disabled={busy}>
            <Text style={styles.resetText}>Reset Demo</Text>
          </Pressable>
        )}
        <Text style={styles.disclaimer}>
          Live ERP integration and submission remain disabled until the real form is inspected.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexShrink: 1 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  backButton: { minHeight: 44, justifyContent: "center", paddingRight: 8 },
  backText: { fontSize: 16, color: "#2563eb", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  content: { paddingBottom: 12 },
  demoBanner: { backgroundColor: "#eff6ff", borderRadius: 12, padding: 12, gap: 5 },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: "#1d4ed8" },
  bannerText: { fontSize: 12, lineHeight: 18, color: "#334155" },
  formTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginTop: 16 },
  metadata: { color: "#64748b", fontSize: 12, lineHeight: 18, marginTop: 6 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginTop: 20, marginBottom: 10 },
  modes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modeButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "#cbd5e1" },
  activeMode: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  modeText: { fontSize: 12, color: "#475569", fontWeight: "600" },
  activeModeText: { color: "#1d4ed8" },
  question: { padding: 12, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, marginBottom: 8 },
  questionText: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  answer: { fontSize: 12, color: "#64748b", marginTop: 8 },
  filledAnswer: { color: "#15803d", fontWeight: "700" },
  error: { color: "#b91c1c", fontSize: 12, marginTop: 10 },
  success: { fontSize: 12, color: "#15803d", marginTop: 10, lineHeight: 18 },
  fillButton: { backgroundColor: "#2563eb", minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 12, marginTop: 18 },
  disabledButton: { opacity: 0.6 },
  fillText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  resetButton: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 6 },
  resetText: { color: "#334155", fontWeight: "600" },
  disclaimer: { fontSize: 11, lineHeight: 17, color: "#64748b", marginTop: 12, textAlign: "center" },
});
