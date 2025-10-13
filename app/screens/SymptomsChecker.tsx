import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from "../../config/api";
import { SafeAreaView } from "react-native-safe-area-context";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

const QUICK_REPLIES = ["Headache", "Fever", "Cough", "Sore Throat", "Fatigue"];

export default function SymptomCheckerScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your personal health assistant. Please describe your symptoms. \n\nDisclaimer: I am not a real doctor. Please consult a professional for any serious concerns.",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        console.log(`Fetching symptoms from ${API_URL}/api/symptoms`);
        const response = await fetch(`${API_URL}/api/symptoms`);
        if (!response.ok) {
          throw new Error(`Failed to fetch symptoms: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setAllSymptoms(data);
      } catch (error) {
        console.error("Failed to fetch symptom list:", error);
        Alert.alert("Error", "Could not load symptoms. Please check your server connection and try again.");
      }
    };
    fetchSymptoms();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    await getBotResponse(input);
  };

  const handleQuickReply = async (symptom: string) => {
    const userMessage: Message = { id: Date.now().toString(), text: symptom, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    await getBotResponse(symptom);
  };

  const getBotResponse = async (userInput: string) => {
    setIsTyping(true);

    const foundSymptoms = allSymptoms.filter(symptom =>
      userInput.toLowerCase().includes(symptom.replace(/_/g, ' ').toLowerCase())
    );

    if (foundSymptoms.length === 0) {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I don't recognize those symptoms. Can you try describing them differently?",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const user = userData ? JSON.parse(userData) : null;
      const userId = user?.id || 'anonymous';

      console.log(`Sending symptom check to ${API_URL}/api/symptom-check`, { symptoms: foundSymptoms, userId });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${API_URL}/api/symptom-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ symptoms: foundSymptoms, user_id: userId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      const confidence = (data.confidence_score * 100).toFixed(1);
      const botMessageText = `Based on your symptoms (${foundSymptoms.join(', ')}), I think you might have **${data.predicted_disease}** with a confidence of ${confidence}%. \n\nWould you like to find doctors who specialize in this?`;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botMessageText,
        sender: "bot",
      };
      
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Symptom check failed:", error);
      Alert.alert("Error", error.name === 'AbortError'
        ? "Request timed out. Please check your network and try again."
        : `Sorry, I couldn't get a prediction. Error: ${error.message}`);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Symptom Checker</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainer,
                item.sender === "user"
                  ? styles.userMessageContainer
                  : styles.botMessageContainer,
              ]}
            >
              {item.sender === "bot" && (
                <View style={styles.avatar}>
                  <MaterialCommunityIcons
                    name="robot-happy-outline"
                    size={24}
                    color="#fff"
                  />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  item.sender === "user"
                    ? styles.userMessageBubble
                    : styles.botMessageBubble,
                ]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        <View style={styles.inputArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplyContainer}>
            {QUICK_REPLIES.map((reply) => (
              <TouchableOpacity key={reply} style={styles.quickReplyButton} onPress={() => handleQuickReply(reply)}>
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Describe your symptoms..."
              value={input}
              onChangeText={setInput}
              selectionColor="#63b0a3"
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TypingIndicator = () => (
  <View style={[styles.messageContainer, styles.botMessageContainer]}>
    <View style={styles.avatar}>
      <MaterialCommunityIcons name="robot-happy-outline" size={24} color="#fff" />
    </View>
    <View style={[styles.messageBubble, styles.botMessageBubble]}>
      <ActivityIndicator size="small" color="#666" />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 15,
    color: "#333",
  },
  messageList: {
    padding: 10,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 5,
    alignItems: "flex-end",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#63b0a3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: "80%",
  },
  userMessageBubble: {
    backgroundColor: "#63b0a3",
    borderBottomRightRadius: 5,
  },
  botMessageBubble: {
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputArea: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  quickReplyContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  quickReplyButton: {
    backgroundColor: "#e8f5e9",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  quickReplyText: {
    color: "#388e3c",
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "#f9f9f9",
  },
  sendButton: {
    backgroundColor: "#63b0a3",
    padding: 12,
    borderRadius: 25,
  },
});