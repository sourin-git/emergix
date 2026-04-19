export interface FirstAidGuide {
  id: string;
  category: string;
  title: string;
  steps: string[];
  voiceAudioUrl: string;
  cachedLocalUri?: string;
}

export type IncidentType =
  | "Accident"
  | "Heart Attack"
  | "Snake Bite"
  | "Fire"
  | "Other";

export interface EmergencyIncidentPayload {
  incidentType: IncidentType;
  landmark: string;
  latitude: number;
  longitude: number;
  address: string;
}

export interface EmergencyIncident {
  id: string;
  status: "DISPATCHED" | "EN_ROUTE" | "ARRIVING" | "ARRIVED";
  etaMinutes: number;
  createdAt: string;
  payload: EmergencyIncidentPayload;
}

export interface TrackingPoint {
  latitude: number;
  longitude: number;
}

export interface TrackingUpdate {
  incidentId: string;
  ambulanceLocation: TrackingPoint;
  status: EmergencyIncident["status"];
  etaMinutes: number;
}
