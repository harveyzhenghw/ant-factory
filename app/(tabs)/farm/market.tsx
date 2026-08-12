import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { subscribeMarketListings, createMarketListing, removeMarketListing, buyMarketListing } from '../../../src/services/economyService';
import { getMyQueens, updateQueen } from '../../../src/services/queenService';
import { ANT_SPECIES } from '../../../src/constants/species';
import { MarketListing, Queen } from '../../../src/types';
import { calculateQueenPrice } from '../../../src/game/economy';
import Header from '../../../src/components/Header';

export default function MarketScreen() {
  const { profile, user } = useAuth();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [queens, setQueens] = useState<Queen[]>([]);
  const [selling, setSelling] = useState(false);
  const [selectedQueen, setSelectedQueen] = useState<Queen | null>(null);
  const [price, setPrice] = useState('');

  useEffect(() => {
    const unsub = subscribeMarketListings(setListings);
    return unsub;
  }, []);

  useEffect(() => {
    if (user) getMyQueens(user.uid).then(setQueens);
  }, [user]);

  const refreshQueens = async () => {
    if (user) setQueens(await getMyQueens(user.uid));
  };

  const handleBuy = async (listing: MarketListing) => {
    if (!user) return;
    if ((profile?.honeydew ?? 0) < listing.price) {
      Alert.alert('Not enough Honeydew', `You need ${listing.price} Honeydew.`);
      return;
    }
    Alert.alert('Buy queen', `Buy this ${speciesName(listing.queenId)} for ${listing.price} Honeydew?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Buy', onPress: async () => {
          try {
            const ok = await buyMarketListing(listing.id, user.uid);
            if (ok) {
              Alert.alert('Success', 'Queen added to your collection!');
              refreshQueens();
            } else {
              Alert.alert('Error', 'Could not complete purchase.');
            }
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleRemove = async (listingId: string) => {
    try {
      await removeMarketListing(listingId);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSell = async () => {
    if (!user || !selectedQueen) return;
    const p = Math.floor(Number(price));
    if (!p || p <= 0) {
      Alert.alert('Error', 'Enter a valid price.');
      return;
    }
    try {
      await createMarketListing({
        sellerId: user.uid,
        sellerName: profile?.username ?? 'Ant Keeper',
        queenId: selectedQueen.id,
        type: 'queen',
        price: p,
      });
      await updateQueen(selectedQueen.id, { forSale: true, price: p });
      Alert.alert('Listed!', 'Your queen is now on the market.');
      setSelling(false);
      setSelectedQueen(null);
      setPrice('');
      refreshQueens();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const speciesName = (id?: string) => {
    const q = queens.find((x) => x.id === id);
    return q ? ANT_SPECIES[q.species]?.name ?? q.species : 'Queen';
  };

  const sellable = queens.filter((q) => !q.forSale);

  return (
    <View style={styles.container}>
      <Header
        title="Market"
        right={
          <View style={styles.balance}>
            <Ionicons name="leaf" size={18} color={Colors.accent} />
            <Text style={styles.balanceText}>{profile?.honeydew ?? 0}</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.sellBtn} onPress={() => setSelling((v) => !v)}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.sellBtnText}>{selling ? 'Cancel' : 'Sell a Queen'}</Text>
      </TouchableOpacity>

      {selling && (
        <View style={styles.sellPanel}>
          <Text style={styles.sellTitle}>Choose a queen to sell</Text>
          {sellable.length === 0 ? (
            <Text style={styles.sellEmpty}>No sellable queens yet.</Text>
          ) : (
            sellable.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={[styles.queenRow, selectedQueen?.id === q.id && styles.queenRowSelected]}
                onPress={() => setSelectedQueen(q)}
              >
                <Ionicons name="bug" size={18} color={Colors.primary} />
                <Text style={styles.queenName}>{ANT_SPECIES[q.species]?.name ?? q.species}</Text>
                <Text style={styles.queenMeta}>suggested ~{calculateQueenPrice(q.species, q.health, q.fertility)}</Text>
              </TouchableOpacity>
            ))
          )}
          {selectedQueen && (
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                placeholder="Price (Honeydew)"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor={Colors.ui.textSecondary}
              />
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSell}>
                <Text style={styles.confirmText}>List</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={listings}
        contentContainerStyle={styles.content}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="storefront" size={64} color={Colors.ui.textSecondary} />
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptyText}>Be the first to sell a queen!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.listingCard}>
            <Ionicons name="bug" size={28} color={Colors.primary} />
            <View style={styles.listingInfo}>
              <Text style={styles.listingName}>{speciesName(item.queenId)}</Text>
              <Text style={styles.listingSeller}>by {item.sellerName}</Text>
            </View>
            <View style={styles.priceTag}>
              <Ionicons name="leaf" size={12} color={Colors.accent} />
              <Text style={styles.priceText}>{item.price}</Text>
            </View>
            {item.sellerId === user?.uid ? (
              <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id)}>
                <Ionicons name="trash-outline" size={18} color={Colors.ui.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.buyBtn} onPress={() => handleBuy(item)} disabled={(profile?.honeydew ?? 0) < item.price}>
                <Text style={styles.buyBtnText}>Buy</Text>
              </TouchableOpacity>
            )}
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
  sellBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, marginHorizontal: 16, marginTop: 16, padding: 12, borderRadius: 10 },
  sellBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  sellPanel: { backgroundColor: Colors.ui.surface, marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: Colors.ui.border },
  sellTitle: { fontSize: 14, fontWeight: '600', color: Colors.ui.text, marginBottom: 10 },
  sellEmpty: { fontSize: 13, color: Colors.ui.textSecondary },
  queenRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: Colors.ui.border, marginBottom: 8 },
  queenRowSelected: { borderColor: Colors.primary, backgroundColor: Colors.ui.card },
  queenName: { fontSize: 14, fontWeight: '600', color: Colors.ui.text, flex: 1 },
  queenMeta: { fontSize: 11, color: Colors.ui.textSecondary },
  priceRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  priceInput: { flex: 1, backgroundColor: Colors.ui.background, borderWidth: 1, borderColor: Colors.ui.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: Colors.ui.text },
  confirmBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  confirmText: { color: '#fff', fontWeight: '600' },
  content: { padding: 16 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.ui.text },
  emptyText: { fontSize: 14, color: Colors.ui.textSecondary },
  listingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.ui.surface, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.ui.border },
  listingInfo: { flex: 1 },
  listingName: { fontSize: 16, fontWeight: '600', color: Colors.ui.text },
  listingSeller: { fontSize: 12, color: Colors.ui.textSecondary },
  priceTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceText: { fontSize: 14, fontWeight: '600', color: Colors.ui.text },
  buyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  buyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  removeBtn: { padding: 8 },
});
