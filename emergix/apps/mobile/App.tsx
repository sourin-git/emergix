import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import Screens and Global Components
import SOSScreen from './src/screens/SOSScreen';
import TrackingScreen from './src/screens/TrackingScreen';
import FirstAidScreen from './src/screens/FirstAidScreen';
import NetworkBanner from './src/components/NetworkBanner';

// Import Backend Initializers
import { useConnectivityStore } from './src/store/useConnectivityStore';
import { initDB } from './src/services/Database';

const Stack = createStackNavigator();

export default function App() {
  const { initialize } = useConnectivityStore();

  useEffect(() => {
    // 1. Kickstart background Battery & NetInfo Polling 
    initialize(); 
    
    // 2. Launch local SQLite schema definitions safely
    try {
       initDB(); 
    } catch (e) {
       console.log("Database bootup logs:", e)
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#121212' }}>
      {/* Persisted Amber Warning overrides navigation contexts globally */}
      <NetworkBanner />
      
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SOSScreen">
          <Stack.Screen name="SOSScreen" component={SOSScreen} />
          <Stack.Screen name="TrackingScreen" component={TrackingScreen} />
          <Stack.Screen name="FirstAidScreen" component={FirstAidScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
