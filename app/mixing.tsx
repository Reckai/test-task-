import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { mixTexts, type MixingMode } from '../services/claude';

export default function MixingScreen() {
  const { text1, text2, mode } = useLocalSearchParams<{
    text1: string;
    text2: string;
    mode: MixingMode;
  }>();

  const [error, setError] = useState<string | null>(null);
  const [isMixing, setIsMixing] = useState(false);

  const rotation = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const mergeProgress = useSharedValue(0);

  const orb1Style = useAnimatedStyle(() => {
    const angle = rotation.value * (Math.PI / 180);
    const radius = 60 * (1 - mergeProgress.value);
    return {
      transform: [
        { translateX: Math.cos(angle) * radius },
        { translateY: Math.sin(angle) * radius },
        { scale: scale1.value },
      ],
    };
  });

  const orb2Style = useAnimatedStyle(() => {
    const angle = rotation.value * (Math.PI / 180) + Math.PI;
    const radius = 60 * (1 - mergeProgress.value);
    return {
      transform: [
        { translateX: Math.cos(angle) * radius },
        { translateY: Math.sin(angle) * radius },
        { scale: scale2.value },
      ],
    };
  });

  const startAnimations = useCallback(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
    scale1.value = withRepeat(
      withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    scale2.value = withRepeat(
      withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [rotation, scale1, scale2]);

  const resolveAnimation = useCallback(() => {
    mergeProgress.value = withSpring(1, { damping: 12, stiffness: 80 });
    scale1.value = withTiming(0.5, { duration: 500 });
    scale2.value = withTiming(0.5, { duration: 500 });
  }, [mergeProgress, scale1, scale2]);

  const doMix = useCallback(async () => {
    if (!text1 || !text2 || !mode) return;

    setError(null);
    setIsMixing(true);
    startAnimations();

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await mixTexts(text1, text2, mode as MixingMode);

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resolveAnimation();

      setTimeout(() => {
        router.push({
          pathname: '/result',
          params: { result, mode },
        });
      }, 600);
    } catch (err: unknown) {
      setIsMixing(false);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    }
  }, [text1, text2, mode, startAnimations, resolveAnimation]);

  useEffect(() => {
    doMix();
  }, [doMix]);

  const truncate = (s: string | undefined, len: number) =>
    s && s.length > len ? s.slice(0, len) + '...' : s ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Mixing...</Text>

        <View style={styles.orbContainer}>
          <Animated.View style={[styles.orb, styles.orb1, orb1Style]}>
            <Text style={styles.orbText} numberOfLines={2}>
              {truncate(text1, 30)}
            </Text>
          </Animated.View>
          <Animated.View style={[styles.orb, styles.orb2, orb2Style]}>
            <Text style={styles.orbText} numberOfLines={2}>
              {truncate(text2, 30)}
            </Text>
          </Animated.View>
        </View>

        {isMixing && !error && (
          <ActivityIndicator size="large" color="#6c63ff" style={styles.loader} />
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.button} onPress={doMix}>
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
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 48,
  },
  orbContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  orb: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  orb1: {
    backgroundColor: '#6c63ff',
  },
  orb2: {
    backgroundColor: '#ff6b6b',
  },
  orbText: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 24,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#6c63ff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
