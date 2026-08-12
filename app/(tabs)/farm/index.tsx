import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFarm } from '../../../src/contexts/FarmContext';
import AntFarmRenderer from '../../../src/components/AntFarmRenderer';
import CatchQueenModal from '../../../src/components/CatchQueenModal';
import { levelProgress } from '../../../src/game/progression';
import { populationCap } from '../../../src/game/simulation';
import { ANT_SPECIES } from '../../../src/constants/species';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FarmScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const { activeFarm, ants, loading, care, farms, createNewFarm, setActiveFarm } = useFarm();
  const [catchVisible, setCatchVisible] = useState(false);
  const insets = useSafeAreaInsets();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!activeFarm) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="leaf-outline" size={64} color={Colors.primary} />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.ui.text, marginTop: 16 }}>No farm yet</Text>
      </View>
    );
  }

  const fw = 340;
  const fh = 300;

  const stats: { label: string; value: number; max: number; color: string; icon: 'fast-food' | 'water' | 'sparkles' | 'heart' | 'bug' }[] = [
    { label: 'Food', value: activeFarm.foodLevel, max: 100, color: Colors.food, icon: 'fast-food' },
    { label: 'Water', value: activeFarm.waterLevel, max: 100, color: Colors.water, icon: 'water' },
    { label: 'Clean', value: activeFarm.cleanliness, max: 100, color: Colors.cleanliness, icon: 'sparkles' },
    { label: 'Health', value: activeFarm.health, max: 100, color: Colors.health.good, icon: 'heart' },
    { label: 'Pop', value: activeFarm.population, max: populationCap(activeFarm), color: Colors.ant, icon: 'bug' },
  ];

  const queenName = activeFarm.queenSpecies ? ANT_SPECIES[activeFarm.queenSpecies]?.name ?? activeFarm.queenSpecies : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>{activeFarm.name}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Open shop"
            onPress={() => router.push('/(tabs)/farm/shop')}
          >
            <Ionicons name="storefront" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Open market"
            onPress={() => router.push('/(tabs)/farm/market')}
          >
            <Ionicons name="swap-horizontal" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.balance} accessible accessibilityLabel={`${profile?.honeydew ?? 0} honeydew`}>
            <Ionicons name="leaf" size={18} color={Colors.accent} />
            <Text style={styles.balanceText}>{profile?.honeydew ?? 0}</Text>
          </View>
        </View>
      </View>

      <View style={styles.levelBar}>
        <Ionicons name="trophy" size={16} color={Colors.accent} />
        <Text style={styles.levelText}>Level {profile?.level ?? 1}</Text>
        <View style={styles.levelTrack}>
          <View style={[styles.levelFill, { width: `${levelProgress(profile ?? { xp: 0, level: 1 }) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.farmBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.farmChips}>
          {farms.map((farm) => (
            <TouchableOpacity
              key={farm.id}
              style={[styles.farmChip, farm.id === activeFarm?.id && styles.farmChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: farm.id === activeFarm?.id }}
              accessibilityLabel={`Switch to colony ${farm.name}`}
              onPress={() => setActiveFarm(farm)}
            >
              <Ionicons name="leaf" size={14} color={farm.id === activeFarm?.id ? '#fff' : Colors.primary} />
              <Text style={[styles.farmChipText, farm.id === activeFarm?.id && styles.farmChipTextActive]} numberOfLines={1}>
                {farm.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.farmChip}
            accessibilityRole="button"
            accessibilityLabel="Create a new colony"
            onPress={() => createNewFarm(`My Colony ${farms.length + 1}`)}
          >
            <Ionicons name="add" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.terrariumContainer}>
          <AntFarmRenderer farm={activeFarm} ants={ants} width={fw} height={fh} />
        </View>

        <View style={styles.statsContainer}>
          {stats.map((s) => {
            const pct = Math.min(100, (s.value / s.max) * 100);
            return (
              <View key={s.label} style={styles.statRow}>
                <Ionicons name={s.icon} size={14} color={Colors.ui.textSecondary} />
                <Text style={styles.statLabel}>{s.label}</Text>
                <View style={styles.statBarBg}>
                  <View style={[styles.statBarFill, { width: `${pct}%`, backgroundColor: s.color }]} />
                </View>
                <Text style={styles.statValue}>{Math.round(s.value)}</Text>
              </View>
            );
          })}
        </View>

        {queenName && (
          <View style={styles.queenRow} accessible accessibilityLabel={`Resident queen: ${queenName}`}>
            <Text style={styles.queenEmoji}>👑</Text>
            <Text style={styles.queenText}>Resident queen: {queenName}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Daily Care</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Feed the colony"
            onPress={() => care('feed')}
          >
            <Ionicons name="fast-food" size={28} color={Colors.food} />
            <Text style={styles.actionLabel}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Water the colony"
            onPress={() => care('water')}
          >
            <Ionicons name="water" size={28} color={Colors.water} />
            <Text style={styles.actionLabel}>Water</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Clean the colony"
            onPress={() => care('clean')}
          >
            <Ionicons name="sparkles" size={28} color={Colors.cleanliness} />
            <Text style={styles.actionLabel}>Clean</Text>
          </TouchableOpacity>
        </View>

        {(profile?.inventory ?? []).includes('supplies-test-tube') && user && (
          <TouchableOpacity
            style={styles.catchBtn}
            accessibilityRole="button"
            accessibilityLabel="Catch a queen using a test tube"
            onPress={() => setCatchVisible(true)}
          >
            <Ionicons name="flask" size={22} color="#fff" />
            <Text style={styles.catchBtnText}>Catch a Queen (Test Tube)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {user && (
        <CatchQueenModal
          visible={catchVisible}
          userId={user.uid}
          onClose={() => setCatchVisible(false)}
          onProgress={refreshProfile}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.ui.surface, borderBottomWidth: 1, borderBottomColor: Colors.ui.border,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.primary, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },
  balance: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.ui.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  balanceText: { fontSize: 16, fontWeight: '600', color: Colors.ui.text },
  levelBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.ui.surface, borderBottomWidth: 1, borderBottomColor: Colors.ui.border },
  levelText: { fontSize: 13, fontWeight: '600', color: Colors.ui.text },
  levelTrack: { flex: 1, height: 8, backgroundColor: Colors.ui.border, borderRadius: 4, overflow: 'hidden' },
  levelFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 4 },
  farmBar: { backgroundColor: Colors.ui.surface, borderBottomWidth: 1, borderBottomColor: Colors.ui.border, paddingVertical: 8 },
  farmChips: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, alignItems: 'center' },
  farmChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.ui.border, backgroundColor: Colors.ui.background, maxWidth: 180 },
  farmChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  farmChipText: { fontSize: 13, color: Colors.ui.text, fontWeight: '500', flexShrink: 1 },
  farmChipTextActive: { color: '#fff' },
  content: { flex: 1, padding: 16 },
  terrariumContainer: { borderRadius: 16, overflow: 'hidden', borderWidth: 3, borderColor: Colors.primary, marginBottom: 16, alignSelf: 'center' },
  statsContainer: { backgroundColor: Colors.ui.surface, borderRadius: 12, padding: 16, marginBottom: 16, gap: 10 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: { width: 40, fontSize: 13, color: Colors.ui.text, fontWeight: '600' },
  statBarBg: { flex: 1, height: 12, backgroundColor: Colors.ui.border, borderRadius: 6, overflow: 'hidden' },
  statBarFill: { height: '100%', borderRadius: 6 },
  statValue: { width: 30, fontSize: 12, color: Colors.ui.textSecondary, fontWeight: '500', textAlign: 'right' },
  queenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.ui.surface, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.ui.border },
  queenEmoji: { fontSize: 18 },
  queenText: { fontSize: 14, color: Colors.ui.text, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.ui.text, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32 },
  actionBtn: { backgroundColor: Colors.ui.surface, borderRadius: 16, padding: 16, alignItems: 'center', gap: 8, minWidth: 96, borderWidth: 1, borderColor: Colors.ui.border },
  actionLabel: { fontSize: 14, color: Colors.ui.text, fontWeight: '500' },
  catchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, marginBottom: 32 },
  catchBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
