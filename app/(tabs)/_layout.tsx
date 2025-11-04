import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    // 👇 SafeAreaView with no top padding, keeps only bottom safe area
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, backgroundColor: "#ffffffff" }}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#63b0a3",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: {
            height: 72,
            paddingBottom: 10,
            paddingTop: 5,
            backgroundColor: "#fff",
            borderTopWidth: 0.5,
            borderTopColor: "#ccc",
          },
          tabBarLabelStyle: {
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "home" : "home-outline"}
                size={26}
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
            title: "Medications",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="pill" size={26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="symptom-checker"
          options={{
            title: "Symptoms",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="stethoscope" size={26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="ProfileScreen"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "account" : "account-outline"}
                size={26}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="inventory"
          options={{
            title: "Inventory",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "package-variant" : "package-variant-closed"}
                size={26}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}