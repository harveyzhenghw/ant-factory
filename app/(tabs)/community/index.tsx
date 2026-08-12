import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { subscribePosts, toggleLike } from '../../../src/services/communityService';
import Header from '../../../src/components/Header';
import { CommunityPost } from '../../../src/types';

export default function CommunityScreen() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  useEffect(() => {
    const unsub = subscribePosts(setPosts);
    return unsub;
  }, []);

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      await toggleLike(postId, user.uid, profile?.username ?? 'Ant Keeper');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Community"
        right={
          <TouchableOpacity style={styles.newPostBtn} onPress={() => router.push('/(tabs)/community/new')}>
            <Ionicons name="camera" size={22} color="#fff" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={posts}
        contentContainerStyle={styles.content}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color={Colors.ui.textSecondary} />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>Be the first to share your farm!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.postCard} onPress={() => router.push(`/(tabs)/community/${item.id}`)}>
            <View style={styles.postHeader}>
              <Ionicons name="person-circle" size={32} color={Colors.primaryLight} />
              <View>
                <Text style={styles.postUsername}>{item.username}</Text>
                <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
            </View>
            {item.caption ? <Text style={styles.postCaption}>{item.caption}</Text> : null}
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" /> : null}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
                <Ionicons name={item.likes.includes(user?.uid ?? '') ? 'heart' : 'heart-outline'} size={20} color={item.likes.includes(user?.uid ?? '') ? Colors.ui.error : Colors.ui.textSecondary} />
                <Text style={styles.actionText}>{item.likes.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(tabs)/community/${item.id}`)}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.ui.textSecondary} />
                <Text style={styles.actionText}>{item.commentCount}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  newPostBtn: { backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: Colors.ui.text },
  emptyText: { fontSize: 14, color: Colors.ui.textSecondary },
  postCard: { backgroundColor: Colors.ui.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.ui.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  postUsername: { fontSize: 14, fontWeight: '600', color: Colors.ui.text },
  postTime: { fontSize: 11, color: Colors.ui.textSecondary },
  postCaption: { fontSize: 14, color: Colors.ui.text, marginBottom: 12, lineHeight: 20 },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12, backgroundColor: Colors.ui.card },
  postActions: { flexDirection: 'row', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, color: Colors.ui.textSecondary },
});
