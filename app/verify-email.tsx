import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import api from '@/services/api';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    setLoading(true);
    try {
      await api.post('/verify-email', { email, otp });
      Alert.alert('Success', 'Email verified successfully', [
        { text: 'Login', onPress: () => router.replace('/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/resend-verification-otp', { email });
      Alert.alert('Success', 'OTP resent successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ title: 'Verify Email', headerShown: false }} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Verify Your Email</Text>
        <Text style={[styles.description, { color: theme.icon }]}>
          Enter the verification code sent to {email}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.text }]}>OTP Code</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="Enter 6-digit code"
            placeholderTextColor={theme.icon}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]} 
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify Email</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton} 
          onPress={handleResendOtp}
          disabled={loading}
        >
          <Text style={[styles.resendText, { color: theme.primary }]}>Resend Code</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={() => router.replace('/login')}
        >
          <Text style={[styles.logoutText, { color: theme.icon }]}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 5,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
  },
});
