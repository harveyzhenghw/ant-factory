import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { register } from '../../src/services/auth';
import { Colors } from '../../src/constants/colors';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, username);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Ant Factory</Text>
      <Text style={styles.subtitle}>Start your first colony</Text>

      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" placeholderTextColor={Colors.ui.textSecondary} />
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={Colors.ui.textSecondary} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={Colors.ui.textSecondary} />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
      </View>

      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background, justifyContent: 'center', padding: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: Colors.primary, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: Colors.ui.textSecondary, textAlign: 'center', marginBottom: 48 },
  form: { gap: 16 },
  input: { backgroundColor: Colors.ui.surface, borderWidth: 1, borderColor: Colors.ui.border, borderRadius: 12, padding: 16, fontSize: 16, color: Colors.ui.text },
  button: { backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { marginTop: 24, alignItems: 'center' },
  linkText: { color: Colors.primaryLight, fontSize: 14 },
});
