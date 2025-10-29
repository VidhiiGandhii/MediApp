import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const QUICK_ACTIONS = [
  {
    icon: "add-circle-outline" as const,
    label: "Add\nMedication",
    route: "medicineReminder/medications/add" as const,
    gradient: ["#63b0a3ff", "#44a192ff"] as [string, string],
  },
  {
    icon: "calendar-outline" as const,
    label: "Calendar\nView",
    route: "medicineReminder/calendar" as const,
    gradient: ["#5992c2ff", "#3d6791ff"] as [string, string],
  },
  {
    icon: "time-outline" as const,
    label: "History\nLog",
    route: "medicineReminder/history" as const,
    gradient: ["#bd7994ff", "#744256ff"] as [string, string],
  },
  {
    icon: "medical-outline" as const,
    label: "Refill\nTracker",
    route: "medicineReminder/refills" as const,
    gradient: ["#be745dff", "#74493cff"] as [string, string],
  },
];

const SAMPLE_MEDICATIONS = [
  { id: 1, name: "Aspirin", dosage: "100mg", time: "08:00 AM", completed: true },
  { id: 2, name: "Vitamin D", dosage: "1000 IU", time: "09:00 AM", completed: true },
  { id: 3, name: "Metformin", dosage: "500mg", time: "12:00 PM", completed: false },
  { id: 4, name: "Lisinopril", dosage: "10mg", time: "02:00 PM", completed: false },
  { id: 5, name: "Aspirin", dosage: "100mg", time: "08:00 PM", completed: false },
];

const FILTER_OPTIONS: { value: keyof typeof COMPLETION_DATA; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const COMPLETION_DATA = {
  day: { completed: 2, total: 5, percentage: 40 },
  week: { completed: 28, total: 35, percentage: 80 },
  month: { completed: 98, total: 150, percentage: 65 },
  year: { completed: 1200, total: 1825, percentage: 66 },
};

export default function MedicineTracker() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<keyof typeof COMPLETION_DATA>("day");
  const [medications, setMedications] = useState(SAMPLE_MEDICATIONS);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const currentData = COMPLETION_DATA[selectedFilter];

  const toggleMedication = (id: number) => {
    setMedications(
      medications.map((med) =>
        med.id === id ? { ...med, completed: !med.completed } : med
      )
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient colors={["#63b0a3ff", "#3a9479ff"]} style={styles.header}>
        {/* Header Top */}
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Daily Progress</Text>
            <Text style={styles.subtitle}>Track your medication adherence</Text>
          </View>

          {/* Notifications */}
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>3</Text>
            </View>
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
                  ]}
                  onPress={() => {
                    setSelectedFilter(option.value);
                    setShowFilterMenu(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFilter === option.value &&
                        styles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>Completion Rate</Text>
              <Text style={styles.progressPercentage}>
                {currentData.percentage}%
              </Text>
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressStatsText}>
                {currentData.completed} of {currentData.total}
              </Text>
              <Text style={styles.progressStatsSubtext}>doses taken</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${currentData.percentage}%` },
              ]}
            />
          </View>

          {/* Stats */}
          <View style={styles.progressFooter}>
            <View style={styles.progressFooterItem}>
              <Ionicons name="trending-up" size={16} color="white" />
              <Text style={styles.progressFooterText}>
                {selectedFilter === "day"
                  ? "Today"
                  : `This ${selectedFilter}`}
              </Text>
            </View>
            <Text style={styles.progressFooterText}>
              {currentData.total - currentData.completed} remaining
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Quick Actions */}
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

        {/* Today's Medications */}
        <View style={styles.medicationsContainer}>
          <View style={styles.medicationsHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <Text style={styles.completionCount}>
              {medications.filter((m) => m.completed).length}/{medications.length}{" "}
              completed
            </Text>
          </View>

          <View style={styles.medicationsList}>
            {medications.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={[
                  styles.medicationCard,
                  med.completed && styles.medicationCardCompleted,
                ]}
                onPress={() => toggleMedication(med.id)}
                activeOpacity={0.7}
              >
                <View style={styles.medicationContent}>
                  {/* Checkbox */}
                  <View style={styles.checkbox}>
                    {med.completed ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={32}
                        color="#63b0a3ff"
                      />
                    ) : (
                      <Ionicons
                        name="ellipse-outline"
                        size={32}
                        color="#d1d5db"
                      />
                    )}
                  </View>

                  {/* Medication Info */}
                  <View style={styles.medicationInfo}>
                    <Text
                      style={[
                        styles.medicationName,
                        med.completed && styles.medicationNameCompleted,
                      ]}
                    >
                      {med.name}
                    </Text>
                    <Text style={styles.medicationDosage}>{med.dosage}</Text>
                  </View>

                  {/* Time */}
                  <View style={styles.medicationTime}>
                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <Text style={styles.medicationTimeText}>{med.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Add Medication Button */}
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}  onPress={() => router.push("/medicineReminder/medications/add")}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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