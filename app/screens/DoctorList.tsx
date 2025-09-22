import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Doctor type
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  image: ImageSourcePropType;
  phone: string;
}

// Doctors data
const doctors: Doctor[] = [
  { id: "1", name: "Dr. Rishi", specialty: "Cardiologist", rating: 4.7, distance: "800m", image: require("../../assets/images/dr1.jpg"), phone: "9876543210" },
  { id: "2", name: "Dr. Vaamana", specialty: "Dentist", rating: 4.7, distance: "1.2km", image: require("../../assets/images/dr2.jpg"), phone: "9876501234" },
  { id: "3", name: "Dr. Nallarasu", specialty: "Orthopaedic", rating: 4.7, distance: "2km", image: require("../../assets/images/dr3.jpg"), phone: "9876512345" },
  { id: "4", name: "Dr. Nihal", specialty: "Neurologist", rating: 4.7, distance: "500m", image: require("../../assets/images/dr4.jpg"), phone: "9876523456" },
  { id: "5", name: "Dr. Rishita", specialty: "Dermatologist", rating: 4.7, distance: "1km", image: require("../../assets/images/dr5.jpg"), phone: "9876534567" },
];

// Specializations grid
const specializations = [
  { name: "Cardiologist", icon: "heart-pulse" },
  { name: "Dentist", icon: "tooth" },
  { name: "Orthopaedic", icon: "bone" },
  { name: "Dermatologist", icon: "face-man" },
  { name: "Neurologist", icon: "brain" },
  { name: "Pediatrician", icon: "baby-face" },
];

// Doctor Card component
const DoctorCard: React.FC<Doctor> = ({ name, specialty, rating, distance, image, phone }) => (
  <View style={styles.card}>
    <Image source={image} style={styles.image} />
    <View style={styles.info}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.specialty}>{specialty}</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.rating}>⭐ {rating}</Text>
        <Text style={styles.distance}>📍 {distance}</Text>
      </View>
    </View>

    {/* Chat + Call buttons */}
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.actionButton, styles.chatButton]}
        onPress={() => router.push(`../../screens/chat?doctorName=${name}`)}
      >
        <MaterialCommunityIcons name="message-text" size={22} color="#63b0a3ff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.callButton]}
        onPress={() => Linking.openURL(`tel:${phone}`)}
      >
        <MaterialCommunityIcons name="phone" size={22} color="#63b0a3ff" />
      </TouchableOpacity>
    </View>
  </View>
);

const DoctorList = () => {
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const filteredDoctors = doctors.filter((doc) => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || doc.specialty.toLowerCase().includes(search.toLowerCase());
    const matchSpec = selectedSpec ? doc.specialty === selectedSpec : true;
    return matchSearch && matchSpec;
  });

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Find Your Doctor </Text>

        {/* Search bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search doctors or specialization..."
          value={search}
          onChangeText={setSearch}
        />

        {/* Specialization grid */}
        <View style={styles.grid}>
          {specializations.map((spec) => (
            <TouchableOpacity
              key={spec.name}
              style={[styles.gridItem, selectedSpec === spec.name && styles.gridItemSelected]}
              onPress={() => setSelectedSpec(selectedSpec === spec.name ? null : spec.name)}
            >
              <MaterialCommunityIcons name={spec.icon as any} size={24} color={selectedSpec === spec.name ? "#fff" : "#333"} />
              <Text style={[styles.gridText, selectedSpec === spec.name && styles.gridTextSelected]}>{spec.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Doctor list */}
        <FlatList
          data={filteredDoctors}
          renderItem={({ item }) => <DoctorCard {...item} />}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.noResult}>No doctors found 😕</Text>}
        />
      </View>
    </SafeAreaView>
  );
};

export default DoctorList;

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 15, backgroundColor: "#fff" },
  header: { fontSize: 26, fontWeight: "bold", marginBottom: 10 , color:"#63b0a3"},
  searchBar: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 5 },
  gridItem: { width: "30%", aspectRatio: 1, backgroundColor: "#f8f8f8", borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12, elevation: 2 },
  gridItemSelected: { backgroundColor: "#63b0a3" },
  gridText: { fontSize: 12, marginTop: 5, color: "#333", fontWeight: "500", textAlign: "center" },
  gridTextSelected: { color: "#fff", fontWeight: "bold" },
  card: { flexDirection: "row", alignItems: "center", padding: 12, marginVertical: 6, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  image: { width: 60, height: 60, borderRadius: 30 },
  info: { marginLeft: 12, flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "bold", color: "#222" },
  specialty: { fontSize: 13, color: "#666", marginTop: 2 },
  ratingContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  rating: { fontSize: 13, color: "#000" },
  distance: { fontSize: 13, color: "#555" },
  actions: { flexDirection: "row", alignItems: "center" },
  actionButton: { justifyContent: "center", alignItems: "center", padding: 6, marginLeft: 8 },
  chatButton: {},
  callButton: {},
  noResult: { textAlign: "center", marginTop: 20, fontSize: 15, color: "#888" },
});