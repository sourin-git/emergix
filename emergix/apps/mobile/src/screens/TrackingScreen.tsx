import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated as NativeAnimated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { io } from 'socket.io-client';
import * as Linking from 'expo-linking';

// === STITCH MCP DESIGN TOKENS (Shared System Mocks) ===
const StitchTokens = {
  color: {
    primaryRed: '#FF3B30',
    primaryBlue: '#007AFF',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceSecondary: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A5',
    success: '#34C759',
    warning: '#FF9F0A',
    badgeBg: 'rgba(255, 59, 48, 0.15)',
    divider: 'rgba(255,255,255,0.08)'
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  typography: {
    title: { fontSize: 22, fontWeight: '700' },
    bodyBold: { fontSize: 16, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 13, fontWeight: '500' },
    small: { fontSize: 11, fontWeight: '600' }
  },
  radius: { sm: 8, md: 12, lg: 16, round: 999 }
};

const mapDarkStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
];

export default function TrackingScreen({ route, navigation }: any) {
  const { incidentId = 'demo-123', incidentType = 'Emergency' } = route?.params || {};
  
  const mapRef = useRef<MapView>(null);
  const [patientLoc] = useState({ latitude: 12.9716, longitude: 77.5946 }); 
  
  // Natively animating region blocks to simulate Uber style smooth map marker sliding 
  const [ambulanceLoc, setAmbulanceLoc] = useState({ latitude: 12.9650, longitude: 77.5900 });
  const [polylineRoute, setPolylineRoute] = useState<any[]>([]);
  
  const [eta, setEta] = useState(4);
  const [status, setStatus] = useState('DISPATCHED');

  useEffect(() => {
    // 1. Fetch initial live Polyline mapping from Postgres routing API
    setPolylineRoute([
      { latitude: 12.9650, longitude: 77.5900 },
      { latitude: 12.9680, longitude: 77.5920 },
      { latitude: 12.9716, longitude: 77.5946 },
    ]);

    // 2. Connect to Tracking-Service WebSockets (Port 3002 via localhost or production URI)
    const socket = io('http://localhost:3002');
    socket.emit('join_incident', incidentId);
    
    // Subscribe to Redux/Redis synced driver locations
    socket.on('ambulance:location', (data: { lat: number, lng: number, speed: number }) => {
      setAmbulanceLoc({ latitude: data.lat, longitude: data.lng });
      // Optionally execute camera auto-follow physics
      // mapRef.current?.animateCamera({ center: { latitude: data.lat, longitude: data.lng } });
    });

    socket.on('incident:update', (data: { status: string }) => {
       if (data.status) setStatus(data.status);
    });

    return () => { socket.disconnect(); };
  }, [incidentId]);

  const handleCallDriver = () => {
     Linking.openURL(`tel:+919876543210`);
  };

  const handleShareTracking = () => {
     Linking.openURL(`sms:?body=Track my emergency ambulance arrival here: https://emergix.in/track/${incidentId}`);
  };

  return (
    <View style={styles.container}>
      {/* TOP: Map Layer Context */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: 12.9690,
            longitude: 77.5920,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsTraffic={true}
          customMapStyle={mapDarkStyle}
        >
          {/* Patient Location */}
          <Marker coordinate={patientLoc} title="Your Location">
             <View style={styles.patientMarker}>
                 <View style={styles.patientDot} />
             </View>
          </Marker>

          {/* Driver Context Marker */}
          <Marker coordinate={ambulanceLoc} title="Ambulance" flat={true} anchor={{ x: 0.5, y: 0.5 }}>
             <View style={styles.ambulanceMarker}>
                <Text style={styles.ambulanceIcon}>🚑</Text>
             </View>
          </Marker>

          {/* Active Polyline tracking shortest-derived path */}
          {polylineRoute.length > 0 && (
            <Polyline
              coordinates={polylineRoute}
              strokeColor={StitchTokens.color.primaryRed}
              strokeWidth={4}
              lineDashPattern={[5, 5]} 
            />
          )}
        </MapView>
      </View>

      {/* BOTTOM SHEET LAYER */}
      <View style={styles.bottomSheet}>
         <View style={styles.dragHandle} />

         {/* 1. Driver Metadata Context Row */}
         <View style={styles.driverRow}>
            <View style={styles.driverInfoRow}>
              <View style={styles.avatar}>
                 <Text style={styles.avatarText}>RK</Text>
              </View>
              <View>
                 <Text style={styles.driverName}>Ramesh Kumar</Text>
                 <Text style={styles.ratingText}>⭐ 4.8 Rating • BLS Van</Text>
              </View>
            </View>
            
            <View style={styles.plateAndCall}>
               <View style={styles.plateBadge}>
                  <Text style={styles.plateText}>KA-01-AB-1234</Text>
               </View>
               <TouchableOpacity style={styles.callButton} onPress={handleCallDriver} accessibilityLabel="Call Ambulance Driver">
                  <Text style={styles.callIcon}>📞</Text>
               </TouchableOpacity>
            </View>
         </View>

         <View style={styles.divider} />

         {/* 2. Intelligent ETA Tracking Context */}
         <View style={styles.etaRow}>
           <View style={{ flex: 1 }}>
              <Text style={styles.etaText}>
                 {eta} min <Text style={{fontSize: 18, color: StitchTokens.color.textSecondary}}>away</Text>
              </Text>
              <View style={styles.progressBarBg}>
                 <View style={[styles.progressBarFill, { width: '60%' }]} /> 
              </View>
           </View>
           
           <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{status}</Text>
           </View>
         </View>

         <View style={styles.divider} />

         {/* 3. AI Generated Route Analysis Parameters */}
         <View style={styles.routeInfo}>
            <View>
               <Text style={styles.routeHeader}>Fastest route: 4.2 km</Text>
               <Text style={styles.routeSub}>Shortest route: 5.1 km</Text>
            </View>
            <View style={styles.aiTag}>
               <Text style={styles.aiTagText}>✨ AI Traffic Layer Active</Text>
            </View>
         </View>

         <View style={styles.divider} />

         {/* 4. Incident Hospital Destinations Context */}
         <View style={styles.emergencyContext}>
            <View style={styles.incidentBadge}>
               <Text style={styles.incidentBadgeContent}>{incidentType}</Text>
            </View>
            <Text style={styles.hospitalDest} numberOfLines={1}>Dest: Apollo City Hospital ER</Text>
         </View>

         <TouchableOpacity style={styles.shareButton} onPress={handleShareTracking}>
             <Text style={styles.shareText}>↗ Share live web tracking link</Text>
         </TouchableOpacity>

         {/* 5. Terminal Support Action Paths */}
         <View style={styles.actionRow}>
            <TouchableOpacity style={styles.helpAction}>
               <Text style={styles.helpText}>Get App Help</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelAction}>
               <Text style={styles.cancelText}>Cancel Request</Text>
            </TouchableOpacity>
         </View>
      </View>

    </View>
  );
}

