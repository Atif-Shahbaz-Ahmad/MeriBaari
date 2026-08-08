import { Stack } from 'expo-router';

export default function JoinQueueLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[orgId]" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="success" options={{ animation: 'fade' }} />
    </Stack>
  );
}
