import { Stack } from 'expo-router';

export default function TicketDetailLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="progress" options={{ animation: 'fade_from_bottom' }} />
    </Stack>
  );
}
