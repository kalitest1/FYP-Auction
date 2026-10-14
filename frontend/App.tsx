import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from '@expo/vector-icons/Ionicons';

// 1. 引入 Context Provider 與 Hook
import { AppProvider } from './src/context/AppContext';

// 2. 導入頁面組件 (對應 src/ 目錄)
import SearchScreen from './src/Search';
import WatchlistScreen from './src/Watchlist';
import SellScreen from './src/Sell';
import ActivityScreen from './src/Activity';
import ProfileScreen from './src/Profile';
import SearchListScreen from './src/Searchlist';
import AuctionRoomScreen from './src/AuctionRoom';

export type BottomTabParamList = {
  Search: { mode: 'Buyer' | 'Seller' };
  Watchlist: { mode: 'Buyer' | 'Seller' };
  Sell: { mode: 'Buyer' | 'Seller' };
  Activity: { mode: 'Buyer' | 'Seller' };
  Profile: { mode: 'Buyer' | 'Seller' };
};

export type RootStackParamList = {
  MainTabs: undefined;
  SearchList: { query?: string; category?: string };
  AuctionRoom: { auctionId?: string; title?: string };
};

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [mode, setMode] = useState<'Buyer' | 'Seller'>('Buyer');

  const toggleMode = () => {
    setMode((prev) => (prev === 'Buyer' ? 'Seller' : 'Buyer'));
  };

  function MainTabs() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false, // 隱藏 Tab 頂部 Header
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case 'Search':
                iconName = focused ? 'search' : 'search-outline';
                break;
              case 'Watchlist':
                iconName = focused ? 'time' : 'time-outline';
                break;
              case 'Sell':
                iconName = focused ? 'add-circle' : 'add-circle-outline';
                break;
              case 'Activity':
                iconName = focused ? 'notifications' : 'notifications-outline';
                break;
              case 'Profile':
                iconName = focused ? 'person' : 'person-outline';
                break;
              default:
                iconName = 'help-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Search">
          {(props) => <SearchScreen {...props} mode={mode} />}
        </Tab.Screen>
        
        <Tab.Screen name="Watchlist">
          {(props) => <WatchlistScreen {...props} mode={mode} />}
        </Tab.Screen>

        <Tab.Screen name="Sell">
          {(props) => <SellScreen {...props} mode={mode} />}
        </Tab.Screen>

        <Tab.Screen name="Activity">
          {(props) => <ActivityScreen {...props} mode={mode} />}
        </Tab.Screen>

        <Tab.Screen name="Profile">
          {(props) => <ProfileScreen {...props} mode={mode} onToggleMode={toggleMode} />}
        </Tab.Screen>
      </Tab.Navigator>
    );
  }

  return (
    // 用 AppProvider 包裹全域導航
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="SearchList" 
            component={SearchListScreen} 
            options={{ headerShown: true, title: 'Search Results' }}
          />
          <Stack.Screen 
            name="AuctionRoom" 
            component={AuctionRoomScreen} 
            options={({ route }) => ({
              headerShown: true,
              title: route.params?.title || 'Live Auction Room',
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}