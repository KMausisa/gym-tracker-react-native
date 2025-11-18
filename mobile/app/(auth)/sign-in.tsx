import { useSignIn, useSSO, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

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
import OrDivider from "@/components/OrDivider";
import GoogleSignIn from "../../assets/signin-assets/iOS/svg/neutral/ios_neutral_rd_na.svg";
import { Ionicons } from "@expo/vector-icons";

import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";

WebBrowser.maybeCompleteAuthSession();

const SignInScreen = () => {
  const router = useRouter();

  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut, isSignedIn } = useAuth();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle if the user is signed in already
  if (isSignedIn) {
    console.log("The user is already signed in, signing out...");
    signOut();
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isLoaded) return;

    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        Alert.alert("Error", "Sign in failed. Please try again.");
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      Alert.alert("Error", err.errors?.[0]?.message || "Sign in failed");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = useCallback(async () => {
    if (!isLoaded) {
      console.log("Clerk is not loaded yet.");
      return;
    }

    if (isLoaded) console.log("Clerk is loaded, proceeding with Google SSO.");
    try {
      console.log("Logging in with Google...");
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: AuthSession.makeRedirectUri(),
        });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        await setActive!({
          session: createdSessionId,
          // Check for session tasks and navigate to custom UI to help users resolve them
          // See https://clerk.com/docs/guides/development/custom-flows/overview#session-tasks
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask);
              router.push("/(home)");
              return;
            }

            console.log("Signed in successfully, navigating to home page...");
            router.push("/");
          },
        });
      }
      console.log("Missing requirements, handle accordingly.");
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, startSSOFlow]);

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={authStyles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* <View style={authStyles.imageContainer}>
            <Image
              source={require("../../assets/images/i1.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View> */}

          <Text style={authStyles.title}>Welcome Back</Text>

          {/* FORM CONTAINER */}
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

            {/* PASSWORD INPUT */}
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

            <TouchableOpacity
              style={[
                authStyles.authButton,
                loading && authStyles.buttonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={authStyles.buttonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <OrDivider />

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[
                authStyles.googleButton,
                loading && authStyles.buttonDisabled,
              ]}
              onPress={handleGoogleSignin}
              disabled={loading || !isLoaded}
              activeOpacity={0.8}
            >
              <GoogleSignIn
                width={44}
                height={44}
                style={authStyles.googleLogo}
              />
              <Text style={authStyles.googleButtonText}>
                Sign in with Google
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <TouchableOpacity
              style={authStyles.linkContainer}
              onPress={() => router.push("/(auth)/sign-up")}
            >
              <Text style={authStyles.linkText}>
                Don&apos;t have an account?{" "}
                <Text style={authStyles.link}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};
export default SignInScreen;
