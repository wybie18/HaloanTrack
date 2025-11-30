import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';
import { createEcho } from '@/services/echo';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

interface Notification {
  id: string | number;
  title: string;
  message: string;
  created_at: string;
  read_at?: string | null;
  type?: string;
  data?: any;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    console.log('NotificationsScreen mounted. UserInfo:', userInfo);
    fetchNotifications();
    let echo: any;

    if (userInfo?.id) {
      console.log('Initializing Echo for user (NotificationsScreen):', userInfo.id);
      echo = createEcho();
      
      const channelName = `App.Models.User.${userInfo.id}`;
      const channel = echo.private(channelName);
      
      channel.notification((notification: any) => {
        console.log('New notification received via Echo (NotificationsScreen):', notification);
        
        const newNotification: Notification = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          created_at: new Date().toISOString(),
          read_at: null,
          type: notification.type,
        };

        setNotifications((prev) => [newNotification, ...prev]);
      });
    }

    return () => {
      if (echo && userInfo?.id) {
        echo.leave(`App.Models.User.${userInfo.id}`);
      }
    };
  }, [userInfo?.id]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      console.log('Fetched notifications:', response.data);
      setNotifications(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {item.title && (
        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
      )}
      <Text style={[styles.text, { color: theme.text }]}>
        {item.message || 'New Notification'}
      </Text>
      <Text style={[styles.date, { color: theme.icon }]}>
        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.icon }]}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  item: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
