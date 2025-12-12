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
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, setUserToken, setUserInfo } = useAuth();
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
        Alert.alert("Error", message || "Login failed");
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    try {
      await login(email, password);
    } catch (error: any) {
      const data = error.response?.data;
      const errorMessage = data?.errors
        ? Object.values(data.errors).flat().join("\n")
        : data?.message || "Invalid credentials or network error";

      Alert.alert("Login Failed", errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
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
      Alert.alert("Error", "An error occurred during Google login");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.logoContainer}>
        <View
          style={[styles.logoPlaceholder, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.logoText}>HT</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>HaloanTrack</Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Track your Haloan ponds
        </Text>
      </View>

      <View style={styles.formContainer}>
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
            placeholder="Enter your password"
            placeholderTextColor={theme.icon}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Link href={"/forgot-password" as any} asChild>
            <TouchableOpacity style={{ alignSelf: "flex-end", marginTop: 8 }}>
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </Link>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
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
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={handleGoogleLogin}
        >
          <AntDesign
            name="google"
            size={20}
            color={theme.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.googleButtonText, { color: theme.text }]}>
            Sign in with Google
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text }]}>
            Don't have an account?{" "}
          </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={[styles.link, { color: theme.primary }]}>
                Register
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
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
  // New Styles for Google Auth
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
});
