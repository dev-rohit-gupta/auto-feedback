import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { FeedbackMode } from "../automation/types";
import { FEATURES } from "../config/features";
import type { ErpSessionStatus } from "../erp/erpSessionBridge";
import type { FeedbackInspectionState } from "../erp/feedbackInspection";
import ErpLoginGate from "./ErpLoginGate";
import FeedbackInspectionPanel from "./FeedbackInspectionPanel";
import FeedbackModeSelector from "./FeedbackModeSelector";
import OfflineFeedbackDemo from "./OfflineFeedbackDemo";

type Props = {
  mode: FeedbackMode;
  onModeChange: (mode: FeedbackMode) => void;
  sessionStatus: ErpSessionStatus;
  onCheckSession: () => void;
  inspection: FeedbackInspectionState;
  onInspectFeedbackPage: () => void;
};

/** Optional demo entry; it is never rendered when FEATURES.offlineDemo is false. */
function DemoEntry({ onPress, loggedIn }: { onPress: () => void; loggedIn: boolean }) {
  return (
    <Pressable style={styles.demoButton} onPress={onPress} accessibilityRole="button">
      <Text style={styles.demoButtonText}>Try Offline Demo</Text>
      <Text style={styles.demoButtonHelp}>
        {loggedIn ? "Use sample questions; no ERP submission" :
          "No login required · No ERP submission"}
      </Text>
    </Pressable>
  );
}

/** Owns menu presentation only; knows nothing about WebView scripts or ERP navigation. */
export default function FeedbackMenu({
  mode,
  onModeChange,
  sessionStatus,
  onCheckSession,
  inspection,
  onInspectFeedbackPage,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const closeMenu = () => {
    setDemoOpen(false);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        style={styles.floatingButton}
        onPress={() => {
          setVisible(true);
          onCheckSession();
        }}
        accessibilityRole="button"
        accessibilityLabel="Open feedback menu"
      >
        <Text style={styles.floatingIcon}>⚡</Text>
        <Text style={styles.floatingText}>Feedback</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => {
          if (FEATURES.offlineDemo && demoOpen) setDemoOpen(false);
          else closeMenu();
        }}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={closeMenu} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <View style={styles.handle} />

            {FEATURES.offlineDemo && demoOpen ? (
              <OfflineFeedbackDemo
                mode={mode}
                onModeChange={onModeChange}
                onBack={() => setDemoOpen(false)}
              />
            ) : (
              <>
                <View style={styles.header}>
                  <View style={styles.heading}>
                    <Text style={styles.title}>Quick Feedback</Text>
                    <Text style={styles.subtitle}>Choose your rating preference</Text>
                  </View>
                  <Pressable
                    style={styles.closeButton}
                    onPress={closeMenu}
                    accessibilityRole="button"
                    accessibilityLabel="Close feedback menu"
                  >
                    <Text style={styles.closeText}>✕</Text>
                  </Pressable>
                </View>

                {sessionStatus === "logged_in" ? (
                  <>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      <FeedbackModeSelector mode={mode} onModeChange={onModeChange} />
                      <FeedbackInspectionPanel
                        inspection={inspection}
                        onInspect={onInspectFeedbackPage}
                      />
                      {FEATURES.offlineDemo && (
                        <DemoEntry onPress={() => setDemoOpen(true)} loggedIn />
                      )}
                    </ScrollView>
                    <Pressable
                      style={styles.doneButton}
                      onPress={closeMenu}
                      accessibilityRole="button"
                    >
                      <Text style={styles.doneText}>Save Selection</Text>
                    </Pressable>
                    <Text style={styles.footer}>
                      Selection saved for this app session. No feedback has been submitted.
                    </Text>
                  </>
                ) : (
                  <>
                    <ErpLoginGate
                      status={sessionStatus}
                      onLogin={closeMenu}
                      onRetry={onCheckSession}
                    />
                    {FEATURES.offlineDemo && (
                      <DemoEntry onPress={() => setDemoOpen(true)} loggedIn={false} />
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute", bottom: 20, left: 16, zIndex: 10,
    flexDirection: "row", alignItems: "center", backgroundColor: "#2563eb",
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 30,
    elevation: 8, shadowColor: "#000", shadowOpacity: 0.2,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  floatingIcon: { fontSize: 18, marginRight: 7 },
  floatingText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: "85%", elevation: 15,
  },
  handle: {
    width: 42, height: 5, borderRadius: 10, backgroundColor: "#d1d5db",
    alignSelf: "center", marginBottom: 24,
  },
  header: {
    flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between",
    marginBottom: 22,
  },
  heading: { flex: 1, paddingRight: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 5 },
  closeButton: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
  },
  closeText: { fontSize: 16, color: "#374151" },
  doneButton: {
    backgroundColor: "#2563eb", paddingVertical: 16,
    borderRadius: 14, alignItems: "center", marginTop: 10,
  },
  doneText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  footer: {
    fontSize: 11, color: "#94a3b8", textAlign: "center",
    marginTop: 14, lineHeight: 16,
  },
  demoButton: {
    backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#86efac",
    borderRadius: 12, padding: 12, alignItems: "center", marginTop: 12,
  },
  demoButtonText: { color: "#166534", fontSize: 14, fontWeight: "700" },
  demoButtonHelp: { color: "#475569", fontSize: 11, marginTop: 4 },
});
