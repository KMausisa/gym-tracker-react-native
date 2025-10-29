import { StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../../constants/colors";

const { height } = Dimensions.get("window");

export const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  imageContainer: {
    height: height * 0.3,
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 320,
    height: 320,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 30,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
    position: "relative",
  },
  textInput: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 16,
    padding: 4,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 0,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
  },
  linkContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  linkText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  link: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    maxWidth: 450,

    backgroundColor: "#f2f2f2",
    borderWidth: 0.2,
    borderColor: "#747775",
    borderRadius: 20,

    paddingHorizontal: 12,
    height: 45,

    // shadowColor: "rgba(60, 64, 67, 0.3)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 1,
    elevation: 2,
    marginBottom: 28,
  },
  googleLogo: { marginRight: 8 },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f1f1f",
    letterSpacing: 0.25,
    fontFamily: "Roboto",
    marginRight: 12,
  },
});
