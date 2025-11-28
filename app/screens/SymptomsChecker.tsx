import React from 'react';
import SymptomChatModal from '../../components/SymptomChatModal';

// Minimal wrapper to satisfy Expo Router's requirement for a default export.
// The real, interactive modal is provided by `components/SymptomChatModal`.
export default function SymptomsCheckerScreen() {
	// Render the modal in closed state by default; users can open it from Home.
	return <SymptomChatModal isVisible={false} onClose={() => {}} />;
}
// interface Message {
//   id: string;
//   text: string;
//   sender: "user" | "bot";
// }

// const FALLBACK_QUICK_REPLIES = ["Headache", "Fever", "Cough", "Sore Throat", "Fatigue"];

// export default function SymptomCheckerScreen() {
//   const router = useRouter();
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: "1",
//       text: "Hello! I'm your personal health assistant. Please describe your symptoms. \n\nDisclaimer: I am not a real doctor. Please consult a professional for any serious concerns.",
//       sender: "bot",
//     },
//   ]);
//   const [input, setInput] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
//   const flatListRef = useRef<FlatList>(null);

//   // --- ✅ FIX 1: Authentication added to fetchSymptoms ---
//   useEffect(() => {
//     const fetchSymptoms = async () => {
//       try {
//         const token = await AsyncStorage.getItem('userToken');
//         if (!token) {
//           Alert.alert("Authentication Error", "You must be logged in to use this feature.");
//           return;
//         }

//         // ❗️ Make sure this endpoint is correct for your Python server
//         console.log(`Fetching symptoms from ${PYTHON_API_URL}/api/symptoms`);
//         const response = await fetch(`${PYTHON_API_URL}/api/symptoms`, {
//           headers: {
//             'Authorization': `Bearer ${token}`, // <-- Correctly added token
//             'Content-Type': 'application/json',
//           },
//         });

//         if (!response.ok) {
//           throw new Error(`Failed to fetch symptoms: ${response.status} ${response.statusText}`);
//         }
//         const data = await response.json();
//         setAllSymptoms(data); // Assuming data is string[] like ["headache", "fever"]
//       } catch (error) {
//         console.error("Failed to fetch symptom list:", error);
//         Alert.alert("Server Error", "Could not load symptoms. Please check your server connection and try again.");
//       }
//     };
//     fetchSymptoms();
//   }, []);

//   const handleSend = async () => {
//     if (!input.trim()) return;
//     const userMessage: Message = { id: Date.now().toString(), text: input, sender: "user" };
//     setMessages((prev) => [...prev, userMessage]);
//     const textToSend = input; // Grab text before clearing
//     setInput("");
//     await getBotResponse(textToSend); // Send the text
//   };

//   const handleQuickReply = async (symptom: string) => {
//     const userMessage: Message = { id: Date.now().toString(), text: symptom, sender: "user" };
//     setMessages((prev) => [...prev, userMessage]);
//     await getBotResponse(symptom);
//   };

//   // --- ✅ FIX 2: Major Logic Improvement ---
//   // This function now sends raw text to the server for processing
//   const getBotResponse = async (userInput: string) => {
//     setIsTyping(true);

//     // --- We no longer filter symptoms on the client ---
//     // (Removed the 'foundSymptoms' logic block)

//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       const userData = await AsyncStorage.getItem('userData');
//       const user = userData ? JSON.parse(userData) : null;
//       const userId = user?.id || 'anonymous'; // Use the real ID or a fallback

//       // ❗️ This endpoint must match your Python server's prediction route
//       console.log(`Sending prediction request to ${PYTHON_API_URL}/api/predict`);
//       
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

//       const response = await fetch(`${PYTHON_API_URL}/api/predict`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token || ''}`, // Send token
//         },
//         // --- Send the raw text, not filtered symptoms ---
//         body: JSON.stringify({ 
//           text: userInput, 
//           user_id: userId 
//         }),
//         signal: controller.signal,
//       });
//       clearTimeout(timeoutId);

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.error || `Server responded with status: ${response.status}`);
//       }

