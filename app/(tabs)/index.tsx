import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../services/api";

const { width } = Dimensions.get("window");

interface UserData {
  name: string;
  email: string;
  profilePicture: string;
}

interface Appointment {
  _id: string;
  doctorName: string;
  specialty: string;
  appointmentTime: string;
  status: "upcoming" | "completed" | "cancelled";
}

interface Medication {
  _id: string;
  medicineName: string;
  dosage: string;
  scheduledTime: string;
  status: "pending" | "taken" | "skipped" | "missed";
}

const DEFAULT_PROFILE_PIC = "https://example.com/default-profile-pic.png";

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(true);

  const [nextMedicine, setNextMedicine] = useState<Medication | null>(null);
  const [isLoadingMedicine, setIsLoadingMedicine] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataJson = await AsyncStorage.getItem("userData");
        if (userDataJson) {
          const userDataFromStorage = JSON.parse(userDataJson);
          const completeUserData: UserData = {
            name: userDataFromStorage.name || "User",
            email: userDataFromStorage.email || "No Email",
            profilePicture: DEFAULT_PROFILE_PIC,
          };
          setUser(completeUserData);
        } else {
          setUser({
            name: "Guest User",
            email: "Please log in",
            profilePicture: DEFAULT_PROFILE_PIC,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const fetchUpcomingAppointment = async () => {
    setIsLoadingAppointment(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        setIsLoadingAppointment(false);
        return;
      }

      const response = await api.get("/appointments");
      const allAppointments: Appointment[] = response.data.appointments || [];

      const nextAppointment = allAppointments
        .filter((a) => a.status === "upcoming")
        .sort(
          (a, b) =>
            new Date(a.appointmentTime).getTime() -
            new Date(b.appointmentTime).getTime()
        );

      if (nextAppointment.length > 0) {
        setUpcomingAppointment(nextAppointment[0]);
      } else {
        setUpcomingAppointment(null);
      }
    } catch (error) {
      console.error("Error fetching upcoming appointment:", error);
      setUpcomingAppointment(null);
    } finally {
      setIsLoadingAppointment(false);
    }
  };

  const fetchNextMedicine = async () => {
    setIsLoadingMedicine(true);
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      const userId = userDataString ? JSON.parse(userDataString).id : null;

      if (!userId) {
        setNextMedicine(null);
        setIsLoadingMedicine(false);
        return;
      }

      const response = await api.get(`/medications/today/${userId}`);
      const schedule: Medication[] = response.data.schedule || [];

      const upcoming = schedule
        .filter((dose) => dose.status === "pending")
        .sort(
          (a, b) =>
            new Date(a.scheduledTime).getTime() -
            new Date(b.scheduledTime).getTime()
        );

      if (upcoming.length > 0) setNextMedicine(upcoming[0]);
      else setNextMedicine(null);
    } catch (error) {
      console.error("Error fetching next medicine:", error);
      setNextMedicine(null);
    } finally {
      setIsLoadingMedicine(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUpcomingAppointment();
      fetchNextMedicine();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: user?.profilePicture || DEFAULT_PROFILE_PIC }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.welcome}>Hi, Welcome Back</Text>
            <Text style={styles.username}>{user?.name}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push("../../screens/ProfileScreen")}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={22}
                color="#333"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
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
              onPress={() => router.push("/screens/upload")}
            >
              <Ionicons
                name="document-text-outline"
                size={28}
                color="#27AE60"
              />
              <Text style={styles.cardLabel}>Upload</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/screens/DoctorList")}
            >
              <Ionicons name="medkit-outline" size={28} color="#FF5A5F" />
              <Text style={styles.cardLabel}>Doctor List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/screens/FamilyScreen")}
            >
              <Ionicons name="people-outline" size={28} color="#9B51E0" />
              <Text style={styles.cardLabel}>View Family</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
          {isLoadingAppointment ? (
            <ActivityIndicator size="large" color="#63b0a3" style={{ marginTop: 20 }} />
          ) : upcomingAppointment ? (
            <View style={styles.appointmentCard}>
              <Text style={styles.appointmentTime}>
                {new Date(upcomingAppointment.appointmentTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.appointmentTitle}>
                  {upcomingAppointment.doctorName}
                </Text>
                <Text style={styles.appointmentDetails}>
                  {upcomingAppointment.specialty}
                </Text>
                <Text style={styles.appointmentDetails}>
                  {new Date(upcomingAppointment.appointmentTime).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.appointmentCard}>
              <Text style={styles.appointmentTitle}>No upcoming appointments</Text>
              <Text style={styles.appointmentDetails}>
                Book a new appointment with a doctor.
              </Text>
            </View>
          )}
        </View>

        {/* 🆕 Next Medicine Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Next Medicine</Text>

          {isLoadingMedicine ? (
            <ActivityIndicator size="large" color="#63b0a3" style={{ marginTop: 20 }} />
          ) : nextMedicine ? (
            <TouchableOpacity
              style={styles.appointmentCard}
              onPress={() => router.push("../MedicineTracker")}
            >
              <Ionicons name="medkit-outline" size={26} color="#63b0a3" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.appointmentTitle}>{nextMedicine.medicineName}</Text>
                <Text style={styles.appointmentDetails}>{nextMedicine.dosage}</Text>
                <Text style={styles.appointmentDetails}>
                  {new Date(nextMedicine.scheduledTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.appointmentCard}>
              <Text style={styles.appointmentTitle}>No upcoming medicines</Text>
              <Text style={styles.appointmentDetails}>
                You have no medicines scheduled for now.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

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
  safeContainer: { flex: 1, backgroundColor: "#5fb093ff" },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -10,
    minHeight: Dimensions.get("window").height,
  },
  header: { flexDirection: "row", alignItems: "center", padding: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  welcome: { fontSize: 14, color: "#666" },
  username: { fontSize: 18, fontWeight: "bold", color: "#222" },
  headerIcons: { flexDirection: "row", gap: 10 },
  iconButton: { marginLeft: 12 },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#EEE",
    padding: Platform.OS === "ios" ? 12 : 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  searchText: { marginLeft: 6, color: "#666" },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#333" },
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
  appointmentTime: { fontSize: 14, fontWeight: "600", color: "#4A90E2" },
  appointmentTitle: { fontSize: 16, fontWeight: "700", color: "#333" },
  appointmentDetails: { fontSize: 13, color: "#666", marginTop: 4 },
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
  },
});
