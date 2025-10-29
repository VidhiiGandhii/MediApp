// import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";

// export default function RootLayout() {
//   return (
//     <>
//       <StatusBar style="dark" />
//       <Stack screenOptions={{ headerShown: false }}>
//         {/* Splash first */}
//         <Stack.Screen name="index" options={{ headerShown: false }} />

//         {/* Tabs group */}
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

//         {/* Extra pages (hidden from bottom bar) */}
//         <Stack.Screen
//           name="medicineTracker"
//           options={{
//             headerShown: false,
//             presentation: "modal", // optional: makes it slide up
//           }}
//         />
//       </Stack>
//     </>
//   );
// }
import { Stack } from 'expo-router';
import { AuthProvider } from './contexts/AuthContext';
import { useEffect } from 'react';
import { NotificationService } from './services/notificationService';

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions when app loads
    NotificationService.requestPermissions();

    // Listen for notification taps
    const subscription = NotificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);
        
        // Handle navigation based on notification type
        if (data.type === 'medication_reminder') {
          // Navigate to medications screen
          // router.push('/medications');
        }
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
