import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { updateUserProfile } from '../../../src/services/auth';

export default function SettingsScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const name = username.trim();
    if (!user || !name) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { username: name, displayName: name });
      await refreshProfile();
      Alert.alert('Saved', 'Your profile was updated.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholder="Ant Keeper"
          placeholderTextColor={Colors.ui.textSecondary}
        />
        <Text style={styles.hint}>Shown on your profile and community posts.</Text>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12,
    backgroundColor: Colors.ui.surface, borderBottomWidth: 1, borderBottomColor: Colors.ui.border,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.ui.text, flex: 1 },
  content: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.ui.text, marginBottom: 8 },
  input: { backgroundColor: Colors.ui.surface, borderWidth: 1, borderColor: Colors.ui.border, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.ui.text },
  hint: { fontSize: 12, color: Colors.ui.textSecondary, marginTop: 6, marginBottom: 24 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
