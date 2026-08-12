import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { subscribeNotifications, markNotificationsRead } from '../../../src/services/communityService';
import { Notification } from '../../../src/types';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeNotifications(user.uid, (items) => {
      setNotifs(items);
      const unread = items.filter((n) => !n.read).map((n) => n.id);
      if (unread.length > 0) markNotificationsRead(user.uid, unread);
    });
    return unsub;
  }, [user]);

  const message = (n: Notification) => {
    switch (n.type) {
      case 'like': return `liked your post`;
      case 'comment': return `commented on your post`;
      case 'follow': return `started following you`;
      default: return `sent you a notification`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifs}
        contentContainerStyle={styles.content}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color={Colors.ui.textSecondary} />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => {
              if (item.postId) router.push(`/(tabs)/community/${item.postId}`);
            }}
          >
            <Ionicons
              name={item.type === 'like' ? 'heart' : item.type === 'comment' ? 'chatbubble' : 'notifications'}
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.text}>
              <Text style={styles.username}>{item.fromUsername}</Text> {message(item)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: Colors.ui.surface, borderBottomWidth: 1, borderBottomColor: Colors.ui.border },
  title: { fontSize: 18, fontWeight: '600', color: Colors.ui.text, flex: 1 },
  content: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: Colors.ui.textSecondary },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.ui.surface, borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.ui.border },
  cardUnread: { borderColor: Colors.primary, backgroundColor: Colors.ui.card },
  text: { flex: 1, fontSize: 14, color: Colors.ui.text, lineHeight: 20 },
  username: { fontWeight: '700', color: Colors.ui.text },
});
