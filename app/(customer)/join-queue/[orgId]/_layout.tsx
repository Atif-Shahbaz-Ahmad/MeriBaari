import { Stack } from 'expo-router';

export default function OrganizationFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="departments" />
      <Stack.Screen name="services" />
    </Stack>
  );
}
