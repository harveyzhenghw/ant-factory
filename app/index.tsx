import { useAuth } from '../src/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View, Text } from 'react-native';

export default function Index() {
  const { user, loading, configError } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E1' }}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  if (configError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E1', padding: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8B4513', textAlign: 'center', marginBottom: 12 }}>
          Firebase is not configured
        </Text>
        <Text style={{ fontSize: 15, color: '#8D6E63', textAlign: 'center', lineHeight: 22 }}>{configError}</Text>
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/farm" />;
  }

  return <Redirect href="/(auth)/login" />;
}
