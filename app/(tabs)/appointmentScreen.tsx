// FILE: app/(tabs)/appointmentScreen.tsx (or wherever yours is)

import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import api from '../../backend/node_server/services/api'; // Your axios instance

// --- NEW IMPORT ---
import DateTimePickerModal from "react-native-modal-datetime-picker";

// --- THEME, STYLES, and INTERFACES ---
const PrimaryColor = '#63b0a3';
// ... (rest of your styles and interfaces)
const BackgroundColor = '#f0f4f7';
const CardColor = '#ffffff';
const TextColor = '#333333';
const SubtextColor = '#666666';

const styles = StyleSheet.create({
  // ... (Paste your original styles here)
  container: { flex: 1, backgroundColor: BackgroundColor },
  header: {
    backgroundColor: PrimaryColor, paddingVertical: 40, paddingHorizontal: 20,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    marginBottom: 20, elevation: 5, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: CardColor, marginTop: 20 },
  sectionTitle: {
    fontSize: 20, fontWeight: '600', color: TextColor,
    paddingHorizontal: 20, marginBottom: 10,
  },
  card: {
    backgroundColor: CardColor, borderRadius: 12, padding: 15,
    marginHorizontal: 20, marginBottom: 15, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  button: {
    backgroundColor: PrimaryColor, padding: 12, borderRadius: 8,
    alignItems: 'center', marginTop: 10,
  },
  buttonDisabled: { backgroundColor: '#a0c0b8' },
  buttonText: { color: CardColor, fontWeight: 'bold', fontSize: 16 },
  tabBar: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 20,
    backgroundColor: CardColor, borderRadius: 10, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  tabButton: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 3, borderColor: 'transparent',
  },
  activeTab: { borderColor: PrimaryColor },
  tabText: { fontSize: 16, fontWeight: '600', color: SubtextColor },
  activeTabText: { color: PrimaryColor },
  loader: { marginTop: 40 },
  emptyText: { textAlign: 'center', color: SubtextColor, marginTop: 20, fontSize: 16 },
  
  // --- NEW STYLES for Date/Time ---
  datePickerButton: {
    backgroundColor: '#f0f4f7', padding: 12, borderRadius: 8,
    alignItems: 'center', marginVertical: 10,
  },
  datePickerText: { color: TextColor, fontWeight: '600' },
  timeSlotContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  timeSlot: {
    width: '30%', backgroundColor: '#f0f4f7', padding: 10,
    borderRadius: 8, alignItems: 'center', marginVertical: 5,
  },
  selectedTimeSlot: {
    backgroundColor: PrimaryColor,
    borderColor: PrimaryColor,
  },
  timeSlotText: { color: TextColor, fontWeight: '600' },
  selectedTimeSlotText: { color: CardColor },
});

interface Doctor { _id: string; name: string; specialty: string; rating: number; }
interface Appointment {
  _id: string; doctorId: string; doctorName: string; specialty: string;
  appointmentTime: string; status: 'upcoming' | 'completed' | 'cancelled';
}

// --- MOCK TIME SLOTS (Backend doesn't provide this) ---
const MOCK_TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM",
  "02:30 PM", "03:00 PM", "03:30 PM",
];

