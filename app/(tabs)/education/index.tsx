import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../../src/constants/colors';
import { EDUCATION_ARTICLES } from '../../../src/constants/species';
import { useAuth } from '../../../src/contexts/AuthContext';
import Header from '../../../src/components/Header';
import { EducationArticle } from '../../../src/types';

type CategoryKey = 'species' | 'biology' | 'behavior' | 'care' | 'all';

export default function EducationScreen() {
  const { profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'species', label: 'Species', icon: 'bug' },
    { key: 'biology', label: 'Biology', icon: 'fitness' },
    { key: 'behavior', label: 'Behavior', icon: 'git-network' },
    { key: 'care', label: 'Care', icon: 'heart' },
  ];

  const level = profile?.level ?? 1;
  const articles: EducationArticle[] =
    activeCategory === 'all'
      ? EDUCATION_ARTICLES
      : EDUCATION_ARTICLES.filter((a) => a.category === activeCategory);

  const handleOpen = (article: EducationArticle) => {
    if (article.unlockLevel > level) {
      Alert.alert('Locked', `Reach Level ${article.unlockLevel} to unlock this article.`);
      return;
    }
    router.push(`/(tabs)/education/${article.id}`);
  };

  return (
    <View style={styles.container}>
      <Header title="Learn About Ants" />

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryCard, activeCategory === cat.key && styles.categoryCardActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Ionicons name={cat.icon as any} size={22} color={activeCategory === cat.key ? '#fff' : Colors.primary} />
              <Text style={[styles.categoryLabel, activeCategory === cat.key && styles.categoryLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Articles</Text>
        {articles.map((article) => {
          const locked = article.unlockLevel > level;
          return (
            <TouchableOpacity key={article.id} style={[styles.articleCard, locked && styles.articleCardLocked]} onPress={() => handleOpen(article)}>
              <View style={styles.articleIcon}>
                <Ionicons name={locked ? 'lock-closed' : 'document-text'} size={24} color={locked ? Colors.ui.textSecondary : Colors.primary} />
              </View>
              <View style={styles.articleInfo}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSummary}>{article.summary}</Text>
                <Text style={styles.articleMeta}>
                  {locked ? `Locked · Level ${article.unlockLevel}` : `Level ${article.unlockLevel} · ${article.category}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.ui.textSecondary} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ui.background },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.ui.text, marginBottom: 12, marginTop: 8 },
  categoriesRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  categoryCard: {
    flex: 1, backgroundColor: Colors.ui.surface, borderRadius: 12, padding: 16,
    alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.ui.border,
  },
  categoryCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryLabel: { fontSize: 12, color: Colors.ui.text, fontWeight: '500' },
  categoryLabelActive: { color: '#fff' },
  articleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.ui.surface,
    borderRadius: 12, padding: 16, marginBottom: 12, gap: 12,
    borderWidth: 1, borderColor: Colors.ui.border,
  },
  articleCardLocked: { opacity: 0.7 },
  articleIcon: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.ui.card,
    justifyContent: 'center', alignItems: 'center',
  },
  articleInfo: { flex: 1 },
  articleTitle: { fontSize: 16, fontWeight: '600', color: Colors.ui.text, marginBottom: 2 },
  articleSummary: { fontSize: 13, color: Colors.ui.textSecondary, marginBottom: 4 },
  articleMeta: { fontSize: 11, color: Colors.primaryLight, fontWeight: '500' },
});
