import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import FallingTablets from "../../components/FallingTablets";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SharedValue, useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config/api";
import { useAuth } from "../contexts/AuthContext";

type TabletButtonProps = {
  onPress: () => void;
  text: string;
};

const TabletButton: React.FC<TabletButtonProps> = ({ onPress, text }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <MaterialCommunityIcons name="pill" size={24} color="#fff" style={{ marginRight: 10 }} />
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);

export default function LoginScreen() {
  const router = useRouter();
   const { login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const fallRate = useSharedValue<number>(2);
  const clearTrigger = useSharedValue<boolean>(false);

  const handleTextChange = (text: string): void => {
    fallRate.value = Math.min(2 + text.length * 0.5, 20);
  };

  // const handleSubmit = async (): Promise<void> => {
  //   if (!email || !password) {
  //     Alert.alert("Error", "Please enter both email/username and password.");
  //     return;
  //   }

  //   try {
  //     const controller = new AbortController();
  //     const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
  //     const response = await fetch(`${API_URL}/api/login`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ email, password }),
  //       signal: controller.signal,
  //     });
  //     clearTimeout(timeoutId);

  //     const data: {
  //       success?: boolean;
  //       message?: string;
  //       token?: string;
  //       user?: { name: string; email: string; username: string };
  //     } = await response.json();

  //     if (response.ok && data.success) {
  //       await AsyncStorage.setItem('userToken', data.token);
  //       await AsyncStorage.setItem('userData', JSON.stringify(data.user));
  //       clearTrigger.value = true;
  //       setTimeout(() => {
  //         router.replace("/(tabs)");
  //       }, 800);
  //     } else {
  //       Alert.alert("Login Failed", data.message || "An unknown error occurred.");
  //     }
  //   } catch (error) {
  //     console.error("Login failed:", error);
  //     Alert.alert("Connection Error", error.name === 'AbortError'
  //       ? "Request timed out. Please try again."
  //       : "Could not connect to the server. Please try again.");
  //   }
  // };
  const handleSubmit = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email/username and password.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Use auth context to store user data
        await login(data.token, data.user);
        
        clearTrigger.value = true;
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 800);
      } else {
        Alert.alert("Login Failed", data.message || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      Alert.alert("Connection Error", "Could not connect to the server. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FallingTablets fallRate={fallRate} clearTrigger={clearTrigger} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Log in to continue your health journey.</Text>

          <TextInput
            style={styles.input}
            placeholder="Email or Username"
            placeholderTextColor="#888"
            onChangeText={(text: string) => {
              setEmail(text);
              handleTextChange(text + password);
            }}
            value={email}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            onChangeText={(text: string) => {
              setPassword(text);
              handleTextChange(email + text);
            }}
            value={password}
          />

          <TabletButton text="Login" onPress={handleSubmit} />

          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text style={styles.link}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#63b0a3",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#63b0a3",
    fontWeight: "600",
  },
});