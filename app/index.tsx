import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import type { MixingMode } from '../services/claude';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useStepTransition } from '../hooks/useStepTransition';
import { Colors } from '../constants/colors';
import { MicButton } from '../components/MicButton';
import { ModeSelector } from '../components/ModeSelector';

type CaptureStep = 'text1' | 'text2';

export default function CaptureScreen() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [mode, setMode] = useState<MixingMode>('style-transfer');
  const [captureStep, setCaptureStep] = useState<CaptureStep>('text1');
  const [isAnimating, setIsAnimating] = useState(false);

  const stepRef = useRef<CaptureStep>('text1');
  const text1InputRef = useRef<TextInput>(null);

  const {
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
  } = useStepTransition();

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
  const isText1Step = captureStep === 'text1';

  // --- Transition completion callbacks ---
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
        if (finished) runOnJS(onStepForwardComplete)();
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
        if (finished) runOnJS(onStepBackComplete)();
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

  const displayText1 = useMemo(() => {
    const trimmed = text1.trim();
    return trimmed.length > 60 ? trimmed.slice(0, 60) + '...' : trimmed;
  }, [text1]);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {/* Text1 title/subtitle */}
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

        {/* Text1 actions row */}
        <Animated.View style={fadeOutBottomStyle} pointerEvents={isText1Step ? 'auto' : 'none'}>
          <View style={styles.row}>
            <MicButton
              isRecording={isRecording && isText1Step}
              isTranscribing={isTranscribing && isText1Step}
              disabled={isTranscribing || isAnimating || !isText1Step}
              onPress={toggleRecording}
            />
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

        {/* Text2 content */}
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
            <ModeSelector mode={mode} onModeChange={setMode} />
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

              <MicButton
                isRecording={isRecording && !isText1Step}
                isTranscribing={isTranscribing && !isText1Step}
                disabled={isTranscribing || isAnimating || isText1Step}
                onPress={toggleRecording}
              />

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
