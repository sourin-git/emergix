import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createEmergencyIncident,
  dispatchSmsSOS,
} from "@emergix/services";
import { triggerSosApi } from "../services/backendApi";
import type { IncidentType } from "@emergix/shared-types";
import { useConnectivityStore } from "../store/useConnectivityStore";
import { useEmergencyStore } from "../store/useEmergencyStore";

const INCIDENT_TYPES: IncidentType[] = [
  "Accident",
  "Heart Attack",
  "Snake Bite",
  "Fire",
  "Other",
];

export function SOSPage() {
  const navigate = useNavigate();
  const { incidentType, landmark, setIncidentType, setLandmark } =
    useEmergencyStore();
  const isSmsMode = useConnectivityStore((state) => state.isSmsMode);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimeoutRef = useRef<number | null>(null);
  const holdIntervalRef = useRef<number | null>(null);

  const resetHold = () => {
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      window.clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  useEffect(() => resetHold, []);

  const triggerSOS = () => {
    if (sending) {
      return;
    }

    setSending(true);
    setErrorMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          incidentType,
          landmark,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Current location from browser GPS",
        };

        try {
          const apiIncident = await triggerSosApi(payload, isSmsMode);
          navigate(`/tracking/${apiIncident.incident_id}`, {
            state: { incidentType: payload.incidentType },
          });
          return;
        } catch (error) {
          const message =
            error instanceof Error
              ? "SOS API unreachable, switched to local fallback."
              : "SOS API error, switched to local fallback.";
          setErrorMessage(message);
        }

        if (isSmsMode) {
          dispatchSmsSOS(payload);
        }

        const incident = await createEmergencyIncident(payload);
        navigate(`/tracking/${incident.id}`, {
          state: { incidentType: incident.payload.incidentType },
        });
      },
      async () => {
        const payload = {
          incidentType,
          landmark,
          latitude: 12.9716,
          longitude: 77.5946,
          address: "Fallback location",
        };

        try {
          const apiIncident = await triggerSosApi(payload, isSmsMode);
          navigate(`/tracking/${apiIncident.incident_id}`, {
            state: { incidentType: payload.incidentType },
          });
          return;
        } catch (error) {
          const message =
            error instanceof Error
              ? "Location permission denied, local fallback activated."
              : "Location issue, local fallback activated.";
          setErrorMessage(message);
        }

        if (isSmsMode) {
          dispatchSmsSOS(payload);
        }

        const incident = await createEmergencyIncident(payload);
        navigate(`/tracking/${incident.id}`, {
          state: { incidentType: incident.payload.incidentType },
        });
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const startHold = () => {
    if (sending || holdTimeoutRef.current) {
      return;
    }

    const durationMs = 1500;
    const start = performance.now();

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - start;
      const progress = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setHoldProgress(progress);
    }, 16);

    holdTimeoutRef.current = window.setTimeout(() => {
      resetHold();
      triggerSOS();
    }, durationMs);
  };

  return (
    <section className="card-grid">
      <article className="panel stitch-panel">
        <div className="hero-header">
          <div>
            <p className="eyebrow">STITCH RESPONSE LAYER</p>
            <h1>Emergency SOS</h1>
            <p>Choose incident type and trigger dispatch immediately.</p>
          </div>
          <div className={isSmsMode ? "signal-badge warning" : "signal-badge"}>
            {isSmsMode ? "SMS fallback" : "Live network"}
          </div>
        </div>

        <div className="chip-row">
          {INCIDENT_TYPES.map((type) => (
            <button
              key={type}
              className={type === incidentType ? "chip active" : "chip"}
              onClick={() => setIncidentType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="sos-stage">
          <div className="pulse-ring" aria-hidden="true" />
          <div
            className="hold-ring"
            style={{
              background: `conic-gradient(#ff6a5e ${holdProgress * 3.6}deg, rgba(255, 255, 255, 0.15) 0deg)`,
            }}
            aria-hidden="true"
          />
          <button
            className="sos-button stage"
            onPointerDown={startHold}
            onPointerUp={resetHold}
            onPointerLeave={resetHold}
            onPointerCancel={resetHold}
            onKeyDown={(event) => {
              if (event.key === " " || event.key === "Enter") {
                startHold();
              }
            }}
            onKeyUp={resetHold}
          >
            <span className="sos-main">{sending ? "Sending" : "SOS"}</span>
            <span className="sos-sub">
              {sending ? "dispatching" : holdProgress > 0 ? "hold to confirm" : "hold 1.5s"}
            </span>
          </button>
        </div>

        <label className="field-label" htmlFor="landmark">
          Landmark
        </label>
        <input
          id="landmark"
          className="text-field"
          placeholder="Near school, temple, junction..."
          value={landmark}
          onChange={(event) => setLandmark(event.target.value)}
        />

        <div className="meta-row">
          <div>
            <span className="muted">Dispatch channel</span>
            <strong>{isSmsMode ? "SMS -> 108" : "Live service"}</strong>
          </div>
          <div>
            <span className="muted">Mode</span>
            <strong>{isSmsMode ? "Low signal" : "Connected"}</strong>
          </div>
        </div>
        {errorMessage ? <p className="ops-error">{errorMessage}</p> : null}
      </article>
    </section>
  );
}
