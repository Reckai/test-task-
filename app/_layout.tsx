import { Stack } from 'expo-router';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <KeyboardProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="mixing" options={{ gestureEnabled: false }} />
          <Stack.Screen name="result" />
        </Stack>
      </KeyboardProvider>
    </ErrorBoundary>
  );
}
