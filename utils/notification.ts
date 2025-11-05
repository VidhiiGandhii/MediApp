import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
// --- 1. IMPORT THE TRIGGER TYPES ---
import { SchedulableTriggerInputTypes } from 'expo-notifications';

// ... (setNotificationHandler is unchanged)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

// ... (Interface is unchanged)
export interface MedicationData {
  _id: string; 
  medicineName: string;
  dosage: string;
  times: { hour: number; minute: number }[];
  instructions?: string;
}

export class NotificationService {
  
  // ... (requestPermissions is unchanged)
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return false;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return false;
    }
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#63b0a3ff',
      });
    }
    return true;
  }

  static async scheduleMedicationReminders(med: MedicationData): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      await this.cancelMedicationReminders(med._id);

      for (const [index, time] of med.times.entries()) {
        const identifier = `${med._id}_${index}`;
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💊 Medication Reminder',
            body: `It's time to take your ${med.medicineName} (${med.dosage})`,
            sound: 'default',
            data: {
              type: 'medication_reminder',
              medicationId: med._id,
            }
          },
          trigger: {
            hour: time.hour,
            minute: time.minute,
            repeats: true,
            // --- 2. THIS IS THE FIX for the "daily" error ---
            type: SchedulableTriggerInputTypes.CALENDAR,
          },
          identifier: identifier,
        });
      }
      console.log(`Successfully scheduled reminders for ${med.medicineName}`);
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  // ... (cancelMedicationReminders is unchanged)
  static async cancelMedicationReminders(medicationId: string): Promise<void> {
    try {
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of allScheduled) {
        if (notification.identifier.startsWith(medicationId)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
      console.log(`Cancelled existing reminders for ${medicationId}`);
    } catch (error) {
      console.error("Error cancelling notifications:", error);
    }
  }
  
  static async scheduleRefillReminder(medicationName: string, stock: number): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Medication Refill Reminder',
          body: `You're running low on ${medicationName}. You have ${stock} doses left.`,
          data: { type: 'refill_reminder', medicationName },
        },
        trigger: {
          seconds: 5, // Show 5 seconds from now
          // --- 3. THIS IS THE FIX for the "seconds" error ---
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });
    } catch (error) {
      console.error('Error scheduling refill reminder:', error);
    }
  }

  // ... (addNotificationResponseListener is unchanged)
  static addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}