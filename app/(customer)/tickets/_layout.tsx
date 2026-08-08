import { Stack } from 'expo-router';

export default function TicketsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="history" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
