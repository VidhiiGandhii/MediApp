import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Alert } from "react-native";
import { Card } from "react-native-paper";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';

type FileItem = {
  name: string;
  uri: string;
  category: string;
};

const categories = [
  { id: "1", name: "Prescription", icon: <MaterialIcons name="medication" size={24} color="white" /> },
  { id: "2", name: "Report", icon: <MaterialIcons name="summarize" size={24} color="white" /> },
  { id: "3", name: "Bill", icon: <FontAwesome5 name="file-invoice" size={24} color="white" />},
  { id: "4", name: "Other", icon: <Ionicons name="document-text" size={24} color="white" />},
];

const UploadScreen: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePick = async (category: string) => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const pickedFiles = (result.assets || [result]).map((file: any) => ({
        name: file.name || "Unnamed Document",
        uri: file.uri,
        category,
      }));

      setFiles((prev) => [...prev, ...pickedFiles]);
      Alert.alert("Success", `${pickedFiles.length} file(s) added to ${category}`);
    } catch (error) {
      console.error("Document pick error:", error);
      Alert.alert("Error", "Failed to pick document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const renderCategory = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity 
      style={styles.categoryCard} 
      onPress={() => handlePick(item.name)}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {item.icon}
      </View>
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFile = ({ item, index }: { item: FileItem; index: number }) => (
    <Card style={styles.fileCard}>
      <Card.Content>
        <View style={styles.fileContent}>
          <View style={styles.fileInfo}>
            <Text style={styles.fileCategory}>{item.category}</Text>
            <Text style={styles.fileName} numberOfLines={2}>{item.name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleRemoveFile(index)}
          >
            <MaterialIcons name="close" size={20} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upload Documents</Text>

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
        Uploaded Files {files.length > 0 && `(${files.length})`}
      </Text>

      {files.length === 0 ? (
        <Text style={styles.noFilesText}>No files uploaded yet</Text>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item, index) => `${item.name}-${item.category}-${index}`}
          renderItem={({ item, index }) => renderFile({ item, index })}
          contentContainerStyle={styles.fileList}
          scrollEnabled={false}
        />
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