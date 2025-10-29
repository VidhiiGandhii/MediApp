import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.welcome}>Hi, Welcome Back</Text>
            <Text style={styles.username}>Johny</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="settings-outline" size={22} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickItem}
            onPress={() => router.push("/screens/DoctorList")}
          >
            <Ionicons name="medkit-outline" size={24} color="#4A90E2" />
            <Text style={styles.quickLabel}>Doctors</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem}>
            <MaterialIcons name="recent-actors" size={24} color="#FF5A5F" />
            <Text style={styles.quickLabel}>Recents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <Text style={styles.searchText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Family Member Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Member</Text>
          <View style={styles.cardGrid}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/(tabs)/appointmentScreen")}
            >
              <Ionicons name="calendar-outline" size={28} color="#4A90E2" />
              <Text style={styles.cardLabel}>Upcoming Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/(tabs)/medicineTracker")}
            >
              <Ionicons name="document-text-outline" size={28} color="#27AE60" />
              <Text style={styles.cardLabel}>View Prescriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/screens/healthTipsScreen")}
            >
              <Ionicons name="heart-circle-outline" size={28} color="#FF5A5F" />
              <Text style={styles.cardLabel}>Health Tips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/(tabs)/FamilyScreen")}
            >
              <Ionicons name="people-outline" size={28} color="#9B51E0" />
              <Text style={styles.cardLabel}>View Family</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Appointments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointments</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10 }}
          >
            {["9 MON", "10 TUE", "11 WED", "12 THU", "13 FRI", "14 SAT"].map(
              (day, index) => (
                <TouchableOpacity key={index} style={styles.dateBox}>
                  <Text style={styles.dateText}>{day.split(" ")[0]}</Text>
                  <Text style={styles.dateSub}>{day.split(" ")[1]}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentTime}>9 AM</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.appointmentTitle}>Dr. Olivia Turner, M.D.</Text>
              <Text style={styles.appointmentDetails}>
                Treatment and prevention of skin and photodermatitis.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button for Symptom Checker */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("../screens/SymptomsChecker")}
      >
        <MaterialCommunityIcons name="robot-happy-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: "#fff" },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  welcome: {
    fontSize: 14,
    color: "#666",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  headerIcons: {
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    marginLeft: 12,
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickItem: {
    alignItems: "center",
    marginRight: 20,
  },
  quickLabel: {
    fontSize: 12,
    marginTop: 5,
    color: "#444",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#EEE",
    padding: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  searchText: {
    marginLeft: 6,
    color: "#666",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: (width - 60) / 2,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginTop: 10,
  },
  dateBox: {
    width: 60,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  dateSub: {
    fontSize: 12,
    color: "#666",
  },
  appointmentCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginTop: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  appointmentTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A90E2",
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  appointmentDetails: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    right: 30,
    bottom: 30,
    backgroundColor: "#63b0a3",
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});