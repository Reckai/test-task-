import { memo } from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

interface MicButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  disabled: boolean;
  onPress: () => void;
}

export const MicButton = memo(function MicButton({
  isRecording,
  isTranscribing,
  disabled,
  onPress,
}: MicButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.micButton,
        isRecording && styles.micButtonActive,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={isRecording ? 'Stop recording' : 'Start voice input'}
      accessibilityState={{ busy: isTranscribing }}
    >
      {isTranscribing ? (
        <ActivityIndicator size="small" color={Colors.foreground} />
      ) : (
        <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
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
  micIcon: {
    fontSize: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});
