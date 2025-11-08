import { useRouter } from "expo-router";
import { useSignUp, useSSO, useAuth, useClerk } from "@clerk/clerk-expo";
import { useState, useCallback } from "react";
import * as AuthSession from "expo-auth-session";

// Import components
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";
import OrDivider from "@/components/OrDivider";
import GoogleSignIn from "../../assets/signin-assets/iOS/svg/neutral/ios_neutral_rd_na.svg";

import { Ionicons } from "@expo/vector-icons";
// import VerifyEmail from "./verify-email";

const SignUpScreen = () => {
  const router = useRouter();
  const { isLoaded, signUp } = useSignUp();
  const { startSSOFlow } = useSSO();
  const { isSignedIn, getToken } = useAuth();

  const { signOut } = useClerk();
  signOut();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const handleCreatedUser = async (
    id: string,
    emailAddress: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No token found from Clerk");

      const response = await fetch("http://10.0.0.218:5000/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // include Clerk token if you’re protecting the route:
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          createdUserId: id,
          email: emailAddress,
          firstName: firstName,
          lastName: lastName,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create user in backend");
      }

      const data = await response.json();
      console.log("User created in backend:", data);
    } catch (error) {
      console.error("Error creating user in backend:", error);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password)
      return Alert.alert("Error", "Please fill in all fields");
    if (password.length < 6)
      return Alert.alert("Error", "Password must be at least 6 characters");

    if (!isLoaded) return;

    setLoading(true);

    try {
      await signUp.create({ emailAddress: email, password });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.errors?.[0]?.message || "Failed to create account"
      );
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = useCallback(async () => {
    if (isSignedIn) {
      router.push("/(home)");
      return;
    }
    try {
      const { createdSessionId, setActive, signUp } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId) {
        await setActive!({ session: createdSessionId });

        handleCreatedUser(
          signUp!.createdUserId!,
          signUp!.emailAddress!,
          signUp!.firstName!,
          signUp!.lastName!
        );
        router.push("/(home)");
        return;
      }

      if (signUp?.missingFields?.length) {
        console.log("Missing fields:", signUp.missingFields);

        // Example: auto-generate a username if required
        if (signUp.missingFields.includes("username")) {
          await signUp.update({
            username: `user_${Date.now()}`,
          });
        }

        // Complete sign-up now that all required fields are filled
        const completeSignUp = await signUp.create({});

        if (completeSignUp.createdSessionId) {
          await setActive!({ session: completeSignUp.createdSessionId });
          router.push("/(home)");
        } else {
          console.warn("Still missing something:", completeSignUp);
        }
      }
    } catch (error) {
      console.error("SSO Sign-In Error:", error);
    }
  }, []);

  //   if (pendingVerification)
  //     return (
  //       <VerifyEmail email={email} onBack={() => setPendingVerification(false)} />
  //     );

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        style={authStyles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image Container */}
          {/* <View style={authStyles.imageContainer}>
            <Image
              source={require("../../assets/images/i2.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View> */}

          <Text style={authStyles.title}>Create Account</Text>

          <View style={authStyles.formContainer}>
            {/* Email Input */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter email"
                placeholderTextColor={COLORS.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password Input */}
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter password"
                placeholderTextColor={COLORS.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={authStyles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                authStyles.authButton,
                loading && authStyles.buttonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={authStyles.buttonText}>
                {loading ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>

            <OrDivider />

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[
                authStyles.googleButton,
                loading && authStyles.buttonDisabled,
              ]}
              onPress={handleGoogleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              <GoogleSignIn
                width={44}
                height={44}
                style={authStyles.googleLogo}
              />
              <Text style={authStyles.googleButtonText}>
                Sign up with Google
              </Text>
            </TouchableOpacity>

            {/* Sign In Link */}
            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.back()}
            >
              <Text style={authStyles.linkText}>
                Already have an account?{" "}
                <Text style={authStyles.link}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
export default SignUpScreen;
