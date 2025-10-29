import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type FileItem = {
  name: string;
  uri: string;
  category: string;
};

const categories = [
  { id: "1", name: "Prescription", icon: require("../../assets/images/medical-prescription.png") },
  { id: "2", name: "Report", icon: require("../../assets/images/medical-report.png") },
  { id: "3", name: "Bill", icon: require("../../assets/images/bill.png") },
  { id: "4", name: "Other", icon: require("../../assets/images/folder.png") },
];

const UploadScreen: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);

  const handlePick = async (category: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const pickedFiles = (result.assets || [result]).map((file: any) => ({
        name: file.name,
        uri: file.uri,
        category,
      }));

      setFiles((prev) => [...prev, ...pickedFiles]);
    } catch (error) {
      console.error("Document pick error:", error);
    }
  };

  const renderCategory = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity style={styles.categoryCard} onPress={() => handlePick(item.name)}>
      <Image source={item.icon} style={styles.categoryIcon} />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFile = ({ item }: { item: FileItem }) => (
    <Card style={styles.fileCard}>
      <Card.Content>
        <Text style={styles.fileCategory}>{item.category}</Text>
        <Text style={styles.fileName}>{item.name}</Text>
      </Card.Content>
    </Card>
  );

  return (
  <SafeAreaView style={styles.safeContainer}>
    <View style={styles.container}>
      <Text style={styles.header}>Upload Documents</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
      />

      <Text style={styles.subHeader}>Uploaded Files</Text>

      {files.length === 0 ? (
        <Text style={styles.noFilesText}>No files uploaded yet</Text>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => `${item.name}-${item.category}`}
          renderItem={renderFile}
          contentContainerStyle={styles.fileList}
        />
      )}
    </View>
  </SafeAreaView>
  );
};

export default UploadScreen;

const styles = StyleSheet.create({
  safeContainer:{
    flex: 1,
    backgroundColor: "#fff" 
  },
  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    
    fontSize: 26, 
    fontWeight: "bold", 
    marginBottom: 10 , 
    color:"#63b0a3"
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 25,
    marginBottom: 10,
  },
  gridContainer: {
    justifyContent: "center",
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
  },
  categoryIcon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000ff",
  },
  fileList: {
    paddingBottom: 100,
  },
  fileCard: {
    marginVertical: 6,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    elevation: 2,
  },
  fileCategory: {
    fontSize: 14,
    color: "#63b0a3",
    fontWeight: "600",
  },
  fileName: {
    fontSize: 16,
    color: "#333",
  },
  noFilesText: {
    textAlign: "center",
    fontSize: 15,
    color: "#666",
  },
});
