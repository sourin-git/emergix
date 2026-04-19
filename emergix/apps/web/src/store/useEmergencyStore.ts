import { create } from "zustand";
import type { IncidentType } from "@emergix/shared-types";

interface EmergencyState {
  incidentType: IncidentType;
  landmark: string;
  setIncidentType: (type: IncidentType) => void;
  setLandmark: (landmark: string) => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
  incidentType: "Other",
  landmark: "",
  setIncidentType: (type) => set({ incidentType: type }),
  setLandmark: (landmark) => set({ landmark }),
}));
