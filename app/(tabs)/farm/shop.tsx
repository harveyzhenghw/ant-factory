import { View, Text, StyleSheet, TouchableOpacity, Alert, SectionList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useFarm } from '../../../src/contexts/FarmContext';
import { SHOP_ITEMS } from '../../../src/game/economy';
import { applyPurchase } from '../../../src/services/shopService';
import { applyXp } from '../../../src/services/progressionService';
import Header from '../../../src/components/Header';
import { ShopItem } from '../../../src/types';

const CATEGORIES: { key: ShopItem['type']; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'food', label: 'Food', icon: 'fast-food' },
  { key: 'decoration', label: 'Decorations', icon: 'leaf' },
  { key: 'expansion', label: 'Expansions', icon: 'add-circle' },
  { key: 'supplies', label: 'Supplies', icon: 'flask' },
];

export default function ShopScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const { activeFarm } = useFarm();

  const handleBuy = async (item: ShopItem) => {
    if (!user) return;
    if ((profile?.honeydew ?? 0) < item.price) {
      Alert.alert('Not enough Honeydew', `You need ${item.price} Honeydew.`);
      return;
    }
    if (!activeFarm) {
      Alert.alert('Error', 'No active farm to apply this purchase to.');
      return;
    }
    try {
      await applyPurchase(user.uid, activeFarm, item);
      await applyXp(user.uid, 15);
      await refreshProfile();
      Alert.alert('Purchased!', `You bought ${item.name}.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const sections = CATEGORIES.map((cat) => ({
    title: cat.label, icon: cat.icon,
    data: SHOP_ITEMS.filter((i) => i.type === cat.key),
  })).filter((s) => s.data.length > 0);

  return (
    <View style={styles.container}>
      <Header
        title="Shop"
        right={
          <View style={styles.balance}>
            <Ionicons name="leaf" size={18} color={Colors.accent} />
            <Text style={styles.balanceText}>{profile?.honeydew ?? 0}</Text>
          </View>
        }
      />
      <SectionList
        sections={sections}
        contentContainerStyle={styles.content}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title, icon } }) => (
          <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>{item.description}</Text>
            </View>
            <View style={styles.itemRight}>
              <View style={styles.priceTag}>
                <Ionicons name="leaf" size={12} color={Colors.accent} />
                <Text style={styles.priceText}>{item.price}</Text>
              </View>
              <TouchableOpacity style={[styles.buyBtn, (profile?.honeydew ?? 0) < item.price && styles.buyBtnDisabled]} onPress={() => handleBuy(item)} disabled={(profile?.honeydew ?? 0) < item.price}>
                <Text style={styles.buyBtnText}>Buy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  balance: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.ui.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  balanceText: { fontSize: 16, fontWeight: '600', color: Colors.ui.text },
  content: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.ui.text },
  itemCard: { flexDirection: 'row', backgroundColor: Colors.ui.surface, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.ui.border },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: Colors.ui.text, marginBottom: 2 },
  itemDesc: { fontSize: 13, color: Colors.ui.textSecondary },
  itemRight: { alignItems: 'flex-end', gap: 8, justifyContent: 'center' },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText: { fontSize: 14, fontWeight: '600', color: Colors.ui.text },
  buyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  buyBtnDisabled: { opacity: 0.4 },
  buyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
