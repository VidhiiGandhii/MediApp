import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { useAuth } from "../contexts/AuthContext";

// 🚨 CRITICAL: REPLACE THIS WITH YOUR COMPUTER'S ACTUAL LOCAL IPV4 ADDRESS AND PORT 3000
// Example: http://192.168.1.5:3000
import { API_URL } from "../../config/api"; 

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
    // FIX: Correctly destructuring the 'login' function from AuthContext
    const { login } = useAuth(); 
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    // Animation states
    const fallRate = useSharedValue<number>(2);
    const clearTrigger = useSharedValue<boolean>(false);

    const handleTextChange = (text: string): void => {
        fallRate.value = Math.min(2 + text.length * 0.5, 20);
    };

    const handleSubmit = async (): Promise<void> => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email/username and password.");
            return;
        }

        try {
            // 1. Attempt connection to the backend
            const response = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // 2. On success, use the context function to save token and user data
                await login(data.token, data.user); 
                
                clearTrigger.value = true;
                setTimeout(() => {
                    // 3. Navigate to the main application tabs
                    router.replace("/(tabs)");
                }, 800);
            } else {
                Alert.alert("Login Failed", data.message || "An unknown error occurred.");
            }
        } catch (error: any) {
            console.error("Login failed:", error);
            // Updated error message to guide user to the API_URL fix
            Alert.alert("Connection Error", `Could not connect to the server. Check your API_URL configuration and network connection.`);
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