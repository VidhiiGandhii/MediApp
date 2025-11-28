// FILE: medicineReminder/medications/add.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import api from "../../../services/api"; // Your axios instance
import { NotificationService } from '../../../services/notificationService';

const { width } = Dimensions.get("window");

// This interface now matches your 'Inventory' model
interface MedicineFromSearch {
  _id: string;
  name: string;
}

// --- (Your constants are unchanged) ---
const FREQUENCIES = [
  { id: "1", label: "Once daily", icon: "sunny-outline" as const, times: ["09:00"] },
  { id: "2", label: "Twice daily", icon: "sync-outline" as const, times: ["09:00", "21:00"] },
  { id: "3", label: "Three times daily", icon: "time-outline" as const, times: ["09:00", "15:00", "21:00"] },
  { id: "4", label: "Four times daily", icon: "repeat-outline" as const, times: ["09:00", "13:00", "17:00", "21:00"] },
  { id: "5", label: "As needed", icon: "calendar-outline" as const, times: [] },
];
const DURATIONS = [
  { id: "1", label: "7 days", value: 7 },
  { id: "2", label: "14 days", value: 14 },
  { id: "3", label: "30 days", value: 30 },
  { id: "4", label: "90 days", value: 90 },
  { id: "5", label: "Ongoing", value: -1 },
];

