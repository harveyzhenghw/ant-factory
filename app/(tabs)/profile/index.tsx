import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFarm } from '../../../src/contexts/FarmContext';
import Header from '../../../src/components/Header';
import { logout } from '../../../src/services/auth';

export default function ProfileScreen() {
  const { profile, user } = useAuth();
  const { farms } = useFarm();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.username}>{profile?.username ?? 'Ant Keeper'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile?.level ?? 1}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile?.honeydew ?? 0}</Text>
              <Text style={styles.statLabel}>Honeydew</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{farms.length}</Text>
              <Text style={styles.statLabel}>Farms</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(tabs)/profile/notifications')}>
          <Ionicons name="notifications" size={20} color={Colors.primary} />
          <Text style={styles.linkText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => router.push('/(tabs)/profile/settings')}>
          <Ionicons name="settings" size={20} color={Colors.primary} />
          <Text style={styles.linkText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={Colors.ui.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  content: { flex: 1, padding: 16 },
  profileCard: { backgroundColor: Colors.ui.surface, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: Colors.ui.border },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.ui.card, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  username: { fontSize: 22, fontWeight: 'bold', color: Colors.ui.text, marginBottom: 4 },
  email: { fontSize: 14, color: Colors.ui.textSecondary, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 40 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
  statLabel: { fontSize: 12, color: Colors.ui.textSecondary, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, backgroundColor: Colors.ui.surface, borderWidth: 1, borderColor: Colors.ui.error },
  logoutText: { fontSize: 16, color: Colors.ui.error, fontWeight: '600' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, backgroundColor: Colors.ui.surface, borderWidth: 1, borderColor: Colors.ui.border, marginBottom: 12 },
  linkText: { fontSize: 16, color: Colors.ui.text, fontWeight: '600' },
});
