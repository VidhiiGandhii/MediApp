// FILE: medicineReminder/calendar/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { JSX, useCallback, useMemo, useState } from "react";
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
import { Calendar } from 'react-native-calendars'; // Import calendar
import api from "../../../services/api"; // Your axios instance

// --- UPDATED: Added new interface ---
interface Medication {
  _id: string;
  medicineName: string;
  dosage: string;
  times: { hour: number, minute: number }[];
  frequency: string; // We need this now
  startDate: string; // And this
  endDate?: string; // And this
}
interface HistoryItem {
  _id: string;
  medicationId: {
    _id: string;
    medicineName: string;
    dosage: string;
  };
  status: 'taken' | 'skipped' | 'missed' | 'pending';
  scheduledTime: string;
}
interface ScheduledDose {
  medication: {
    _id: string;
    medicineName: string;
    dosage: string;
  };
  scheduledTime: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  historyId?: string;
}

type MarkedDates = {
  [date: string]: {
    dots?: { key: string; color: string }[];
    selected?: boolean;
    selectedColor?: string;
    marked?: boolean; // For future dates
    dotColor?: string; // For future dates
  };
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Helper function to get dates ---
const getDatesInRange = (startDate: Date, endDate: Date) => {
  const dates = [];
  let currentDate = new Date(startDate.toISOString().split('T')[0]); // Normalize to start of day
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // --- UPDATED: We need all three sets of data ---
  const [allHistory, setAllHistory] = useState<HistoryItem[]>([]);
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduledDose[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      const userId = userDataString ? JSON.parse(userDataString).id : null;
      if (!userId) {
        router.replace("/(auth)/login");
        return;
      }

      // Fetch all three endpoints
      const [historyRes, todayRes, allMedsRes] = await Promise.all([
        api.get(`/medications/history/${userId}`),
        api.get(`/medications/today/${userId}`),
        api.get(`/medications/${userId}?active=true`) // <-- NEW
      ]);
      
      setAllHistory(historyRes.data.history || []);
      setTodaySchedule(todayRes.data.schedule || []);
      setActiveMeds(allMedsRes.data.medications || []); // <-- NEW
    } catch (error) {
      console.error("Error loading calendar data:", error);
      Alert.alert("Error", "Could not load calendar data.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // --- UPDATED: This function now marks history AND future doses ---
  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};
    const futureDotColor = '#63b0a3ff'; // Teal for future
    const takenDotColor = '#4CAF50';
    const missedDotColor = '#F44336';

    // 1. Mark past history
    allHistory.forEach((item) => {
      const dateStr = item.scheduledTime.split('T')[0];
      if (!marks[dateStr]) marks[dateStr] = { dots: [] };
      
      let color = missedDotColor;
      if (item.status === 'taken') color = takenDotColor;
      
      if (!marks[dateStr].dots?.find(d => d.color === color)) {
        marks[dateStr].dots?.push({ key: item._id, color });
      }
    });

    // 2. Mark future schedules
    const today = new Date();
    const futureEndDate = new Date();
    futureEndDate.setDate(today.getDate() + 30); // Mark 30 days into the future

    activeMeds.forEach(med => {
      if (med.frequency === 'As needed') return; // Don't mark 'As needed'
      
      const medStartDate = new Date(med.startDate);
      const medEndDate = med.endDate ? new Date(med.endDate) : futureEndDate;
      
      // Get all dates this med is active
      const activeDates = getDatesInRange(medStartDate, medEndDate);

      activeDates.forEach(date => {
        // Only mark dates that are in the future
        if (date >= today) { 
          const dateStr = date.toISOString().split('T')[0];
          if (!marks[dateStr]) {
            // This is a future, scheduled dose
            marks[dateStr] = { marked: true, dotColor: futureDotColor, dots: [] };
          }
        }
      });
    });

    // 3. Highlight the selected day
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    if (!marks[selectedDateStr]) {
      marks[selectedDateStr] = { dots: [] };
    }
    marks[selectedDateStr].selected = true;
    marks[selectedDateStr].selectedColor = '#63b0a3ff';

    return marks;
  }, [allHistory, activeMeds, selectedDate]);


  // --- (getDaysInMonth and renderCalendar are unchanged from your code) ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };
  const { days, firstDay } = getDaysInMonth(selectedDate);
  const renderCalendar = () => {
    const calendar: JSX.Element[] = [];
    let week: JSX.Element[] = [];
    for (let i = 0; i < firstDay; i++) {
      week.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    for (let day = 1; day <= days; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const dayMarks = markedDates[dateStr];
      week.push(
        <TouchableOpacity
          key={day}
          style={[ styles.calendarDay, isToday && styles.today, isSelected && styles.selectedDay ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[styles.dayText, isToday && styles.todayText, isSelected && styles.selectedDayText]}>
            {day}
          </Text>
          {dayMarks && ( // Show dots
            <View style={styles.eventDotContainer}>
              {dayMarks.dots?.slice(0, 3).map(dot => (
                <View key={dot.key} style={[styles.eventDot, {backgroundColor: dot.color}]} />
              ))}
              {dayMarks.marked && !dayMarks.dots?.length && ( // Show single dot for future
                 <View style={[styles.eventDot, {backgroundColor: dayMarks.dotColor}]} />
              )}
            </View>
          )}
        </TouchableOpacity>
      );
      if ((firstDay + day) % 7 === 0 || day === days) {
        calendar.push(<View key={day} style={styles.calendarWeek}>{week}</View>);
        week = [];
      }
    }
    return calendar;
  };

  // --- (handleLogIntake is unchanged) ---
  const handleLogIntake = async (item: ScheduledDose) => {
    if (item.status !== 'pending') return;
    try {
      const resp = await api.post('/medications/intake', {
        medicationId: item.medication._id,
        status: "taken",
        scheduledTime: item.scheduledTime,
      });
      Alert.alert("Success", "Marked as taken");
      if (resp?.data?.shouldRefill) {
        Alert.alert("Low Stock", `Only ${resp.data.remainingStock} units left — consider refilling.`);
      }
      loadData(); // Refresh all data
    } catch (error) {
      console.error("Error logging intake:", error);
      Alert.alert("Error", "Could not log intake.");
    }
  };

  // --- UPDATED: This now renders differently based on the date ---
  const renderMedicationsForDate = () => {
    const selectedDateStr = selectedDate.toDateString();
    const isToday = selectedDateStr === new Date().toDateString();

    // 1. If it's today, show the interactive schedule
    if (isToday) {
      if (isLoading) return <ActivityIndicator />;
      if (todaySchedule.length === 0) {
        return <Text style={styles.emptyScheduleText}>No medications scheduled for today.</Text>;
      }
      return todaySchedule.map((dose) => {
        const isCompleted = dose.status === 'taken';
        const isSkipped = dose.status === 'skipped';
        return (
          <View key={dose.medication._id + dose.scheduledTime} style={styles.medicationCard}>
            <View style={[ styles.medicationColor, { backgroundColor: isCompleted ? '#63b0a3ff' : (isSkipped ? '#F44336' : '#ccc') }]} />
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{dose.medication.medicineName}</Text>
              <Text style={styles.medicationDosage}>{dose.medication.dosage}</Text>
              <Text style={styles.medicationTime}>
                {new Date(dose.scheduledTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            {dose.status === 'pending' ? (
              <TouchableOpacity
                style={[ styles.takeDoseButton, { backgroundColor: "#63b0a3ff" } ]}
                onPress={() => handleLogIntake(dose)}
              >
                <Text style={styles.takeDoseText}>Take</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.takenBadge}>
                <Ionicons name={isCompleted ? "checkmark-circle" : "close-circle"} size={20} color={isCompleted ? "#63b0a3ff" : "#F44336"} />
                <Text style={[styles.takenText, {color: isCompleted ? "#63b0a3ff" : "#F44336"}]}>{dose.status}</Text>
              </View>
            )}
          </View>
        );
      });
    }

    // 2. If it's in the past, show history
    const historyForDay = allHistory.filter(h => new Date(h.scheduledTime).toDateString() === selectedDateStr);
    if (selectedDate < new Date() && historyForDay.length > 0) {
      return historyForDay.map((dose) => (
        <View key={dose._id} style={styles.medicationCard}>
          <View style={[ styles.medicationColor, { backgroundColor: dose.status === 'taken' ? '#63b0a3ff' : '#F44336' }]} />
          <View style={styles.medicationInfo}>
            <Text style={styles.medicationName}>{dose.medicationId?.medicineName || 'Unknown'}</Text>
            <Text style={styles.medicationDosage}>{dose.medicationId?.dosage || 'N/A'}</Text>
          </View>
          <View style={styles.takenBadge}>
            <Ionicons name={dose.status === 'taken' ? 'checkmark-circle' : 'close-circle'} size={20} color={dose.status === 'taken' ? '#63b0a3ff' : '#F44336'} />
            <Text style={[styles.takenText, {color: dose.status === 'taken' ? '#63b0a3ff' : '#F44336'}]}>{dose.status}</Text>
          </View>
        </View>
      ));
    }
    
    // 3. If it's in the future, show the planned schedule
    const futureSchedule = activeMeds.filter(med => {
      // This logic should be more robust, but for "Daily" it works
      return med.frequency === 'Daily' && 
             selectedDate >= new Date(med.startDate) &&
             (!med.endDate || selectedDate <= new Date(med.endDate));
    });

    if (futureSchedule.length > 0) {
       return futureSchedule.map(med => (
         med.times.map(time => (
          <View key={med._id + time.hour} style={[styles.medicationCard, {opacity: 0.7}]}>
            <View style={[ styles.medicationColor, { backgroundColor: '#ccc' }]} />
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{med.medicineName}</Text>
              <Text style={styles.medicationDosage}>{med.dosage}</Text>
            </View>
            <Text style={styles.medicationTime}>
              {String(time.hour).padStart(2, '0')}:{String(time.minute).padStart(2, '0')}
            </Text>
          </View>
         ))
       ));
    }

    // 4. Default empty state
    return <Text style={styles.emptyScheduleText}>No doses scheduled for this day.</Text>;
  };

  return (
    <View style={styles.container}>
      {/* ... (Header is unchanged) ... */}
      <LinearGradient colors={["#63b0a3ff", "#4b9185ff"]} style={styles.headerGradient} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#63b0a3ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendar</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#63b0a3" style={{marginTop: 40}} />
        ) : (
          <>
            {/* --- UPDATED: Using react-native-calendars --- */}
            <Calendar
              current={selectedDate.toISOString().split('T')[0]}
              onDayPress={day => setSelectedDate(new Date(day.timestamp))}
              markedDates={markedDates as any} // Cast as any to avoid type conflict
              markingType={'multi-dot'}
              theme={{
                selectedDayBackgroundColor: '#63b0a3ff',
                todayTextColor: '#63b0a3ff',
                arrowColor: '#63b0a3ff',
                dotColor: '#63b0a3ff', // For single 'marked'
              }}
            />
            {/* --- (Replaced your custom calendar) --- */}
            
            <View style={styles.scheduleContainer}>
              <Text style={styles.scheduleTitle}>
                {selectedDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderMedicationsForDate()}
              </ScrollView>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
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
  
  // Calendar-related styles (added to satisfy references)
  calendarWeek: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  calendarDay: {
    width: 40,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: "#333",
  },
  today: {
    borderColor: "#63b0a3ff",
    borderWidth: 1,
  },
  selectedDay: {
    backgroundColor: "#63b0a3ff",
  },
  todayText: {
    color: "#63b0a3ff",
    fontWeight: "700",
  },
  selectedDayText: {
    color: "white",
    fontWeight: "700",
  },
  eventDotContainer: {
    flexDirection: "row",
    marginTop: 6,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },

  // --- (Your old calendar styles are no longer needed) ---

  scheduleContainer: {
    flex: 1, backgroundColor: "white", borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 20, shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05,
    shadowRadius: 8, elevation: 2,
    marginTop: 20, // Added margin
  },
  scheduleTitle: {
    fontSize: 20, fontWeight: "700", color: "#333",
    marginBottom: 15,
  },
  medicationCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "white",
    borderRadius: 16, padding: 15, marginBottom: 12, borderWidth: 1,
    borderColor: "#e0e0e0", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  medicationColor: { width: 12, height: 40, borderRadius: 6, marginRight: 15 },
  medicationInfo: { flex: 1 },
  medicationName: {
    fontSize: 16, fontWeight: "600", color: "#333",
    marginBottom: 4,
  },
  medicationDosage: { fontSize: 14, color: "#666", marginBottom: 2 },
  medicationTime: { fontSize: 14, color: "#666" },
  takeDoseButton: {
    paddingVertical: 8, paddingHorizontal: 15,
    borderRadius: 12,
  },
  takeDoseText: { color: "white", fontWeight: "600", fontSize: 14 },
  takenBadge: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#E8F5E9",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
  },
  takenText: {
    color: "#63b0a3ff", fontWeight: "600", fontSize: 14,
    marginLeft: 4, textTransform: 'capitalize',
  },
  emptyScheduleText: {
    textAlign: 'center', fontSize: 16, color: '#888',
    marginTop: 20,
  }
});