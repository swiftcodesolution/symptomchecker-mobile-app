import { Stack } from "expo-router";

const AuthLayout = () => {
  return (
    <Stack>
      
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="otp" options={{ headerShown: false }} />
      <Stack.Screen name="signup-success" options={{ headerShown: false }} />
      <Stack.Screen name="logout" options={{ headerShown: false }} />
    </Stack>
  );
};

export default AuthLayout;
