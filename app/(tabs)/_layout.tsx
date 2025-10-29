// import { Tabs } from "expo-router";
// import { Ionicons } from "@expo/vector-icons";

// export default function TabLayout() {
//   return (
//     <Tabs screenOptions={{ headerShown: false }}>
//       <Tabs.Screen
//         name="index"
//         options={{
//           title: "Home",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="home-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="medicineTracker"
//         options={{
//           title: "Medicines",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="medkit-outline" size={size} color={color} />
//           ),
//         }}
//       />
    
//       <Tabs.Screen
//         name="FamilyScreen"
//         options={{
//           title: "Family",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="people-outline" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="ProfileScreen"
//         options={{
//           title: "Profile",
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="person" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// }
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, ComponentProps } from 'react';
import { useRouter } from 'expo-router';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#63b0a3',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />
 <Tabs.Screen
         name="appointmentScreen"
         options={{
           title: "Appointments",
           tabBarIcon: ({ color, size }) => (
             <Ionicons name="calendar-outline" size={size} color={color} />
           ),
         }}
       />
      <Tabs.Screen
        name="medicineTracker"
        options={{
          title: 'Medications',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={('pill') }
              size={28}
              color={color}
            />
          ),
        }}
      />
      
 {/* <Tabs.Screen
        name="medicineTracker"
         options={{
           title: "Medicines",
           tabBarIcon: ({ color, size }) => (
             <Ionicons name="medkit-outline" size={size} color={color} />
           ),
         }}
       /> */}
      <Tabs.Screen
        name="symptom-checker"
        options={{
          title: 'Symptoms',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'stethoscope' : 'stethoscope'}
              size={28}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
  name="inventory"
  options={{
    title: 'Inventory',
    tabBarIcon: ({ color, focused }) => (
      <MaterialCommunityIcons 
        name={focused ? 'package-variant' : 'package-variant-closed'} 
        size={28} 
        color={color} 
      />
    ),
  }}
/>
    </Tabs>
    
  );
}
