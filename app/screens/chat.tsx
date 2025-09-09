import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

interface Message {
  id: string;
  text: string;
  sender: "user" | "doctor";
}

interface DoctorProfile {
  name: string;
  specialty: string;
  image: any;
}

const ChatPage: React.FC = () => {
  const { doctorName } = useLocalSearchParams<{ doctorName: string }>();

  const doctorProfile: DoctorProfile = {
    name: doctorName,
    specialty: "Cardiologist",
    image: require("../../assets/images/dr1.jpg"),
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    // Dummy doctor reply after 1 second
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: " Got it!", sender: "doctor" },
      ]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        {/* Doctor Profile */}
        <View style={styles.profileContainer}>
          <Image source={doctorProfile.image} style={styles.profileImage} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.profileName}>{doctorProfile.name}</Text>
            <Text style={styles.profileSpecialty}>{doctorProfile.specialty}</Text>
          </View>
        </View>

        {/* Chat messages */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.sender === "user" ? styles.userMessage : styles.doctorMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  item.sender === "user" ? styles.userMessageText : styles.doctorMessageText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 10 }}
        />

        {/* Input box */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
            selectionColor="#63b0a3" // caret color
            underlineColorAndroid="transparent" // remove Android orange
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={{ color: "#fff" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatPage;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },

  // Doctor Profile
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#63b0a3",
    borderRadius: 12,
  },
  profileImage: { width: 60, height: 60, borderRadius: 30 },
  profileName: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  profileSpecialty: { fontSize: 14, color: "#eee" },

  // Chat messages
  message: { padding: 10, borderRadius: 8, marginVertical: 4, maxWidth: "70%" },
  userMessage: { alignSelf: "flex-end", backgroundColor: "#63b0a3" },
  doctorMessage: { alignSelf: "flex-start", backgroundColor: "#ddd" },
  messageText: { fontSize: 14 },
  userMessageText: { color: "#fff" },
  doctorMessageText: { color: "#000" },

  // Input box
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#63b0a3", // fixed border color
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#63b0a3",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
});