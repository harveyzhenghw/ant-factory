import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.ui.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.ui.surface,
          borderTopColor: Colors.ui.border,
        },
      }}
    >
      <Tabs.Screen
        name="farm/index"
        options={{
          title: 'My Farm',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="education/index"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />
      {/* Community depends on Firebase Storage for photos and will be hosted
          separately later; hide the tab for now (href: null) without deleting
          the routes. */}
      <Tabs.Screen name="community/index" options={{ href: null }} />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
