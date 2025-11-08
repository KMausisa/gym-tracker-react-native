import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SignOutButton } from "../../components/SignOutButton";
import { useEffect } from "react";

export default function Page() {
  const { user } = useUser();
  const { getToken, isLoaded } = useAuth();
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function logToken() {
      if (!isLoaded) return;
      const token = await getToken();
      console.log("New token loading...");
      console.log("Bearer token:", token);
    }

    // Log once immediately
    logToken();

    // Then log every 60 seconds (for testing refresh)
    interval = setInterval(logToken, 60000);

    return () => clearInterval(interval);
  }, [isLoaded, getToken]);

  return (
    <View>
      <SignedIn>
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
        <SignOutButton />
      </SignedIn>
      <SignedOut>
        <Link href="/(auth)/sign-in">
          <Text>Sign in</Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text>Sign up</Text>
        </Link>
      </SignedOut>
    </View>
  );
}
