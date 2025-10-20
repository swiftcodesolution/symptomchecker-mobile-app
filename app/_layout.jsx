import { Stack } from "expo-router";
import { ThemeProvider } from "./theme/ThemeContext";
import AnimatedBackground from "./components/AnimatedBackground";
import { Toaster } from 'sonner-native';
import { Provider } from 'react-redux';
import { store } from "./redux/store";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <Toaster 
            position="top-center" 
            duration={4000}
            richColors
            closeButton
            expand={true}
          />
          <AnimatedBackground>
            <Stack>
              <Stack.Screen name="splash" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="check-personal-info" options={{ headerShown: false }} />
              <Stack.Screen
                name="collect-user-info"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(main)" options={{ headerShown: false }} />
            </Stack>
          </AnimatedBackground>
        </ThemeProvider>
      </GestureHandlerRootView>
    </Provider>
  );
}
