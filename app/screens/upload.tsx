import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Card } from "react-native-paper";
import { API_URL } from "../../config/api";

// --- NEW IMPORTS ---
import * as FileSystem from 'expo-file-system/legacy';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from "react-native-safe-area-context";
// -------------------

type FileItem = {
  id: string;
  fileName: string;
  category: string;
};

const categories = [
  // ... (categories array is unchanged) ...
  { id: "1", name: "Prescription", icon: <MaterialIcons name="medication" size={24} color="white" /> },
  { id: "2", name: "Report", icon: <MaterialIcons name="summarize" size={24} color="white" /> },
  { id: "3", name: "Bill", icon: <FontAwesome5 name="file-invoice" size={24} color="white" />},
  { id: "4", name: "Other", icon: <Ionicons name="document-text" size={24} color="white" />},
];

const UploadScreen: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // --- NEW STATE for viewing ---
  const [isViewing, setIsViewing] = useState(false);
  // -----------------------------

  const fetchDocuments = async () => {
    // ... (This function is unchanged) ...
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "You are not logged in.");
        return;
      }
      const response = await fetch(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      setUploadedFiles(data.documents || []);
    } catch (error) {
      console.error("Fetch documents error:", error);
      Alert.alert("Error", "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const uploadFile = async (
    file: DocumentPicker.DocumentPickerAsset,
    category: string
  ) => {
    // ... (This function is unchanged) ...
    setUploading(true);
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      Alert.alert("Error", "Authentication token not found.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("category", category);
    formData.append("description", file.name || "Uploaded file");
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as any);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Upload failed");
      }

      const data = await response.json();
      setUploadedFiles((prev: any) => [...prev, data.document]);
      Alert.alert("Success", `${file.name} uploaded to ${category}`);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : String(error);
      Alert.alert("Error", `Failed to upload ${file.name}: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePick = async (category: string) => {
    // ... (This function is unchanged) ...
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }
      for (const file of result.assets) {
        await uploadFile(file, category);
      }
    } catch (error) {
      console.error("Document pick error:", error);
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  const handleRemoveFile = async (fileId: string) => {
    // ... (This function is unchanged) ...
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Authentication token not found.");
        return;
      }
      const response = await fetch(`${API_URL}/api/documents/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      setUploadedFiles((prev: any[]) => prev.filter((file) => file.id !== fileId));
      Alert.alert("Success", "File removed");
    } catch (error) {
      console.error("Delete file error:", error);
      Alert.alert("Error", "Failed to remove file.");
    }
  };

  // --- NEW FUNCTION to view the file ---
 // --- NEW FUNCTION to view the file (works on web and native) ---
  const handleViewFile = async (file: FileItem) => {
    setIsViewing(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "Authentication token not found.");
        return;
      }

      const remoteUrl = `${API_URL}/api/documents/${file.id}/download`;

      if (Platform.OS === 'web') {
        // --- WEB SOLUTION (This part is correct and unchanged) ---
        const response = await fetch(remoteUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch file for viewing.');
        }
        const blob = await response.blob();
        const fileUrl = URL.createObjectURL(blob);
        WebBrowser.openBrowserAsync(fileUrl);

      } else {
        // --- NATIVE SOLUTION (Changed to use expo-sharing) ---
        
        // 1. Define a local path to save the file (this fix is still correct)
        const localUri = FileSystem.documentDirectory + '/' + encodeURIComponent(file.fileName);

        // 2. Download the file
        const { uri } = await FileSystem.downloadAsync(remoteUrl, localUri, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // 3. Use expo-sharing to open the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert("Error", "Viewing files is not available on this device.");
        }
      }

    } catch (error) {
      console.error("View file error:", error);
      Alert.alert("Error", "Could not open the file.");
    } finally {
      setIsViewing(false);
    }
  };
  // ------------------------------------
  // ------------------------------------

  const renderCategory = ({ item }: { item: (typeof categories)[0] }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handlePick(item.name)}
      disabled={uploading || isViewing} // --- MODIFIED ---
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{item.icon}</View>
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // --- MODIFIED: renderFile is now a TouchableOpacity ---
  const renderFile = ({ item }: { item: FileItem }) => (
    <TouchableOpacity 
      onPress={() => handleViewFile(item)} 
      disabled={isViewing}
      activeOpacity={0.7}
    >
      <Card style={styles.fileCard}>
        <Card.Content>
          <View style={styles.fileContent}>
            <View style={styles.fileInfo}>
              <Text style={styles.fileCategory}>{item.category}</Text>
              <Text style={styles.fileName} numberOfLines={2}>
                {item.fileName}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveFile(item.id)} // Pass the database ID
            >
              <MaterialIcons name="close" size={20} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  // ------------------------------------------------------

  return (
    <View style={styles.container}>
    <SafeAreaView>
      <Text style={styles.header}>Upload Documents</Text>
      </SafeAreaView>

      {/* --- NEW: Added loading indicator for viewing --- */}
      {(uploading || isViewing) && (
        <View style={styles.uploadingIndicator}>
          <ActivityIndicator size="small" color="#63b0a3" />
          <Text style={styles.uploadingText}>
            {uploading ? "Uploading file..." : "Opening file..."}
          </Text>
        </View>
      )}

      <FlatList
        // ... (FlatList props unchanged) ...
        data={categories}
        keyExtractor={(item: { id: any; }) => item.id}
        renderItem={renderCategory}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        scrollEnabled={false}
      />

      <Text style={styles.subHeader}>
        Uploaded Files{" "}
        {uploadedFiles.length > 0 && (`${uploadedFiles.length}`)}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#63b0a3" />
      ) : uploadedFiles.length === 0 ? (
        <Text style={styles.noFilesText}>No files uploaded yet</Text>
      ) : (
        <FlatList
          data={uploadedFiles}
          keyExtractor={(item: { id: any; }) => item.id}
          renderItem={renderFile} // --- MODIFIED (will use new renderFile) ---
          contentContainerStyle={styles.fileList}
        />
      )}
    </View>
  );
};

export default UploadScreen;

// --- STYLES (No changes, but included for completeness) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    color: "#63b0a3",
  },
  uploadingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadingText: {
    marginLeft: 10,
    color: '#63b0a3',
    fontStyle: 'italic',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 12,
    color: "#333",
  },
  gridContainer: {
    justifyContent: "center",
    paddingBottom: 16,
  },
  row: {
    justifyContent: "space-around",
  },
  categoryCard: {
    backgroundColor: "#63b0a3",
    alignItems: "center",
    justifyContent: "center",
    width: "45%",
    marginVertical: 10,
    paddingVertical: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 12,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  fileList: {
    paddingBottom: 100,
  },
  fileCard: {
    marginVertical: 8,
    marginHorizontal: 0,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  fileContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileCategory: {
    fontSize: 12,
    color: "#63b0a3",
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  fileName: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#ffebee",
    alignItems: "center",
    justifyContent: "center",
  },
  noFilesText: {
    textAlign: "center",
    fontSize: 15,
    color: "#999",
    marginTop: 24,
    fontStyle: "italic",
  },
});

function setUploading(arg0: boolean) {
  throw new Error("Function not implemented.");
}
