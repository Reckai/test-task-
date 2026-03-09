import { useCallback, useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';

const STAGGER_DELAYS = [50, 100, 150, 250, 350];

export function useStepTransition() {
  const stepProgress = useSharedValue(0);

  // --- Text2 stagger shared values ---
  const s1o = useSharedValue(0);
  const s1y = useSharedValue(20);
  const s2o = useSharedValue(0);
  const s2y = useSharedValue(20);
  const s3o = useSharedValue(0);
  const s3y = useSharedValue(20);
  const s4o = useSharedValue(0);
  const s4y = useSharedValue(20);
  const s5o = useSharedValue(0);
  const s5y = useSharedValue(20);

  const staggerOpacities = useRef([s1o, s2o, s3o, s4o, s5o]).current;
  const staggerYs = useRef([s1y, s2y, s3y, s4y, s5y]).current;

  const triggerText2Stagger = useCallback(() => {
    const dur = 350;
    staggerOpacities.forEach((sv, i) => {
      sv.value = withDelay(STAGGER_DELAYS[i], withTiming(1, { duration: dur }));
    });
    staggerYs.forEach((sv, i) => {
      sv.value = withDelay(STAGGER_DELAYS[i], withTiming(0, { duration: dur }));
    });
  }, [staggerOpacities, staggerYs]);

  const resetText2Stagger = useCallback(() => {
    staggerOpacities.forEach((sv) => { sv.value = 0; });
    staggerYs.forEach((sv) => { sv.value = 20; });
  }, [staggerOpacities, staggerYs]);

  // --- Animated styles ---

  const fadeOutTopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0, 0.4], [1, 0], 'clamp'),
    maxHeight: interpolate(stepProgress.value, [0.1, 0.65], [200, 0], 'clamp'),
    overflow: 'hidden' as const,
  }));

  const fadeOutBottomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0, 0.4], [1, 0], 'clamp'),
    maxHeight: interpolate(stepProgress.value, [0.1, 0.65], [200, 0], 'clamp'),
    overflow: 'hidden' as const,
  }));

  const inputAnimStyle = useAnimatedStyle(() => ({
    minHeight: interpolate(stepProgress.value, [0.15, 0.65], [140, 0], 'clamp'),
    maxHeight: interpolate(stepProgress.value, [0.15, 0.65], [240, 100], 'clamp'),
    borderRadius: interpolate(stepProgress.value, [0.15, 0.65], [12, 16], 'clamp'),
    overflow: 'hidden' as const,
    paddingHorizontal: interpolate(stepProgress.value, [0.15, 0.65], [17, 16], 'clamp'),
    paddingVertical: interpolate(stepProgress.value, [0.15, 0.65], [15, 12], 'clamp'),
    marginBottom: 24,
  }));

  const pillLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0.45, 0.75], [0, 1], 'clamp'),
    height: interpolate(stepProgress.value, [0.45, 0.75], [0, 15], 'clamp'),
    marginBottom: interpolate(stepProgress.value, [0.45, 0.75], [0, 4], 'clamp'),
  }));

  const inputTextFadeOut = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0.1, 0.4], [1, 0], 'clamp'),
    flex: interpolate(stepProgress.value, [0.3, 0.6], [1, 0], 'clamp'),
    maxHeight: interpolate(stepProgress.value, [0.3, 0.6], [200, 0], 'clamp'),
    overflow: 'hidden' as const,
  }));

  const pillTextFadeIn = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0.45, 0.75], [0, 1], 'clamp'),
  }));

  const text2ContainerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(stepProgress.value, [0.2, 0.8], [0, 800], 'clamp'),
    overflow: 'hidden' as const,
  }));

  const staggerStyle1 = useAnimatedStyle(() => ({
    opacity: s1o.value,
    transform: [{ translateY: s1y.value }],
  }));
  const staggerStyle2 = useAnimatedStyle(() => ({
    opacity: s2o.value,
    transform: [{ translateY: s2y.value }],
  }));
  const staggerStyle3 = useAnimatedStyle(() => ({
    opacity: s3o.value,
    transform: [{ translateY: s3y.value }],
  }));
  const staggerStyle4 = useAnimatedStyle(() => ({
    opacity: s4o.value,
    transform: [{ translateY: s4y.value }],
  }));
  const staggerStyle5 = useAnimatedStyle(() => ({
    opacity: s5o.value,
    transform: [{ translateY: s5y.value }],
  }));

  const staggerStyles = [staggerStyle1, staggerStyle2, staggerStyle3, staggerStyle4, staggerStyle5];

  return {
    stepProgress,
    triggerText2Stagger,
    resetText2Stagger,
    animatedStyles: {
      fadeOutTopStyle,
      fadeOutBottomStyle,
      inputAnimStyle,
      pillLabelStyle,
      inputTextFadeOut,
      pillTextFadeIn,
      text2ContainerStyle,
      staggerStyles,
    },
  };
}
