import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import type { MixingMode } from '../services/claude';

const MODE_LABELS: Record<MixingMode, string> = {
  'style-transfer': 'Style Transfer',
  mashup: 'Mashup',
};

export default function ResultScreen() {
  const { result, mode } = useLocalSearchParams<{
    result: string;
    mode: MixingMode;
  }>();

  const [displayedText, setDisplayedText] = useState('');
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const playChime = useCallback(async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/chime.wav'),
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch {
      // Sound playback is non-critical
    }
  }, []);

  useEffect(() => {
    if (!result) return;

    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    playChime();

    // Typewriter effect
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setDisplayedText(result.slice(0, index));
      if (index >= result.length) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [result, opacity, playChime]);

  const handleMixAgain = () => {
    router.dismissAll();
    router.replace('/');
  };

  const modeLabel = mode ? MODE_LABELS[mode as MixingMode] ?? mode : '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Result</Text>

        {modeLabel ? (
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{modeLabel}</Text>
          </View>
        ) : null}

        <ScrollView
          style={styles.resultScroll}
          contentContainerStyle={styles.resultContent}
        >
          <Animated.View style={animatedStyle}>
            <Text style={styles.resultText}>{displayedText}</Text>
          </Animated.View>
        </ScrollView>

        <Pressable style={styles.button} onPress={handleMixAgain}>
          <Text style={styles.buttonText}>Mix Again</Text>
        </Pressable>
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
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  modeBadge: {
    backgroundColor: '#6c63ff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  modeBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  resultScroll: {
    flex: 1,
    width: '100%',
    backgroundColor: '#16213e',
    borderRadius: 16,
    marginBottom: 24,
  },
  resultContent: {
    padding: 20,
  },
  resultText: {
    color: '#e0e0e0',
    fontSize: 17,
    lineHeight: 26,
  },
  button: {
    backgroundColor: '#6c63ff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
