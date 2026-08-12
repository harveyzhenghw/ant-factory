import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { ANT_SPECIES } from '../constants/species';
import { addQueen } from '../services/queenService';
import { removeItemFromInventory, applyXp } from '../services/progressionService';

interface Props {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onProgress: () => void;
}

interface CatchResult {
  species: string;
  health: number;
  fertility: number;
}

function randomSpecies(): string {
  const table = [
    ['lasius_niger', 40],
    ['formica_rufa', 25],
    ['camponotus', 20],
    ['messor_barbarus', 12],
    ['atta', 3],
  ] as const;
  let roll = Math.random() * 100;
  for (const [species, weight] of table) {
    if (roll < weight) return species;
    roll -= weight;
  }
  return 'lasius_niger';
}

export default function CatchQueenModal({ visible, userId, onClose, onProgress }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CatchResult | null>(null);

  const handleCatch = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const species = randomSpecies();
      const health = Math.floor(50 + Math.random() * 50);
      const fertility = Math.floor(40 + Math.random() * 60);
      await addQueen(userId, species, health, fertility);
      await removeItemFromInventory(userId, 'supplies-test-tube');
      await applyXp(userId, 25);
      setResult({ species, health, fertility });
      onProgress();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not go on the flight.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setResult(null);
    onClose();
  };

  const handleSell = () => {
    setResult(null);
    onClose();
    router.push('/(tabs)/farm/market');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleDone}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {result ? (
            <>
              <Ionicons name="bug" size={48} color={Colors.primary} />
              <Text style={styles.title}>You caught a queen!</Text>
              <Text style={styles.species}>{ANT_SPECIES[result.species]?.name ?? result.species}</Text>
              <Text style={styles.subtitle}>Health {result.health} · Fertility {result.fertility}</Text>
              <TouchableOpacity style={styles.button} onPress={handleSell}>
                <Text style={styles.buttonText}>List on Market</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondary} onPress={handleDone}>
                <Text style={styles.secondaryText}>Done</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Ionicons name="flask" size={48} color={Colors.primary} />
              <Text style={styles.title}>Catch a Queen</Text>
              <Text style={styles.subtitle}>Use your Test Tube Setup to join a nuptial flight and try to catch a new queen.</Text>
              {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 16 }} />
              ) : (
                <TouchableOpacity style={styles.button} onPress={handleCatch}>
                  <Text style={styles.buttonText}>Go on the Flight</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondary} onPress={handleDone}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: Colors.ui.surface, borderRadius: 20, padding: 24, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.ui.text, marginTop: 12 },
  species: { fontSize: 18, fontWeight: '600', color: Colors.primary, marginTop: 8 },
  subtitle: { fontSize: 14, color: Colors.ui.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  button: { alignSelf: 'stretch', backgroundColor: Colors.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  secondary: { alignSelf: 'stretch', marginTop: 10, padding: 12, alignItems: 'center' },
  secondaryText: { color: Colors.ui.textSecondary, fontSize: 15 },
});
