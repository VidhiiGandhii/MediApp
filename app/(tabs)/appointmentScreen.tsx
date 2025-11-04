import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router'; // Assuming you use expo-router
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../../config/api'; // Import your API_URL

// --- THEME AND STYLES ---
// (Your styles are unchanged, I'm omitting them for brevity. Paste them back in.)
const PrimaryColor = '#63b0a3';
const BackgroundColor = '#f0f4f7';
const CardColor = '#ffffff';
const TextColor = '#333333';
const SubtextColor = '#666666';

const styles = StyleSheet.create({
  // ... (Paste your original styles here)
  container: {
    flex: 1,
    backgroundColor: BackgroundColor,
  },
  header: {
    backgroundColor: PrimaryColor,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: CardColor,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: TextColor,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: CardColor,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  button: {
    backgroundColor: PrimaryColor,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a0c0b8',
  },
  buttonText: {
    color: CardColor,
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: CardColor,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: PrimaryColor,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: SubtextColor,
  },
  activeTabText: {
    color: PrimaryColor,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: SubtextColor,
    marginTop: 20,
    fontSize: 16,
  },
});
// --- (End of styles) ---


// --- REAL DATA TYPES (matching backend) ---

interface Doctor {
  _id: string; // Changed from id
  name: string;
  specialty: string;
  rating: number;
}

interface Appointment {
  _id: string; // Changed from id
  doctorId: string;
  doctorName: string;
  specialty: string;
  appointmentTime: string; // This will be an ISO Date string from backend
  status: 'upcoming' | 'completed' | 'cancelled';
}

// --- COMPONENTS ---

const AppointmentCard: React.FC<{ 
  appointment: Appointment, 
  onCancel: (id: string) => void 
}> = ({ appointment, onCancel }) => {
  // ... (Your getStatusStyle function is unchanged)
  const getStatusStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'upcoming': return { color: PrimaryColor, borderColor: PrimaryColor };
      case 'completed': return { color: '#4CAF50', borderColor: '#4CAF50' };
      case 'cancelled': return { color: '#F44336', borderColor: '#F44336' };
      default: return { color: SubtextColor, borderColor: SubtextColor };
    }
  };

  const statusStyles = getStatusStyle(appointment.status);
  
  // Format the date from the backend
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
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 6,
          borderWidth: 1,
          ...(statusStyles as any),
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
      
      {/* NEW: Cancel Button */}
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
  // ... (This component is largely unchanged, just uses `_id` for the key)
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


/**
 * Main Appointment Screen Component
 */
export default function AppointmentScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activeTab, setActiveTab] = useState<'view' | 'book'>('view');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false); // For modal/form
  const [isSubmitting, setIsSubmitting] = useState(false); // For booking loading
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // --- DATA FETCHING ---
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert("Session expired", "Please log in again.");
        router.replace('/(auth)/login');
        return;
      }
      
      // Fetch both appointments and doctors in parallel
      const [appResponse, docResponse] = await Promise.all([
        fetch(`${API_URL}/api/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/doctors`) // This is a public route
      ]);

      if (!appResponse.ok) throw new Error('Failed to fetch appointments');
      if (!docResponse.ok) throw new Error('Failed to fetch doctors');

      const appData = await appResponse.json();
      const docData = await docResponse.json();

      setAppointments(appData.appointments || []);
      setDoctors(docData.doctors || []);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Could not load appointment data.");
    } finally {
      setIsLoading(false);
    }
  };

  // useFocusEffect re-fetches data every time the screen is viewed
  useFocusEffect(useCallback(() => { fetchData(); }, []));

  // --- ACTIONS ---

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsBooking(true);
  };

  const handleBookAppointment = async (date: string, time: string) => {
    if (!selectedDoctor) return;
    
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Combine date and time into a real Date object
      // This is a mock date, you MUST replace this with a real DateTimePicker
      const mockAppointmentTime = new Date('2025-10-31T09:30:00');

      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          appointmentTime: mockAppointmentTime.toISOString(), // Send as ISO string
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Booking failed");
      }

      Alert.alert("Success!", `Appointment booked with ${selectedDoctor.name}.`);
      
      // Reset state and switch back to view tab
      setIsBooking(false);
      setSelectedDoctor(null);
      setActiveTab('view');
      fetchData(); // Refresh all data

    } catch (error) {
      console.error("Error booking appointment:", error);
      Alert.alert("Booking Failed", error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const response = await fetch(`${API_URL}/api/appointments/${appointmentId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (!response.ok) throw new Error('Failed to cancel');
              
              Alert.alert("Success", "Appointment cancelled.");
              fetchData(); // Refresh data
            } catch (error) {
              Alert.alert("Error", "Could not cancel appointment.");
            }
          }
        }
      ]
    );
  };

  // --- RENDER FUNCTIONS ---

  const renderUpcomingAppointments = () => {
    if (isLoading) return <ActivityIndicator size="large" color={PrimaryColor} style={styles.loader} />;
    
    const sortedAppointments = appointments
      .slice()
      .sort((a, b) => {
        if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
        if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
        // Sort by date
        return new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime();
      });

    return (
      <View>
        {sortedAppointments.length > 0 ? (
          sortedAppointments.map((app) => (
            <AppointmentCard 
              key={app._id} 
              appointment={app} 
              onCancel={handleCancelAppointment} 
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No appointments yet!</Text>
        )}
      </View>
    );
  };

  const renderDoctorSelection = () => {
    if (isLoading) return <ActivityIndicator size="large" color={PrimaryColor} style={styles.loader} />;

    if (isBooking && selectedDoctor) {
      // Simple Mock Booking Confirmation View
      // YOU MUST REPLACE THIS with a real Date/Time Picker
      return (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>Confirm with {selectedDoctor.name}</Text>
          <View style={styles.card}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: TextColor }}>Appointment Details</Text>
            <Text style={{ color: SubtextColor, marginVertical: 10 }}>
              Specialty: {selectedDoctor.specialty}
            </Text>
            <Text style={{ fontWeight: 'bold', marginTop: 10, color: TextColor }}>Preferred Date: Oct 31, 2025</Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 15, color: TextColor }}>Preferred Time: 09:30 AM</Text>

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={() => handleBookAppointment('Oct 31, 2025', '09:30 AM')}
              disabled={isSubmitting}
            >
              {isSubmitting ? 
                <ActivityIndicator color={CardColor} /> : 
                <Text style={styles.buttonText}>Confirm Booking</Text>
              }
            </TouchableOpacity>
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

    // Doctor List View
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'view' && styles.activeTab]}
          onPress={() => {
            setActiveTab('view');
            setIsBooking(false);
          }}
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