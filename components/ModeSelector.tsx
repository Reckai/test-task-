import { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { MixingMode } from '../services/claude';
import { Colors } from '../constants/colors';

const MODES: { key: MixingMode; label: string }[] = [
  { key: 'style-transfer', label: 'Style Transfer' },
  { key: 'mashup', label: 'Mashup' },
];

interface ModeSelectorProps {
  mode: MixingMode;
  onModeChange: (mode: MixingMode) => void;
}

export const ModeSelector = memo(function ModeSelector({
  mode,
  onModeChange,
}: ModeSelectorProps) {
  return (
    <View style={styles.modeContainer}>
      <Text style={styles.modeLabel}>Mixing Mode</Text>
      <View style={styles.segmentedControl} accessibilityRole="radiogroup">
        {MODES.map((m) => (
          <Pressable
            key={m.key}
            style={({ pressed }) => [
              styles.segment,
              mode === m.key && styles.segmentActive,
              pressed && styles.pressed,
            ]}
            onPress={() => onModeChange(m.key)}
            accessibilityRole="radio"
            accessibilityLabel={m.label}
            accessibilityState={{ selected: mode === m.key }}
          >
            <Text
              style={[
                styles.segmentText,
                mode === m.key && styles.segmentTextActive,
              ]}
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  modeContainer: {
    marginBottom: 24,
  },
  modeLabel: {
    color: Colors.foregroundMuted,
    fontSize: 14,
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderCurve: 'continuous',
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  segmentText: {
    color: Colors.foregroundMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.primaryForeground,
  },
  pressed: {
    opacity: 0.7,
  },
});
