import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../src/constants/colors';
import { useAuth } from '../../../src/contexts/AuthContext';
import { createPost } from '../../../src/services/communityService';
import { uploadCommunityImage } from '../../../src/services/storageService';
import { applyXp } from '../../../src/services/progressionService';

export default function NewPostScreen() {
  const { profile, user, refreshProfile } = useAuth();
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to share farm pictures.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile || !caption.trim()) {
      Alert.alert('Error', 'Please write a caption.');
      return;
    }
    setUploading(true);
    try {
      let imageUrl = '';
      if (imageUri) {
        const blob = await fetch(imageUri).then((res) => res.blob());
        imageUrl = await uploadCommunityImage(user.uid, blob, 'image/jpeg');
      }
      await createPost(user.uid, profile.username, profile.avatarUrl, '', imageUrl, caption.trim());
      await applyXp(user.uid, 10);
      await refreshProfile();
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={Colors.ui.text} />
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity style={[styles.postBtn, (!caption.trim() || uploading) && styles.postBtnDisabled]} onPress={handleSubmit} disabled={!caption.trim() || uploading}>
          {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color={Colors.ui.textSecondary} />
              <Text style={styles.imageHint}>Add a photo</Text>
            </View>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.captionInput}
          placeholder="Write a caption for your farm photo..."
          value={caption}
          onChangeText={setCaption}
          multiline
          placeholderTextColor={Colors.ui.textSecondary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12, backgroundColor: Colors.ui.surface, borderBottomWidth: 1, borderBottomColor: Colors.ui.border },
  title: { fontSize: 18, fontWeight: '600', color: Colors.ui.text },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  content: { flex: 1, padding: 16 },
  imagePicker: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.ui.border, backgroundColor: Colors.ui.surface },
  preview: { width: '100%', height: 220, resizeMode: 'cover' },
  imagePlaceholder: { height: 140, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imageHint: { fontSize: 14, color: Colors.ui.textSecondary },
  captionInput: { backgroundColor: Colors.ui.surface, borderWidth: 1, borderColor: Colors.ui.border, borderRadius: 12, padding: 16, fontSize: 16, color: Colors.ui.text, minHeight: 120, textAlignVertical: 'top' },
});