export default function AddMedicationScreen() {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MedicineFromSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineFromSearch | null>(null);
  
  const [form, setForm] = useState({
    dosage: "", frequency: "", duration: "",
    startDate: new Date(),
    times: [{ hour: 9, minute: 0 }],
    notes: "", reminderEnabled: true, refillReminder: false,
    currentSupply: "", refillAt: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerIndex, setTimePickerIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. CONNECTED: Medicine Search Function ---
  const searchMedicines = async (query: string) => {
    setSearchQuery(query);
    setSelectedMedicine(null);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      // Calls the now-public GET /api/inventory route
      const response = await api.get(`/inventory?search=${query}`);
      setSearchResults(response.data.inventory || []);
    } catch (error) {
      console.error("Failed to search medicines:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const onSelectMedicine = (medicine: MedicineFromSearch) => {
    setSelectedMedicine(medicine);
    setSearchQuery(medicine.name);
    setSearchResults([]);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  // --- 2. NEW: Function to add a custom medicine ---
  const handleAddNewMedicine = async () => {
    if (searchQuery.length < 2) {
      Alert.alert("Invalid Name", "Please type a longer medicine name.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Calls the private POST /api/inventory route
      const response = await api.post("/inventory", {
        name: searchQuery,
        category: "User Added",
        quantity: 0, // Not relevant for this collection
        lowStockThreshold: 10, // Default
      });
      
      const newMed: MedicineFromSearch = response.data.item;
      onSelectMedicine(newMed); // Automatically select the new medicine

    } catch (error) {
      console.error("Failed to add new medicine:", error);
      Alert.alert("Error", "Could not add this medicine. It may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const validateForm = () => {
    // ... (Your validation logic is unchanged) ...
    const newErrors: { [key: string]: string } = {};
    if (!selectedMedicine) { newErrors.name = "Please search and select a medication"; }
    if (!form.dosage.trim()) newErrors.dosage = "Dosage is required";
    if (!form.frequency) newErrors.frequency = "Frequency is required";
    if (!form.duration) newErrors.duration = "Duration is required";
    if (form.times.length === 0 && form.frequency !== "As needed") newErrors.times = "Please add at least one time";
    if (form.refillReminder) {
      if (!form.currentSupply) newErrors.currentSupply = "Current supply is required";
      if (!form.refillAt) newErrors.refillAt = "Refill alert threshold is required";
      if (Number(form.refillAt) >= Number(form.currentSupply)) newErrors.refillAt = "Refill alert must be less than current supply";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- 3. UPDATED: handleSave connects to the backend ---
  const handleSave = async () => {
    try {
      if (!validateForm() || !selectedMedicine) {
        Alert.alert("Error", "Please fill in all required fields correctly");
        return;
      }
      if (isSubmitting) return;
      setIsSubmitting(true);

      const userDataString = await AsyncStorage.getItem("userData");
      const userId = userDataString ? JSON.parse(userDataString).id : null;
      if (!userId) {
        router.replace("/(auth)/login");
        return;
      }
      
      const medicationData = {
        userId: userId,
        // The BE 'medicineId' is an 'ObjectId', but our schema links to 'Inventory'
        // This is a disconnect. We'll send the *Inventory* ID.
        // We MUST update the backend 'UserMedication' schema to ref 'Inventory'.
        medicineId: selectedMedicine._id, // This is the ID from the 'Inventory' collection
        medicineName: selectedMedicine.name,
        dosage: form.dosage,
        frequency: form.frequency,
        times: form.times,
        startDate: form.startDate.toISOString(),
        instructions: form.notes,
        reminderEnabled: form.reminderEnabled,
        stock: form.currentSupply ? Number(form.currentSupply) : 0,
        refillReminder: form.refillReminder,
        refillThreshold: form.refillAt ? Number(form.refillAt) : 0,
      };
const response = await api.post("/medications", medicationData);
const savedMedication = response.data.medication;
if (savedMedication.reminderEnabled) {
      await NotificationService.scheduleMedicationReminders(
        savedMedication._id,
        savedMedication.medicineName,
        savedMedication.dosage,
        savedMedication.times,
        savedMedication.instructions // optional, can be undefined
      );
    }
      await api.post("/medications", medicationData);
      
      
      Alert.alert(
        "Success", "Medication added successfully",
        [{ text: "OK", onPress: () => router.back() }],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Save error:", error);
      const message = axios.isAxiosError(error) ? error.response?.data.message : "Failed to save medication.";
      Alert.alert("Error", message, [{ text: "OK" }], { cancelable: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- (All your other helper functions and UI renderers are unchanged) ---
  const handleFrequencySelect = (freq: string) => {
    setSelectedFrequency(freq);
    const selectedFreq = FREQUENCIES.find((f) => f.label === freq);
    const newTimes = (selectedFreq?.times || []).map(timeStr => {
      const [hour, minute] = timeStr.split(':').map(Number);
      return { hour, minute };
    });
    setForm((prev) => ({ ...prev, frequency: freq, times: newTimes }));
    if (errors.frequency) setErrors((prev) => ({ ...prev, frequency: "" }));
  };
  const handleDurationSelect = (dur: string) => {
    setSelectedDuration(dur);
    setForm((prev) => ({ ...prev, duration: dur }));
    if (errors.duration) setErrors((prev) => ({ ...prev, duration: "" }));
  };
  const renderFrequencyOptions = () => {
    return (
      <View style={styles.optionsGrid}>
        {FREQUENCIES.map((freq) => (
          <TouchableOpacity
            key={freq.id}
            style={[ styles.optionCard, selectedFrequency === freq.label && styles.selectedOptionCard ]}
            onPress={() => handleFrequencySelect(freq.label)}
          >
            <View style={[ styles.optionIcon, selectedFrequency === freq.label && styles.selectedOptionIcon ]}>
              <Ionicons name={freq.icon} size={24} color={selectedFrequency === freq.label ? "white" : "#666"} />
            </View>
            <Text style={[ styles.optionLabel, selectedFrequency === freq.label && styles.selectedOptionLabel ]}>
              {freq.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  const renderDurationOptions = () => {
    return (
      <View style={styles.optionsGrid}>
        {DURATIONS.map((dur) => (
          <TouchableOpacity
            key={dur.id}
            style={[ styles.optionCard, selectedDuration === dur.label && styles.selectedOptionCard ]}
            onPress={() => handleDurationSelect(dur.label)}
          >
            <Text style={[ styles.durationNumber, selectedDuration === dur.label && styles.selectedDurationNumber ]}>
              {dur.value > 0 ? dur.value : "∞"}
            </Text>
            <Text style={[ styles.optionLabel, selectedDuration === dur.label && styles.selectedOptionLabel ]}>
              {dur.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  const handleTimeConfirm = (date: Date) => {
    const newTime = { hour: date.getHours(), minute: date.getMinutes() };
    const newTimes = [...form.times];
    if (timePickerIndex > -1) {
      newTimes[timePickerIndex] = newTime;
    } else {
      newTimes.push(newTime);
    }
    setForm(prev => ({ ...prev, times: newTimes }));
    setShowTimePicker(false);
  };
  const openTimePicker = (index: number) => {
    setTimePickerIndex(index);
    setShowTimePicker(true);
  };
  const openNewTimePicker = () => {
    setTimePickerIndex(-1);
    setShowTimePicker(true);
  }
  const handleDateConfirm = (date: Date) => {
    setForm({ ...form, startDate: date });
    setShowDatePicker(false);
  }
  
  return (
    <View style={styles.container}>
      <LinearGradient colors={["#63b0a3ff", "#54968bff"]} style={styles.headerGradient} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Medication</Text>
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContentContainer}
        >
          {/* --- UPDATED: Basic Information --- */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.mainInput, errors.name && styles.inputError]}
                placeholder="Search Medication Name*"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={searchMedicines}
              />
              {isSearching && <ActivityIndicator style={{padding: 10}} />}

              {/* --- UPDATED: Show search results or "Add New" button --- */}
              {!isSearching && searchQuery.length > 1 && (
                <>
                  {searchResults.length > 0 ? (
                    searchResults.map((item) => (
                      <TouchableOpacity
                        key={item._id}
                        style={styles.searchResult}
                        onPress={() => onSelectMedicine(item)}
                      >
                        <Text>{item.name}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    // Show the "Add New" button only if no results are found
                    <TouchableOpacity
                      style={styles.addNewButton}
                      onPress={handleAddNewMedicine}
                    >
                      <Ionicons name="add" size={20} color="#63b0a3ff" />
                      <Text style={styles.addNewButtonText}>
                        Add "{searchQuery}" as a new medicine
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
          </View>
          
          {selectedMedicine && (
            <>
              {/* ... (Rest of your form JSX is unchanged) ... */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.mainInput, errors.dosage && styles.inputError]}
                  placeholder="Dosage (e.g., 500mg)"
                  placeholderTextColor="#999"
                  value={form.dosage}
                  onChangeText={(text) => {
                    setForm({ ...form, dosage: text });
                    if (errors.dosage) setErrors({ ...errors, dosage: "" });
                  }}
                />
                {errors.dosage && <Text style={styles.errorText}>{errors.dosage}</Text>}
              </View>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How often?</Text>
                {errors.frequency && <Text style={styles.errorText}>{errors.frequency}</Text>}
                {renderFrequencyOptions()}
                <Text style={styles.sectionTitle}>For how long?</Text>
                {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
                {renderDurationOptions()}
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.dateIconContainer}><Ionicons name="calendar" size={20} color="#63b0a3ff" /></View>
                  <Text style={styles.dateButtonText}>
                    Starts {form.startDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showDatePicker}
                  mode="date"
                  date={form.startDate}
                  onConfirm={handleDateConfirm}
                  onCancel={() => setShowDatePicker(false)}
                />
                {form.frequency && form.frequency !== "As needed" && (
                  <View style={styles.timesContainer}>
                    <Text style={styles.timesTitle}>Medication Times</Text>
                    {form.times.map((time, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.timeButton}
                        onPress={() => openTimePicker(index)}
                      >
                        <View style={styles.timeIconContainer}><Ionicons name="time-outline" size={20} color="#63b0a3ff" /></View>
                        <Text style={styles.timeButtonText}>
                          {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#666" />
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.addButton} onPress={openNewTimePicker}>
                      <Ionicons name="add" size={20} color="#63b0a3ff" />
                      <Text style={styles.addButtonText}>Add another time</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <DateTimePickerModal
                  isVisible={showTimePicker}
                  mode="time"
                  date={new Date()}
                  onConfirm={handleTimeConfirm}
                  onCancel={() => setShowTimePicker(false)}
                />
              </View>
              <View style={styles.section}>
                <View style={styles.card}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <View style={styles.iconContainer}><Ionicons name="notifications" size={20} color="#63b0a3ff" /></View>
                      <View style={{flex: 1}}>
                        <Text style={styles.switchLabel}>Reminders</Text>
                        <Text style={styles.switchSubLabel}>
                          Get notified when it's time to take your medication
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={form.reminderEnabled}
                      onValueChange={(value) => setForm({ ...form, reminderEnabled: value })}
                      trackColor={{ false: "#ddd", true: "#63b0a3ff" }}
                      thumbColor="white"
                    />
                  </View>
                </View>
              </View>
              <View style={styles.section}>
                <View style={styles.card}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLabelContainer}>
                      <View style={styles.iconContainer}><Ionicons name="reload" size={20} color="#63b0a3ff" /></View>
                      <View style={{flex: 1}}>
                        <Text style={styles.switchLabel}>Refill Tracking</Text>
                        <Text style={styles.switchSubLabel}>
                          Get notified when you need to refill
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={form.refillReminder}
                      onValueChange={(value) => {
                        setForm({ ...form, refillReminder: value });
                        if (!value) setErrors({ ...errors, currentSupply: "", refillAt: "" });
                      }}
                      trackColor={{ false: "#ddd", true: "#63b0a3ff" }}
                      thumbColor="white"
                    />
                  </View>
                  {form.refillReminder && (
                    <View style={styles.refillInputs}>
                      <View style={styles.inputRow}>
                        <View style={[styles.inputContainer, styles.flex1]}>
                          <TextInput
                            style={[ styles.input, errors.currentSupply && styles.inputError ]}
                            placeholder="Current Supply"
                            placeholderTextColor="#999"
                            value={form.currentSupply}
                            onChangeText={(text) => {
                              setForm({ ...form, currentSupply: text });
                              if (errors.currentSupply) setErrors({ ...errors, currentSupply: "" });
                            }}
                            keyboardType="numeric"
                          />
                          {errors.currentSupply && <Text style={styles.errorText}>{errors.currentSupply}</Text>}
                        </View>
                        <View style={[styles.inputContainer, styles.flex1]}>
                          <TextInput
                            style={[ styles.input, errors.refillAt && styles.inputError ]}
                            placeholder="Alert at"
                            placeholderTextColor="#999"
                            value={form.refillAt}
                            onChangeText={(text) => {
                              setForm({ ...form, refillAt: text });
                              if (errors.refillAt) setErrors({ ...errors, refillAt: "" });
                            }}
                            keyboardType="numeric"
                          />
                          {errors.refillAt && <Text style={styles.errorText}>{errors.refillAt}</Text>}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.section}>
                <View style={styles.textAreaContainer}>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Add notes or special instructions..."
                    placeholderTextColor="#999"
                    value={form.notes}
                    onChangeText={(text) => setForm({ ...form, notes: text })}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[ styles.saveButton, (isSubmitting || !selectedMedicine) && styles.saveButtonDisabled ]}
            onPress={handleSave}
            disabled={isSubmitting || !selectedMedicine}
          >
            <LinearGradient
              colors={["#6dbbaeff", "#63b0a3ff"]}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "Adding..." : "Add Medication"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  formContainer: { flex: 1 },
  formContentContainer: { padding: 20 },
  section: { marginBottom: 25 },
  sectionTitle: {
    fontSize: 18, fontWeight: "700", color: "#1a1a1a",
    marginBottom: 15, marginTop: 10,
  },
  mainInput: { fontSize: 20, color: "#333", padding: 15 },
  optionsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  optionCard: {
    width: (width - 60) / 2, backgroundColor: "white", borderRadius: 16,
    padding: 15, margin: 5, alignItems: "center", borderWidth: 1,
    borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  selectedOptionCard: { backgroundColor: "#63b0a3ff", borderColor: "#63b0a3ff" },
  optionIcon: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "#f5f5f5", justifyContent: "center",
    alignItems: "center", marginBottom: 10,
  },
  selectedOptionIcon: { backgroundColor: "rgba(255, 255, 255, 0.2)" },
  optionLabel: {
    fontSize: 14, fontWeight: "600", color: "#333",
    textAlign: "center",
  },
  selectedOptionLabel: { color: "white" },
  durationNumber: {
    fontSize: 24, fontWeight: "700", color: "#63b0a3ff",
    marginBottom: 5,
  },
  selectedDurationNumber: { color: "white" },
  inputContainer: {
    backgroundColor: "white", borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 2,
  },
  dateButton: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white",
    borderRadius: 16, padding: 15, marginTop: 15, borderWidth: 1,
    borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  dateIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f5f5f5", justifyContent: "center",
    alignItems: "center", marginRight: 10,
  },
  dateButtonText: { flex: 1, fontSize: 16, color: "#333" },
  card: {
    backgroundColor: "white", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#e0e0e0", shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 2,
  },
  switchRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabelContainer: {
    flexDirection: "row", alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f5f5f5", justifyContent: "center",
    alignItems: "center", marginRight: 15,
  },
  switchLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  switchSubLabel: {
    fontSize: 13, color: "#666", marginTop: 2,
    flexWrap: 'wrap', flex: 1,
  },
  inputRow: { flexDirection: "row", marginTop: 15, gap: 10 },
  flex1: { flex: 1 },
  input: { padding: 15, fontSize: 16, color: "#333" },
  textAreaContainer: {
    backgroundColor: "white", borderRadius: 16, borderWidth: 1,
    borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  textArea: { height: 100, padding: 15, fontSize: 16, color: "#333" },
  footer: {
    padding: 20, backgroundColor: "white",
    borderTopWidth: 1, borderTopColor: "#e0e0e0",
  },
  saveButton: { borderRadius: 16, overflow: "hidden", marginBottom: 12 },
  saveButtonGradient: {
    paddingVertical: 15, justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  cancelButton: {
    paddingVertical: 15, borderRadius: 16, borderWidth: 1,
    borderColor: "#e0e0e0", justifyContent: "center",
    alignItems: "center", backgroundColor: "white",
  },
  cancelButtonText: { color: "#666", fontSize: 16, fontWeight: "600" },
  inputError: { borderColor: "#FF5252" },
  errorText: {
    color: "#FF5252", fontSize: 12,
    marginTop: 4, marginLeft: 12,
  },
  saveButtonDisabled: { opacity: 0.7 },
  refillInputs: { marginTop: 15 },
  timesContainer: { marginTop: 20 },
  timesTitle: {
    fontSize: 16, fontWeight: "600", color: "#333",
    marginBottom: 10,
  },
  timeButton: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white",
    borderRadius: 16, padding: 15, marginBottom: 10, borderWidth: 1,
    borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  timeIconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f5f5f5", justifyContent: "center",
    alignItems: "center", marginRight: 10,
  },
  timeButtonText: { flex: 1, fontSize: 16, color: "#333" },
  // --- NEW STYLES ---
  searchResult: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  addNewButtonText: {
    color: '#63b0a3ff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  addButton: { // For "Add another time"
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 10,
  },
  addButtonText: {
    color: '#63b0a3ff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  }
});