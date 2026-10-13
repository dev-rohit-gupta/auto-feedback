import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FeedbackMode } from "../automation/types";

export const RATING_MODES: readonly { mode: FeedbackMode; label: string; description: string }[] = [
  { mode: "excellent", label: "Excellent", description: "Select the highest ratings" },
  { mode: "average", label: "Average", description: "Select moderate ratings" },
  { mode: "poor", label: "Poor", description: "Select the lowest ratings" },
  { mode: "random", label: "Random", description: "Select varying ratings" },
];

type Props = {
  mode: FeedbackMode;
  onModeChange: (mode: FeedbackMode) => void;
};

/** Pure control: selection state belongs to its parent. */
export default function FeedbackModeSelector({ mode, onModeChange }: Props) {
  return (
    <View>
      {RATING_MODES.map((item) => {
        const active = item.mode === mode;
        return (
          <Pressable
            key={item.mode}
            style={[styles.option, active && styles.selected]}
            onPress={() => onModeChange(item.mode)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
          >
            <View style={styles.optionText}>
              <Text style={styles.title}>{item.label}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            <View style={[styles.radio, active && styles.radioSelected]}>
              {active && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12,
  },
  selected: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  optionText: { flex: 1, paddingRight: 12 },
  title: { fontSize: 16, fontWeight: "600", color: "#111827" },
  description: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center",
  },
  radioSelected: { borderColor: "#2563eb" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2563eb" },
});
