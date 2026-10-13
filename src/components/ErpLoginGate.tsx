import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { ErpSessionStatus } from "../erp/erpSessionBridge";

type Props = {
  status: ErpSessionStatus;
  onLogin: () => void;
  onRetry: () => void;
};

/** The feedback menu never guesses whether an ERP session is authenticated. */
export default function ErpLoginGate({ status, onLogin, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {status === "checking" ? "Checking ERP login..." :
          status === "logged_out" ? "Login Required" : "Unable to Verify Login"}
      </Text>
      <Text style={styles.message}>
        {status === "checking" ? "Checking your current ERP page." :
          status === "logged_out"
            ? "Please log in to your ERP account before using Quick Feedback."
            : "Open your ERP dashboard and try checking again."}
      </Text>
      {status === "checking" ? (
        <ActivityIndicator size="small" color="#2563eb" />
      ) : (
        <Pressable
          style={styles.button}
          onPress={status === "logged_out" ? onLogin : onRetry}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {status === "logged_out" ? "Continue to ERP Login" : "Check Again"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 12 },
  title: {
    fontSize: 19, fontWeight: "700", color: "#111827",
    marginBottom: 12, textAlign: "center",
  },
  message: {
    fontSize: 14, lineHeight: 22, color: "#64748b",
    textAlign: "center", marginBottom: 24,
  },
  button: {
    backgroundColor: "#2563eb", paddingVertical: 16,
    borderRadius: 14, alignItems: "center", marginTop: 10, width: "100%",
  },
  buttonText: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
});
