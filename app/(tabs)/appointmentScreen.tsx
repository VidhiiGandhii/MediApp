// screens/AppointmentsScreen.tsx
// This file is designed for a React Native environment and uses native components.
// It features a clean, card-based design matching the provided image's aesthetic
// (using a primary teal color and subtle shadows) and includes sections for
// viewing upcoming appointments and booking new ones.

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- THEME AND STYLES ---

const PrimaryColor = '#63b0a3'; // Teal color, derived from your doctor list design
const BackgroundColor = '#f0f4f7'; // Light, clean background
const CardColor = '#ffffff';
const TextColor = '#333333';
const SubtextColor = '#666666';

const styles = StyleSheet.create({
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
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
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
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
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
  buttonText: {
    color: CardColor,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Tab Bar Styles for clean navigation
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
});

// --- MOCK DATA TYPES ---

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled'; // For color coding
}

const MOCK_DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Rishi', specialty: 'Cardiologist', rating: 4.8 },
  { id: 'd2', name: 'Dr. Vaamana', specialty: 'Dentist', rating: 4.7 },
  { id: 'd3', name: 'Dr. Nallarasu', specialty: 'Orthopaedic', rating: 4.9 },
  { id: 'd4', name: 'Dr. Nihal', specialty: 'Neurologist', rating: 4.6 },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    doctorId: 'd1',
    doctorName: 'Dr. Rishi',
    specialty: 'Cardiologist',
    date: 'Oct 30, 2025',
    time: '10:00 AM',
    status: 'upcoming',
  },
  {
    id: 'a2',
    doctorId: 'd3',
    doctorName: 'Dr. Nallarasu',
    specialty: 'Orthopaedic',
    date: 'Oct 22, 2025',
    time: '02:30 PM',
    status: 'completed',
  },
  {
    id: 'a3',
    doctorId: 'd2',
    doctorName: 'Dr. Vaamana',
    specialty: 'Dentist',
    date: 'Nov 05, 2025',
    time: '11:00 AM',
    status: 'cancelled',
  },
];

// --- COMPONENTS ---

/**
 * Renders a card for a booked/upcoming appointment, color-coded by status.
 */
const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  const getStatusStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'upcoming':
        return { color: PrimaryColor, borderColor: PrimaryColor };
      case 'completed':
        return { color: '#4CAF50', borderColor: '#4CAF50' }; // Green for completed
      case 'cancelled':
        return { color: '#F44336', borderColor: '#F44336' }; // Red for cancelled
      default:
        return { color: SubtextColor, borderColor: SubtextColor };
    }
  };

  const statusStyles = getStatusStyle(appointment.status);

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
          ...statusStyles as any,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', ...statusStyles as any }}>
            {appointment.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={{ borderTopWidth: 1, borderTopColor: BackgroundColor, marginTop: 10, paddingTop: 10 }}>
        <Text style={{ fontSize: 14, color: SubtextColor }}>
          Date: <Text style={{ fontWeight: '600', color: TextColor }}>{appointment.date}</Text>
        </Text>
        <Text style={{ fontSize: 14, color: SubtextColor }}>
          Time: <Text style={{ fontWeight: '600', color: TextColor }}>{appointment.time}</Text>
        </Text>
      </View>
    </View>
  );
};

/**
 * Renders a doctor card for selection, matching the visual style of your list.
 */
const DoctorCard: React.FC<{ doctor: Doctor; onSelect: (doc: Doctor) => void }> = ({ doctor, onSelect }) => (
  <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {/* Mock Profile Image Placeholder */}
      <View style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: PrimaryColor + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
      }}>
        <Text style={{ fontSize: 24 }}>👨‍⚕</Text>
      </View>
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: TextColor }}>{doctor.name}</Text>
        <Text style={{ fontSize: 14, color: SubtextColor }}>{doctor.specialty}</Text>
        <Text style={{ fontSize: 12, color: PrimaryColor, fontWeight: '600' }}>
            {/* Using a star icon to mimic the rating display */}
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
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [activeTab, setActiveTab] = useState<'view' | 'book'>('view');
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsBooking(true);
  };

  // Simulated booking function
  const handleBookAppointment = (date: string, time: string) => {
    if (selectedDoctor) {
      const newAppointment: Appointment = {
        id: `a${appointments.length + 1}`,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        date,
        time,
        status: 'upcoming', // New bookings are always 'upcoming'
      };
      setAppointments([...appointments, newAppointment]);
      setIsBooking(false);
      setSelectedDoctor(null);
      setActiveTab('view'); // Switch back to view appointments after booking
    }
  };

  const renderUpcomingAppointments = () => {
      // Filter and sort to show upcoming appointments first for better visibility
      const sortedAppointments = appointments
        .slice() // Create a copy to avoid modifying state directly during sort
        .sort((a, b) => {
          if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
          if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
          return 0;
        });

      return (
        <View>
          {sortedAppointments.map((app) => (
            <AppointmentCard key={app.id} appointment={app} />
          ))}
          {appointments.length === 0 && (
            <Text style={{ textAlign: 'center', color: SubtextColor, marginTop: 20 }}>No appointments yet!</Text>
          )}
        </View>
      );
  }

  const renderDoctorSelection = () => {
    if (isBooking && selectedDoctor) {
      // Simple Mock Booking Confirmation View
      return (
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={styles.sectionTitle}>Confirm with {selectedDoctor.name}</Text>
          <View style={styles.card}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: TextColor }}>Appointment Details</Text>
            <Text style={{ color: SubtextColor, marginVertical: 10 }}>
              Specialty: {selectedDoctor.specialty}
            </Text>
            {/* Mock Date/Time Selection for simplicity */}
            <Text style={{ fontWeight: 'bold', marginTop: 10, color: TextColor }}>Preferred Date: Oct 31, 2025</Text>
            <Text style={{ fontWeight: 'bold', marginBottom: 15, color: TextColor }}>Preferred Time: 09:30 AM</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => handleBookAppointment('Oct 31, 2025', '09:30 AM')}
            >
              <Text style={styles.buttonText}>Confirm Booking</Text>
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

    // Doctor List View (when in the 'Book New' tab)
    return (
      <View>
        {MOCK_DOCTORS.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} onSelect={handleSelectDoctor} />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appointments</Text>
      </View>

      {/* Tab Bar for Switching Views */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'view' && styles.activeTab]}
          onPress={() => {
            setActiveTab('view');
            setIsBooking(false); // Reset booking flow when switching tabs
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