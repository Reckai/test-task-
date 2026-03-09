import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import type { MixingMode } from '../services/claude';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { Colors } from '../constants/colors';

const MODES: { key: MixingMode; label: string }[] = [
  { key: 'style-transfer', label: 'Style Transfer' },
  { key: 'mashup', label: 'Mashup' },
];

const STAGGER_DELAYS = [50, 100, 150, 250, 350];

type CaptureStep = 'text1' | 'text2';

export default function CaptureScreen() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [mode, setMode] = useState<MixingMode>('style-transfer');
  const [captureStep, setCaptureStep] = useState<CaptureStep>('text1');
  const [isAnimating, setIsAnimating] = useState(false);

  const stepRef = useRef<CaptureStep>('text1');
  const text1InputRef = useRef<TextInput>(null);

  // Single voice input instance — routes to active step via stepRef
  const onTranscription = useCallback((transcribed: string) => {
    if (stepRef.current === 'text1') {
      setText1((prev) => (prev ? prev + ' ' + transcribed : transcribed));
    } else {
      setText2((prev) => (prev ? prev + ' ' + transcribed : transcribed));
    }
  }, []);

  const { isRecording, isTranscribing, error: micError, toggleRecording } =
    useVoiceInput(onTranscription);

  const isText1Valid = text1.trim().length > 0;
  const isText2Valid = text2.trim().length > 0;

  // --- Master transition shared value (0 = text1 step, 1 = text2 step) ---
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

  // --- Transition completion callbacks (called from UI thread via runOnJS) ---
  const onStepForwardComplete = useCallback(() => {
    setCaptureStep('text2');
    stepRef.current = 'text2';
    setIsAnimating(false);
    triggerText2Stagger();
  }, [triggerText2Stagger]);

  const onStepBackComplete = useCallback(() => {
    setCaptureStep('text1');
    stepRef.current = 'text1';
    setIsAnimating(false);
    text1InputRef.current?.focus();
  }, []);

  // --- Handlers ---
  const handleContinue = useCallback(() => {
    if (!isText1Valid || isAnimating) return;
    setIsAnimating(true);
    Keyboard.dismiss();

    stepProgress.value = withTiming(
      1,
      { duration: 900, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        'worklet';
        if (finished) {
          runOnJS(onStepForwardComplete)();
        }
      },
    );
  }, [isText1Valid, isAnimating, onStepForwardComplete]);

  const handleBack = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    Keyboard.dismiss();

    resetText2Stagger();

    stepProgress.value = withTiming(
      0,
      { duration: 900, easing: Easing.inOut(Easing.ease) },
      (finished) => {
        'worklet';
        if (finished) {
          runOnJS(onStepBackComplete)();
        }
      },
    );
  }, [isAnimating, resetText2Stagger, onStepBackComplete]);

  const handleMix = useCallback(() => {
    if (!isText2Valid) return;
    router.push({
      pathname: '/mixing',
      params: { text1: text1.trim(), text2: text2.trim(), mode },
    });
  }, [isText2Valid, text1, text2, mode]);

  // Reset when returning from mixing/result
  useFocusEffect(
    useCallback(() => {
      stepProgress.value = 0;
      resetText2Stagger();
      setText2('');
      setCaptureStep('text1');
      stepRef.current = 'text1';
      setIsAnimating(false);
    }, [resetText2Stagger]),
  );

  // --- Animated styles ---

  // Text1 title/subtitle fade out + collapse
  const fadeOutTopStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0, 0.4], [1, 0], 'clamp'),
    maxHeight: interpolate(stepProgress.value, [0.1, 0.65], [200, 0], 'clamp'),
    overflow: 'hidden' as const,
  }));

  // Text1 bottom row (mic + Continue) fade out + collapse
  const fadeOutBottomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0, 0.4], [1, 0], 'clamp'),
    maxHeight: interpolate(stepProgress.value, [0.1, 0.65], [200, 0], 'clamp'),
    overflow: 'hidden' as const,
  }));

  // Input container morphs into pill
  const inputAnimStyle = useAnimatedStyle(() => ({
    minHeight: interpolate(stepProgress.value, [0.15, 0.65], [140, 0], 'clamp'),
    maxHeight: interpolate(stepProgress.value, [0.15, 0.65], [240, 100], 'clamp'),
    borderRadius: interpolate(stepProgress.value, [0.15, 0.65], [12, 16], 'clamp'),
    overflow: 'hidden' as const,
    paddingHorizontal: interpolate(stepProgress.value, [0.15, 0.65], [17, 16], 'clamp'),
    paddingVertical: interpolate(stepProgress.value, [0.15, 0.65], [15, 12], 'clamp'),
    marginBottom: 24,
  }));

  // Pill label fades in
  const pillLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0.45, 0.75], [0, 1], 'clamp'),
    height: interpolate(stepProgress.value, [0.45, 0.75], [0, 15], 'clamp'),
    marginBottom: interpolate(stepProgress.value, [0.45, 0.75], [0, 4], 'clamp'),
  }));

  // Text input text fades out
  const inputTextFadeOut = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0.1, 0.4], [1, 0], 'clamp'),
    flex: interpolate(stepProgress.value, [0.3, 0.6], [1, 0], 'clamp'),
    maxHeight: interpolate(stepProgress.value, [0.3, 0.6], [200, 0], 'clamp'),
    overflow: 'hidden' as const,
  }));

  // Pill text fades in
  const pillTextFadeIn = useAnimatedStyle(() => ({
    opacity: interpolate(stepProgress.value, [0.45, 0.75], [0, 1], 'clamp'),
  }));

  // Text2 content container — expands gradually alongside collapse of top/bottom
  const text2ContainerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(stepProgress.value, [0.2, 0.8], [0, 800], 'clamp'),
    overflow: 'hidden' as const,
  }));

  // Stagger styles for text2 elements
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

  const displayText1 = useMemo(() => {
    const trimmed = text1.trim();
    return trimmed.length > 60 ? trimmed.slice(0, 60) + '...' : trimmed;
  }, [text1]);

  const isText1Step = captureStep === 'text1';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {/* Text1 title/subtitle — fades out during transition */}
        <Animated.View style={fadeOutTopStyle}>
          <Text style={styles.title}>Text 1</Text>
          <Text style={styles.subtitle}>Enter your first piece of text</Text>
        </Animated.View>

        {/* Morphing container: input <-> pill */}
        <Pressable
          onPress={!isText1Step ? handleBack : undefined}
          disabled={isText1Step || isAnimating}
          accessibilityRole="button"
          accessibilityLabel={!isText1Step ? 'Edit Text 1' : undefined}
        >
          <Animated.View style={[styles.inputOuter, inputAnimStyle]}>
            <Animated.Text style={[styles.pillLabel, pillLabelStyle]}>
              Text 1
            </Animated.Text>
            <Animated.View style={inputTextFadeOut}>
              <TextInput
                ref={text1InputRef}
                style={styles.inputInner}
                value={text1}
                onChangeText={setText1}
                placeholder="Type or paste your text here..."
                placeholderTextColor={Colors.placeholder}
                multiline
                textAlignVertical="top"
                autoFocus
                editable={isText1Step && !isAnimating}
                accessibilityLabel="Text 1 input"
                accessibilityHint="Enter your first piece of text"
              />
            </Animated.View>
            <Animated.Text style={[styles.pillText, pillTextFadeIn]} numberOfLines={2}>
              {displayText1}
            </Animated.Text>
          </Animated.View>
        </Pressable>

        {/* Text1 mic + Continue — fades out during transition */}
        <Animated.View style={fadeOutBottomStyle} pointerEvents={isText1Step ? 'auto' : 'none'}>
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [
                styles.micButton,
                isRecording && isText1Step && styles.micButtonActive,
                pressed && styles.pressed,
              ]}
              onPress={toggleRecording}
              disabled={isTranscribing || isAnimating || !isText1Step}
              accessibilityRole="button"
              accessibilityLabel={isRecording && isText1Step ? 'Stop recording' : 'Start voice input'}
              accessibilityState={{ busy: isTranscribing && isText1Step }}
            >
              {isTranscribing && isText1Step ? (
                <ActivityIndicator size="small" color={Colors.foreground} />
              ) : (
                <Text style={styles.micIcon}>{isRecording && isText1Step ? '⏹' : '🎤'}</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                !isText1Valid && styles.buttonDisabled,
                pressed && isText1Valid && styles.pressed,
              ]}
              onPress={handleContinue}
              disabled={!isText1Valid || isAnimating}
              accessibilityRole="button"
              accessibilityLabel="Continue to Text 2"
              accessibilityState={{ disabled: !isText1Valid || isAnimating }}
            >
              <Text style={[styles.buttonText, !isText1Valid && styles.buttonTextDisabled]}>
                Continue
              </Text>
            </Pressable>
          </View>

          {isRecording && isText1Step ? (
            <Text style={styles.recordingHint}>Recording... tap to stop</Text>
          ) : null}
          {!!micError && isText1Step ? <Text style={styles.errorText}>{micError}</Text> : null}
        </Animated.View>

        {/* Text2 content — hidden at step 0, expands + staggers in at step 1 */}
        <Animated.View style={text2ContainerStyle} pointerEvents={!isText1Step ? 'auto' : 'none'}>
          <Animated.View style={staggerStyles[0]}>
            <Text style={styles.title}>Text 2</Text>
          </Animated.View>

          <Animated.View style={staggerStyles[1]}>
            <Text style={styles.subtitle}>Enter your second piece of text</Text>
          </Animated.View>

          <Animated.View style={staggerStyles[2]}>
            <TextInput
              style={styles.text2Input}
              value={text2}
              onChangeText={setText2}
              placeholder="Type or paste your text here..."
              placeholderTextColor={Colors.placeholder}
              multiline
              textAlignVertical="top"
              editable={!isText1Step && !isAnimating}
              accessibilityLabel="Text 2 input"
              accessibilityHint="Enter your second piece of text"
            />
          </Animated.View>

          <Animated.View style={staggerStyles[3]}>
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
                    onPress={() => setMode(m.key)}
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
          </Animated.View>

          <Animated.View style={staggerStyles[4]}>
            <View style={styles.row}>
              <Pressable
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                onPress={handleBack}
                disabled={isAnimating}
                accessibilityRole="button"
                accessibilityLabel="Go back to Text 1"
              >
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.micButton,
                  isRecording && !isText1Step && styles.micButtonActive,
                  pressed && styles.pressed,
                ]}
                onPress={toggleRecording}
                disabled={isTranscribing || isAnimating || isText1Step}
                accessibilityRole="button"
                accessibilityLabel={isRecording && !isText1Step ? 'Stop recording' : 'Start voice input'}
                accessibilityState={{ busy: isTranscribing && !isText1Step }}
              >
                {isTranscribing && !isText1Step ? (
                  <ActivityIndicator size="small" color={Colors.foreground} />
                ) : (
                  <Text style={styles.micIcon}>{isRecording && !isText1Step ? '⏹' : '🎤'}</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  !isText2Valid && styles.buttonDisabled,
                  pressed && isText2Valid && styles.pressed,
                ]}
                onPress={handleMix}
                disabled={!isText2Valid || isAnimating}
                accessibilityRole="button"
                accessibilityLabel="Mix the two texts"
                accessibilityState={{ disabled: !isText2Valid || isAnimating }}
              >
                <Text style={[styles.buttonText, !isText2Valid && styles.buttonTextDisabled]}>
                  Mix them
                </Text>
              </Pressable>
            </View>

            {isRecording && !isText1Step ? (
              <Text style={styles.recordingHint}>Recording... tap to stop</Text>
            ) : null}
            {!!micError && !isText1Step ? <Text style={styles.errorText}>{micError}</Text> : null}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    justifyContent: 'center',
  },
  title: {
    color: Colors.foreground,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.foregroundMuted,
    fontSize: 16,
    marginBottom: 24,
  },
  inputOuter: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 17,
    paddingVertical: 15,
    minHeight: 140,
    maxHeight: 240,
    marginBottom: 24,
  },
  inputInner: {
    color: Colors.foreground,
    fontSize: 16,
    flex: 1,
    padding: 0,
    textAlignVertical: 'top',
  },
  pillLabel: {
    color: Colors.placeholder,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pillText: {
    color: Colors.foregroundMuted,
    fontSize: 14,
  },
  text2Input: {
    backgroundColor: Colors.surface,
    color: Colors.foreground,
    fontSize: 16,
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 16,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micButtonActive: {
    backgroundColor: Colors.recording,
    borderColor: Colors.recording,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    color: Colors.foregroundMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  micIcon: {
    fontSize: 20,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.border,
  },
  buttonText: {
    color: Colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: Colors.placeholder,
  },
  pressed: {
    opacity: 0.7,
  },
  recordingHint: {
    color: Colors.recording,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
