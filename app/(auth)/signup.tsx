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
import { API_URL } from "../../config/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../contexts/AuthContext';

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

export default function SignupScreen() {
  const router = useRouter();
   const { login } = useAuth();
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const fallRate = useSharedValue<number>(2);
  const clearTrigger = useSharedValue<boolean>(false);

  const handleTextChange = (text: string): void => {
    fallRate.value = Math.min(2 + text.length * 0.5, 20);
  };

  const handleSignup = async (): Promise<void> => {
    if (!name || !username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
try {
      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
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
        Alert.alert("Signup Failed", data.message || "An unknown error occurred.");
      }
    } catch (error) {
      console.error("Signup failed:", error);
      Alert.alert("Connection Error", "Could not connect to the server. Please try again.");
    }
  };

  //   try {
  //     const controller = new AbortController();
  //     const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
  //     const response = await fetch(`${API_URL}/api/signup`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ name, username, email, password }),
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
  //       Alert.alert("Signup Failed", data.message || "An unknown error occurred.");
  //     }
  //   } catch (error) {
  //     console.error("Signup failed:", error);
  //     Alert.alert("Connection Error", error.name === 'AbortError'
  //       ? "Request timed out. Please try again."
  //       : "Could not connect to the server. Please try again.");
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>
      <FallingTablets fallRate={fallRate} clearTrigger={clearTrigger} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start managing your health today.</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={(text: string) => {
              setName(text);
              handleTextChange(text);
            }}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={(text: string) => {
              setUsername(text);
              handleTextChange(text);
            }}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={(text: string) => {
              setEmail(text);
              handleTextChange(text);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={(text: string) => {
              setPassword(text);
              handleTextChange(text);
            }}
            secureTextEntry
          />

          <TabletButton text="Sign Up" onPress={handleSignup} />

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Already have an account? Login</Text>
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