//       const data = await response.json();
//       // Server response should be like:
//       // { 
//       //   predicted_disease: "Common Cold", 
//       //   confidence_score: 0.85, 
//       //   found_symptoms: ["cough", "headache"] 
//       // }
      
//       const foundSymptoms = data.found_symptoms || [];
//       const confidence = (data.confidence_score * 100).toFixed(1);

//       let botMessageText = "";
//       if (foundSymptoms.length > 0) {
//         botMessageText = `Based on your symptoms (${foundSymptoms.join(', ')}), I think you might have **${data.predicted_disease}** with a confidence of ${confidence}%. \n\nWould you like to find doctors who specialize in this?`;
//       } else {
//         botMessageText = "I'm sorry, I couldn't identify any specific symptoms from your message. Could you try describing them differently? For example: 'I have a headache and a fever.'";
//       }

//       const botMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         text: botMessageText,
//         sender: "bot",
//       };
//       
//       setMessages((prev) => [...prev, botMessage]);

//     } catch (error) {
//       console.error("Symptom check failed:", error);
//       let errorMessage = "Sorry, I couldn't get a prediction.";
//       if (error instanceof Error) {
//         if (error.name === 'AbortError') {
//           errorMessage = "The server is taking too long to respond. Please try again later.";
//         } else {
//           errorMessage += ` Error: ${error.message}`;
//         }
//       }
//       Alert.alert("Error", errorMessage);
//       // Also send a message in the chat
//       const botMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         text: errorMessage,
//         sender: "bot",
//       };
//       setMessages((prev) => [...prev, botMessage]);
//     } finally {
//       setIsTyping(false);
//     }
//   };

//   // --- ✅ FIX 4: Dynamic Quick Replies ---
//   // This creates a formatted list of replies from the fetched symptoms
//   const quickReplies = useMemo(() => {
//     const formatSymptom = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
//     if (allSymptoms.length > 0) {
//       // Get 5 random symptoms from the list
//       const shuffled = [...allSymptoms].sort(() => 0.5 - Math.random());
//       return shuffled.slice(0, 5).map(formatSymptom);
//     }
//     return FALLBACK_QUICK_REPLIES; // Fallback to the hardcoded list
//   }, [allSymptoms]);


//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Ionicons name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.title}>Symptom Checker</Text>
//       </View>
//       <KeyboardAvoidingView
//         style={{ flex: 1 }}
//         behavior={Platform.OS === "ios" ? "padding" : "height"}
//         keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
//       >
//         <FlatList
//           ref={flatListRef}
//           data={messages}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.messageList}
//           // --- ✅ FIX 3: Auto-scrolling list ---
//           onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
//           onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
//           renderItem={({ item }) => (
//             <View
//               style={[
//                 styles.messageContainer,
//                 item.sender === "user"
//                   ? styles.userMessageContainer
//                   : styles.botMessageContainer,
//               ]}
//           >
//               {item.sender === "bot" && (
//                 <View style={styles.avatar}>
//                   <MaterialCommunityIcons
//                     name="robot-happy-outline"
//                     size={24}
//                     color="#fff"
//                   />
//                 </View>
//               )}
//              <View
//                 style={[
//                   styles.messageBubble,
//                   item.sender === "user"
//                     ? styles.userMessageBubble
//                     : styles.botMessageBubble,
//                 ]}
//               >
//                 {/* This now correctly styles user text as white and bot text as black */}
//                 <Text style={item.sender === 'user' ? styles.userMessageText : styles.messageText}>
//                   {item.text.replace(/\*\*/g, '')}
//                 </Text>
//               </View>
//             </View>
//           )}
//           ListFooterComponent={isTyping ? <TypingIndicator /> : null}
//         />

