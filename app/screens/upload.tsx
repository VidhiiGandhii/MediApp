import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform, // Added
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "../../config/api";
import { secureStorageHelper } from '../../utils/secureStorage';

type FileItem = {
  id: string;
  _id?: string;
  fileName: string;
  category: string;
};

const categories = [
  { id: "1", name: "Prescription", icon: <MaterialIcons name="medication" size={24} color="white" /> },
  { id: "2", name: "Report", icon: <MaterialIcons name="summarize" size={24} color="white" /> },
  { id: "3", name: "Bill", icon: <FontAwesome5 name="file-invoice" size={24} color="white" />},
  { id: "4", name: "Other", icon: <Ionicons name="document-text" size={24} color="white" />},
];

const UploadScreen: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  // --- NEW STATE FOR ANALYSIS ---
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    summary: string;
    originalText: string;
    fileName: string;
  } | null>(null);

  // Helper function to validate token
  const getValidToken = async (): Promise<string | null> => {
    try {
      const token = await secureStorageHelper.getItem("userToken");
      if (!token || token.trim() === '') {
        console.log("❌ No valid token found");
        return null;
      }
      console.log("✅ Token retrieved successfully");
      return token;
    } catch (error) {
      console.error("Error retrieving token:", error);
      return null;
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert(
          "Authentication Required", 
          "Please log in again to view your documents.",
          [{ text: "OK", onPress: () => console.log("User needs to log in again") }]
        );
        return;
      }

      console.log(`📡 Fetching documents from: ${API_URL}/api/documents`);
      
      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.status === 401 || response.status === 403) {
        await AsyncStorage.removeItem("userToken");
        Alert.alert("Session Expired", "Please log in again.", [{ text: "OK" }]);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch documents");
      }

      const data = await response.json();
      console.log(`✅ Fetched ${data.documents?.length || 0} documents`);
      setUploadedFiles(data.documents || []);
    } catch (error) {
      console.error("Fetch documents error:", error);
      Alert.alert("Error", "Failed to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // --- THIS IS YOUR ORIGINAL UPLOAD FUNCTION (SAVES FILE) ---
  const uploadFile = async (
    file: DocumentPicker.DocumentPickerAsset,
    category: string
  ) => {
    setUploading(true);
    
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        return;
      }

      // Build FormData - handle web vs native file objects
      const formData = new FormData();
      formData.append("category", category);
      formData.append("description", file.name || "Uploaded file");

      // On web we need a File/Blob; on native Expo, uri objects work
      if (Platform.OS === 'web') {
        // fetch the file uri as a blob and convert to File
        try {
          const fileResp = await fetch(file.uri);
          const blob = await fileResp.blob();
          const webFile = new File([blob], file.name || 'upload', { type: file.mimeType || blob.type });
          formData.append('file', webFile);
        } catch (e) {
          console.warn('Failed to fetch file URI for web upload, falling back to raw append', e);
          formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
          } as any);
        }
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as any);
      }

      console.log(`📤 Uploading file: ${file.name}`);

      // Calls the /api/upload endpoint
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        await AsyncStorage.removeItem("userToken");
        Alert.alert("Session Expired", "Please log in again.");
        return;
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Upload failed");
      }

      const data = await response.json();
      setUploadedFiles((prev) => [...prev, data.document]);
      Alert.alert("Success", `${file.name} uploaded to ${category}`);
      console.log(`✅ File uploaded successfully`);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert("Error", `Failed to upload ${file.name}: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  // --- THIS IS YOUR ORIGINAL PICK FUNCTION (CALLS uploadFile) ---
  const handlePick = async (category: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }
      for (const file of result.assets) {
        await uploadFile(file, category); // This saves the file
      }
    } catch (error) {
      console.error("Document pick error:", error);
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  // --- NEW FUNCTION: HANDLE ANALYSIS (DOES NOT SAVE FILE) ---
  const handleAnalyze = async () => {
    try {
      // 1. Pick the document
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (pickerResult.canceled) return;

      const file = pickerResult.assets[0];
      if (!file) return;

      setIsAnalyzing(true);
      setAnalysisResult(null);

      // 2. Get token
      const token = await getValidToken();
      if (!token) {
        Alert.alert("Error", "Authentication token not found.");
        setIsAnalyzing(false);
        return;
      }


      // 3. Create FormData and append file (web-safe)
      const formData = new FormData();
      if (Platform.OS === 'web') {
        try {
          const fileResp = await fetch(file.uri);
          const blob = await fileResp.blob();
          const webFile = new File([blob], file.name || 'analysis', { type: file.mimeType || blob.type });
          formData.append('file', webFile);
        } catch (e) {
          console.warn('Failed to fetch file URI for web analysis, aborting', e);
          throw new Error('Unable to read selected file for analysis');
        }
      } else {
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as any);
      }

      console.log(`🔬 Analyzing file: ${file.name}`);

      // 4. Call the OCR-enabled upload endpoint (this saves the file and returns OCR)
      const response = await fetch(`${API_URL}/api/upload-with-ocr`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        // Try to parse JSON error, otherwise throw generic
        let err: any = { error: 'Analysis failed' };
        try { err = await response.json(); } catch (e) {}
        throw new Error(err?.error || err?.message || "Analysis failed");
      }

      const data = await response.json();

      // Support two response shapes:
      // 1) New: { success: true, document: { ocrText, ocrSummary, fileName, ... } }
      // 2) Legacy: { success: true, originalText, summary, fileName }
      let result = null;
      if (data.document) {
        result = {
          summary: data.document.ocrSummary || '',
          originalText: data.document.ocrText || '',
          fileName: data.document.fileName || file.name,
        };

        // Add saved document to uploaded files list
        setUploadedFiles((prev) => [...prev, data.document]);
        Alert.alert('Saved', `${file.name} uploaded and OCR saved.`);
      } else {
        result = {
          summary: data.summary || data.ocrSummary || '',
          originalText: data.originalText || data.extracted_text || '',
          fileName: data.fileName || file.name,
        };
      }

      setAnalysisResult(result);
      console.log(`✅ Analysis successful`);

    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert("Error", `Failed to analyze file: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };


  const handleRemoveFile = async (fileId: string) => {
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_URL}/api/documents/${fileId}`, {
        method: "DELETE",
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.status === 401 || response.status === 403) {
        await AsyncStorage.removeItem("userToken");
        Alert.alert("Session Expired", "Please log in again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
      Alert.alert("Success", "File removed");
      console.log(`🗑️ File removed successfully`);
    } catch (error) {
      console.error("Delete file error:", error);
      Alert.alert("Error", "Failed to remove file.");
    }
  };

  const handleViewFile = async (file: FileItem) => {
    setIsViewing(true);
    try {
      const token = await getValidToken();
      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        return;
      }

      const remoteUrl = `${API_URL}/api/documents/${file.id}/download`;

      if (Platform.OS === 'web') {
        // ... (web logic)
      } else {
        const localUri = FileSystem.documentDirectory + '/' + encodeURIComponent(file.fileName);

        const { uri } = await FileSystem.downloadAsync(remoteUrl, localUri, {
          headers: { Authorization: `Bearer ${token}` },
        });

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

  // Renders the "Prescription", "Report" buttons
  const renderCategory = ({ item }: { item: (typeof categories)[0] }) => (
    <TouchableOpacity
      key={item.id}
      style={styles.categoryCard}
      onPress={() => handlePick(item.name)} // This will SAVE the file
      disabled={uploading || isViewing || isAnalyzing}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{item.icon}</View>
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Renders a saved file card
  const renderFile = ({ item }: { item: FileItem }) => (
    <TouchableOpacity 
      key={item.id || item._id}
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
              onPress={() => handleRemoveFile(item.id)}
            >
              <MaterialIcons name="close" size={20} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <Text style={styles.header}>Upload Documents</Text>
      </SafeAreaView>

      {/* --- NEW "ANALYZE" BUTTON --- */}
      <TouchableOpacity
        style={styles.analyzeButton}
        onPress={handleAnalyze} // Calls the new analysis function
        disabled={isAnalyzing || uploading || isViewing}
      >
        <MaterialIcons name="analytics" size={20} color="white" />
        <Text style={styles.analyzeButtonText}>Analyze New Document</Text>
      </TouchableOpacity>

      {/* --- UPDATED INDICATOR --- */}
      {(uploading || isViewing || isAnalyzing) && (
        <View style={styles.uploadingIndicator}>
          <ActivityIndicator size="small" color="#63b0a3" />
          <Text style={styles.uploadingText}>
            {uploading ? "Uploading file..." : isViewing ? "Opening file..." : "Analyzing document..."}
          </Text>
        </View>
      )}

      <Text style={styles.subHeader}>Save to Category</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
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
          // Use _id when available (Mongo), fallback to id, otherwise index
          keyExtractor={(item, index) => (item._id ? String(item._id) : item.id ? String(item.id) : String(index))}
          renderItem={renderFile}
          contentContainerStyle={styles.fileList}
        />
      )}

      {/* --- NEW ANALYSIS RESULT MODAL --- */}
      {analysisResult && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={analysisResult !== null}
          onRequestClose={() => setAnalysisResult(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Analysis Result</Text>
              <Text style={styles.modalFileName}>{analysisResult.fileName}</Text>
              
              <ScrollView style={styles.modalScrollView}>
                <Text style={styles.modalSectionTitle}>Summary</Text>
                <Text style={styles.modalSummary}>{analysisResult.summary || "No summary could be generated."}</Text>
                
                <Text style={styles.modalSectionTitle}>Full Extracted Text</Text>
                <Text style={styles.modalOriginalText}>{analysisResult.originalText || "No text could be extracted."}</Text>
              </ScrollView>
              
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setAnalysisResult(null)}
              >
                <Text style={styles.analyzeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default UploadScreen;

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
    marginTop: 16, // Adjusted margin
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

  // --- NEW STYLES ---
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff', // Blue color
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10, // Added margin
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalFileName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  modalScrollView: {
    flex: 1,
    marginBottom: 10,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  modalSummary: {
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: '#f0f8ff', // Light blue background
    padding: 10,
    borderRadius: 5,
  },
  modalOriginalText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginTop: 10,
    backgroundColor: '#f9f9f9', // Light gray background
    padding: 10,
    borderRadius: 5,
  },
  modalCloseButton: {
    backgroundColor: '#6c757d', // Gray color
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
});