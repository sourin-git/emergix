import { create } from 'zustand';

interface EmergencyState {
  incidentType: string;
  landmark: string;
  isRecording: boolean;
  setIncidentType: (type: string) => void;
  setLandmark: (landmark: string) => void;
  setIsRecording: (recording: boolean) => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
  incidentType: 'Other',
  landmark: '',
  isRecording: false,
  setIncidentType: (type) => set({ incidentType: type }),
  setLandmark: (landmark) => set({ landmark }),
  setIsRecording: (recording) => set({ isRecording: recording }),
}));