// --- COMPONENTS (AppointmentCard, DoctorCard) ---
// (These are unchanged)
const AppointmentCard: React.FC<{ appointment: Appointment, onCancel: (id: string) => void }> = ({ appointment, onCancel }) => {
  const getStatusStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'upcoming': return { color: PrimaryColor, borderColor: PrimaryColor };
      case 'completed': return { color: '#4CAF50', borderColor: '#4CAF50' };
      case 'cancelled': return { color: '#F44336', borderColor: '#F44336' };
      default: return { color: SubtextColor, borderColor: SubtextColor };
    }
  };
  const statusStyles = getStatusStyle(appointment.status);
  const date = new Date(appointment.appointmentTime);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: TextColor }}>{appointment.doctorName}</Text>
          <Text style={{ fontSize: 14, color: SubtextColor, marginBottom: 5 }}>{appointment.specialty}</Text>
        </View>
        <View style={{
          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
          borderWidth: 1, ...(statusStyles as any),
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', ...(statusStyles as any) }}>
            {appointment.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: BackgroundColor, marginTop: 10, paddingTop: 10 }}>
        <Text style={{ fontSize: 14, color: SubtextColor }}>
          Date: <Text style={{ fontWeight: '600', color: TextColor }}>{formattedDate}</Text>
        </Text>
        <Text style={{ fontSize: 14, color: SubtextColor }}>
          Time: <Text style={{ fontWeight: '600', color: TextColor }}>{formattedTime}</Text>
        </Text>
      </View>
      {appointment.status === 'upcoming' && (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#F44336', marginTop: 10 }]} 
          onPress={() => onCancel(appointment._id)}
        >
          <Text style={styles.buttonText}>Cancel Appointment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
const DoctorCard: React.FC<{ doctor: Doctor; onSelect: (doc: Doctor) => void }> = ({ doctor, onSelect }) => (
  <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: PrimaryColor + '10',
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
      }}>
        <Text style={{ fontSize: 24 }}>👨‍⚕</Text>
      </View>
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: TextColor }}>{doctor.name}</Text>
        <Text style={{ fontSize: 14, color: SubtextColor }}>{doctor.specialty}</Text>
        <Text style={{ fontSize: 12, color: PrimaryColor, fontWeight: '600' }}>
          <Text style={{ color: '#FFC107' }}>★</Text> {doctor.rating} Rating
        </Text>
      </View>
    </View>
    <TouchableOpacity style={[styles.button, { paddingVertical: 8, paddingHorizontal: 15, width: 100 }]} onPress={() => onSelect(doctor)}>
      <Text style={styles.buttonText}>Book</Text>
    </TouchableOpacity>
  </View>
);
// --- (End of components) ---

/**
 * Main Appointment Screen Component
 */
