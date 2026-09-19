import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { parseTime } from '../utils/time';

/**
 * Local notifications for the daily prayer reminder.
 *
 * Only ever schedules a single repeating reminder; it is tagged in the
 * notification content's `data` so we can find and cancel the previous one
 * before scheduling a new time. Reliable scheduling requires a dev/standalone
 * build — local notification scheduling is limited in Expo Go on SDK 53+.
 */

const PRAYER_REMINDER_TAG = 'prayer-reminder';
const ANDROID_CHANNEL_ID = 'prayer-reminders';

// Show an alert + play a sound when a notification fires while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Prayer Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Request notification permissions, returning whether they were granted. */
export async function ensurePermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Cancel any previously-scheduled prayer reminder. */
export async function cancelPrayerReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.tag === PRAYER_REMINDER_TAG)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/**
 * Schedule (or reschedule) the daily prayer reminder at `time` ("HH:MM").
 * Cancels the existing reminder first so only one is ever active.
 */
export async function scheduleDailyPrayerReminder(time: string): Promise<void> {
  await ensureAndroidChannel();
  await cancelPrayerReminder();

  const { hour, minute } = parseTime(time);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to pray 🙏',
      body: 'Take a moment for your daily prayer.',
      data: { tag: PRAYER_REMINDER_TAG },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });
}
