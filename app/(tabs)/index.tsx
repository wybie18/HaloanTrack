import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';

interface Schedule {
  id: number;
  name: string;
  frequency: string;
  time_of_day: string;
  interval: number;
}

interface Pond {
  id: number;
  name: string;
  fish_count: number;
  registered_at: string;
  status: string;
}

export default function HomeScreen() {
  const { userInfo } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [stats, setStats] = useState({ ponds: 0, fish: 0 });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await api.get<Pond[]>('/ponds');
      const ponds = response.data;
      const activePonds = ponds.filter(pond => pond.status === 'active');
      const totalFish = activePonds.reduce((acc: number, pond: any) => acc + pond.fish_count, 0);
      setStats({ ponds: activePonds.length, fish: totalFish });
    } catch (error) {
      console.log(error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules');
      console.log('Fetched schedules:', response.data);
      setSchedules(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchSchedules()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
    fetchSchedules();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>{userInfo?.name || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <IconSymbol name="bell.fill" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <IconSymbol name="drop.fill" size={32} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.ponds}</Text>
            <Text style={[styles.statLabel, { color: theme.icon }]}>Active Ponds</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <IconSymbol name="fish.fill" size={32} color={theme.secondary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.fish}</Text>
            <Text style={[styles.statLabel, { color: theme.icon }]}>Total Haloan</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.card }]}
              onPress={() => router.push('/(tabs)/ponds')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.primary }]}>
                <IconSymbol name="plus" size={24} color="#fff" />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>Add Pond</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.card }]}
              onPress={() => router.push('/(tabs)/ponds')}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.secondary }]}>
                <IconSymbol name="list.bullet" size={24} color="#fff" />
              </View>
              <Text style={[styles.actionText, { color: theme.text }]}>View Ponds</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Feeds Guide</Text>
          <View style={[styles.feedGuideCard, { backgroundColor: theme.card }]}>
            <View style={styles.guideItem}>
              <IconSymbol name="leaf.fill" size={20} color={theme.secondary} />
              <Text style={[styles.guideText, { color: theme.text }]}>Use tateh aqua feeds</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Schedules</Text>
          {schedules.length === 0 ? (
            <Text style={{ color: theme.icon, fontStyle: 'italic' }}>No schedules found</Text>
          ) : (
            schedules.map((schedule) => {
              // Helper logic for display text
              const frequencyMap: Record<string, string> = { daily: 'days', weekly: 'weeks', monthly: 'months' };
              const frequencyText = schedule.interval > 1 
                ? `Every ${schedule.interval} ${frequencyMap[schedule.frequency] || schedule.frequency}`
                : schedule.frequency.charAt(0).toUpperCase() + schedule.frequency.slice(1);

              return (
                <View key={schedule.id} style={[styles.scheduleCard, { backgroundColor: theme.card, borderLeftColor: theme.primary }]}>
                  <View>
                    <Text style={[styles.scheduleTitle, { color: theme.text }]}>{schedule.name}</Text>
                    <Text style={[styles.scheduleSub, { color: theme.icon }]}>
                      {frequencyText} • {schedule.time_of_day}
                    </Text>
                  </View>
                  <IconSymbol name="clock.fill" size={20} color={theme.primary} />
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  username: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontWeight: '600',
  },
  activityCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  activityText: {
    fontStyle: 'italic',
  },
  feedGuideCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  guideText: {
    fontSize: 14,
    flex: 1,
  },
  scheduleCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scheduleSub: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
