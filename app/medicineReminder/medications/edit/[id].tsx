import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router"; // <-- Import useLocalSearchParams
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../../../backend/node_server/services/api"; // Your axios instance
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

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

export default function EditMedicationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); // <-- Get the medication ID from the URL

  const [form, setForm] = useState<any>(null); // Start as null
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerIndex, setTimePickerIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial fetch

  // --- NEW: Fetch existing medication data ---
  useEffect(() => {
    if (!id) return;
    const fetchMedication = async () => {
      try {
        setIsLoading(true);
        // We call the 'All Medications' endpoint, which returns an array
        // We'll find our specific medication by its ID
        // Note: We need the userId, but the interceptor adds the token,
        // so we don't know the user ID here.
        // THIS IS A PROBLEM. The GET /api/medications/:userId route
        // needs the userId in the URL.
        // Let's assume you'll update your 'api' service to get the userId
        // or we need to add a new backend route: GET /api/medications/details/:id
        
        // --- TEMPORARY FIX: We'll assume the backend route is GET /api/medications/details/:id
        // You will need to add this route to your backend.
        
        // --- REAL FIX: Let's use the 'GET /api/medications/:userId' route
        // We just need to get the userId from storage first.
        
        const userDataString = await AsyncStorage.getItem("userData");
        const userId = userDataString ? JSON.parse(userDataString).id : null;
        if (!userId) {
          router.replace("/(auth)/login");
          return;
        }

        const response = await api.get(`/medications/${userId}`);
        const allMeds = response.data.medications || [];
        const thisMed = allMeds.find((med: any) => med._id === id);

        if (thisMed) {
          setForm({
            ...thisMed,
            startDate: new Date(thisMed.startDate), // Convert string back to Date
            currentSupply: thisMed.stock?.toString() || '0',
            refillAt: thisMed.refillThreshold?.toString() || '0',
          });
          setSelectedFrequency(thisMed.frequency);
          setSelectedDuration(thisMed.duration || "Ongoing"); // Default if not set
        } else {
          Alert.alert("Error", "Could not find this medication.");
          router.back();
        }
      } catch (err) {
        console.error("Fetch medication error:", err);
        Alert.alert("Error", "Failed to load medication details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedication();
  }, [id, router]);

  // --- (Validation is unchanged) ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.dosage.trim()) newErrors.dosage = "Dosage is required";
    if (!form.frequency) newErrors.frequency = "Frequency is required";
    if (!form.duration) newErrors.duration = "Duration is required";
    // ... rest of your validation
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- UPDATED: handleSave calls PUT instead of POST ---
  const handleSave = async () => {
    try {
      if (!validateForm()) {
        Alert.alert("Error", "Please fill in all required fields correctly");
        return;
      }
      if (isSubmitting) return;
      setIsSubmitting(true);

      const medicationData = {
        // We don't send userId or medicineId/Name, as they aren't changing
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

      // --- Backend API Call ---
      // We call PUT to the specific medication's ID
      await api.put(`/medications/${id}`, medicationData);
      
      Alert.alert(
        "Success", "Medication updated successfully",
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

  // --- (All other helpers are the same as add.tsx) ---
  const handleFrequencySelect = (freq: string) => {
    setSelectedFrequency(freq);
    const selectedFreq = FREQUENCIES.find((f) => f.label === freq);
    const newTimes = (selectedFreq?.times || []).map(timeStr => {
      const [hour, minute] = timeStr.split(':').map(Number);
      return { hour, minute };
    });
    setForm((prev: any) => ({ ...prev, frequency: freq, times: newTimes }));
  };
  const handleDurationSelect = (dur: string) => {
    setSelectedDuration(dur);
    setForm((prev: any) => ({ ...prev, duration: dur }));
  };
  const handleTimeConfirm = (date: Date) => {
    const newTime = { hour: date.getHours(), minute: date.getMinutes() };
    const newTimes = [...form.times];
    newTimes[timePickerIndex] = newTime;
    setForm((prev: any) => ({ ...prev, times: newTimes }));
    setShowTimePicker(false);
  };
  const openTimePicker = (index: number) => {
    setTimePickerIndex(index);
    setShowTimePicker(true);
  };
  const openNewTimePicker = () => {
    setTimePickerIndex(-1); // Use -1 to signify a new time
    setShowTimePicker(true);
  }
  const handleDateConfirm = (date: Date) => {
    setForm({ ...form, startDate: date });
    setShowDatePicker(false);
  }

  // --- (All render helpers are the same as add.tsx) ---
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

  // --- Show loading indicator while fetching ---
  if (isLoading || !form) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#63b0a3ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#63b0a3ff", "#54968bff"]} style={styles.headerGradient} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1a8e2d" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Medication</Text>
        </View>

        <ScrollView
          style={styles.formContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.formContentContainer}
        >
          {/* --- UPDATED: Show selected medicine name --- */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <Text style={styles.mainInput}>{form.medicineName}</Text>
            </View>
          </View>
          
          {/* --- (The rest of the form is the same as add.tsx) --- */}
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
                {form.times.map((time: any, index: number) => (
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
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[ styles.saveButton, isSubmitting && styles.saveButtonDisabled ]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={["#6dbbaeff", "#63b0a3ff"]}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "Updating..." : "Update Medication"}
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

// --- (Styles are unchanged from add.tsx) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 140 : 120,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    marginLeft: 15,
  },
  formContainer: {
    flex: 1,
  },
  formContentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 15,
    marginTop: 10,
  },
  mainInput: {
    fontSize: 20,
    color: "#333",
    padding: 15,
    backgroundColor: '#eee', // Make it look disabled
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
  },
  optionCard: {
    width: (width - 60) / 2,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    margin: 5,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedOptionCard: {
    backgroundColor: "#63b0a3ff",
    borderColor: "#63b0a3ff",
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  selectedOptionIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  selectedOptionLabel: {
    color: "white",
  },
  durationNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#63b0a3ff",
    marginBottom: 5,
  },
  selectedDurationNumber: {
    color: "white",
  },
  inputContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  switchSubLabel: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
    flexWrap: 'wrap',
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 15,
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  input: {
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  textAreaContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textArea: {
    height: 100,
    padding: 15,
    fontSize: 16,
    color: "#333",
  },
  footer: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  saveButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  saveButtonGradient: {
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  inputError: {
    borderColor: "#FF5252",
  },
  errorText: {
    color: "#FF5252",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  refillInputs: {
    marginTop: 15,
  },
  timesContainer: {
    marginTop: 20,
  },
  timesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  timeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  timeButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  addButton: {
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