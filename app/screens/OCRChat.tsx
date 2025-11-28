import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { secureStorageHelper } from '../../utils/secureStorage';

import { Audio } from 'expo-av';
import { API_URL } from '../../config/api';
import ttsService from '../../services/ttsService';

type ChatMessage = {
  _id: string;
  summary: string;
  fullText: string;
  audioFileId?: string;
  createdAt: string;
};

const OCRChat: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getValidToken = async (): Promise<string | null> => {
    try {
      const token = await secureStorageHelper.getItem('userToken');
      return token || null;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  };

  const fetchChatMessages = async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert('Authentication Required', 'Please log in again.');
        return;
      }

      const response = await fetch(`${API_URL}/api/chat/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat messages');
      }

      const data = await response.json();
      setChatMessages(data.chats || []);
    } catch (error) {
      console.error('Fetch chat error:', error);
      Alert.alert('Error', 'Failed to load chat messages.');
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (chatId: string) => {
    try {
      const token = await getValidToken();
      if (!token) return;

      // Stop currently playing audio if any
      if (sound) {
        await sound.unloadAsync();
      }

      const audioUrl = `${API_URL}/api/chat/${chatId}/audio`;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl, headers: { Authorization: `Bearer ${token}` } },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingAudioId(chatId);

      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setPlayingAudioId(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setPlayingAudioId(null);
    }
  };

  const deleteMessage = async (chatId: string) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message from chat history?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const token = await getValidToken();
              if (!token) {
                Alert.alert('Error', 'Authentication required');
                return;
              }

              const response = await fetch(`${API_URL}/api/chat/${chatId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (!response.ok) {
                throw new Error('Failed to delete message');
              }

              // Remove from local state
              setChatMessages((prev) => prev.filter((msg) => msg._id !== chatId));
              Alert.alert('Success', 'Message deleted from chat history');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const translateAndSpeak = async (text: string, chatId: string) => {
    try {
      Alert.alert('Translating & Speaking', 'Converting to Hindi speech...');
      const token = await getValidToken();
      if (!token) return;

      const result = await ttsService.translateAndSpeak(text, token);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to translate and speak');
        return;
      }

      // Play the generated Hindi audio
      if (result.audioUrl) {
        if (sound) {
          await sound.unloadAsync();
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: result.audioUrl, headers: { Authorization: `Bearer ${token}` } },
          { shouldPlay: true }
        );

        setSound(newSound);
        setPlayingAudioId(chatId);

        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setPlayingAudioId(null);
          }
        });

        Alert.alert('Success', `Hindi: ${result.hindiText}`);
      }
    } catch (error) {
      console.error('Translate and speak error:', error);
      Alert.alert('Error', 'Failed to process request');
    }
  };

  useEffect(() => {
    fetchChatMessages();
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const renderChatItem = ({ item }: { item: ChatMessage }) => {
    const isExpanded = expandedId === item._id;
    const isPlaying = playingAudioId === item._id;
    const createdDate = new Date(item.createdAt).toLocaleDateString();

    return (
      <Card style={styles.chatCard}>
        <TouchableOpacity
          style={styles.chatHeader}
          onPress={() => setExpandedId(isExpanded ? null : item._id)}
        >
          <View style={styles.chatTitleContainer}>
            <MaterialIcons name="chat" size={20} color="#63b0a3" />
            <Text style={styles.chatDate}>{createdDate}</Text>
          </View>
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color="#63b0a3"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.chatContent}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{item.summary || 'No summary available.'}</Text>

            {item.audioFileId && (
              <View style={styles.audioContainer}>
                <TouchableOpacity
                  style={[
                    styles.audioButton,
                    isPlaying && styles.audioButtonActive,
                  ]}
                  onPress={() => (isPlaying ? stopAudio() : playAudio(item._id))}
                >
                  <MaterialIcons
                    name={isPlaying ? 'pause' : 'play-arrow'}
                    size={20}
                    color="white"
                  />
                  <Text style={styles.audioButtonText}>
                    {isPlaying ? 'Pause Audio' : 'Play Audio Summary'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Translate to Hindi & Speak Button */}
            <TouchableOpacity
              style={styles.translateButton}
              onPress={() => translateAndSpeak(item.summary, item._id)}
            >
              <MaterialIcons name="translate" size={16} color="white" />
              <Text style={styles.translateButtonText}>Hindi Translation & Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.expandFullButton}
              onPress={() => {
                Alert.alert('Full Text', item.fullText || 'No full text available.');
              }}
            >
              <MaterialIcons name="description" size={16} color="white" />
              <Text style={styles.expandFullButtonText}>View Full Text</Text>
            </TouchableOpacity>

            {/* Delete Message Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteMessage(item._id)}
            >
              <MaterialIcons name="delete" size={16} color="white" />
              <Text style={styles.deleteButtonText}>Remove from Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text style={styles.header}>📋 OCR Chat History</Text>
      </SafeAreaView>

      {loading ? (
        <ActivityIndicator size="large" color="#63b0a3" style={styles.loader} />
      ) : chatMessages.length === 0 ? (
        <Text style={styles.noMessagesText}>No chat messages yet. Upload a document to get started!</Text>
      ) : (
        <FlatList
          data={chatMessages}
          keyExtractor={(item) => item._id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

export default OCRChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#63b0a3',
    marginBottom: 16,
  },
  loader: {
    marginTop: 50,
  },
  noMessagesText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#999',
    marginTop: 50,
    fontStyle: 'italic',
  },
  listContent: {
    paddingBottom: 100,
  },
  chatCard: {
    marginVertical: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  chatTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatDate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  chatContent: {
    padding: 15,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#D0E8E5',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 5,
  },
  audioContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#63b0a3',
    padding: 12,
    borderRadius: 8,
  },
  audioButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  audioButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  translateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  expandFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  expandFullButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
