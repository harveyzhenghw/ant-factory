import { Stack } from 'expo-router';

export default function FarmLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="market" />
    </Stack>
  );
}
