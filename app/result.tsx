import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useAudioPlayer } from 'expo-audio';
import type { MixingMode } from '../services/claude';
import { Colors } from '../constants/colors';

const MODE_LABELS: Record<MixingMode, string> = {
  'style-transfer': 'Style Transfer',
  mashup: 'Mashup',
};

export default function ResultScreen() {
  const { result, mode } = useLocalSearchParams<{
    result: string;
    mode: MixingMode;
  }>();

  const [displayedText, setDisplayedText] = useState('');
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const chimePlayer = useAudioPlayer(require('../assets/chime.wav'));

  useEffect(() => {
    if (!result) return;

    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    try { chimePlayer?.play(); } catch { /* non-critical */ }

    // Typewriter effect using requestAnimationFrame for frame-aligned updates
    let index = 0;
    const charsPerTick = Math.max(1, Math.ceil(result.length / 120));
    let rafId: number;

    const tick = () => {
      index += charsPerTick;
      setDisplayedText(result.slice(0, index));
      if (index < result.length) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [result]);

  const handleMixAgain = () => {
    router.dismissAll();
    router.replace('/');
  };

  const modeLabel = mode ? MODE_LABELS[mode as MixingMode] ?? mode : '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Result</Text>

        {modeLabel ? (
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{modeLabel}</Text>
          </View>
        ) : null}

        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Animated.View style={animatedStyle}>
            <Text
              style={styles.resultText}
              accessibilityRole="text"
              accessibilityLabel={`Mixed result: ${displayedText}`}
            >
              {displayedText}
            </Text>
          </Animated.View>
        </ScrollView>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleMixAgain}
          accessibilityRole="button"
          accessibilityLabel="Mix Again"
        >
          <Text style={styles.buttonText}>Mix Again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: Colors.foreground,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  modeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderCurve: 'continuous',
    marginBottom: 24,
  },
  modeBadgeText: {
    color: Colors.primaryForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  resultScroll: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderCurve: 'continuous',
    marginBottom: 24,
  },
  resultContent: {
    padding: 20,
  },
  resultText: {
    color: Colors.foreground,
    fontSize: 17,
    lineHeight: 26,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
});
