import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { subscribeComments, addComment, getPost, toggleLike } from '../../../src/services/communityService';
import { Comment, CommunityPost } from '../../../src/types';

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { profile, user } = useAuth();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!postId) return;
    getPost(postId).then(setPost);
    const unsub = subscribeComments(postId, setComments);
    return unsub;
  }, [postId]);

  const handleComment = async () => {
    if (!user || !profile || !newComment.trim() || !postId) return;
    try {
      await addComment(postId, user.uid, profile.username, profile.avatarUrl, newComment.trim());
      setNewComment('');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLike = async () => {
    if (!user || !postId || !post) return;
    try {
      await toggleLike(postId, user.uid, profile?.username ?? 'Ant Keeper');
      getPost(postId).then(setPost);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const liked = post?.likes.includes(user?.uid ?? '') ?? false;

  const ListHeader = (
    <View>
      {post ? (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <Ionicons name="person-circle" size={36} color={Colors.primaryLight} />
            <View>
              <Text style={styles.postUsername}>{post.username}</Text>
              <Text style={styles.postTime}>{new Date(post.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" /> : null}
          {post.caption ? <Text style={styles.postCaption}>{post.caption}</Text> : null}
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? Colors.ui.error : Colors.ui.textSecondary} />
              <Text style={styles.actionText}>{post.likes.length}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.ui.textSecondary} />
              <Text style={styles.actionText}>{post.commentCount}</Text>
            </View>
          </View>
        </View>
      ) : null}
      <Text style={styles.commentsTitle}>Comments</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={comments}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.content}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No comments yet. Be the first!</Text>}
        renderItem={({ item }) => (
          <View style={styles.commentCard}>
            <Ionicons name="person-circle" size={28} color={Colors.primaryLight} />
            <View style={styles.commentBody}>
              <Text style={styles.commentUser}>{item.username}</Text>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput style={styles.commentInput} placeholder="Add a comment..." value={newComment} onChangeText={setNewComment} placeholderTextColor={Colors.ui.textSecondary} />
        <TouchableOpacity style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]} onPress={handleComment} disabled={!newComment.trim()}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: Colors.ui.surface, borderBottomWidth: 1, borderBottomColor: Colors.ui.border },
  title: { fontSize: 18, fontWeight: '600', color: Colors.ui.text, flex: 1 },
  content: { padding: 16 },
  postCard: { backgroundColor: Colors.ui.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.ui.border },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  postUsername: { fontSize: 14, fontWeight: '600', color: Colors.ui.text },
  postTime: { fontSize: 11, color: Colors.ui.textSecondary },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12, backgroundColor: Colors.ui.card },
  postCaption: { fontSize: 14, color: Colors.ui.text, marginBottom: 12, lineHeight: 20 },
  postActions: { flexDirection: 'row', gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, color: Colors.ui.textSecondary },
  commentsTitle: { fontSize: 18, fontWeight: '600', color: Colors.ui.text, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.ui.textSecondary, textAlign: 'center', marginTop: 16 },
  commentCard: { flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'flex-start' },
  commentBody: { flex: 1 },
  commentUser: { fontSize: 14, fontWeight: '600', color: Colors.ui.text, marginBottom: 2 },
  commentText: { fontSize: 14, color: Colors.ui.text, lineHeight: 20 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: Colors.ui.surface, borderTopWidth: 1, borderTopColor: Colors.ui.border },
  commentInput: { flex: 1, backgroundColor: Colors.ui.background, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.ui.text, borderWidth: 1, borderColor: Colors.ui.border },
  sendBtn: { backgroundColor: Colors.primary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
