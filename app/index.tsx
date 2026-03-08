import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVoiceInput } from '../hooks/useVoiceInput';

export default function Text1Screen() {
  const [text, setText] = useState('');

  const onTranscription = useCallback(
    (transcribed: string) => {
      setText((prev) => (prev ? prev + ' ' + transcribed : transcribed));
    },
    [],
  );

  const { isRecording, isTranscribing, error: micError, toggleRecording } =
    useVoiceInput(onTranscription);

  const isValid = text.trim().length > 0;

  const handleContinue = () => {
    if (!isValid) return;
    router.push({ pathname: '/text2', params: { text1: text.trim() } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>Text 1</Text>
        <Text style={styles.subtitle}>Enter your first piece of text</Text>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type or paste your text here..."
          placeholderTextColor="#666"
          multiline
          textAlignVertical="top"
          autoFocus
        />

        <View style={styles.row}>
          <Pressable
            style={[styles.micButton, isRecording && styles.micButtonActive]}
            onPress={toggleRecording}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
            )}
          </Pressable>

          <Pressable
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
              Continue
            </Text>
          </Pressable>
        </View>

        {isRecording && (
          <Text style={styles.recordingHint}>Recording... tap to stop</Text>
        )}
        {micError ? <Text style={styles.errorText}>{micError}</Text> : null}
      </KeyboardAvoidingView>
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
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#16213e',
    color: '#fff',
    fontSize: 16,
    borderRadius: 12,
    padding: 16,
    minHeight: 140,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    marginBottom: 24,
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
    backgroundColor: '#16213e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  micButtonActive: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  micIcon: {
    fontSize: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#6c63ff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#3a3a5a',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#777',
  },
  recordingHint: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