// OS Stitch Tokens mapping stylesheet execution
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StitchTokens.color.background,
  },
  mapContainer: {
    flex: 1,
    marginBottom: -20, // Slide the map boundary underneath the absolute bottom sheet slightly
  },
  
  // Custom Map Markers
  patientMarker: {
    width: 20, height: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  patientDot: {
    width: 8, height: 8,
    backgroundColor: StitchTokens.color.primaryRed,
    borderRadius: 4,
  },
  ambulanceMarker: {
    width: 36, height: 36,
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 2, borderColor: StitchTokens.color.primaryRed,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 3, elevation: 5
  },
  ambulanceIcon: { fontSize: 18 },

  // Bottom Sheet Container Context
  bottomSheet: {
    backgroundColor: StitchTokens.color.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: StitchTokens.spacing.lg,
    paddingBottom: StitchTokens.spacing.lg,
    shadowColor: '#000', shadowOffset: {width: 0, height: -5}, shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  dragHandle: {
    width: 40, height: 4,
    backgroundColor: StitchTokens.color.surfaceSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: StitchTokens.color.divider,
    marginVertical: StitchTokens.spacing.md,
  },

  // 1. Driver Card
  driverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: StitchTokens.color.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center'
  },
  avatarText: { ...StitchTokens.typography.bodyBold, color: StitchTokens.color.textSecondary },
  driverName: { ...StitchTokens.typography.bodyBold, color: StitchTokens.color.text },
  ratingText: { ...StitchTokens.typography.caption, color: StitchTokens.color.textSecondary, marginTop: 2 },
  plateAndCall: { alignItems: 'flex-end', gap: 6 },
  plateBadge: {
    backgroundColor: '#FFD60A',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  plateText: { ...StitchTokens.typography.small, color: '#000', fontWeight: '800' },
  callButton: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    justifyContent: 'center', alignItems: 'center'
  },
  callIcon: { fontSize: 18 },

  // 2. ETA Section
  etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etaText: { ...StitchTokens.typography.title, color: StitchTokens.color.text, fontSize: 32 },
  progressBarBg: {
    height: 6,
    backgroundColor: StitchTokens.color.surfaceSecondary,
    borderRadius: 3,
    marginTop: 8,
    width: '90%'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: StitchTokens.color.primaryBlue,
    borderRadius: 3,
  },
  statusBadge: {
    backgroundColor: StitchTokens.color.badgeBg,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: StitchTokens.radius.round,
  },
  statusBadgeText: { ...StitchTokens.typography.small, color: StitchTokens.color.primaryRed, letterSpacing: 0.5 },

  // 3. AI Route Analysis Section
  routeInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeHeader: { ...StitchTokens.typography.bodyBold, color: StitchTokens.color.text },
  routeSub: { ...StitchTokens.typography.caption, color: StitchTokens.color.textSecondary, marginTop: 2 },
  aiTag: {
    backgroundColor: 'rgba(94, 92, 230, 0.15)',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: StitchTokens.radius.md,
  },
  aiTagText: { ...StitchTokens.typography.small, color: '#5E5CE6' },

  // 4. Emergency Summary Row
  emergencyContext: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  incidentBadge: {
     backgroundColor: StitchTokens.color.surfaceSecondary,
     paddingHorizontal: 8, paddingVertical: 4,
     borderRadius: 4
  },
  incidentBadgeContent: { ...StitchTokens.typography.caption, color: StitchTokens.color.text },
  hospitalDest: { ...StitchTokens.typography.body, color: StitchTokens.color.text, flex: 1 },
  
  shareButton: {
     paddingVertical: 14,
     backgroundColor: StitchTokens.color.surfaceSecondary,
     borderRadius: StitchTokens.radius.md,
     alignItems: 'center',
     marginBottom: 16,
  },
  shareText: { ...StitchTokens.typography.bodyBold, color: StitchTokens.color.primaryBlue },

  // 5. Actions context
  actionRow: { flexDirection: 'row', gap: 12 },
  cancelAction: {
    flex: 1, paddingVertical: 14,
    backgroundColor: StitchTokens.color.badgeBg,
    borderRadius: StitchTokens.radius.md,
    alignItems: 'center',
  },
  cancelText: { ...StitchTokens.typography.bodyBold, color: StitchTokens.color.primaryRed },
  helpAction: {
    flex: 1, paddingVertical: 14,
    backgroundColor: StitchTokens.color.surfaceSecondary,
    borderRadius: StitchTokens.radius.md,
    alignItems: 'center',
  },
  helpText: { ...StitchTokens.typography.bodyBold, color: StitchTokens.color.text },
});
