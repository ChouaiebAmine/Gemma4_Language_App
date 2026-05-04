import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const TOPIC_COLORS = [
  ['#7c3d3d', '#7c3d3d'],
  ['#1d7c75', '#1d7c75'],
  ['#e17686', '#e17686'],
  ['#3884a2', '#6FB8DB'],
  ['#FFD700', '#FFC700'],
  ['#9370DB', '#8560C8'],
];

export default function TopicsScreen({ navigation }) {
  const { selectedLanguage, topics, fetchTopics, generateAiTopics, fetchActivities, isLoading } = useLanguage();

  useEffect(() => {
    if (selectedLanguage) {
      fetchTopics(selectedLanguage._id || selectedLanguage.id);
    }
  }, [selectedLanguage, fetchTopics]);

  const handleSelectTopic = async (topic) => {
    // Pass full topic object so generateActivities can use the topic name for the AI
    const topicId = topic.id || topic._id;
    await fetchActivities(topicId);
    navigation.navigate('Activities', { topicId, topic });
  };

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
        <Text style={styles.headerSubtitle}>
          {topics.length} topics available
        </Text>
      </LinearGradient>

      {/* Topics List */}
{isLoading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : topics.length > 0 ? (
        <FlatList
          data={topics}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={({ item, index }) => (
            <TopicCard
              topic={item}
              colors={TOPIC_COLORS[index % TOPIC_COLORS.length]}
              onPress={() => handleSelectTopic(item)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}><Ionicons name="book" size={40} color="#ccc" /></Text>
          <Text style={styles.emptyText}>No topics found</Text>
          <TouchableOpacity 
            style={styles.generateButton} 
            onPress={generateAiTopics} 
          >
            <Text style={styles.buttonText}>Generate AI Topics</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TopicCard({ topic, colors, onPress }) {
  return (
    <TouchableOpacity style={styles.topicCard} onPress={onPress}>
      <LinearGradient colors={colors} style={styles.cardGradient}>
        <View style={styles.cardContent}>
          <Text style={styles.topicIcon}>
            {topic.icon || <Ionicons name="book" size={40} color="#fff" />}
          </Text>
          <View style={styles.topicInfo}>
            <Text style={styles.topicName}>{topic.name}</Text>
            {topic.target_name && (
              <Text style={styles.topicTargetName}>{topic.target_name}</Text>
            )}
            <Text style={styles.topicDesc}>{topic.description || 'Click to learn'}</Text>
            {topic.lesson_count && (
              <View style={styles.metaInfo}>
                <Ionicons name="play-circle" size={14} color="#fff" />
                <Text style={styles.metaText}>{topic.lesson_count} lessons</Text>
              </View>
            )}
          </View>
        </View>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topicCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topicIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  topicTargetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
    fontStyle: 'italic',
    marginTop: 2,
  },
  topicDesc: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.85,
    marginTop: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
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