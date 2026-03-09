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
import { useAuth } from "../../contexts/AuthContext";

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
    const { login } = useAuth();
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);

    // Animation states
    const fallRate = useSharedValue<number>(2);
    const clearTrigger = useSharedValue<boolean>(false);

    const handleTextChange = (text: string): void => {
        fallRate.value = Math.min(2 + text.length * 0.5, 20);
    };

    const handleSubmit = async (): Promise<void> => {
        console.log("🚀 Login submitted");
        if (!email || !password) {
            Alert.alert("Error", "Please enter both email/username and password.");
            return;
        }

        setIsLoading(true);

        try {
            console.log("📡 Sending login request to:", `${API_URL}/api/login`);
            const response = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            console.log("📥 Response status:", response.status);
            const responseText = await response.text();
            console.log("📝 Raw response:", responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error("❌ Failed to parse JSON:", e);
                Alert.alert("Server Error", "The server returned an invalid response format.");
                return;
            }

            if (response.ok && data.success) {
                console.log("✅ Login successful!");
                await login(data.token, data.user);

                clearTrigger.value = true;
                setTimeout(() => {
                    router.replace("/(tabs)");
                }, 800);
            } else {
                console.warn("⚠️ Login failed:", data.message);
                Alert.alert("Login Failed", data.message || "An unknown error occurred.");
            }
        } catch (error: any) {
            console.error("🚨 Login error:", error);
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

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#555', marginBottom: 10 }, (isTestingConnection || isLoading) && { opacity: 0.7 }]}
                        disabled={isTestingConnection || isLoading}
                        onPress={async () => {
                            const testUrl = `${API_URL}/api/ping`;
                            setIsTestingConnection(true);
                            Alert.alert("Diagnostic Start", `Testing reachability to:\n${testUrl}`);
                            try {
                                const controller = new AbortController();
                                const timeoutId = setTimeout(() => controller.abort(), 5000);

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
                                if (err.name === 'AbortError') detail = "Connection timed out (5s).";

                                Alert.alert("Network Failure",
                                    `❌ Cannot reach server.\n\nError: ${detail}\n\nTroubleshoot:\n1. Server running on port 8000?\n2. Port 8000 allowed in Firewall?\n3. Same Wi-Fi?`);
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
                        onPress={handleSubmit}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="pill" size={24} color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.buttonText}>Login</Text>
                            </>
                        )}
                    </TouchableOpacity>

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