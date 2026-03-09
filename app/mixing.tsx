import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
  useAnimatedStyle,
} from 'react-native-reanimated';
import {
  Canvas,
  Text as SkiaText,
  useFont,
  Group,
  Mask,
  Rect,
  Path as SkiaPath,
  Skia,
  type SkFont,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { mixTexts, type MixingMode } from '../services/claude';

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

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 80;
const BASE_FONT_SIZE = 48;

function SkiaWord({
  word,
  font,
  onComplete,
}: {
  word: string;
  font: SkFont;
  onComplete: () => void;
}) {
  const revealProgress = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  const drop1Opacity = useSharedValue(0);
  const drop1Y = useSharedValue(-12);
  const drop1Scale = useSharedValue(0.3);
  const drop2Opacity = useSharedValue(0);
  const drop2Y = useSharedValue(-12);
  const drop2Scale = useSharedValue(0.3);
  const drop3Opacity = useSharedValue(0);
  const drop3Y = useSharedValue(-12);
  const drop3Scale = useSharedValue(0.3);

  const strikeProgress = useSharedValue(0);
  const strikeOpacity = useSharedValue(0);

  const textMetrics = useMemo(() => {
    let fontSize = BASE_FONT_SIZE;
    let textWidth = font.measureText(word).width;
    // Scale down for long words
    if (textWidth > 280) {
      fontSize = Math.floor((280 / textWidth) * BASE_FONT_SIZE);
      textWidth = 280;
    }
    return { fontSize, textWidth };
  }, [font, word]);

  useEffect(() => {
    // 0-2000ms: reveal text left-to-right
    revealProgress.value = withTiming(1, {
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
    });

    // 1800-2200ms: ink drops spring in
    const dropDelay = 1800;
    drop1Opacity.value = withDelay(dropDelay, withTiming(1, { duration: 200 }));
    drop1Y.value = withDelay(dropDelay, withSpring(0, { damping: 6, stiffness: 200 }));
    drop1Scale.value = withDelay(dropDelay, withSpring(1, { damping: 6, stiffness: 200 }));

    drop2Opacity.value = withDelay(dropDelay + 200, withTiming(1, { duration: 200 }));
    drop2Y.value = withDelay(dropDelay + 200, withSpring(0, { damping: 6, stiffness: 200 }));
    drop2Scale.value = withDelay(dropDelay + 200, withSpring(1, { damping: 6, stiffness: 200 }));

    drop3Opacity.value = withDelay(dropDelay + 400, withTiming(1, { duration: 200 }));
    drop3Y.value = withDelay(dropDelay + 400, withSpring(0, { damping: 6, stiffness: 200 }));
    drop3Scale.value = withDelay(dropDelay + 400, withSpring(1, { damping: 6, stiffness: 200 }));

    // 2600-3100ms: red strikethrough
    const crossDelay = 2600;
    strikeOpacity.value = withDelay(crossDelay, withTiming(1, { duration: 100 }));
    strikeProgress.value = withDelay(
      crossDelay,
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
    );

    // 3300-3700ms: fade out
    containerOpacity.value = withDelay(
      3300,
      withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onComplete)();
      }),
    );
  }, [font, textMetrics]);

  // Derived value for mask width (reveal effect)
  const maskWidth = useDerivedValue(() => {
    return revealProgress.value * CANVAS_WIDTH;
  });

  // Derived value for strike path end
  const strikeEnd = useDerivedValue(() => {
    return strikeProgress.value;
  });

  const strikeAlpha = useDerivedValue(() => {
    return strikeOpacity.value;
  });

  const drop1Style = useAnimatedStyle(() => ({
    opacity: drop1Opacity.value,
    transform: [{ translateY: drop1Y.value }, { scale: drop1Scale.value }],
  }));
  const drop2Style = useAnimatedStyle(() => ({
    opacity: drop2Opacity.value,
    transform: [{ translateY: drop2Y.value }, { scale: drop2Scale.value }],
  }));
  const drop3Style = useAnimatedStyle(() => ({
    opacity: drop3Opacity.value,
    transform: [{ translateY: drop3Y.value }, { scale: drop3Scale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  // Build strikethrough path
  const strikePath = useMemo(() => {
    const path = Skia.Path.Make();
    const xStart = (CANVAS_WIDTH - textMetrics.textWidth) / 2 - 5;
    const xEnd = xStart + textMetrics.textWidth + 10;
    const y = CANVAS_HEIGHT / 2;
    path.moveTo(xStart, y);
    path.lineTo(xEnd, y);
    return path;
  }, [font, textMetrics]);

  const textX = (CANVAS_WIDTH - textMetrics.textWidth) / 2;
  const textY = CANVAS_HEIGHT / 2 + textMetrics.fontSize / 3;

  return (
    <Animated.View style={[styles.wordContainer, containerStyle]}>
      <Canvas style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        {/* Masked text reveal */}
        <Mask
          mask={
            <Group>
              <Rect x={0} y={0} width={maskWidth} height={CANVAS_HEIGHT} color="white" />
            </Group>
          }
        >
          <SkiaText
            x={textX}
            y={textY}
            text={word}
            font={font}
            color="#141414"
          />
        </Mask>

        {/* Red strikethrough */}
        {strikePath && (
          <Group opacity={strikeAlpha}>
            <SkiaPath
              path={strikePath}
              style="stroke"
              strokeWidth={3}
              strokeCap="round"
              color="#141414"
              end={strikeEnd}
            />
          </Group>
        )}
      </Canvas>

      {/* Ink drops (kept as Animated.View) */}
      <View style={[styles.dropsContainer, { right: 10, top: 20 }]}>
        <Animated.View style={[styles.drop, { top: 2, left: 4 }, drop1Style]} />
        <Animated.View style={[styles.dropSm, { top: 18, left: 14 }, drop2Style]} />
        <Animated.View style={[styles.dropLg, { top: 10, left: 22 }, drop3Style]} />
      </View>
    </Animated.View>
  );
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
  const [words, setWords] = useState<string[]>([]);
  const mixingDone = useRef(false);

  // Guard for missing route params (after all hooks)
  const hasValidParams = Boolean(text1 && text2 && mode);

  useEffect(() => {
    if (text1 && text2) {
      setWords(extractWords(text1, text2));
    }
  }, [text1, text2]);

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

      setTimeout(() => {
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
  }, [doMix]);

  if (!hasValidParams) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Missing required parameters. Please go back and try again.</Text>
          <Pressable
            style={styles.button}
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
          {words.length > 0 && font && (
            <SkiaWord
              key={`${currentWordIndex}-${words[currentWordIndex]}`}
              word={words[currentWordIndex]}
              font={font}
              onComplete={handleWordComplete}
            />
          )}
        </View>

        {isMixing && !error && (
          <ActivityIndicator size="large" color="#1a1a1a" style={styles.loader} />
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.button}
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
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#141414',
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
  wordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dropsContainer: {
    position: 'absolute',
    right: -30,
    top: -5,
    width: 30,
    height: 40,
  },
  drop: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1a1a1a',
  },
  dropSm: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a1a1a',
  },
  dropLg: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
  },
  loader: {
    marginBottom: 24,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '600',
  },
});
