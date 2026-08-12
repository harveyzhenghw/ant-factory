import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { EDUCATION_ARTICLES } from '../../../src/constants/species';

export default function ArticleScreen() {
  const { articleId } = useLocalSearchParams<{ articleId: string }>();
  const article = EDUCATION_ARTICLES.find((a) => a.id === articleId);

  if (!article) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Article Not Found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{article.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.metaCard}>
          <Text style={styles.category}>{article.category}</Text>
          <Text style={styles.level}>Level {article.unlockLevel}</Text>
        </View>
        <Text style={styles.summary}>{article.summary}</Text>
        <Text style={styles.body}>{article.content}</Text>
      </ScrollView>
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
  metaCard: {
    flexDirection: 'row', gap: 12, marginBottom: 20,
  },
  category: {
    backgroundColor: Colors.primaryLight, color: '#fff', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, fontSize: 12, fontWeight: '600', overflow: 'hidden',
  },
  level: {
    backgroundColor: Colors.ui.card, color: Colors.ui.textSecondary, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, fontSize: 12, fontWeight: '600', overflow: 'hidden',
  },
  summary: {
    fontSize: 16, color: Colors.ui.text, fontWeight: '500', marginBottom: 16,
    lineHeight: 22,
  },
  body: {
    fontSize: 15, color: Colors.ui.text, lineHeight: 24,
  },
});
