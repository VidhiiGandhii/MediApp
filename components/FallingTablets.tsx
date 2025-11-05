import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// --- Configuration ---
const TABLET_COUNT = 15;
const TABLET_COLORS = ['#c08370ff', '#63b0a3ff', '#bd7994ff'];

// CRITICAL: Prop definitions for the main component to satisfy TypeScript
interface FallingTabletsProps {
  fallRate: SharedValue<number>; 
  clearTrigger: SharedValue<boolean>;
}

// --- Individual Tablet Component ---
interface TabletProps {
  delay: number;
  fallRate: SharedValue<number>;
  clearTrigger: SharedValue<boolean>;
}

const Tablet: React.FC<TabletProps> = ({ delay, fallRate, clearTrigger }) => {
  const { height, width } = useWindowDimensions();
  const top = useSharedValue(-50);
  // Use useMemo for static values like left, rotation, and color
  const left = useMemo(() => Math.random() * width, [width]);
  const initialRotate = useMemo(() => (Math.random() - 0.5) * 360, []);
  const rotate = useSharedValue(initialRotate);
  const scale = useMemo(() => Math.random() * 0.5 + 0.5, []);
  const color = useMemo(() => TABLET_COLORS[Math.floor(Math.random() * TABLET_COLORS.length)], []);

  // Effect handles the falling and rotating animations
  useEffect(() => {
    // 1. Vertical Falling Animation (Dependent on fallRate)
    top.value = withDelay(
      delay,
      withRepeat(
        withTiming(height + 50, {
          // Duration is dynamically adjusted by fallRate for interaction
          duration: 15000 / fallRate.value, 
          easing: Easing.linear,
        }),
        -1, // Loop indefinitely
        false
      )
    );
    
    // 2. Rotation Animation
    rotate.value = withRepeat(
      withTiming(rotate.value + (Math.random() > 0.5 ? 180 : -180), {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      true
    );

    // Cleanup: Reset animation when component unmounts
    return () => {
      top.value = withTiming(-50);
      rotate.value = withTiming(initialRotate);
    }
  }, [delay, height, fallRate]); // Re-run effect if height or fallRate changes

  // Effect to handle the clear trigger (Login success)
  useEffect(() => {
    if (clearTrigger.value) {
      // Animate them off-screen or fade them out quickly
      top.value = withTiming(height + 50, { duration: 500 }); 
    }
  }, [clearTrigger, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    top: top.value,
    transform: [{ rotate: `${rotate.value}deg` }, { scale }],
  }));

  return (
    <Animated.View style={[styles.tablet, { left }, animatedStyle]}>
      <MaterialCommunityIcons
        name="pill"
        size={40}
        color={color}
      />
    </Animated.View>
  );
};

// --- Main FallingTablets Component ---
const FallingTablets: React.FC<FallingTabletsProps> = ({ fallRate, clearTrigger }) => {
  const tablets = useMemo(() => {
    return Array.from({ length: TABLET_COUNT }).map((_, i) => ({
      key: i,
      delay: i * 200,
    }));
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {tablets.map((tablet) => (
        <Tablet 
          key={tablet.key} 
          delay={tablet.delay} 
          fallRate={fallRate} // Pass props down
          clearTrigger={clearTrigger} // Pass props down
        />
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

export default FallingTablets;