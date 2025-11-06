// FILE: medicineReminder/refills/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
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

// This interface matches your backend schema
interface Medication {
  _id: string;
  medicineName: string;
  dosage: string;
  stock: number;
  refillThreshold: number;
  refillReminder: boolean;
  // Your 'add' form also has 'totalSupply', but the backend doesn't.
  // We'll work with the backend schema.
}

export default function RefillTrackerScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Added

  const loadMedications = useCallback(async () => {
    setIsLoading(true);
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      const userId = userDataString ? JSON.parse(userDataString).id : null;
      if (!userId) {
        router.replace("/(auth)/login");
        return;
      }

      // Fetch all active medications
      const response = await api.get(`/medications/${userId}?active=true`);
      // Filter for only meds that have refill tracking enabled
      const refillMeds = (response.data.medications || []).filter(
        (med: Medication) => med.refillReminder
      );
      setMedications(refillMeds);
    } catch (error) {
      console.error("Error loading medications:", error);
      Alert.alert("Error", "Could not load medication stock.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications])
  );

  // --- CONNECTED: Update stock on the backend ---
  const handleRefill = async (medication: Medication) => {
    // We'll assume a "refill" adds 30 pills.
    // In a real app, you'd show a modal asking "how many?"
    const newStockAmount = (medication.stock || 0) + 30; 

    try {
      await api.put(`/medications/${medication._id}`, {
        stock: newStockAmount, // Only update the stock field
      });

      await loadMedications(); // Refresh the list

      Alert.alert(
        "Refill Recorded",
        `${medication.medicineName} has been refilled to ${newStockAmount} units.`
      );
    } catch (error) {
      console.error("Error recording refill:", error);
      const message = axios.isAxiosError(error) ? error.response?.data.message : "Failed to record refill.";
      Alert.alert("Error", message);
    }
  };

  const getSupplyStatus = (medication: Medication) => {
    const percentage = (medication.stock / (medication.stock + medication.refillThreshold)) * 100; // Simplified
    
    if (medication.stock <= medication.refillThreshold) {
      return { status: "Low", color: "#F44336", backgroundColor: "#FFEBEE" };
    } else if (percentage <= 50) {
      return { status: "Medium", color: "#FF9800", backgroundColor: "#FFF3E0" };
    } else {
      return { status: "Good", color: "#63b0a3ff", backgroundColor: "#E8F5E9" };
    }
  };

  return (
    <View style={styles.container}>
      {/* ... (Header is unchanged) ... */}
      <LinearGradient colors={["#63b0a3ff", "#56998eff"]} style={styles.headerGradient} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#63b0a3ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refill Tracker</Text>
        </View>

        <ScrollView
          style={styles.medicationsContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#63b0a3" style={{marginTop: 40}} />
          ) : medications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>
                No medications with refill tracking enabled.
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/medicineReminder/medications/add")}
              >
                <Text style={styles.addButtonText}>Add Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            medications.map((medication) => {
              const supplyStatus = getSupplyStatus(medication);
              const isFull = (medication.stock || 0) > (medication.refillThreshold + 5); // Just a guess
              const stock = medication.stock || 0;
              const threshold = medication.refillThreshold || 1;
              const supplyPercentage = Math.min(100, (stock / (stock + threshold)) * 100); // Simple %
              
              return (
                <View key={medication._id} style={styles.medicationCard}>
                  <View style={styles.medicationHeader}>
                    <View style={[ styles.medicationColor, { backgroundColor: supplyStatus.color } ]} />
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>
                        {medication.medicineName}
                      </Text>
                      <Text style={styles.medicationDosage}>
                        {medication.dosage}
                      </Text>
                    </View>
                    <View style={[ styles.statusBadge, { backgroundColor: supplyStatus.backgroundColor } ]}>
                      <Text style={[ styles.statusText, { color: supplyStatus.color } ]}>
                        {supplyStatus.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.supplyContainer}>
                    <View style={styles.supplyInfo}>
                      <Text style={styles.supplyLabel}>Current Supply</Text>
                      <Text style={styles.supplyValue}>
                        {medication.stock} units
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBackground}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${supplyPercentage}%`,
                              backgroundColor: supplyStatus.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {Math.round(supplyPercentage)}%
                      </Text>
                    </View>
                    <View style={styles.refillInfo}>
                      <Text style={styles.refillLabel}>
                        Refill alert at: {medication.refillThreshold} units
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.refillButton,
                      { backgroundColor: isFull ? "#e0e0e0" : "#63b0a3ff" },
                    ]}
                    onPress={() => handleRefill(medication)}
                    disabled={isFull}
                  >
                    <Text style={styles.refillButtonText}>
                      {isFull ? "Stocked" : "Record Refill"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
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
  medicationsContainer: { flex: 1, paddingHorizontal: 20 },
  medicationCard: {
    backgroundColor: "white", borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: "#e0e0e0",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  medicationHeader: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 16,
  },
  medicationColor: { width: 12, height: 40, borderRadius: 6, marginRight: 16 },
  medicationInfo: { flex: 1 },
  medicationName: {
    fontSize: 16, fontWeight: "600", color: "#333",
    marginBottom: 4,
  },
  medicationDosage: { fontSize: 14, color: "#666" },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 14, fontWeight: "600" },
  supplyContainer: { marginBottom: 16 },
  supplyInfo: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  supplyLabel: { fontSize: 14, color: "#666" },
  supplyValue: { fontSize: 14, fontWeight: "600", color: "#333" },
  progressBarContainer: { marginBottom: 8 },
  progressBarBackground: {
    height: 8, backgroundColor: "#f5f5f5",
    borderRadius: 4, overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 4 },
  progressText: {
    fontSize: 12, color: "#666",
    marginTop: 4, textAlign: "right",
  },
  refillInfo: { marginTop: 8 },
  refillLabel: { fontSize: 12, color: "#666" },
  lastRefillDate: { fontSize: 12, color: "#666", marginTop: 2 },
  refillButton: { paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  refillButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  emptyState: {
    alignItems: "center", padding: 30,
    backgroundColor: "white", borderRadius: 16, marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16, color: "#666",
    marginTop: 10, marginBottom: 20,
  },
  addButton: {
    backgroundColor: "#63b0a3ff", paddingHorizontal: 20,
    paddingVertical: 10, borderRadius: 20,
  },
  addButtonText: { color: "white", fontWeight: "600" },
});