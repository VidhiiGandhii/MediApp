import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TABLET_COUNT = 15;
const TABLET_COLORS = ['#c08370ff', '#63b0a3ff', '#bd7994ff'];

const Tablet = ({ delay }) => {
  const { height, width } = useWindowDimensions();
  const top = useSharedValue(-50);
  const left = Math.random() * width;
  const rotate = useSharedValue((Math.random() - 0.5) * 360);
  const scale = Math.random() * 0.5 + 0.5;

  useEffect(() => {
    top.value = withDelay(
      delay,
      withRepeat(
        withTiming(height + 50, {
          duration: 2000 + Math.random() * 1000,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );
    rotate.value = withRepeat(
      withTiming(rotate.value + (Math.random() > 0.5 ? 180 : -180), {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    top: top.value,
    transform: [{ rotate: `${rotate.value}deg` }, { scale }],
  }));

  return (
    <Animated.View style={[styles.tablet, { left }, animatedStyle]}>
      <MaterialCommunityIcons
        name="pill"
        size={40}
        color={TABLET_COLORS[Math.floor(Math.random() * TABLET_COLORS.length)]}
      />
    </Animated.View>
  );
};

export default function FallingTablets() {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: TABLET_COUNT }).map((_, i) => (
        <Tablet key={i} delay={i * 200} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  tablet: {
    position: 'absolute',
  },
});