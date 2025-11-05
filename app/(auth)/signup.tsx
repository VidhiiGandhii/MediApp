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
// ... (other imports)
import { API_URL } from "../../config/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../contexts/AuthContext';
import MaterialCommunityIcons from "@expo/vector-icons/build/MaterialCommunityIcons";

// ... (TabletButton component is unchanged)

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  // --- 1. ADD STATE FOR CONFIRM PASSWORD ---
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // ... (fallRate and other hooks are unchanged)

  const handleTextChange = (text: string): void => {
    // ... (unchanged)
  };

  const handleSignup = async (): Promise<void> => {
    if (!name || !username || !email || !password || !confirmPassword) { // <-- 2. CHECK IT
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // --- 3. ADD CLIENT-SIDE CHECK ---
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
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
        // --- 4. SEND IT TO THE BACKEND ---
        body: JSON.stringify({ name, username, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await login(data.token, data.user);
        
        // ... (rest of your success logic)
        // clearTrigger.value = true;
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

  return (
    <SafeAreaView style={styles.container}>
      {/* <FallingTablets ... /> */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start managing your health today.</Text>

          {/* ... (Name, Username, Email inputs are unchanged) ... */}
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

          {/* --- 5. ADD THE NEW TEXT INPUT --- */}
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={(text: string) => {
              setConfirmPassword(text);
              handleTextChange(text);
            }}
            secureTextEntry
          />

          {/* ... (Rest of the component is unchanged) ... */}
          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <MaterialCommunityIcons name="pill" size={24} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ... (styles are unchanged)
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