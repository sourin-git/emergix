import type {
  EmergencyIncident,
  EmergencyIncidentPayload,
} from "@emergix/shared-types";

const DISPATCH_NUMBER = "108";

export function dispatchSmsSOS(payload: EmergencyIncidentPayload): void {
  const smsBody = encodeURIComponent(
    `EMERGIX SOS [${payload.incidentType}] [${payload.latitude},${payload.longitude}] [${payload.landmark}] [${payload.address}]`,
  );
  window.location.href = `sms:${DISPATCH_NUMBER}?body=${smsBody}`;
}

export async function createEmergencyIncident(
  payload: EmergencyIncidentPayload,
): Promise<EmergencyIncident> {
  return {
    id: `inc-${Date.now()}`,
    status: "DISPATCHED",
    etaMinutes: 4,
    createdAt: new Date().toISOString(),
    payload,
  };
}
