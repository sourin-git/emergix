import type { EmergencyIncidentPayload, IncidentType } from "@emergix/shared-types";

const API = {
  sosBase: import.meta.env.VITE_SOS_API_URL ?? "http://localhost:3001",
  trackingBase: import.meta.env.VITE_TRACKING_API_URL ?? "http://localhost:3002",
  notificationBase:
    import.meta.env.VITE_NOTIFICATION_API_URL ?? "http://localhost:3004",
  aiBase: import.meta.env.VITE_AI_API_URL ?? "http://localhost:8000",
  authToken: import.meta.env.VITE_AUTH_TOKEN ?? "",
  internalServiceKey:
    import.meta.env.VITE_INTERNAL_SERVICE_KEY ?? "emergix_internal_secret",
  aiApiKey: import.meta.env.VITE_AI_API_KEY ?? "emergix_service_secret",
  demoUserId:
    import.meta.env.VITE_DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001",
};

type JsonRecord = Record<string, unknown>;

async function request<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

function mapIncidentType(type: IncidentType): "ACCIDENT" | "CARDIAC" | "SNAKE_BITE" | "OTHER" {
  switch (type) {
    case "Accident":
      return "ACCIDENT";
    case "Heart Attack":
      return "CARDIAC";
    case "Snake Bite":
      return "SNAKE_BITE";
    default:
      return "OTHER";
  }
}

export interface SosTriggerResponse {
  incident_id: string;
  ambulance_id: string | null;
  eta_minutes: number | null;
  tracking_url: string;
  driver: {
    name: string;
    phone: string;
  } | null;
}

export async function triggerSosApi(
  payload: EmergencyIncidentPayload,
  smsMode: boolean,
): Promise<SosTriggerResponse> {
  const authHeader: HeadersInit = API.authToken
    ? { Authorization: `Bearer ${API.authToken}` }
    : {};

  return request<SosTriggerResponse>(`${API.sosBase}/api/sos/trigger`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({
      user_id: API.demoUserId,
      incident_type: mapIncidentType(payload.incidentType),
      location: {
        lat: payload.latitude,
        lng: payload.longitude,
      },
      landmark_text: payload.landmark,
      voice_input: false,
      sms_mode: smsMode,
    }),
  });
}

export interface LiveTrackResponse {
  status: string;
  route_polyline: string | null;
  driver: {
    name: string;
    phone: string;
    lat: number;
    lng: number;
    eta_minutes: number | null;
  } | null;
}

export async function getLiveTrackApi(incidentId: string): Promise<LiveTrackResponse> {
  return request<LiveTrackResponse>(`${API.trackingBase}/api/track/${incidentId}/live`, {
    method: "GET",
  });
}

export interface TriageResult {
  urgency: string;
  emergency_type: string;
  facility_needed: string;
  first_aid_steps: string[];
  estimated_response_time: string;
}

export async function runTriageApi(input: {
  symptoms: string;
  voice_transcript?: string;
  age?: number;
  location_type?: string;
}): Promise<TriageResult> {
  return request<TriageResult>(`${API.aiBase}/ai/triage`, {
    method: "POST",
    headers: {
      "X-API-Key": API.aiApiKey,
    },
    body: JSON.stringify(input),
  });
}

export async function mapLandmarkApi(input: {
  landmark_text: string;
  city: string;
}): Promise<JsonRecord> {
  return request<JsonRecord>(`${API.aiBase}/ai/landmark-to-gps`, {
    method: "POST",
    headers: {
      "X-API-Key": API.aiApiKey,
    },
    body: JSON.stringify(input),
  });
}

export async function smartEtaApi(input: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  incident_id: string;
}): Promise<JsonRecord> {
  return request<JsonRecord>(`${API.aiBase}/ai/eta-smart`, {
    method: "POST",
    headers: {
      "X-API-Key": API.aiApiKey,
    },
    body: JSON.stringify(input),
  });
}

export async function queueSmsApi(input: {
  to: string;
  message: string;
  incident_id?: string;
}): Promise<JsonRecord> {
  return request<JsonRecord>(`${API.notificationBase}/notify/sms`, {
    method: "POST",
    headers: {
      "X-Internal-Secret": API.internalServiceKey,
    },
    body: JSON.stringify(input),
  });
}

export async function sendPushApi(input: {
  user_ids: string[];
  title: string;
  body: string;
  data?: JsonRecord;
}): Promise<JsonRecord> {
  return request<JsonRecord>(`${API.notificationBase}/notify/push`, {
    method: "POST",
    headers: {
      "X-Internal-Secret": API.internalServiceKey,
    },
    body: JSON.stringify(input),
  });
}

export async function sendIvrApi(input: {
  to: string;
  message_tts: string;
  language: string;
}): Promise<JsonRecord> {
  return request<JsonRecord>(`${API.notificationBase}/notify/ivr`, {
    method: "POST",
    headers: {
      "X-Internal-Secret": API.internalServiceKey,
    },
    body: JSON.stringify(input),
  });
}
