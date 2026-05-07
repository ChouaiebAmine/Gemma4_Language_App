import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const ACTIVITY_TYPES = {
  listening: { icon: 'headphones', color: ['#4ECDC4', '#45B9B0'] },
  writing: { icon: 'pencil', color: ['#FFB6C1', '#FFA0B4'] },
  speaking: { icon: 'microphone', color: ['#87CEEB', '#6FB8DB'] },
  reading: { icon: 'book', color: ['#FFD700', '#FFC700'] },
  quiz: { icon: 'help-circle', color: ['#9370DB', '#8560C8'] },
};

const DIFFICULTY_CONFIG = [
  { level: 0, label: 'Easy', emoji: <Ionicons name="leaf" size={20} color="#fff" />, colors: ['#4ECDC4', '#45B9B0'] },
  { level: 1, label: 'Medium', emoji: <Ionicons name="flame" size={20} color="#fff" />, colors: ['#FFB347', '#FF8C00'] },
  { level: 2, label: 'Hard', emoji: <Ionicons name="bolt" size={20} color="#fff" />, colors: ['#9370DB', '#7B52D4'] },
];

const ALL_TYPES = ['listening', 'writing', 'reading'];

export default function ActivitiesScreen({ navigation, route }) {
  const {
    activities,
    fetchActivities,
    generateActivities,
    generateActivitiesForDifficulty,
    topicProgress,
    fetchTopicProgress,
    selectedLanguage,
    isLoading,
  } = useLanguage();

  const topicId = route.params?.topicId;
  const topic = route.params?.topic;
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [generatingDifficulty, setGeneratingDifficulty] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (topicId) {
        fetchActivities(topicId);
        if (selectedLanguage) {
          fetchTopicProgress(selectedLanguage._id || selectedLanguage.id);
        }
      }
    }, [topicId, selectedLanguage])
  );

  // Derive completion state for this topic from context
  const topicCompletion = topicProgress[topicId] || {
    easy_completed: false,
    easy_types_done: [],
    medium_completed: false,
    medium_types_done: [],
    hard_completed: false,
    hard_types_done: [],
  };

  // Group activities by difficulty
  const activitiesByDifficulty = useMemo(() => {
    const grouped = { 0: [], 1: [], 2: [] };
    for (const act of activities) {
      const d = act.difficulty ?? 0;
      if (grouped[d] !== undefined) grouped[d].push(act);
    }
    return grouped;
  }, [activities]);

  // Determine which difficulty levels are unlocked
  const isUnlocked = (level) => {
    if (level === 0) return true;
    if (level === 1) return topicCompletion.easy_completed;
    if (level === 2) return topicCompletion.medium_completed;
    return false;
  };

  // Completion for a given difficulty level
  const isCompleted = (level) => {
    if (level === 0) return topicCompletion.easy_completed;
    if (level === 1) return topicCompletion.medium_completed;
    if (level === 2) return topicCompletion.hard_completed;
    return false;
  };

  // Types done for a given difficulty
  const typesDone = (level) => {
    if (level === 0) return topicCompletion.easy_types_done || [];
    if (level === 1) return topicCompletion.medium_types_done || [];
    if (level === 2) return topicCompletion.hard_types_done || [];
    return [];
  };

  const handleGenerateForDifficulty = async (difficulty) => {
    setGeneratingDifficulty(difficulty);
    try {
      if (difficulty === 0) {
        await generateActivities(topic || topicId);
      } else {
        await generateActivitiesForDifficulty(topic || topicId, difficulty);
      }
      if (topicId) await fetchActivities(topicId);
      if (selectedLanguage) await fetchTopicProgress(selectedLanguage._id || selectedLanguage.id);
    } finally {
      setGeneratingDifficulty(null);
    }
  };

  const handleStartActivity = (activity) => {
    // Pass all activities for this difficulty so results screen can suggest the other types
    const sameLevel = Object.values(activitiesByDifficulty[selectedDifficulty] || []);
    navigation.navigate('Learn', {
      activity,
      topicActivities: sameLevel,
    });
  };

  const currentActivities = activitiesByDifficulty[selectedDifficulty] || [];
  const isCurrentUnlocked = isUnlocked(selectedDifficulty);
  const isCurrentCompleted = isCompleted(selectedDifficulty);
  const currentTypesDone = typesDone(selectedDifficulty);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#32435e', '#32435e']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleArea}>
            <Text style={styles.headerTitle}>{topic?.name || 'Activities'}</Text>
            {topic?.target_name && (
              <Text style={styles.headerSubtitle}>{topic.target_name}</Text>
            )}
          </View>
          <View style={{ width: 28 }} />
        </View>

        {/* Difficulty Tabs */}
        <View style={styles.difficultyTabs}>
          {DIFFICULTY_CONFIG.map((config) => {
            const unlocked = isUnlocked(config.level);
            const completed = isCompleted(config.level);
            const active = selectedDifficulty === config.level;
            return (
              <TouchableOpacity
                key={config.level}
                style={[
                  styles.difficultyTab,
                  active && styles.difficultyTabActive,
                  !unlocked && styles.difficultyTabLocked,
                ]}
                onPress={() => unlocked && setSelectedDifficulty(config.level)}
                disabled={!unlocked}
              >
                <Text style={styles.difficultyTabEmoji}>
                  {!unlocked ? '🔒' : completed ? '✅' : config.emoji}
                </Text>
                <Text style={[styles.difficultyTabLabel, !unlocked && styles.difficultyTabLabelLocked]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* Completion / Lock Banner */}
      {isCurrentCompleted ? (
        <View style={[styles.banner, styles.bannerSuccess]}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.bannerText}>
            Level completed! {selectedDifficulty < 2 ? `${DIFFICULTY_CONFIG[selectedDifficulty + 1].label} is now unlocked ` : 'You mastered this topic! '}
          </Text>
        </View>
      ) : !isCurrentUnlocked ? (
        <View style={[styles.banner, styles.bannerLocked]}>
          <Ionicons name="lock-closed" size={20} color="#fff" />
          <Text style={styles.bannerText}>
            Complete {DIFFICULTY_CONFIG[selectedDifficulty - 1].label} first to unlock this level
          </Text>
        </View>
      ) : currentTypesDone.length > 0 && !isCurrentCompleted ? (
        <View style={[styles.banner, styles.bannerProgress]}>
          <Ionicons name="time" size={18} color="#fff" />
          <Text style={styles.bannerText}>
            In progress: {currentTypesDone.join(', ')} done · {ALL_TYPES.filter(t => !currentTypesDone.includes(t)).join(', ')} remaining
          </Text>
        </View>
      ) : null}

      {/* Activities for selected difficulty */}
      {isLoading && generatingDifficulty === null ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : !isCurrentUnlocked ? (
        <View style={styles.lockedState}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Level Locked</Text>
          <Text style={styles.lockedDesc}>
            Finish all Easy activities for this topic to unlock {DIFFICULTY_CONFIG[selectedDifficulty].label}
          </Text>
        </View>
      ) : currentActivities.length > 0 ? (
        <FlatList
          data={currentActivities}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => {
            const typeDone = currentTypesDone.includes(item.type);
            return (
              <ActivityCard
                activity={item}
                completed={typeDone}
                onPress={() => handleStartActivity(item)}
              />
            );
          }}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.generateButton, { margin: 8, marginBottom: 24 }]}
              onPress={() => handleGenerateForDifficulty(selectedDifficulty)}
              disabled={isLoading || generatingDifficulty !== null}
            >
              {generatingDifficulty === selectedDifficulty ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateText}>+ Generate More Activities</Text>
              )}
            </TouchableOpacity>
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{<Ionicons name="book" size={40} color="#5176b1" />}</Text>
          <Text style={styles.emptyText}>No {DIFFICULTY_CONFIG[selectedDifficulty].label} activities yet</Text>
          <Text style={styles.emptyDesc}>Generate AI activities for this difficulty</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => handleGenerateForDifficulty(selectedDifficulty)}
            disabled={isLoading || generatingDifficulty !== null}
          >
            {generatingDifficulty === selectedDifficulty ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateText}>Generate AI Activities</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const DIFFICULTY_LABELS = { 0: 'Easy', 1: 'Medium', 2: 'Hard' };
