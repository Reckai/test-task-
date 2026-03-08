import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Text1Screen() {
  const [text, setText] = useState('');

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

        <Pressable
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
        >
          <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
            Continue
          </Text>
        </Pressable>
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
  button: {
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
});