//         <View style={styles.inputArea}>
//           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplyContainer}>
//             {/* --- Use dynamic quickReplies list --- */}
//             {quickReplies.map((reply) => (
//               <TouchableOpacity key={reply} style={styles.quickReplyButton} onPress={() => handleQuickReply(reply)}>
//                 <Text style={styles.quickReplyText}>{reply}</Text>
//               </TouchableOpacity>
//            ))}
//           </ScrollView>
//           <View style={styles.inputContainer}>
//             <TextInput
//               style={styles.input}
//               placeholder="Describe your symptoms..."
//               value={input}
//               onChangeText={setInput}
//               selectionColor="#63b0a3"
//               onSubmitEditing={handleSend} // Send on keyboard "submit"
//             />
//             <TouchableOpacity 
//               style={styles.sendButton} 
//               onPress={handleSend} 
//               disabled={isTyping || !input.trim()} // Disable button when typing or no input
//             >
//               <Ionicons name="send" size={24} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const TypingIndicator = () => (
//   <View style={[styles.messageContainer, styles.botMessageContainer]}>
//     <View style={styles.avatar}>
//       <MaterialCommunityIcons name="robot-happy-outline" size={24} color="#fff" />
//     </View>
//     <View style={[styles.messageBubble, styles.botMessageBubble]}>
//       <ActivityIndicator size="small" color="#666" />
//     </View>
//   </View>
// );

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//     backgroundColor: "#fff",
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginLeft: 15,
//     color: "#333",
//   },
//   messageList: {
//     padding: 10,
//   },
//   messageContainer: {
//     flexDirection: "row",
//     marginVertical: 5,
//     alignItems: "flex-end",
//   },
//   userMessageContainer: {
//     justifyContent: "flex-end",
//   },
//   botMessageContainer: {
//     justifyContent: "flex-start",
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#63b0a3",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 10,
//   },
//   messageBubble: {
//     padding: 12,
//     borderRadius: 20,
//     maxWidth: "80%",
//   },
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   botMessageBubble: {
//     backgroundColor: "#f0f0f0",
//  borderBottomLeftRadius: 5,
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 22,
//     color: '#333', // Added default text color
//   },
//   // Make user text white
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   // Re-define styles to ensure user text is white
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   botMessageBubble: {
//     backgroundColor: "#f0f0f0",
//     borderBottomLeftRadius: 5,
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 22,
//     color: '#333', // Default bot text color
//   },
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   botMessageBubble: {
//     backgroundColor: "#f0f0f0",
//     borderBottomLeftRadius: 5,
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 22,
//     color: '#333', // Bot text color
//   },
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   userMessageText: { // Specific style for user text
//     fontSize: 16,
//     lineHeight: 22,
//     color: '#fff', 
//   },
//   botMessageBubble: {
//     backgroundColor: "#f0f0f0",
//     borderBottomLeftRadius: 5,
//   },
//   botMessageText: { // Specific style for bot text
//     fontSize: 16,
//     lineHeight: 22,
//     color: '#333',
//   },
//   // Final cleanup of styles
//   messageBubble: {
//     padding: 12,
//     borderRadius: 20,
//     maxWidth: "80%",
//   },
//   userMessageBubble: {
//     backgroundColor: "#63b0a3",
//     borderBottomRightRadius: 5,
//   },
//   botMessageBubble: {
//     backgroundColor: "#f0f0f0",
//     borderBottomLeftRadius: 5,
//   },
//   messageText: { // Use this as the default (bot)
//     fontSize: 16,
//     lineHeight: 22,
//     color: '#333',
//   },
//   // Add a specific style for user text
//   userMessageText: {
//     fontSize: 16,
//     lineHeight: 22,
//     color: '#fff',
//   },
//   //... rest of your styles
//   inputArea: {
//     borderTopWidth: 1,
//     borderTopColor: "#eee",
//     backgroundColor: "#fff",
//   },
//   quickReplyContainer: {
//     paddingHorizontal: 10,
//     paddingVertical: 10,
//   },
//   quickReplyButton: {
//     backgroundColor: "#e8f5e9",
//     paddingVertical: 8,
//     paddingHorizontal: 15,
//     borderRadius: 20,
//     marginRight: 10,
//     borderWidth: 1,
//     borderColor: '#c8e6c9',
//   },
//   quickReplyText: {
//     color: "#388e3c",
//     fontWeight: "600",
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 10,
//   },
//   input: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 25,
//     paddingHorizontal: 15,
//     paddingVertical: 10,
//     marginRight: 10,
//     backgroundColor: "#f9f9f9",
//   },
//   sendButton: {
//     backgroundColor: "#63b0a3",
//     padding: 12,
//     borderRadius: 25,
//   }



