import { create } from "zustand";

type BatteryManager = {
  level: number;
  addEventListener: (
    event: "levelchange",
    listener: (event: Event) => void,
  ) => void;
  removeEventListener: (
    event: "levelchange",
    listener: (event: Event) => void,
  ) => void;
};

interface ConnectivityState {
  networkType: string;
  isSmsMode: boolean;
  batteryLevel: number;
  isLowBattery: boolean;
  initialize: () => Promise<void>;
  setSmsMode: (val: boolean) => void;
}

type NavigatorWithBattery = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
};

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  networkType: "UNKNOWN",
  isSmsMode: false,
  batteryLevel: 100,
  isLowBattery: false,

  setSmsMode: (val) => set({ isSmsMode: val }),

  initialize: async () => {
    const updateConnectivity = () => {
      const isOffline = !navigator.onLine;
      const networkType = isOffline ? "NONE" : "ONLINE";
      const isLowBattery = get().isLowBattery;
      set({
        networkType,
        isSmsMode: isOffline || isLowBattery,
      });
    };

    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);
    updateConnectivity();

    const nav = navigator as NavigatorWithBattery;
    if (typeof nav.getBattery === "function") {
      const battery = await nav.getBattery();
      const syncBattery = () => {
        const batteryLevel = Math.round(battery.level * 100);
        const isLowBattery = battery.level <= 0.15;
        set({
          batteryLevel,
          isLowBattery,
          isSmsMode: !navigator.onLine || isLowBattery,
        });
      };

      syncBattery();
      battery.addEventListener("levelchange", syncBattery);
    }
  },
}));
