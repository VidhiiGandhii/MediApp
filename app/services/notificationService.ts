// services/notificationService.ts
// Install: npx expo install expo-notifications expo-device

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  // Request notification permissions
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

    return true;
  }

  // Schedule a medication reminder
  static async scheduleMedicationReminder(
    medicationId: string,
    medicationName: string,
    dosage: string,
    hour: number,
    minute: number,
    instructions?: string
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Create trigger for daily notification at specific time
      const trigger: Notifications.DailyTriggerInput = {
        hour,
        minute,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Time to take your medication!',
          body: `${medicationName} - ${dosage}${instructions ? `\n${instructions}` : ''}`,
          data: {
            medicationId,
            type: 'medication_reminder',
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });

      console.log(`Scheduled notification ${notificationId} for ${medicationName} at ${hour}:${minute}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule multiple reminders for a medication
  static async scheduleMedicationReminders(
    medicationId: string,
    medicationName: string,
    dosage: string,
    times: { hour: number; minute: number }[],
    instructions?: string
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const time of times) {
      const id = await this.scheduleMedicationReminder(
        medicationId,
        medicationName,
        dosage,
        time.hour,
        time.minute,
        instructions
      );
      if (id) {
        notificationIds.push(id);
      }
    }

    return notificationIds;
  }

  // Cancel a specific notification
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification ${notificationId}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Cancel all notifications for a medication
  static async cancelMedicationNotifications(notificationIds: string[]): Promise<void> {
    for (const id of notificationIds) {
      await this.cancelNotification(id);
    }
  }

  // Cancel all scheduled notifications
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Get all scheduled notifications
  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Schedule a refill reminder
  static async scheduleRefillReminder(
    medicationName: string,
    daysUntilRefill: number
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const trigger: Notifications.TimeIntervalTriggerInput = {
        seconds: daysUntilRefill * 24 * 60 * 60, // Convert days to seconds
        repeats: false,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Medication Refill Reminder',
          body: `Time to refill ${medicationName}. You're running low!`,
          data: {
            type: 'refill_reminder',
            medicationName,
          },
          sound: true,
        },
        trigger,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling refill reminder:', error);
      return null;
    }
  }

  // Add notification response listener
  static addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Add notification received listener
  static addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

// Helper function to format time for notifications
export const getNextNotificationTime = (hour: number, minute: number): Date => {
  const now = new Date();
  const notificationTime = new Date();
  notificationTime.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (notificationTime <= now) {
    notificationTime.setDate(notificationTime.getDate() + 1);
  }

  return notificationTime;
};

// Calculate time until next notification
export const getTimeUntilNotification = (hour: number, minute: number): string => {
  const now = new Date();
  const nextTime = getNextNotificationTime(hour, minute);
  const diff = nextTime.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else {
    return `in ${minutes}m`;
  }
};