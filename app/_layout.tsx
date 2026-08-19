import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
import { AuthProvider } from '../src/contexts/AuthContext';
import { FarmProvider } from '../src/contexts/FarmContext';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Completes a pending Google OAuth popup no matter which route it redirects
// back to (web can land on "/" rather than "/login"), closing the popup and
// posting the token to the opener. Without this the popup spins forever.
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <FarmProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </FarmProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