const DURATION_MAP = { 0: '3-5 mins', 1: '5-10 mins', 2: '10-15 mins' };

function ActivityCard({ activity, onPress, completed }) {
  const activityType = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.quiz;
  const difficultyLabel = DIFFICULTY_LABELS[activity.difficulty] ?? 'Easy';
  const duration = DURATION_MAP[activity.difficulty] ?? '5-10 mins';
  const title = activity.title ||
    `${activity.type?.charAt(0).toUpperCase() + activity.type?.slice(1)} — ${difficultyLabel}`;

  return (
    <TouchableOpacity style={styles.activityCard} onPress={onPress}>
      <LinearGradient colors={activityType.color} style={styles.cardGradient}>
        {completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={activityType.icon} size={28} color="#fff" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.activityTitle}>{title}</Text>
            <Text style={styles.activityDesc}>
              {activity.description || `Practice your ${activity.type} skills on the topic: ${activity.topic || ''}`}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaTags}>
            <Tag icon="⭐" label={difficultyLabel} />
            <Tag icon="⏱" label={duration} />
            {activity.points && <Tag icon="🏅" label={`${activity.points} pts`} />}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function Tag({ icon, label }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagIcon}>{icon}</Text>
      <Text style={styles.tagLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleArea: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#fff', opacity: 0.8, fontStyle: 'italic', marginTop: 2 },

  // Difficulty tabs
  difficultyTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  difficultyTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  difficultyTabActive: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  difficultyTabLocked: { opacity: 0.5 },
  difficultyTabEmoji: { fontSize: 18 },
  difficultyTabLabel: { fontSize: 11, fontWeight: '600', color: '#fff', marginTop: 2 },
  difficultyTabLabelLocked: { opacity: 0.7 },

  // Banners
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerSuccess: { backgroundColor: '#27ae60' },
  bannerLocked: { backgroundColor: '#888' },
  bannerProgress: { backgroundColor: '#e67e22' },
  bannerText: { color: '#fff', fontSize: 13, fontWeight: '500', flex: 1 },

  // Completed badge on card
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 8,
  },
  completedBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // Locked state
  lockedState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  lockedIcon: { fontSize: 56, marginBottom: 16 },
  lockedTitle: { fontSize: 20, fontWeight: '700', color: '#555', marginBottom: 8 },
  lockedDesc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },

  listContent: { paddingHorizontal: 16, paddingVertical: 12 },
  activityCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  cardGradient: { paddingHorizontal: 16, paddingVertical: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  activityDesc: { fontSize: 13, color: '#fff', opacity: 0.85, marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTags: { flexDirection: 'row', gap: 8, flex: 1 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  tagIcon: { fontSize: 12 },
  tagLabel: { fontSize: 11, color: '#fff', fontWeight: '500' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#999', marginTop: 8, marginBottom: 24 },
  generateButton: {
    backgroundColor: '#34435e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 180,
    alignItems: 'center',
  },
  generateText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});