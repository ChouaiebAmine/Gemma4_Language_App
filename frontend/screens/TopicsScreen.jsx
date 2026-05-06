import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';

const TOPIC_COLORS = [
  ['#6d2c2d', '#6d2c2d'],
  ['#366848', '#366848'],
  ['#6a97d1', '#6a97d1'],
  ['#87CEEB', '#6FB8DB'],
  ['#FFD700', '#FFC700'],
  ['#9370DB', '#8560C8'],
];

const ALL_TYPES = ['listening', 'writing', 'reading'];
const TYPE_ICONS = { listening: 'headphones', writing: 'pencil', reading: 'book' };

export default function TopicsScreen({ navigation }) {
  const {
    selectedLanguage, topics, fetchTopics, generateAiTopics,
    fetchActivities, topicProgress, fetchTopicProgress, isLoading,
  } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      if (selectedLanguage) {
        const langId = selectedLanguage._id || selectedLanguage.id;
        fetchTopics(langId);
        fetchTopicProgress(langId);
      }
    }, [selectedLanguage])
  );

  const handleSelectTopic = async (topic) => {
    const topicId = topic.id || topic._id;
    await fetchActivities(topicId);
    navigation.navigate('Activities', { topicId, topic });
  };

  const completedCount = Object.values(topicProgress).filter(t => t.easy_completed).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#32435e', '#32435e']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedLanguage?.name || 'Topics'}</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.headerSubtitle}>{topics.length} topics available</Text>
          {completedCount > 0 && (
            <View style={styles.completedPill}>
              <Ionicons name="checkmark-circle" size={13} color="#fff" />
              <Text style={styles.completedPillText}>{completedCount} completed</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : topics.length > 0 ? (
        <FlatList
          data={topics}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const topicId = item.id || item._id;
            const completion = topicProgress[topicId] || {};
            const typesDone = completion.easy_types_done || [];
            const easyCompleted = completion.easy_completed || false;
            const mediumCompleted = completion.medium_completed || false;
            const hardCompleted = completion.hard_completed || false;

            // Derive a single status label
            let status = 'not_started';
            if (hardCompleted) status = 'mastered';
            else if (easyCompleted || mediumCompleted) status = 'in_progress';
            else if (typesDone.length > 0) status = 'in_progress';

            return (
              <TopicCard
                topic={item}
                colors={TOPIC_COLORS[index % TOPIC_COLORS.length]}
                onPress={() => handleSelectTopic(item)}
                status={status}
                typesDone={typesDone}
                easyCompleted={easyCompleted}
                mediumCompleted={mediumCompleted}
                hardCompleted={hardCompleted}
              />
            );
          }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{<Ionicons name="robot" size={40} color="#ccc" />}</Text>
          <Text style={styles.emptyText}>No topics found</Text>
          <TouchableOpacity style={styles.generateButton} onPress={generateAiTopics}>
            <Text style={styles.buttonText}>Generate AI Topics</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', icon: 'ellipse-outline',    bg: 'rgba(255,255,255,0.15)', color: '#fff' },
  in_progress:  { label: 'In Progress',  icon: 'time-outline',       bg: 'rgba(255,200,0,0.35)',   color: '#fff' },
  mastered:     { label: 'Mastered',     icon: 'star',               bg: 'rgba(255,255,255,0.35)', color: '#fff' },
};

function TopicCard({ topic, colors, onPress, status, typesDone, easyCompleted, mediumCompleted, hardCompleted }) {
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;

  return (
    <TouchableOpacity style={styles.topicCard} onPress={onPress}>
      <LinearGradient colors={colors} style={styles.cardGradient}>

        {/* Status badge — top right */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Ionicons name={statusCfg.icon} size={13} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Main content */}
        <View style={styles.cardContent}>
          <Text style={styles.topicIcon}>{topic.icon || <Ionicons name="book" size={45} color="#fff" />}</Text>
          <View style={styles.topicInfo}>
            <Text style={styles.topicName}>{topic.name}</Text>
            {topic.target_name && (
              <Text style={styles.topicTargetName}>{topic.target_name}</Text>
            )}
            <Text style={styles.topicDesc}>{topic.description || 'Tap to start learning'}</Text>
          </View>
        </View>

        {/* Activity type progress dots */}
        <View style={styles.typeRow}>
          {ALL_TYPES.map(t => {
            const done = typesDone.includes(t);
            return (
              <View key={t} style={[styles.typeChip, done ? styles.typeChipDone : styles.typeChipPending]}>
                <MaterialCommunityIcons
                  name={TYPE_ICONS[t]}
                  size={12}
                  color={done ? '#fff' : 'rgba(255,255,255,0.5)'}
                />
                <Text style={[styles.typeChipLabel, !done && styles.typeChipLabelPending]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Difficulty level pills */}
        {(easyCompleted || mediumCompleted || hardCompleted) && (
          <View style={styles.levelRow}>
            {[
              { label: 'Easy',   done: easyCompleted },
              { label: 'Medium', done: mediumCompleted },
              { label: 'Hard',   done: hardCompleted },
            ].map(({ label, done }) => (
              done ? (
                <View key={label} style={styles.levelPill}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                  <Text style={styles.levelPillText}>{label}</Text>
                </View>
              ) : null
            ))}
          </View>
        )}

        <View style={styles.cardFooter}>
          {topic.difficulty && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{topic.difficulty}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },

  header: { paddingTop: 16, paddingBottom: 24, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9 },
  completedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12,
  },
  completedPillText: { fontSize: 12, color: '#fff', fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingVertical: 12 },

  topicCard: { marginBottom: 12, borderRadius: 16, overflow: 'hidden' },
  cardGradient: { paddingHorizontal: 16, paddingVertical: 14 },

  // Status badge
  cardHeader: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '700' },

  // Main row
  cardContent: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  topicIcon: { fontSize: 38, marginRight: 12 },
  topicInfo: { flex: 1 },
  topicName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  topicTargetName: { fontSize: 13, fontWeight: '600', color: '#fff', opacity: 0.9, fontStyle: 'italic', marginTop: 2 },
  topicDesc: { fontSize: 13, color: '#fff', opacity: 0.8, marginTop: 4 },

  // Type chips
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  typeChipDone: { backgroundColor: 'rgba(255,255,255,0.35)' },
  typeChipPending: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  typeChipLabel: { fontSize: 11, color: '#fff', fontWeight: '600' },
  typeChipLabelPending: { opacity: 0.5 },

  // Level pills (only shown when at least one level is completed)
  levelRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  levelPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  levelPillText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  difficultyBadge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  difficultyText: { fontSize: 11, color: '#fff', fontWeight: '600', textTransform: 'capitalize' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#333' },
  generateButton: {
    marginTop: 20, backgroundColor: '#FF6B6B', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});