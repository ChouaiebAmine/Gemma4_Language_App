import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function LanguagesScreen({ navigation }) {
  const { languages, fetchLanguages, selectLanguage, isLoading } = useLanguage();
  const [search, setSearch] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState([]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  useEffect(() => {
    const filtered = languages.filter((lang) =>
      lang.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredLanguages(filtered);
  }, [search, languages]);

  const handleSelectLanguage = async (languageId) => {
    await selectLanguage(languageId);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#32435e', '#32435e']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Languages</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#ccc"
          />
        </View>
      </LinearGradient>

      {/* Languages List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : filteredLanguages.length > 0 ? (
        <FlatList
          data={filteredLanguages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LanguageItem
              language={item}
              onPress={() => handleSelectLanguage(item )}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No languages found</Text>
          <Text style={styles.emptyDesc}>Try a different search term</Text>
        </View>
      )}
    </View>
  );
}

function LanguageItem({ language, onPress }) {
  const colors = [
    { start: '#32435e', end: '#32435e' },
    { start: '#d0b163', end: '#d0b163' },
    { start: '#652d35', end: '#652d35' },
    { start: '#ae8153', end: '#ae8153' },
    { start: '#3d9f76', end: '#3d9f76' },
  ];

  const color = colors[Math.floor(Math.random() * colors.length)];

  return (
    <TouchableOpacity style={styles.languageItem} onPress={onPress}>
      <LinearGradient colors={[color.start, color.end]} style={styles.itemGradient}>
        <View style={styles.itemContent}>
          <View>
            <Text style={styles.itemName}>{language.name}</Text>
            <Text style={styles.itemCode}>{language.code || 'Code'}</Text>
            {language.level && (
              <Text style={styles.itemLevel}>Level: {language.level}</Text>
            )}
          </View>
          <View style={styles.itemBadges}>
            {language.native_speakers && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {Math.floor(language.native_speakers / 1000)}K speakers
                </Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  languageItem: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  itemCode: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  itemLevel: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.7,
    marginTop: 4,
  },
  itemBadges: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});
