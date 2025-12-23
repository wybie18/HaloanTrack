import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/constants/constants";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import api from "@/services/api";
import { AntDesign } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Link, Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");

  const { register, isLoading, setUserToken, setUserInfo } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const handleDeepLink = async (url: string) => {
    try {
      console.log("Processing Deep Link:", url);
      const { queryParams } = Linking.parse(url);

      const { token, user, status, message } = (queryParams || {}) as {
        token?: string;
        user?: string;
        status?: string;
        message?: string;
      };

      if (token) {
        setUserToken(token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        if (user) {
          try {
            const userObj = JSON.parse(user);
            setUserInfo(userObj);
          } catch (e) {
            console.error("Failed to parse user JSON", e);
          }
        } else {
          try {
            const userResponse = await api.get("/user");
            setUserInfo(userResponse.data);
          } catch (fetchError) {
            console.log("Failed to fetch profile", fetchError);
          }
        }
      } else if (status === "error") {
        Alert.alert("Error", message || "Registration failed");
      }
    } catch (e) {
      console.error("Deep link processing error:", e);
    }
  };

  useEffect(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleGoogleRegister = async () => {
    if (!isAgreed) {
      Alert.alert("Error", "You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    try {
      const callbackUrl = Linking.createURL("/auth/callback");

      const result = await WebBrowser.openAuthSessionAsync(
        `${process.env.EXPO_PUBLIC_API_URL}/auth/google/redirect`,
        callbackUrl
      );

      if (result.type === "success" && result.url) {
        handleDeepLink(result.url);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred during Google registration");
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!isAgreed) {
      Alert.alert("Error", "You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    try {
      await register(name, email, password, confirmPassword);
    } catch (error: any) {
      const data = error.response?.data;
      const errorMessage = data?.errors
        ? Object.values(data.errors).flat().join("\n")
        : data?.message || "Registration failed. Please check your inputs.";

      Alert.alert("Registration Failed", errorMessage);
    }
  };

  const openModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalVisible(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: theme.icon }]}>
            Join Mudfish Track today
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter your full name"
              placeholderTextColor={theme.icon}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={theme.icon}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Create a password"
              placeholderTextColor={theme.icon}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>
              Confirm Password
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="Confirm your password"
              placeholderTextColor={theme.icon}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, { borderColor: theme.border, backgroundColor: isAgreed ? theme.primary : 'transparent' }]}
              onPress={() => setIsAgreed(!isAgreed)}
            >
              {isAgreed && <AntDesign name="check" size={16} color="#fff" />}
            </TouchableOpacity>
            <View style={styles.checkboxLabelContainer}>
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>I agree to the </Text>
              <TouchableOpacity onPress={() => openModal("Terms of Service", TERMS_OF_SERVICE)}>
                <Text style={[styles.checkboxLink, { color: theme.primary }]}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={[styles.checkboxLabel, { color: theme.text }]}> and </Text>
              <TouchableOpacity onPress={() => openModal("Privacy Policy", PRIVACY_POLICY)}>
                <Text style={[styles.checkboxLink, { color: theme.primary }]}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: isAgreed ? theme.primary : theme.icon }]}
            onPress={handleRegister}
            disabled={isLoading || !isAgreed}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.border }]}
            />
            <Text style={[styles.dividerText, { color: theme.icon }]}>OR</Text>
            <View
              style={[styles.dividerLine, { backgroundColor: theme.border }]}
            />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: theme.card, borderColor: theme.border, opacity: isAgreed ? 1 : 0.5 },
            ]}
            onPress={handleGoogleRegister}
            disabled={!isAgreed}
          >
            <AntDesign
              name="google"
              size={20}
              color={theme.text}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.googleButtonText, { color: theme.text }]}>
              Sign up with Google
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.text }]}>
              Already have an account?{" "}
            </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.link, { color: theme.primary }]}>
                  Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{modalTitle}</Text>
            <ScrollView style={styles.modalBody}>
              <Text style={[styles.modalText, { color: theme.text }]}>{modalContent}</Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  headerContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxLabelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  checkboxLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  googleButton: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: "bold",
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
  },
  modalButton: {
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
