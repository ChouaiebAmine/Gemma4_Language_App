import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';
import { useUser } from '../context/UserContext';

const DIFFICULTY_LABELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function HomeScreen({ navigation }) {
  const {
    languages,
    selectedLanguage,
    enrolledLanguages,
    languageProgress,
    easyProgressPct,
    fetchLanguages,
    selectLanguage,
    fetchLanguageProgress,
    refreshAllProgress,
    isLoading,
  } = useLanguage();
  const { user, stats } = useUser();

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  // Refresh progress every time we come back to this screen
  useFocusEffect(
    useCallback(() => {
      refreshAllProgress();
    }, [refreshAllProgress])
  );

  const handleSelectLanguage = async (language) => {
    await selectLanguage(language);
    navigation.navigate('Topics');
  };

  const handleContinueLanguage = async (language) => {
    await selectLanguage(language);
    navigation.navigate('Topics');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#32435e', '#32435e']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.username}>{user?.name || 'Learner'}</Text>
          </View>
          <View style={styles.headerStats}>
            <StatBadge icon={<Ionicons name="flame" size={20} color="#fff" />} value={stats?.streak || 0} label="Streak" />
            <StatBadge icon={<Ionicons name="star" size={20} color="#fff" />} value={stats?.points || 0} label="Points" />
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <QuickStat icon="" title="Lessons Completed" value={stats?.lessons_completed || 0} />
        <QuickStat icon="" title="Correct Answers" value={stats?.correct_answers || 0} />
        <QuickStat icon="" title="Minutes Learned" value={stats?.learning_time || 0} />
      </View>

      {/* Continue Learning — shows ALL enrolled languages */}
      {enrolledLanguages.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          {enrolledLanguages.map((lang) => {
            const langId = lang._id || lang.id;

            return (
              <TouchableOpacity
                key={langId}
                style={styles.continueCard}
                onPress={() => handleContinueLanguage(lang)}
              >
                <View style={styles.continueContent}>
                  <View style={styles.continueHeader}>
                    <Text style={styles.continueLanguage}>{lang.name}</Text>
                    <Text style={styles.continuePct}>{easyProgressPct}%</Text>
                  </View>
                  <Text style={styles.continueNext}>
                    {easyProgressPct >= 100
                      ? ' All Easy topics completed!'
                      : easyProgressPct > 0
                      ? ` Easy topics: ${easyProgressPct}% complete`
                      : 'Start your first activity!'}
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${easyProgressPct}%` }]} />
                  </View>
                  {easyProgressPct >= 100 && (
                    <Text style={styles.unlockedHint}> {<Ionicons name="fire" size={16} color="#FF6B6B" />} Medium difficulty unlocked!</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Languages Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Language</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#32435e" style={{ marginVertical: 20 }} />
        ) : (
          <FlatList
            data={languages}
            keyExtractor={(item) => item._id || item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <LanguageCard
                language={item}
                onPress={() => handleSelectLanguage(item)}
              />
            )}
          />
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionButton icon="headphones" title="Listening" color="#4ECDC4" onPress={() => navigation.navigate('Activities')} />
          <ActionButton icon="pencil" title="Writing" color="#FFB6C1" onPress={() => navigation.navigate('Activities')} />
          <ActionButton icon="comment-check" title="Speaking" color="#87CEEB" onPress={() => navigation.navigate('Activities')} />
          <ActionButton icon="lightbulb" title="Tips" color="#FFD700" onPress={() => alert('Tips coming soon')} />
        </View>
      </View>
    </ScrollView>
  );
}

function StatBadge({ icon, value, label }) {
  return (
    <View style={styles.statBadge}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickStat({ icon, title, value }) {
  return (
    <View style={styles.quickStatCard}>
      <Text style={styles.quickStatIcon}>{icon}</Text>
      <Text style={styles.quickStatTitle}>{title}</Text>
      <Text style={styles.quickStatValue}>{value}</Text>
    </View>
  );
}

function LanguageCard({ language, onPress }) {
  return (
    <TouchableOpacity style={styles.languageCard} onPress={onPress}>
      <LinearGradient
        colors={['#32435e', '#32435e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.languageGradient}
      >
        <View style={styles.languageContent}>
          <Text style={styles.languageFlag}>🌍</Text>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>{language.name}</Text>
            <Text style={styles.languageCode}>{language.code || 'CODE'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ActionButton({ icon, title, color, onPress }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 16, color: '#fff', opacity: 0.9 },
  username: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 4 },
  headerStats: { flexDirection: 'row', gap: 12 },
  statBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 },
  statLabel: { fontSize: 10, color: '#fff', marginTop: 2 },
  quickStats: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  quickStatIcon: { fontSize: 28, marginBottom: 4 },
  quickStatTitle: { fontSize: 11, color: '#999', textAlign: 'center' },
  quickStatValue: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 },
  section: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },

  // Continue Learning cards
  continueCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  continueContent: { flex: 1 },
  continueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  continueLanguage: { fontSize: 16, fontWeight: '700', color: '#333' },
  continuePct: { fontSize: 13, fontWeight: '700', color: '#32435e' },
  continueNext: { fontSize: 12, color: '#888', marginTop: 3, marginBottom: 6 },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#32435e', borderRadius: 3 },
  unlockedHint: { fontSize: 12, color: '#32435e', fontWeight: '600', marginTop: 4 },

  languageCard: { marginBottom: 12, borderRadius: 12, overflow: 'hidden' },
  languageGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  languageContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  languageFlag: { fontSize: 32, marginRight: 12 },
  languageInfo: { flex: 1 },
  languageName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  languageCode: { fontSize: 12, color: '#fff', opacity: 0.8, marginTop: 2 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: { fontSize: 12, fontWeight: '600', color: '#333' },
});