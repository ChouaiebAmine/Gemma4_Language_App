import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

// ============= EVALUATE SCREEN =============
export function EvaluateScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.header}>
        <Text style={styles.headerTitle}>Evaluate</Text>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.comingSoonIcon}>🎯</Text>
        <Text style={styles.comingSoonText}>Evaluation Features</Text>
        <Text style={styles.comingSoonDesc}>Track your test results here</Text>
      </View>
    </View>
  );
}

// ============= ACHIEVEMENTS SCREEN =============
export function AchievementsScreen() {
  const achievements = [
    { id: 1, name: 'First Step', icon: '👟', desc: 'Complete your first lesson' },
    { id: 2, name: 'On Fire', icon: '🔥', desc: 'Maintain 7-day streak' },
    { id: 3, name: 'Polyglot', icon: '🌍', desc: 'Learn 3 languages' },
    { id: 4, name: 'Perfect Score', icon: '💯', desc: 'Get 100% on a quiz' },
    { id: 5, name: 'Night Owl', icon: '🦉', desc: 'Learn after 10 PM' },
    { id: 6, name: 'Speed Demon', icon: '⚡', desc: 'Complete activity in < 2 mins' },
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.header}>
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSubtitle}>Unlock all achievements</Text>
      </LinearGradient>

      <View style={styles.achievementGrid}>
        {achievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementCard}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.achievementDesc}>{achievement.desc}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ============= ANALYTICS SCREEN =============
export function AnalyticsScreen() {
  const { stats } = useUser();

  const chartData = [
    { day: 'Mon', minutes: 15 },
    { day: 'Tue', minutes: 20 },
    { day: 'Wed', minutes: 10 },
    { day: 'Thu', minutes: 25 },
    { day: 'Fri', minutes: 30 },
    { day: 'Sat', minutes: 40 },
    { day: 'Sun', minutes: 35 },
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
        <Text style={styles.headerSubtitle}>Your learning journey</Text>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <StatBox icon="📚" label="Lessons" value={stats?.lessons_completed || 0} />
        <StatBox icon="⭐" label="Points" value={stats?.points || 0} />
        <StatBox icon="🔥" label="Streak" value={stats?.streak || 0} />
        <StatBox icon="⏱️" label="Hours" value={stats?.learning_time || 0} />
      </View>

      {/* Weekly Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Weekly Activity</Text>
        <View style={styles.chart}>
          {chartData.map((item, idx) => (
            <View key={idx} style={styles.chartBar}>
              <View
                style={[styles.barFill, { height: `${(item.minutes / 40) * 100}%` }]}
              />
              <Text style={styles.barLabel}>{item.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Goals */}
      <View style={styles.goalsSection}>
        <Text style={styles.goalsTitle}>Goals</Text>
        <GoalItem title="Daily Goal" progress={75} target="30 mins" />
        <GoalItem title="Weekly Goal" progress={90} target="3 hours" />
        <GoalItem title="Accuracy" progress={85} target="90%" />
      </View>
    </ScrollView>
  );
}

// ============= SETTINGS SCREEN =============
export function SettingsScreen({ navigation }) {
  const { user, logout } = useUser();

  const handleLogout = async () => {
    await logout();
    // Navigation to Splash happens automatically
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <SettingItem icon="person" label="Name" value={user?.name || 'User'} />
        <SettingItem icon="mail" label="Email" value={user?.email || 'user@example.com'} />
        <SettingItem
          icon="calendar"
          label="Member Since"
          value={new Date().getFullYear().toString()}
        />
      </View>

      {/* Learning Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Learning</Text>
        <SettingToggle icon="notifications" label="Daily Reminders" defaultValue={true} />
        <SettingToggle icon="moon" label="Dark Mode" defaultValue={false} />
        <SettingToggle icon="volume-mute" label="Sound Effects" defaultValue={true} />
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <SettingItem icon="information-circle" label="Version" value="1.0.0" />
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="help-circle-outline" size={20} color="#FF6B6B" />
          <Text style={styles.settingLabel}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#FF6B6B" />
          <Text style={styles.settingLabel}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ============= HELPER COMPONENTS =============

function StatBox({ icon, label, value }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxIcon}>{icon}</Text>
      <Text style={styles.statBoxValue}>{value}</Text>
      <Text style={styles.statBoxLabel}>{label}</Text>
    </View>
  );
}

function GoalItem({ title, progress, target }) {
  return (
    <View style={styles.goalItem}>
      <View>
        <Text style={styles.goalTitle}>{title}</Text>
        <Text style={styles.goalTarget}>{target}</Text>
      </View>
      <View style={styles.goalProgressBar}>
        <View style={[styles.goalProgressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.goalPercent}>{progress}%</Text>
    </View>
  );
}

function SettingItem({ icon, label, value }) {
  return (
    <TouchableOpacity style={styles.settingItem}>
      <MaterialCommunityIcons name={icon} size={20} color="#FF6B6B" />
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </TouchableOpacity>
  );
}

function SettingToggle({ icon, label, defaultValue }) {
  const [enabled, setEnabled] = React.useState(defaultValue);
  return (
    <View style={styles.settingItem}>
      <MaterialCommunityIcons name={icon} size={20} color="#FF6B6B" />
      <Text style={styles.settingLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.toggle, enabled && styles.toggleActive]}
        onPress={() => setEnabled(!enabled)}
      >
        <View
          style={[styles.toggleButton, enabled && styles.toggleButtonActive]}
        />
      </TouchableOpacity>
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
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  comingSoonDesc: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  achievementCard: {
    width: '31%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  achievementDesc: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statBoxIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  statBoxLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  chartSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 12,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barFill: {
    width: 24,
    backgroundColor: '#FF6B6B',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 8,
    fontWeight: '600',
  },
  goalsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  goalsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  goalTarget: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  goalProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
  },
  goalPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
    width: 35,
    textAlign: 'right',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  settingValue: {
    fontSize: 12,
    color: '#999',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#FF6B6B',
  },
  toggleButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleButtonActive: {
    alignSelf: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
