// FILE: medicineReminder/history/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../services/api"; // Your axios instance

// This matches your backend schema (with populated medicationId)
interface HistoryItem {
  _id: string;
  medicationId: {
    _id: string;
    medicineName: string;
    dosage: string;
  };
  status: 'taken' | 'skipped' | 'missed' | 'pending';
  scheduledTime: string;
  takenTime?: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Added
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "taken" | "skipped" | "missed" // Added "missed"
  >("all");

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      const userId = userDataString ? JSON.parse(userDataString).id : null;
      if (!userId) {
        router.replace("/(auth)/login");
        return;
      }

      // Fetch history from the backend
      const response = await api.get(`/medications/history/${userId}`);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error("Error loading history:", error);
      Alert.alert("Error", "Could not load history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // Filter the history based on the selected tab
  const filteredHistory = history.filter((dose) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "taken") return dose.status === 'taken';
    if (selectedFilter === "missed") return dose.status === 'missed' || dose.status === 'skipped'; // Group missed/skipped
    return true;
  });

  // Group the filtered history by date
  const groupedHistory = filteredHistory.reduce((acc, dose) => {
    const date = new Date(dose.scheduledTime).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(dose);
    return acc;
  }, {} as Record<string, HistoryItem[]>);
  
  const groupedHistoryEntries = Object.entries(groupedHistory).sort(
    (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );

  return (
    <View style={styles.container}>
      {/* ... (Header is unchanged) ... */}
      <LinearGradient colors={["#63b0a3ff", "#599b90ff"]} style={styles.headerGradient} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#63b0a3ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History Log</Text>
        </View>

        {/* --- (Filters are slightly updated) --- */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            <TouchableOpacity
              style={[ styles.filterButton, selectedFilter === "all" && styles.filterButtonActive ]}
              onPress={() => setSelectedFilter("all")}
            >
              <Text style={[ styles.filterText, selectedFilter === "all" && styles.filterTextActive ]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ styles.filterButton, selectedFilter === "taken" && styles.filterButtonActive ]}
              onPress={() => setSelectedFilter("taken")}
            >
              <Text style={[ styles.filterText, selectedFilter === "taken" && styles.filterTextActive ]}>
                Taken
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ styles.filterButton, selectedFilter === "missed" && styles.filterButtonActive ]}
              onPress={() => setSelectedFilter("missed")}
            >
              <Text style={[ styles.filterText, selectedFilter === "missed" && styles.filterTextActive ]}>
                Missed/Skipped
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#63b0a3" />
        ) : (
          <ScrollView
            style={styles.historyContainer}
            showsVerticalScrollIndicator={false}
          >
            {groupedHistoryEntries.length === 0 ? (
              <Text style={styles.emptyText}>No history found for this filter.</Text>
            ) : (
              groupedHistoryEntries.map(([date, doses]) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>
                    {new Date(date).toLocaleDateString("default", {
                      weekday: "long", month: "long", day: "numeric",
                    })}
                  </Text>
                  {doses.map((dose) => (
                    <View key={dose._id} style={styles.historyCard}>
                      <View style={[ styles.medicationColor, { 
                        backgroundColor: dose.status === 'taken' ? '#63b0a3ff' : '#F44336' 
                      }]} />
                      <View style={styles.medicationInfo}>
                        <Text style={styles.medicationName}>
                          {dose.medicationId?.medicineName || "Unknown"}
                        </Text>
                        <Text style={styles.medicationDosage}>
                          {dose.medicationId?.dosage}
                        </Text>
                        <Text style={styles.timeText}>
                          {new Date(dose.scheduledTime).toLocaleTimeString("default", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <View style={styles.statusContainer}>
                        {dose.status === 'taken' ? (
                          <View style={[ styles.statusBadge, { backgroundColor: "#E8F5E9" } ]}>
                            <Ionicons name="checkmark-circle" size={16} color="#63b0a3ff" />
                            <Text style={[styles.statusText, { color: "#63b0a3ff" }]}>
                              Taken
                            </Text>
                          </View>
                        ) : (
                          <View style={[ styles.statusBadge, { backgroundColor: "#FFEBEE" } ]}>
                            <Ionicons name="close-circle" size={16} color="#F44336" />
                            <Text style={[styles.statusText, { color: "#F44336" }]}>
                              {dose.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
            {/* Removed the "Clear All Data" button as it has no backend endpoint */}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  // ... (Paste your original styles here)
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  headerGradient: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: Platform.OS === "ios" ? 140 : 120,
  },
  content: { flex: 1, paddingTop: Platform.OS === "ios" ? 50 : 30 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 20, zIndex: 1,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "white", justifyContent: "center", alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "white", marginLeft: 15 },
  filtersContainer: {
    paddingHorizontal: 20, marginBottom: 20,
    backgroundColor: "#f8f9fa", paddingTop: 10,
  },
  filtersScroll: { paddingRight: 20 },
  filterButton: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "white", marginRight: 10, borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterButtonActive: { backgroundColor: "#63b0a3ff", borderColor: "#63b0a3ff" },
  filterText: { fontSize: 14, fontWeight: "600", color: "#666" },
  filterTextActive: { color: "white" },
  historyContainer: { flex: 1, paddingHorizontal: 20, backgroundColor: "#f8f9fa" },
  dateGroup: { marginBottom: 25 },
  dateHeader: {
    fontSize: 16, fontWeight: "600", color: "#666",
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white",
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1,
    borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  medicationColor: { width: 12, height: 40, borderRadius: 6, marginRight: 16 },
  medicationInfo: { flex: 1 },
  medicationName: {
    fontSize: 16, fontWeight: "600", color: "#333",
    marginBottom: 4,
  },
  medicationDosage: { fontSize: 14, color: "#666", marginBottom: 2 },
  timeText: { fontSize: 14, color: "#666" },
  statusContainer: { alignItems: "flex-end" },
  statusBadge: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  statusText: {
    marginLeft: 4, fontSize: 14, fontWeight: "600",
    textTransform: 'capitalize',
  },
  emptyText: { // Added
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 40,
  }
});