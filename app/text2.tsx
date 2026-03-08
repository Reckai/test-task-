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
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MixingMode } from '../services/claude';

const MODES: { key: MixingMode; label: string }[] = [
  { key: 'style-transfer', label: 'Style Transfer' },
  { key: 'mashup', label: 'Mashup' },
];

export default function Text2Screen() {
  const { text1 } = useLocalSearchParams<{ text1: string }>();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<MixingMode>('style-transfer');

  const isValid = text.trim().length > 0;

  const handleMix = () => {
    if (!isValid) return;
    router.push({
      pathname: '/mixing',
      params: { text1, text2: text.trim(), mode },
    });
  };

  const displayText1 =
    text1 && text1.length > 60 ? text1.slice(0, 60) + '...' : text1;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {text1 ? (
          <View style={styles.pill}>
            <Text style={styles.pillLabel}>Text 1</Text>
            <Text style={styles.pillText} numberOfLines={2}>
              {displayText1}
            </Text>
          </View>
        ) : null}

        <Text style={styles.title}>Text 2</Text>
        <Text style={styles.subtitle}>Enter your second piece of text</Text>

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

        <View style={styles.modeContainer}>
          <Text style={styles.modeLabel}>Mixing Mode</Text>
          <View style={styles.segmentedControl}>
            {MODES.map((m) => (
              <Pressable
                key={m.key}
                style={[
                  styles.segment,
                  mode === m.key && styles.segmentActive,
                ]}
                onPress={() => setMode(m.key)}
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

        <Pressable
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleMix}
          disabled={!isValid}
        >
          <Text style={[styles.buttonText, !isValid && styles.buttonTextDisabled]}>
            Mix them
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
  pill: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#6c63ff',
  },
  pillLabel: {
    color: '#6c63ff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pillText: {
    color: '#ccc',
    fontSize: 14,
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
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    marginBottom: 20,
  },
  modeContainer: {
    marginBottom: 24,
  },
  modeLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#6c63ff',
  },
  segmentText: {
    color: '#777',
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
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
