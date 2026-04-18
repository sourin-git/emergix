import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as SMS from 'expo-sms';
import NetInfo from '@react-native-community/netinfo';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { useEmergencyStore } from '../store/useEmergencyStore';

// === STITCH MCP DESIGN TOKENS (EMERGIX SYSTEM MOCK) ===
const StitchTokens = {
  color: {
    primaryRed: '#FF3B30',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A5',
    chipSelected: '#FF3B30',
    chipUnselected: '#2C2C2E',
  },
  spacing: { sm: 8, md: 16, lg: 24, xl: 32 },
  typography: {
    header: { fontSize: 24, fontWeight: '700' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 12, fontWeight: '500' }
  },
  radius: { sm: 8, md: 12, mdlg: 16, round: 999 }
};

const INCIDENT_TYPES = ["Accident", "Heart Attack", "Snake Bite", "Fire", "Other"];

export default function SOSScreen({ navigation }: any) {
  const { incidentType, setIncidentType, landmark, setLandmark } = useEmergencyStore();
  
  const [address, setAddress] = useState<string>("Locating...");
  const [isOffline, setIsOffline] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState("100%"); // Represents a Native integration layer bridging native batteries
  const [countdown, setCountdown] = useState(3);
  const [isHolding, setIsHolding] = useState(false);
  
  const pulseScale = useSharedValue(1);
  const holdProgress = useSharedValue(0);

  useEffect(() => {
    // 1. Idle Pulse Animation Logic -> Heartbeat Effect
    pulseScale.value = withRepeat(
      withTiming(1.05, { duration: 1000 }), 
      -1, 
      true
    );

    // 2. NetInfo hook bindings (Low Cell checks SMS modes natively)
    const unsubscribe = NetInfo.addEventListener(state => {
      // Typically iOS/Android expose raw strength on native layers but simulate via net drops globally
      setIsOffline(!state.isConnected || (state.details?.strength && state.details.strength < 30));
    });

    // 3. Location Mapping utilizing Expo Reverse Geocoding natively
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
         setAddress("Location access denied");
         return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      let reverseLoc = await Location.reverseGeocodeAsync({
         latitude: loc.coords.latitude,
         longitude: loc.coords.longitude
      });
      if (reverseLoc.length > 0) {
         setAddress(`${reverseLoc[0].name || ''}, ${reverseLoc[0].city || ''}`);
      }
    })();

    return () => unsubscribe();
  }, []);

  // Timer declarations logic mapped globally per component lifecycle
  let holdTimer: any;
  let countdownInterval: any;

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      setIsHolding(true);
      setCountdown(3);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      holdProgress.value = withTiming(1, { duration: 1500 });
      
      let count = 3;
      countdownInterval = setInterval(() => {
        count -= 1;
        if(count > 0) setCountdown(count);
      }, 500);

      holdTimer = setTimeout(() => {
        clearInterval(countdownInterval);
        triggerSOS();
      }, 1500);

    } else if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED || event.nativeEvent.state === State.FAILED) {
      clearTimeout(holdTimer);
      clearInterval(countdownInterval);
      setIsHolding(false);
      holdProgress.value = withTiming(0, { duration: 300 }); // Returns ring mapping instantly smoothly
    }
  };

  const triggerSOS = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsHolding(false);
    
    // Natively inject directly to the emergency broadcast line if net drops entirely using OS native SMS overlay mappings
    if (isOffline) {
       await SMS.sendSMSAsync(
         ['108'],
         `SOS ALERT! Type: ${incidentType}. Location: ${address}. Landmark: ${landmark}`
       );
    }
    // Pipeline route to Navigation core
    navigation.navigate('TrackingScreen', { incidentType, isOffline });
  };

  // Reanimated style computations bindings
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: isHolding ? interpolate(holdProgress.value, [0, 1], [1, 0.9]) : pulseScale.value }
      ],
      backgroundColor: holdProgress.value > 0.8 ? '#D32F2F' : StitchTokens.color.primaryRed
    };
  });

  const progressRingStyle = useAnimatedStyle(() => {
    return {
       transform: [{ scale: interpolate(holdProgress.value, [0, 1], [1, 1.3], Extrapolate.CLAMP) }],
       opacity: interpolate(holdProgress.value, [0, 0.8, 1], [0, 0.5, 0])
    };
  });

  return (
    <View style={styles.container}>
      {/* Dynamic Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText} accessibilityLabel="Current Address, தற்போதைய முகவரி" numberOfLines={1}>
             {address}
          </Text>
        </View>
        <View style={styles.statusIcons}>
           <Text style={[styles.signalText, { color: isOffline ? '#FF9F0A' : StitchTokens.color.textSecondary }]}>
             {isOffline ? 'SMS Mode Fallback' : 'Active Live Net'}
           </Text>
           <Text style={styles.batteryText}>{batteryLevel}</Text>
        </View>
      </View>

      {/* Horizontal List Types utilizing Native wrapping */}
      <View style={styles.chipsContainer}>
        {INCIDENT_TYPES.map((type) => (
          <TouchableOpacity 
             key={type}
             style={[styles.chip, incidentType === type && styles.chipActive]}
             onPress={() => {
                setIncidentType(type);
                Haptics.selectionAsync();
             }}
             accessibilityLabel={`${type} Emergency, ${type} அவசரநிலை`}
          >
             <Text style={[styles.chipText, incidentType === type && styles.chipTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Hero Central Presentation Component */}
      <View style={styles.centerStage}>
        <Animated.View style={[styles.progressRing, progressRingStyle]} />
        <TapGestureHandler onHandlerStateChange={onHandlerStateChange}>
            <Animated.View style={[styles.sosButton, buttonStyle]} accessibilityLabel="Hold to trigger SOS, அவசரநிலையைத் தூண்ட அழுத்திப் பிடிக்கவும்">
               <Text style={styles.sosText}>{isHolding ? countdown : 'SOS'}</Text>
               <Text style={styles.sosSubtext}>{isHolding ? 'Release to cancel' : 'HOLD 1.5s'}</Text>
            </Animated.View>
        </TapGestureHandler>
      </View>

      {/* Supplemental Context Interactions */}
      <View style={styles.inputsContainer}>
         <TextInput 
            style={styles.landmarkInput}
            placeholder="Describe location (e.g. near temple, school)"
            placeholderTextColor={StitchTokens.color.textSecondary}
            value={landmark}
            onChangeText={setLandmark}
            accessibilityLabel="Landmark input, அடையாள உரை"
         />
         
         {/* Simple press-mic integration simulating waveforms mapping */}
         <TouchableOpacity 
            style={styles.voiceButton} 
            accessibilityLabel="Tap to record voice, குரல் பதிவு செய்ய அழுத்தவும்"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
         >
            <Text style={styles.voiceIcon}>🎤</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

// Emulating Stitch MCP system core configurations
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StitchTokens.color.background,
    padding: StitchTokens.spacing.md,
    paddingTop: 50, // OS SafeArea
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: StitchTokens.spacing.lg,
  },
  locationContainer: { flex: 1, paddingRight: 10 },
  locationText: {
    ...StitchTokens.typography.body,
    color: StitchTokens.color.text,
  },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalText: { ...StitchTokens.typography.caption },
  batteryText: { ...StitchTokens.typography.caption, color: StitchTokens.color.text },
  
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 40,
  },
  chip: {
    backgroundColor: StitchTokens.color.chipUnselected,
    paddingVertical: 8,
    paddingHorizontal: StitchTokens.spacing.md,
    borderRadius: StitchTokens.radius.round,
  },
  chipActive: {
    backgroundColor: StitchTokens.color.chipSelected,
  },
  chipText: {
    ...StitchTokens.typography.caption,
    color: StitchTokens.color.text,
  },
  chipTextActive: {
    fontWeight: '700',
  },

  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255, 59, 48, 0.4)',
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  sosText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },
  sosSubtext: {
    ...StitchTokens.typography.caption,
    color: '#FFE5E5',
    marginTop: 8,
  },

  inputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  landmarkInput: {
    flex: 1,
    backgroundColor: StitchTokens.color.surface,
    color: StitchTokens.color.text,
    padding: StitchTokens.spacing.md,
    borderRadius: StitchTokens.radius.mdlg,
    ...StitchTokens.typography.body,
  },
  voiceButton: {
    backgroundColor: StitchTokens.color.surface,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIcon: {
    fontSize: 24,
  }
});
