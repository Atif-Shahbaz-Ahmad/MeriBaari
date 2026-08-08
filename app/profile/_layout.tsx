import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="settings" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="language" />
    </Stack>
  );
}
