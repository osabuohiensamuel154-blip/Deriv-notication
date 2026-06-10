import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { InstrumentsScreen } from './src/screens/InstrumentsScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { derivApi } from './src/services/derivApi';
import { notificationService } from './src/services/notifications';

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    notificationService.requestPermissions();
    derivApi.connect();
    return () => derivApi.disconnect();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: '#16213E', borderTopColor: '#1A1A2E', height: 60 },
          tabBarActiveTintColor: '#FF6B35',
          tabBarInactiveTintColor: '#64748B',
          headerStyle: { backgroundColor: '#16213E' },
          headerTintColor: '#E2E8F0',
          headerTitleStyle: { fontWeight: '700' },
          tabBarLabelStyle: { fontSize: 11, marginBottom: 4 },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Deriv Alerts',
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text>,
          }}
        />
        <Tab.Screen
          name="Instruments"
          component={InstrumentsScreen}
          options={{
            title: 'Instruments',
            tabBarLabel: 'Markets',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📊</Text>,
          }}
        />
        <Tab.Screen
          name="Alerts"
          component={AlertsScreen}
          options={{
            title: 'My Alerts',
            tabBarLabel: 'Alerts',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🔔</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
