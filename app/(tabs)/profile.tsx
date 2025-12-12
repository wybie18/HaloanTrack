import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Entypo } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { userInfo, logout, updateProfile, updatePassword } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editName, setEditName] = useState(userInfo?.name || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      await updateProfile(editName);
      setModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword, confirmPassword);
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
    } catch (error: any) {
      const data = error.response?.data;
      const errorMessage = data?.errors
        ? Object.values(data.errors).flat().join("\n")
        : data?.message || "Failed to update password";
      Alert.alert('Error', errorMessage);
    }
  };

  const openEditModal = () => {
    setEditName(userInfo?.name || '');
    setModalVisible(true);
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>
            {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={[styles.name, { color: theme.text }]}>{userInfo?.name || 'User'}</Text>
        <Text style={[styles.email, { color: theme.icon }]}>{userInfo?.email || 'email@example.com'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        
        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: theme.border }]}
          onPress={openEditModal}
        >
          <View style={styles.menuItemLeft}>
            <IconSymbol name="person.fill" size={20} color={theme.text} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Edit Profile</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={theme.icon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: theme.border }]}
          onPress={openPasswordModal}
        >
          <View style={styles.menuItemLeft}>
            <Entypo name="lock" size={20} color={theme.text} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Change Password</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={theme.icon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { borderBottomColor: theme.border }]}
          onPress={() => router.push('/notifications')}
        >
          <View style={styles.menuItemLeft}>
            <IconSymbol name="bell.fill" size={20} color={theme.text} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Notifications</Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={theme.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: theme.error }]} 
          onPress={logout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Enter your full name"
              placeholderTextColor={theme.icon}
              value={editName}
              onChangeText={setEditName}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.icon }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <View style={{ width: 10 }} />

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.primary }]} 
                onPress={handleUpdateProfile}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
            
            <Text style={[styles.label, { color: theme.text }]}>Current Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Enter current password"
              placeholderTextColor={theme.icon}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Enter new password"
              placeholderTextColor={theme.icon}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={[styles.label, { color: theme.text }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder="Confirm new password"
              placeholderTextColor={theme.icon}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.icon }]} 
                onPress={() => setPasswordModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <View style={{ width: 10 }} />

              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.primary }]} 
                onPress={handleUpdatePassword}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
  },
  logoutButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
