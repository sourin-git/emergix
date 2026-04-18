import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Battery from 'expo-battery';

interface ConnectivityState {
  networkType: string;
  isSmsMode: boolean;
  batteryLevel: number;
  isLowBattery: boolean;
  
  initialize: () => void;
  setSmsMode: (val: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  networkType: 'UNKNOWN',
  isSmsMode: false,
  batteryLevel: 100,
  isLowBattery: false,

  setSmsMode: (val) => set({ isSmsMode: val }),

  initialize: async () => {
    // 1. Map Battery polling and limits (< 15% forces Low Battery operations UX globally)
    const initialBattery = await Battery.getBatteryLevelAsync();
    set({ 
       batteryLevel: Math.round(initialBattery * 100),
       isLowBattery: (initialBattery <= 0.15 && initialBattery >= 0) // <15% 
    });

    Battery.addBatteryLevelListener(({ batteryLevel }) => {
      set({ 
         batteryLevel: Math.round(batteryLevel * 100),
         isLowBattery: batteryLevel <= 0.15 
      });
    });

    // 2. Continuous Network Listener 
    NetInfo.addEventListener((state: NetInfoState) => {
      const type = state.type.toUpperCase();
      let effectiveType = type;
      
      // Determine precise cellular fallback tiers 
      if (type === 'CELLULAR' && state.details?.cellularGeneration) {
        effectiveType = `CELLULAR_${state.details.cellularGeneration.toUpperCase()}`; // outputs CELLULAR_4G, CELLULAR_2G, etc
      }
      
      // Strict parameter thresholds forcing operations onto SMS Mode
      const isWeakOrOffline = 
         !state.isConnected || 
         effectiveType === 'CELLULAR_2G' || 
         effectiveType === 'NONE' || 
         effectiveType === 'UNKNOWN';
      
      set({ 
          networkType: effectiveType, 
          isSmsMode: isWeakOrOffline 
      });
    });
  }
}));
