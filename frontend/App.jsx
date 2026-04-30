import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Screens
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import LanguagesScreen from './screens/LanguagesScreen';
import TopicsScreen from './screens/TopicsScreen';
import ActivitiesScreen from './screens/ActivitiesScreen';
import LearnScreen from './screens/LearnScreen';
// import EvaluateScreen from './screens/EvaluateScreen';
//import AchievementsScreen from './screens/AchievementsScreen';
//import AnalyticsScreen from './screens/AnalyticsScreen';
//import SettingsScreen from './screens/SettingsScreen';

// Context
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Topics" component={TopicsScreen} />
      <Stack.Screen name="Activities" component={ActivitiesScreen} />
      <Stack.Screen name="Learn" component={LearnScreen} />
      {/*<Stack.Screen name="Evaluate" component={EvaluateScreen} />*/}
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 10,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -5,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#999',
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Languages"
        component={LanguagesScreen}
        options={{
          tabBarLabel: 'Languages',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="language-python" size={size} color={color} />
          ),
        }}
      />
      {/*
        <Tab.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{
            tabBarLabel: 'Achievements',
            tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy-outline" size={size} color={color} />
          ),
        }}
      /> */}
      {/*
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      /> */}
      {/*<Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />*/}
    </Tab.Navigator>
  );
}

// Root Navigator
function RootNavigator({ isLoading, userToken }) {
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userToken ? (
        <Stack.Screen name="Splash" component={SplashScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => {
      setIsLoading(false);
      setUserToken('demo_user'); // In real app, get from secure storage
    }, 2000);
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <UserProvider>
        <LanguageProvider>
          <NavigationContainer>
            <RootNavigator isLoading={isLoading} userToken={userToken} />
          </NavigationContainer>
        </LanguageProvider>
      </UserProvider>
    </>
  );
}
