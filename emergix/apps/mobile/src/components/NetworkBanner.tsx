import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useConnectivityStore } from '../store/useConnectivityStore';

export default function NetworkBanner() {
  const { isSmsMode } = useConnectivityStore();

  // Suppress completely if metrics indicate fast connectivity
  if (!isSmsMode) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>LOW SIGNAL — SMS MODE ACTIVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF9F0A', // Amber explicit color request
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 9999,
  },
  bannerText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1.5,
  }
});
