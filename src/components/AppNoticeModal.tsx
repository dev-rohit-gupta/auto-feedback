import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type AppNotice = Readonly<{
  title: string;
  message: string;
  kind: "info" | "error";
}>;

type Props = {
  notice: AppNotice | null;
  onDismiss: () => void;
};

/** All native notifications share a single presentational component. */
export default function AppNoticeModal({ notice, onDismiss }: Props) {
  return (
    <Modal
      visible={notice !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconContainer, notice?.kind === "error" && styles.errorIconContainer]}>
            <Text style={[styles.iconText, notice?.kind === "error" && styles.errorIconText]}>
              {notice?.kind === "error" ? "!" : "i"}
            </Text>
          </View>
          <Text style={styles.title}>{notice?.title}</Text>
          <Text style={styles.message}>{notice?.message}</Text>
          <Pressable style={styles.button} onPress={onDismiss} accessibilityRole="button">
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(15,23,42,0.5)", padding: 24,
  },
  card: {
    width: "100%", maxWidth: 400, backgroundColor: "#ffffff",
    borderRadius: 22, padding: 24, alignItems: "center", elevation: 10,
  },
  iconContainer: {
    height: 52, width: 52, borderRadius: 26, justifyContent: "center",
    alignItems: "center", backgroundColor: "#dbeafe", marginBottom: 16,
  },
  errorIconContainer: { backgroundColor: "#fee2e2" },
  iconText: { fontSize: 26, fontWeight: "700", color: "#2563eb" },
  errorIconText: { color: "#dc2626" },
  title: { fontSize: 19, fontWeight: "700", color: "#0f172a", marginBottom: 12 },
  message: {
    fontSize: 15, lineHeight: 24, color: "#475569", textAlign: "center", marginBottom: 24,
  },
  button: {
    backgroundColor: "#2563eb", width: "100%", paddingVertical: 14,
    borderRadius: 12, alignItems: "center",
  },
  buttonText: { fontSize: 15, fontWeight: "600", color: "#ffffff" },
});
