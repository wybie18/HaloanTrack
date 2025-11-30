import { useAuth } from '@/context/AuthContext';
import { createEcho } from '@/services/echo';
import { syncOfflineNotifications } from '@/services/scheduler';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useGlobalNotifications() {
  const { userInfo } = useAuth();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    return () => {
      notificationListener.current && notificationListener.current.remove();
      responseListener.current && responseListener.current.remove();
    };
  }, []);

  useEffect(() => {
    let echo: any;

    if (userInfo?.id) {
      // Sync offline notifications (schedules)
      syncOfflineNotifications();

      console.log('[GlobalNotifications] Initializing Echo for user:', userInfo.id);
      echo = createEcho();
      const channelName = `App.Models.User.${userInfo.id}`;
      const channel = echo.private(channelName);

      channel.notification(async (notification: any) => {
        console.log('[GlobalNotifications] Real-time notification received:', notification);
        
        // Schedule a local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title || 'New Notification',
            body: notification.message || 'You have a new update.',
            data: { ...notification },
          },
          trigger: null,
        });
      });
    }

    return () => {
      if (echo && userInfo?.id) {
        console.log('[GlobalNotifications] Leaving channel');
        echo.leave(`App.Models.User.${userInfo.id}`);
      }
    };
  }, [userInfo?.id]);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }
}
