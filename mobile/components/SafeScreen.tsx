import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";
import { ReactNode } from "react";

const SafeScreen = ({ children }: { children: ReactNode }) => {
  // Provides dimensions for safe areas of a device screen.
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        flex: 1,
        backgroundColor: COLORS.background,
      }}
    >
      {children}
    </View>
  );
};
export default SafeScreen;