export default function AppointmentScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'view' | 'book'>('view');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // --- NEW STATE for Date/Time ---
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // --- (Data Fetching is unchanged) ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [appResponse, docResponse] = await Promise.all([
        api.get('/appointments'), api.get('/doctors')
      ]);
      setAppointments(appResponse.data.appointments || []);
      setDoctors(docResponse.data.doctors || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        Alert.alert("Session expired", "Please log in again.");
        router.replace('/(auth)/login');
      } else {
        Alert.alert("Error", "Could not load appointment data.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  useFocusEffect(useCallback(() => { fetchData(); }, []));

  
  // --- UPDATED ACTIONS ---
  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsBooking(true);
    setSelectedDate(null); // Reset date/time on new selection
    setSelectedTime(null);
  };
  
  // --- NEW ACTIONS for Date/Time ---
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  
  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
    hideDatePicker();
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
  };
  
  // --- UPDATED Booking Function ---
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      Alert.alert("Missing Details", "Please select a date and time slot.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // 1. Parse the time string (e.g., "09:30 AM")
      const [time, modifier] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0; // Midnight case
      
      // 2. Combine selected date and time
      const finalAppointmentTime = new Date(selectedDate);
      finalAppointmentTime.setHours(hours, minutes, 0, 0); // Set H, M, S, MS

      // 3. Send to backend
      await api.post('/appointments', {
        doctorId: selectedDoctor._id,
        appointmentTime: finalAppointmentTime.toISOString(), // Send as ISO string
      });

      Alert.alert("Success!", `Appointment booked with ${selectedDoctor.name}.`);
      
      setIsBooking(false);
      setSelectedDoctor(null);
      setActiveTab('view');
      fetchData(); // Refresh all data

    } catch (error) {
      console.error("Error booking appointment:", error);
      const message = axios.isAxiosError(error) 
        ? error.response?.data.message 
        : "An unknown error occurred.";
      Alert.alert("Booking Failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- (Cancel Appointment is unchanged) ---
  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert("Confirm Cancellation", "Are you sure?",
      [ { text: "No", style: "cancel" },
        { text: "Yes, Cancel", style: "destructive", 
          onPress: async () => {
            try {
              await api.put(`/appointments/${appointmentId}/cancel`);
              Alert.alert("Success", "Appointment cancelled.");
              fetchData();
            } catch (error) {
              const message = axios.isAxiosError(error) ? error.response?.data.message : "Could not cancel appointment.";
              Alert.alert("Error", message);
            }
          }
        }
      ]
    );
  };

  // --- RENDER FUNCTIONS ---
  // (renderUpcomingAppointments is unchanged)
  const renderUpcomingAppointments = () => { /* ... (paste your existing function here) ... */
    if (isLoading) return <ActivityIndicator size="large" color={PrimaryColor} style={styles.loader} />;
    const sortedAppointments = appointments.slice().sort((a, b) => {
        if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
        if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
        return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
      });
    return (
      <View>
        {sortedAppointments.length > 0 ? (
          sortedAppointments.map((app) => (
            <AppointmentCard key={app._id} appointment={app} onCancel={handleCancelAppointment} />
          ))
        ) : ( <Text style={styles.emptyText}>No appointments yet!</Text> )}
      </View>
    );
  };
  
  // --- UPDATED Render Function for Booking ---
  const renderDoctorSelection = () => {
    if (isLoading) return <ActivityIndicator size="large" color={PrimaryColor} style={styles.loader} />;

    // --- NEW Booking Form ---
    if (isBooking && selectedDoctor) {
      return (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>Book with {selectedDoctor.name}</Text>
          <View style={styles.card}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: TextColor, marginBottom: 10 }}>
              Specialty: {selectedDoctor.specialty}
            </Text>
            
            {/* 1. Date Picker */}
            <TouchableOpacity style={styles.datePickerButton} onPress={showDatePicker}>
              <Text style={styles.datePickerText}>
                {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: '2-digit' }) : "Select a Date"}
              </Text>
            </TouchableOpacity>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleDateConfirm}
              onCancel={hideDatePicker}
              minimumDate={new Date()} // Can't book in the past
            />

            {/* 2. Time Slots (conditionally rendered) */}
            {selectedDate && (
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: TextColor, marginVertical: 10 }}>
                  Select a Time Slot
                </Text>
                <View style={styles.timeSlotContainer}>
                  {MOCK_TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeSlot,
                        selectedTime === time && styles.selectedTimeSlot,
                      ]}
                      onPress={() => handleSelectTime(time)}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        selectedTime === time && styles.selectedTimeSlotText,
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 3. Confirm Button */}
            <TouchableOpacity
              style={[styles.button, (!selectedDate || !selectedTime || isSubmitting) && styles.buttonDisabled]}
              onPress={handleBookAppointment}
              disabled={!selectedDate || !selectedTime || isSubmitting}
            >
              {isSubmitting ? 
                <ActivityIndicator color={CardColor} /> : 
                <Text style={styles.buttonText}>Confirm Booking</Text>
              }
            </TouchableOpacity>

            {/* 4. Cancel Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: SubtextColor, marginTop: 10 }]}
              onPress={() => setIsBooking(false)}
            >
              <Text style={styles.buttonText}>Change Doctor / Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    // --- (End of new booking form) ---

    // Doctor List View (unchanged)
    return (
      <View>
        {doctors.length > 0 ? (
          doctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} onSelect={handleSelectDoctor} />
          ))
        ) : (
          <Text style={styles.emptyText}>No doctors available at this time.</Text>
        )}
      </View>
    );
  };

  // --- FINAL RENDER (Unchanged) ---
  return (
    <View style={styles.container}>
      {/* ... (Header and Tab Bar JSX are unchanged) ... */}
      <View style={styles.header}><Text style={styles.headerTitle}>Appointments</Text></View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'view' && styles.activeTab]}
          onPress={() => { setActiveTab('view'); setIsBooking(false); }}
        >
          <Text style={[styles.tabText, activeTab === 'view' && styles.activeTabText]}>
            My Bookings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'book' && styles.activeTab]}
          onPress={() => setActiveTab('book')}
        >
          <Text style={[styles.tabText, activeTab === 'book' && styles.activeTabText]}>
            Book New
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {activeTab === 'view' ? renderUpcomingAppointments() : renderDoctorSelection()}
      </ScrollView>
    </View>
  );
}