import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../backend/node_server/services/api"; // Corrected path

const { width } = Dimensions.get("window");

// This interface matches your backend's schedule response
interface ScheduledDose {
  medication: {
    _id: string;
    medicineName: string;
    dosage: string;
  };
  scheduledTime: string; // ISO date string
  status: "pending" | "taken" | "skipped" | "missed";
  historyId?: string;
}

// This state will be calculated from live data
interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
}

const QUICK_ACTIONS = [
  { icon: "add-circle-outline" as const, label: "Add\nMedication", route: "medicineReminder/medications/add" as const, gradient: ["#63b0a3ff", "#44a192ff"] as [string, string] },
  { icon: "calendar-outline" as const, label: "Calendar\nView", route: "medicineReminder/calendar" as const, gradient: ["#5992c2ff", "#3d6791ff"] as [string, string] },
  { icon: "time-outline" as const, label: "History\nLog", route: "medicineReminder/history" as const, gradient: ["#bd7994ff", "#744256ff"] as [string, string] },
  { icon: "medical-outline" as const, label: "Refill\nTracker", route: "medicineReminder/refills" as const, gradient: ["#be745dff", "#74493cff"] as [string, string] },
];

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

export default function MedicineTracker() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("day");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // --- NEW: State for live data ---
  const [schedule, setSchedule] = useState<ScheduledDose[]>([]);
  const [progressData, setProgressData] = useState<ProgressData>({ completed: 0, total: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // --- NEW: Data loading function ---
  const loadData = useCallback(async () => {
    // Only load if the "Today" filter is selected
    if (selectedFilter !== 'day') {
      setSchedule([]);
      setProgressData({ completed: 0, total: 0, percentage: 0 });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userDataString = await AsyncStorage.getItem("userData");
      const userId = userDataString ? JSON.parse(userDataString).id : null;

      if (!userId) {
        router.replace("/(auth)/login");
        return;
      }

      // 1. Fetch today's schedule from the backend
      const response = await api.get(`/medications/today/${userId}`);
      const scheduleData: ScheduledDose[] = response.data.schedule || [];
      setSchedule(scheduleData);

      // 2. Calculate progress from this data
      const completedCount = scheduleData.filter((m) => m.status === 'taken').length;
      const totalCount = scheduleData.length;
      const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
      
      setProgressData({
        completed: completedCount,
        total: totalCount,
        percentage: percentage,
      });

    } catch (error) {
      console.error("Error loading schedule:", error);
      Alert.alert("Error", "Could not load today's schedule.");
    } finally {
      setIsLoading(false);
    }
  }, [router, selectedFilter]); // Re-run when filter changes

  useFocusEffect(
    useCallback(() => {
      // Set status bar to light-content (white text)
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#63b0a3ff'); // Match gradient
      }
      
      loadData();
    }, [loadData])
  );

  // --- NEW: Connected logging function ---
  const handleLogIntake = async (doseToLog: ScheduledDose) => {
    // Only allow logging a pending dose
    if (doseToLog.status !== 'pending') {
      // Optional: Allow un-taking a dose
      // if (doseToLog.status === 'taken') { /* logic to call backend to skip */ }
      return;
    }

    const newStatus = 'taken';

    try {
      // 1. Optimistically update the UI
      setSchedule(prevSchedule =>
        prevSchedule.map(dose => 
          dose.medication._id === doseToLog.medication._id && dose.scheduledTime === doseToLog.scheduledTime
            ? { ...dose, status: newStatus }
            : dose
        )
      );

      // 2. Recalculate progress
      const newCompletedCount = progressData.completed + 1;
      const totalCount = progressData.total;
      const newPercentage = totalCount > 0 ? (newCompletedCount / totalCount) * 100 : 0;
      
      setProgressData({
        completed: newCompletedCount,
        total: totalCount,
        percentage: newPercentage,
      });

      // 3. Send to backend
      await api.post("/medications/intake", {
        medicationId: doseToLog.medication._id,
        status: newStatus,
      });

    } catch (error) {
      console.error("Error logging intake:", error);
      Alert.alert("Error", "Failed to log intake. Reverting.");
      // If backend fails, reload data to revert
      loadData();
    }
  };

  const handleFilterSelect = (filterValue: string) => {
    if (filterValue !== 'day') {
      Alert.alert("Feature Coming Soon", "Only the 'Today' filter is currently connected.");
      return;
    }
    setSelectedFilter(filterValue as 'day');
    setShowFilterMenu(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        {/* Header with gradient */}
        <LinearGradient colors={["#63b0a3ff", "#3a9479ff"]} style={styles.header}>
          {/* ... (Header Top is unchanged) ... */}
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Daily Progress</Text>
              <Text style={styles.subtitle}>Track your medication adherence</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Filter Selection */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterMenu(!showFilterMenu)}
            >
              <Ionicons name="funnel-outline" size={16} color="white" />
              <Text style={styles.filterButtonText}>
                {FILTER_OPTIONS.find((f) => f.value === selectedFilter)?.label}
              </Text>
              <Ionicons
                name={showFilterMenu ? "chevron-up" : "chevron-down"}
                size={16}
                color="white"
              />
            </TouchableOpacity>

            {showFilterMenu && (
              <View style={styles.filterMenu}>
                {FILTER_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      selectedFilter === option.value && styles.filterOptionActive,
                      option.value !== 'day' && styles.filterOptionDisabled, // Dim disabled options
                    ]}
                    onPress={() => handleFilterSelect(option.value)}
                    disabled={option.value !== 'day'} // Disable buttons
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedFilter === option.value && styles.filterOptionTextActive,
                        option.value !== 'day' && styles.filterOptionTextDisabled,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Progress Bar (Now uses `progressData` state) */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressLabel}>Completion Rate</Text>
                <Text style={styles.progressPercentage}>
                  {progressData.percentage.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressStatsText}>
                  {progressData.completed} of {progressData.total}
                </Text>
                <Text style={styles.progressStatsSubtext}>doses taken</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressData.percentage}%` },
                ]}
              />
            </View>
            <View style={styles.progressFooter}>
              <View style={styles.progressFooterItem}>
                <Ionicons name="trending-up" size={16} color="white" />
                <Text style={styles.progressFooterText}>Today</Text>
              </View>
              <Text style={styles.progressFooterText}>
                {progressData.total - progressData.completed} remaining
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Quick Actions (Unchanged) */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {QUICK_ACTIONS.map((action) => (
                <Link href={action.route as any} key={action.label} asChild>
                  <TouchableOpacity style={styles.actionButton}>
                    <LinearGradient
                      colors={action.gradient}
                      style={styles.actionGradient}
                    >
                      <View style={styles.actionContent}>
                        <View style={styles.actionIcon}>
                          <Ionicons name={action.icon} size={28} color="white" />
                        </View>
                        <Text style={styles.actionLabel}>{action.label}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>

          {/* Today's Medications (Now uses `schedule` state) */}
          <View style={styles.medicationsContainer}>
            <View style={styles.medicationsHeader}>
              <Text style={styles.sectionTitle}>Today's Schedule</Text>
              <Text style={styles.completionCount}>
                {progressData.completed}/{progressData.total} completed
              </Text>
            </View>

            <View style={styles.medicationsList}>
              {isLoading ? (
                <ActivityIndicator size="large" color="#63b0a3" />
              ) : schedule.length === 0 ? (
                <Text style={{textAlign: 'center', padding: 20, color: '#666'}}>
                  {selectedFilter === 'day' ? 'No medications scheduled for today.' : `Data for ${selectedFilter} is not available.`}
                </Text>
              ) : (
                schedule.map((dose) => {
                  const isCompleted = dose.status === 'taken';
                  return (
                    <TouchableOpacity
                      key={dose.medication._id + dose.scheduledTime}
                      style={[
                        styles.medicationCard,
                        isCompleted && styles.medicationCardCompleted,
                        dose.status === 'skipped' && styles.medicationCardCompleted,
                      ]}
                      onPress={() => handleLogIntake(dose)}
                      onLongPress={() => // <-- ADDED LONG PRESS TO EDIT
                        router.push({
                          pathname: "/medicineReminder/medications/edit/[id]",
                          params: { id: dose.medication._id },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <View style={styles.medicationContent}>
                        <View style={styles.checkbox}>
                          {isCompleted ? (
                            <Ionicons name="checkmark-circle" size={32} color="#63b0a3ff" />
                          ) : (
                            <Ionicons name={dose.status === 'skipped' ? 'close-circle' : 'ellipse-outline'} size={32} color={dose.status === 'skipped' ? '#F44336' : '#d1d5db'} />
                          )}
                        </View>
                        <View style={styles.medicationInfo}>
                          <Text
                            style={[
                              styles.medicationName,
                              (isCompleted || dose.status === 'skipped') && styles.medicationNameCompleted,
                            ]}
                          >
                            {dose.medication.medicineName}
                          </Text>
                          <Text style={styles.medicationDosage}>
                            {dose.medication.dosage}
                          </Text>
                        </View>
                        <View style={styles.medicationTime}>
                          <Ionicons name="time-outline" size={16} color="#6b7280" />
                          <Text style={styles.medicationTimeText}>
                            {new Date(dose.scheduledTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          {/* Add Medication Button (Unchanged) */}
          <TouchableOpacity 
            style={styles.addButton} 
            activeOpacity={0.8} 
            onPress={() => router.push("/medicineReminder/medications/add")}
          >
            <LinearGradient
              colors={["#63b0a3ff", "#44a192ff"]}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add New Medication</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// STYLES
const styles = StyleSheet.create({
  safeArea: { // <-- NEW: Handles status bar area
    flex: 1,
    backgroundColor: '#63b0a3ff', // Matches gradient top color
  },
  scrollContainer: { // <-- NEW: Content scrolls under header
    flex: 1,
    backgroundColor: "#f8f9fa", // Your main content background
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    // paddingTop: 50, // <-- REMOVED: SafeAreaView handles this
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    // Note: The gradient is now inside the safe area
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  notificationButton: {
    position: "relative",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF5252",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#63b0a3ff",
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  filterContainer: {
    marginBottom: 20,
    position: "relative",
    zIndex: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    alignSelf: "flex-start",
  },
  filterButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  filterMenu: {
    position: "absolute",
    top: 50,
    left: 0,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 140,
    overflow: "hidden",
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterOptionActive: {
    backgroundColor: "rgba(99, 176, 163, 0.1)",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#333",
  },
  filterOptionTextActive: {
    color: "#63b0a3ff",
    fontWeight: "600",
  },
  filterOptionDisabled: { // Added
    backgroundColor: '#f5f5f5',
  },
  filterOptionTextDisabled: { // Added
    color: '#aaa',
  },
  progressCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  progressLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  progressPercentage: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: 4,
  },
  progressStats: {
    alignItems: "flex-end",
  },
  progressStatsText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  progressStatsSubtext: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 6,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
  },
  progressFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressFooterText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    padding: 20,
    backgroundColor: '#f8f9fa', // Added
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    width: (width - 52) / 2,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionGradient: {
    flex: 1,
    padding: 16,
  },
  actionContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginTop: 8,
  },
  medicationsContainer: {
    marginBottom: 20,
  },
  medicationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  completionCount: {
    fontSize: 14,
    color: "#6b7280",
  },
  medicationsList: {
    gap: 12,
  },
  medicationCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  medicationCardCompleted: {
    opacity: 0.6,
  },
  medicationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    justifyContent: "center",
    alignItems: "center",
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  medicationNameCompleted: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  medicationDosage: {
    fontSize: 14,
    color: "#6b7280",
  },
  medicationTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  medicationTimeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  addButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 10,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});