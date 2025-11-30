import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGlobalNotifications } from '@/hooks/useGlobalNotifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

const RootLayoutNav = () => {
  const colorScheme = useColorScheme();
  const { userToken, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  useGlobalNotifications();

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === '(tabs)';

    if (!userToken && inTabsGroup) {
      // Redirect to the login page if not signed in and trying to access the app
      router.replace('/login');
    } else if (userToken && (segments[0] === 'login' || segments[0] === 'register')) {
      // Redirect to the tabs page if signed in and trying to access auth pages
      router.replace('/(tabs)');
    }
  }, [userToken, segments, isLoading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', title: 'Notifications' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
