import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="bug-outline" size={64} color={Colors.primary} />
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.message}>The page you're looking for doesn't exist.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/')}>
        <Text style={styles.buttonText}>Back to Farm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: Colors.ui.background },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.ui.text, marginTop: 16 },
  message: { fontSize: 14, color: Colors.ui.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  button: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
