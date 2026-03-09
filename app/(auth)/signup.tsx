import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import FallingTablets from "../../components/FallingTablets";
import { API_URL } from "../../config/api";
import { useAuth } from '../../contexts/AuthContext';

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
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

  // Animation states
  const fallRate = useSharedValue<number>(2);
  const clearTrigger = useSharedValue<boolean>(false);

  const handleTextChange = (text: string): void => {
    fallRate.value = Math.min(2 + text.length * 0.5, 20);
  };

  const handleSignup = async (): Promise<void> => {
    console.log("🚀 Signup button pressed");
    Alert.alert("Debug", "Signup button clicked");

    if (!name || !username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

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

    setIsLoading(true);
    try {
      console.log("📡 Sending signup request to:", `${API_URL}/api/signup`);
      const response = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" ") || "User",
          username,
          email,
          password,
          role: "guardian",
        }),
      });

      console.log("📥 Response status:", response.status);
      const responseText = await response.text();
      console.log("📝 Raw response:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("❌ Failed to parse JSON:", e);
        Alert.alert("Server Error", "The server returned an invalid response format (not JSON).");
        return;
      }

      if (response.ok && data.success) {
        console.log("✅ Signup successful!");
        await login(data.token, data.user);

        clearTrigger.value = true;
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 800);
      } else {
        console.warn("⚠️ Signup failed:", data.message);
        Alert.alert("Signup Failed", data.message || "An unknown error occurred.");
      }
    } catch (error: any) {
      console.error("🚨 Signup error:", error);
      Alert.alert("Connection Error", `Could not connect to the server at ${API_URL}. Details: ${error.message}`);
    } finally {
      setIsLoading(false);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start managing your health today.</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={(text: string) => {
              setName(text);
              handleTextChange(text + username + email + password);
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
              handleTextChange(name + text + email + password);
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
              handleTextChange(name + username + text + password);
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
              handleTextChange(name + username + email + text);
            }}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={(text: string) => {
              setConfirmPassword(text);
              handleTextChange(name + username + email + password + text);
            }}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#555', marginBottom: 10 }, (isTestingConnection || isLoading) && { opacity: 0.7 }]}
            disabled={isTestingConnection || isLoading}
            onPress={async () => {
              const testUrl = `${API_URL}/api/ping`;
              setIsTestingConnection(true);
              Alert.alert("Diagnostic Start", `Testing reachability to:\n${testUrl}`);
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const start = Date.now();
                const res = await fetch(testUrl, {
                  method: 'GET',
                  signal: controller.signal
                });
                clearTimeout(timeoutId);

                const duration = Date.now() - start;
                const data = await res.json();
                Alert.alert("Success!", `✅ Connected to Backend!\n\nTime: ${duration}ms\nResponse: ${data.message}\nStatus: ${res.status}`);
              } catch (err: any) {
                let detail = err.message;
                if (err.name === 'AbortError') detail = "Connection timed out (5s). The PC is likely not responding on this IP/Port.";

                Alert.alert("Network Failure",
                  `❌ Cannot reach server.\n\nError: ${detail}\n\nTroubleshoot:\n1. PC IP: 192.168.1.11?\n2. Port 8000 allowed in Firewall?\n3. PC and Phone on same Wi-Fi?`);
                console.error("DIAGNOSTIC FAILURE:", err);
              } finally {
                setIsTestingConnection(false);
              }
            }}
          >
            {isTestingConnection ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="wifi-check" size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Check Server Connection</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isLoading && { opacity: 0.7 }]}
            disabled={isLoading || isTestingConnection}
            onPress={handleSignup}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="pill" size={24} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Sign Up</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(auth)/login');
            }
          }}>
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