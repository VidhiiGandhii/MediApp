import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Backend API commented out - using local analyzer instead
// import { PYTHON_API_URL } from "../config/api";
import ttsService from "../services/ttsService";
import { commonSymptoms, generateBotResponse } from "../utils/symptomAnalyzer";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

interface SymptomChatModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const FALLBACK_QUICK_REPLIES = (commonSymptoms || ['headache','fever','cough','sore throat','fatigue']).slice(0,5).map(s => s.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase()));

export default function SymptomChatModal({ isVisible, onClose }: SymptomChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your personal health assistant. Please describe your symptoms. \n\nDisclaimer: I am not a real doctor. Please consult a professional for any serious concerns.",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Backend symptom fetching removed - using local commonSymptoms from analyzer

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    const textToSend = input;
    setInput("");
    await getBotResponse(textToSend);
  };

  const handleQuickReply = async (symptom: string) => {
    const userMessage: Message = { id: Date.now().toString(), text: symptom, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    await getBotResponse(symptom);
  };

  const getBotResponse = async (userInput: string) => {
    setIsTyping(true);
    // Use local analyzer directly for instant response (no backend calls)
    setTimeout(() => {
      try {
        const localReply = generateBotResponse(userInput);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: localReply,
          sender: "bot",
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        console.error("Local analyzer error:", error);
        let errorMessage = "Sorry, I couldn't process your symptoms.";
        if (error instanceof Error) errorMessage += ` Error: ${error.message}`;
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: errorMessage,
          sender: "bot",
        };
        setMessages((prev) => [...prev, botMessage]);
      }
      setIsTyping(false);
    }, 300); // Small delay for UX smoothness
  };

  const quickReplies = useMemo(() => {
    // Use local commonSymptoms from analyzer
    return FALLBACK_QUICK_REPLIES;
  }, []);

  const speakMessage = async (text: string, messageId: string) => {
    try {
      const result = await ttsService.translateAndSpeak(text);
      if (!result.success) {
        Alert.alert("Error", result.error || "Failed to generate speech");
        return;
      }

      if (result.audioUrl) {
        if (sound) {
          await sound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: result.audioUrl },
          { shouldPlay: true }
        );

        setSound(newSound);
        setPlayingAudioId(messageId);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setPlayingAudioId(null);
          }
        });

        Alert.alert("Success", `Hindi: ${result.hindiText}`);
      }
    } catch (error) {
      console.error("Speak error:", error);
      Alert.alert("Error", "Failed to generate speech");
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setPlayingAudioId(null);
    }
  };

  const deleteMessage = (messageId: string) => {
    Alert.alert(
      "Delete Message",
      "Remove this message from chat?",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Symptom Checker</Text>
          </View>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
                    <Text style={item.sender === 'user' ? styles.userMessageText : styles.messageText}>
                      {item.text.replace(/\*\*/g, '')}
                    </Text>

                    {/* Action buttons for bot messages */}
                    {item.sender === "bot" && (
                      <View style={styles.messageActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => speakMessage(item.text, item.id)}
                        >
                          <MaterialCommunityIcons name="volume-high" size={16} color="#fff" />
                          <Text style={styles.actionButtonText}>Speak</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteActionButton]}
                          onPress={() => deleteMessage(item.id)}
                        >
                          <MaterialCommunityIcons name="delete" size={16} color="#fff" />
                          <Text style={styles.actionButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
              ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            />

            <View style={styles.inputArea}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplyContainer}>
                {quickReplies.map((reply) => (
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
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSend}
                  disabled={isTyping || !input.trim()}
                >
                  <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '90%',
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
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
    color: '#333',
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
  },
  messageActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#63b0a3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deleteActionButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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