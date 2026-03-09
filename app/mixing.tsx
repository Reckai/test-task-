import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFont } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { mixTexts, type MixingMode } from '../services/claude';
import { Colors } from '../constants/colors';
import { SkiaWord, BASE_FONT_SIZE } from '../components/SkiaWord';

function extractWords(text1: string, text2: string): string[] {
  const words1 = text1.split(/\s+/).filter(Boolean);
  const words2 = text2.split(/\s+/).filter(Boolean);
  const combined: string[] = [];
  const max = Math.max(words1.length, words2.length);
  for (let i = 0; i < max; i++) {
    if (i < words1.length) combined.push(words1[i]);
    if (i < words2.length) combined.push(words2[i]);
  }
  if (combined.length <= 12) return combined;
  const step = combined.length / 12;
  return Array.from({ length: 12 }, (_, i) => combined[Math.floor(i * step)]);
}

export default function MixingScreen() {
  const { text1, text2, mode } = useLocalSearchParams<{
    text1: string;
    text2: string;
    mode: MixingMode;
  }>();

  const font = useFont(require('../assets/fonts/Caveat-Regular.ttf'), BASE_FONT_SIZE);

  const [error, setError] = useState<string | null>(null);
  const [isMixing, setIsMixing] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const mixingDone = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasValidParams = Boolean(text1 && text2 && mode);

  const words = useMemo(
    () => (text1 && text2 ? extractWords(text1, text2) : []),
    [text1, text2],
  );

  const handleWordComplete = useCallback(() => {
    if (mixingDone.current) return;
    setCurrentWordIndex((prev) => (prev + 1) % (words.length || 1));
  }, [words.length]);

  const doMix = useCallback(async () => {
    if (!text1 || !text2 || !mode) return;

    setError(null);
    setIsMixing(true);
    mixingDone.current = false;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await mixTexts(text1, text2, mode as MixingMode);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      mixingDone.current = true;

      timeoutRef.current = setTimeout(() => {
        router.push({
          pathname: '/result',
          params: { result, mode },
        });
      }, 600);
    } catch (err: unknown) {
      setIsMixing(false);
      mixingDone.current = true;
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    }
  }, [text1, text2, mode]);

  useEffect(() => {
    doMix();
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [doMix]);

  if (!hasValidParams) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Missing required parameters. Please go back and try again.</Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go Back"
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Mixing...</Text>

        <View style={styles.animationArea}>
          {words.length > 0 && font != null ? (
            <SkiaWord
              key={`${currentWordIndex}-${words[currentWordIndex]}`}
              word={words[currentWordIndex]}
              font={font}
              onComplete={handleWordComplete}
            />
          ) : null}
        </View>

        {isMixing && !error ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : null}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={doMix}
              accessibilityRole="button"
              accessibilityLabel="Try Again"
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: Colors.foreground,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 48,
  },
  animationArea: {
    width: 300,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  loader: {
    marginBottom: 24,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
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
