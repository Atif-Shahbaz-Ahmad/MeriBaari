import { Stack } from 'expo-router';

export default function WalkInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="success" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}
