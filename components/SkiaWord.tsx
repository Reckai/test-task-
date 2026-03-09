import { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withDelay,
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
import { Colors } from '../constants/colors';
import { InkDrop } from './InkDrop';

export const CANVAS_WIDTH = 300;
export const CANVAS_HEIGHT = 80;
export const BASE_FONT_SIZE = 48;

interface SkiaWordProps {
  word: string;
  font: SkFont;
  onComplete: () => void;
}

export function SkiaWord({ word, font, onComplete }: SkiaWordProps) {
  const revealProgress = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const strikeProgress = useSharedValue(0);
  const strikeOpacity = useSharedValue(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const textMetrics = useMemo(() => {
    let fontSize = BASE_FONT_SIZE;
    let textWidth = font.measureText(word).width;
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

    // 2600-3100ms: strikethrough
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
        if (finished) runOnJS(onCompleteRef.current)();
      }),
    );
  }, [textMetrics]);

  const maskWidth = useDerivedValue(() => {
    return revealProgress.value * CANVAS_WIDTH;
  });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const strikePath = useMemo(() => {
    const path = Skia.Path.Make();
    const xStart = (CANVAS_WIDTH - textMetrics.textWidth) / 2 - 5;
    const xEnd = xStart + textMetrics.textWidth + 10;
    const y = CANVAS_HEIGHT / 2;
    path.moveTo(xStart, y);
    path.lineTo(xEnd, y);
    return path;
  }, [textMetrics]);

  const textX = (CANVAS_WIDTH - textMetrics.textWidth) / 2;
  const textY = CANVAS_HEIGHT / 2 + textMetrics.fontSize / 3;

  const dropDelay = 1800;

  return (
    <Animated.View style={[styles.wordContainer, containerStyle]}>
      <Canvas style={styles.canvas}>
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
            color={Colors.foreground}
          />
        </Mask>

        <Group opacity={strikeOpacity}>
          <SkiaPath
            path={strikePath}
            style="stroke"
            strokeWidth={3}
            strokeCap="round"
            color={Colors.foreground}
            end={strikeProgress}
          />
        </Group>
      </Canvas>

      <View style={styles.dropsContainer}>
        <InkDrop delay={dropDelay} style={styles.drop1} />
        <InkDrop delay={dropDelay + 200} style={styles.drop2} />
        <InkDrop delay={dropDelay + 400} style={styles.drop3} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  dropsContainer: {
    position: 'absolute',
    right: -30,
    top: -5,
    width: 30,
    height: 40,
  },
  drop1: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    top: 22,
    left: 14,
  },
  drop2: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    top: 38,
    left: 24,
  },
  drop3: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    top: 30,
    left: 32,
  },
});
