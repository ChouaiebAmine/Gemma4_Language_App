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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const ACTIVITY_TYPES = {
  listening: { icon: 'headphones', color: ['#4ECDC4', '#45B9B0'] },
  writing: { icon: 'pencil', color: ['#FFB6C1', '#FFA0B4'] },
  speaking: { icon: 'microphone', color: ['#87CEEB', '#6FB8DB'] },
  reading: { icon: 'book', color: ['#FFD700', '#FFC700'] },
  quiz: { icon: 'help-circle', color: ['#9370DB', '#8560C8'] },
};

export default function ActivitiesScreen({ navigation, route }) {
  const { activities, fetchActivities, generateActivities, isLoading } = useLanguage();
  const topicId = route.params?.topicId;

  useEffect(() => {
    if (topicId) {
      fetchActivities(topicId);
    }
  }, [topicId, fetchActivities]);

  const handleGenerateActivities = async () => {
    if (topicId) {
      await generateActivities(topicId);
    }
  };

  const handleStartActivity = (activity) => {
    navigation.navigate('Learn', { activity });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#3a6567', '#6a71d5']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activities</Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      {/* Activities List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 40 }} />
      ) : activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => (
            <ActivityCard
              activity={item}
              onPress={() => handleStartActivity(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}></Text>
          <Text style={styles.emptyText}>No activities yet</Text>
          <Text style={styles.emptyDesc}>Generate activities for this topic using AI</Text>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateActivities}
            disabled={isLoading}
          >
            <Text style={styles.generateText}>
              {isLoading ? 'Generating...' : 'Generate AI Activities'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ActivityCard({ activity, onPress }) {
  const activityType = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.quiz;
  const difficulty = activity.difficulty || 'Beginner';
  const duration = activity.duration || '5-10 mins';

  return (
    <TouchableOpacity style={styles.activityCard} onPress={onPress}>
      <LinearGradient
        colors={activityType.color}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={activityType.icon}
              size={28}
              color="#fff"
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityDesc}>
              {activity.description || `Practice your ${activity.type} skills`}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaTags}>
            <Tag icon="" label={difficulty} />
            <Tag icon="" label={duration} />
            {activity.points && <Tag icon="" label={`${activity.points} points`} />}
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  activityDesc: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.85,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTags: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  tagIcon: {
    fontSize: 12,
  },
  tagLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
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
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  generateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});