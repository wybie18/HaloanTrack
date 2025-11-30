import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

const SCHEDULES_STORAGE_KEY = 'offline_schedules';
const PONDS_STORAGE_KEY = 'offline_ponds';

interface Schedule {
  id: number;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time_of_day: string; // "HH:mm:ss"
  base_offset_days: number;
  interval: number; // e.g. 1 for every month, 3 for every 3 months
  is_active: boolean;
}

interface Pond {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  registered_at: string;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const setupNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Pond Alarms',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 1000, 500, 1000],
      lightColor: '#FF231F7C',
      sound: 'default',
      audioAttributes: {
        usage: Notifications.AndroidAudioUsage.ALARM,
        contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      },
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
};

export const syncOfflineNotifications = async () => {
  console.log('[Scheduler] Starting sync...');
  
  const hasPermission = await setupNotifications();
  if (!hasPermission) {
    console.log('[Scheduler] Sync aborted: No permissions');
    return;
  }

  try {
    let schedules: Schedule[] = [];
    let ponds: Pond[] = [];

    // 1. Fetch Data
    try {
      const [schedulesRes, pondsRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/ponds')
      ]);
      
      schedules = schedulesRes.data;
      ponds = pondsRes.data;

      await AsyncStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
      await AsyncStorage.setItem(PONDS_STORAGE_KEY, JSON.stringify(ponds));
      console.log('[Scheduler] Fetched and stored data from API');
    } catch (networkError) {
      console.log('[Scheduler] Network failed, loading from storage');
      const storedSchedules = await AsyncStorage.getItem(SCHEDULES_STORAGE_KEY);
      const storedPonds = await AsyncStorage.getItem(PONDS_STORAGE_KEY);

      if (storedSchedules) schedules = JSON.parse(storedSchedules);
      if (storedPonds) ponds = JSON.parse(storedPonds);
    }

    if (schedules.length === 0 || ponds.length === 0) {
      console.log('[Scheduler] No data to schedule');
      return;
    }

    // Filter only active ponds
    const activePonds = ponds.filter(p => p.status === 'active');
    if (activePonds.length === 0) {
      console.log('[Scheduler] No active ponds, skipping.');
      return;
    }

    // 2. Cancel existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Scheduler] Cancelled existing notifications');

    // ==========================================
    // GROUP A: HANDLE DAILY SCHEDULES (General)
    // ==========================================
    const dailySchedules = schedules.filter(s => s.is_active && s.frequency === 'daily');
    
    for (const schedule of dailySchedules) {
      // Create ONE notification per daily schedule, regardless of how many ponds
      const [hourStr, minuteStr] = schedule.time_of_day.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      console.log(`[Scheduler] Scheduling Daily "${schedule.name}" (General)`);

      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: schedule.name,
            body: `It's time for ${schedule.name}`,
            data: { scheduleId: schedule.id, type: 'daily_general' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hour,
            minute: minute,
          },
        });
      } catch (e) {
        console.error(`[Scheduler] Failed daily schedule: ${e}`);
      }
    }

    // ==========================================
    // GROUP B: HANDLE WEEKLY/MONTHLY (Specific)
    // ==========================================
    // These depend on the specific pond registration date, so they must stay separate.
    const otherSchedules = schedules.filter(s => s.is_active && s.frequency !== 'daily');

    for (const pond of activePonds) {
      for (const schedule of otherSchedules) {
        
        const triggers = calculateTriggers(schedule, pond);
        
        if (!triggers || triggers.length === 0) continue;

        console.log(`[Scheduler] Scheduling "${schedule.name}" for pond "${pond.name}"`);

        for (const trigger of triggers) {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: schedule.name,
                body: `${schedule.name} for ${pond.name}`,
                data: { pondId: pond.id, scheduleId: schedule.id, type: 'specific' },
                sound: true,
              },
              trigger: trigger as any,
            });
          } catch (scheduleError) {
            console.error(`[Scheduler] Failed to schedule specific:`, scheduleError);
          }
        }
      }
    }
    console.log('[Scheduler] Sync complete');

  } catch (error) {
    console.error('[Scheduler] Error syncing notifications:', error);
  }
};

// Calculate triggers for NON-DAILY schedules
const calculateTriggers = (schedule: Schedule, pond: Pond): any[] => {
  try {
    const [hourStr, minuteStr] = schedule.time_of_day.split(':');
    const scheduleHour = parseInt(hourStr, 10);
    const scheduleMinute = parseInt(minuteStr, 10);

    const pondStartDate = new Date(pond.registered_at);
    const targetStartDate = new Date(pondStartDate);
    targetStartDate.setDate(pondStartDate.getDate() + (schedule.base_offset_days || 0));
    targetStartDate.setHours(scheduleHour, scheduleMinute, 0, 0);

    const now = new Date();

    switch (schedule.frequency) {
      
      case 'weekly':
        const weekdayIndex = targetStartDate.getDay(); 
        const expoWeekday = weekdayIndex + 1; 
        
        return [{
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoWeekday,
          hour: scheduleHour,
          minute: scheduleMinute,
          repeats: true,
        }];

      case 'monthly':
        let dayOfMonth = targetStartDate.getDate();
        
        if (schedule.interval > 1) {
          // COMPLEX INTERVAL (Every X Months)
          let nextDate = new Date(targetStartDate);
          const triggers = [];

          while (nextDate <= now) {
            nextDate.setMonth(nextDate.getMonth() + schedule.interval);
          }

          // Schedule next 12 occurrences
          for (let i = 0; i < 12; i++) {
            triggers.push({
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: new Date(nextDate),
            });
            nextDate.setMonth(nextDate.getMonth() + schedule.interval);
          }

          return triggers;
        } else {
          // STANDARD MONTHLY
          const safeDay = Math.min(dayOfMonth, 28); 

          return [{
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            day: safeDay,
            hour: scheduleHour,
            minute: scheduleMinute,
            repeats: true,
          }];
        }

      default:
        return [];
    }
  } catch (e) {
    console.error('Error calculating trigger:', e);
    return [];
  }
};