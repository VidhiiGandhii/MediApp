import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Splash first */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Tabs group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Extra pages (hidden from bottom bar) */}
        <Stack.Screen
          name="medicineTracker"
          options={{
            headerShown: false,
            presentation: "modal", // optional: makes it slide up
          }}
        />
      </Stack>
    </>
  );
}
