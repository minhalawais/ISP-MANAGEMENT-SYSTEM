import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { View, Text } from 'react-native';
import { Screen } from '../components/Screen';
import { CustomerListScreen } from '../features/customers/screens/CustomerListScreen';

// --- Placeholder Screens (Will be moved to features later) ---
const DashboardScreen = () => (
  <Screen><View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Dashboard</Text></View></Screen>
);
// Removed CustomersScreen placeholder
const FinanceScreen = () => (
  <Screen><View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Finance</Text></View></Screen>
);
const ProfileScreen = () => (
  <Screen><View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Profile</Text></View></Screen>
);

export type MainTabParamList = {
  Dashboard: undefined;
  Customers: undefined;
  Finance: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Customers') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Finance') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Customers" component={CustomerListScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
