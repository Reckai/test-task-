import { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface InkDropProps {
  delay: number;
  style: ViewStyle;
}

const SPRING_CONFIG = { damping: 6, stiffness: 200 };

export function InkDrop({ delay, style }: InkDropProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-12);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
    scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
  }, [delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return <Animated.View style={[style, animStyle]} />;
}
