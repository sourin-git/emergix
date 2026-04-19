import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  getDemoRoute,
  subscribeToTracking,
} from "@emergix/services";
import type { IncidentType, TrackingPoint } from "@emergix/shared-types";
import { getLiveTrackApi } from "../services/backendApi";

type TrackingLocationState = {
  incidentType?: IncidentType;
};

export function TrackingPage() {
  const { incidentId = "demo-incident" } = useParams();
  const location = useLocation();
  const state = (location.state || {}) as TrackingLocationState;

  const [route] = useState<TrackingPoint[]>(() => getDemoRoute());
  const [status, setStatus] = useState("DISPATCHED");
  const [eta, setEta] = useState(4);
  const [ambulanceLocation, setAmbulanceLocation] = useState<TrackingPoint>(route[0]);
  const [driverName, setDriverName] = useState("Ramesh Kumar");
  const [driverPhone, setDriverPhone] = useState("+919876543210");

  useEffect(() => {
    return subscribeToTracking(incidentId, (update) => {
      setStatus(update.status);
      setEta(update.etaMinutes);
      setAmbulanceLocation(update.ambulanceLocation);
    });
  }, [incidentId]);

  useEffect(() => {
    let mounted = true;

    const fetchTrack = async () => {
      try {
        const live = await getLiveTrackApi(incidentId);
        if (!mounted) {
          return;
        }
        if (live.status) {
          setStatus(live.status);
        }
        if (live.driver?.eta_minutes) {
          setEta(live.driver.eta_minutes);
        }
        if (live.driver?.lat && live.driver?.lng) {
          setAmbulanceLocation({ latitude: live.driver.lat, longitude: live.driver.lng });
        }
        if (live.driver?.name) {
          setDriverName(live.driver.name);
        }
        if (live.driver?.phone) {
          setDriverPhone(live.driver.phone);
        }
      } catch {
        // Keep realtime demo fallback active.
      }
    };

    void fetchTrack();

    return () => {
      mounted = false;
    };
  }, [incidentId]);

  return (
    <section className="card-grid two-col">
      <article className="panel map-panel stitch-panel">
        <p className="eyebrow">LIVE TRACK STREAM</p>
        <h1>Ambulance Tracking</h1>
        <p>Incident ID: {incidentId}</p>

        <div className="route-map-mock" aria-hidden="true">
          {route.map((point) => (
            <span
              key={`${point.latitude}-${point.longitude}`}
              className="route-dot"
            />
          ))}
          <span className="ambulance-dot">A</span>
        </div>

        <div className="route-box split">
          <div>
            <span className="muted">Current ambulance position</span>
            <strong className="mono">
              {ambulanceLocation.latitude.toFixed(4)}, {ambulanceLocation.longitude.toFixed(4)}
            </strong>
          </div>
          <div>
            <span className="muted">Route points</span>
            <strong>{route.length}</strong>
          </div>
        </div>
      </article>

      <article className="panel stitch-panel">
        <h2>Response Status</h2>
        <p>
          {eta} min away - <strong>{status}</strong>
        </p>
        <div className="eta-track" aria-hidden="true">
          <span style={{ width: `${Math.min(100, Math.max(10, (5 - eta) * 25))}%` }} />
        </div>
        <div className="status-pill">{state.incidentType || "Emergency"}</div>
        <div className="status-steps" aria-hidden="true">
          <span className={status === "DISPATCHED" ? "active" : ""}>Dispatched</span>
          <span className={status === "EN_ROUTE" ? "active" : ""}>En Route</span>
          <span className={status === "ARRIVING" ? "active" : ""}>Arriving</span>
          <span className={status === "ARRIVED" ? "active" : ""}>Arrived</span>
        </div>
        <ul className="check-list">
          <li>Driver assigned: {driverName}</li>
          <li>Contact: {driverPhone}</li>
          <li>Vehicle: KA-01-AB-1234</li>
          <li>Destination: Apollo City Hospital ER</li>
        </ul>
      </article>
    </section>
  );
}
