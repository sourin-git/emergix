import type { TrackingPoint, TrackingUpdate } from "@emergix/shared-types";

const baselineRoute: TrackingPoint[] = [
  { latitude: 12.965, longitude: 77.59 },
  { latitude: 12.968, longitude: 77.592 },
  { latitude: 12.9716, longitude: 77.5946 },
];

export function getDemoRoute(): TrackingPoint[] {
  return baselineRoute;
}

export function subscribeToTracking(
  incidentId: string,
  onUpdate: (update: TrackingUpdate) => void,
): () => void {
  let index = 0;
  const statuses: TrackingUpdate["status"][] = [
    "DISPATCHED",
    "EN_ROUTE",
    "ARRIVING",
    "ARRIVED",
  ];

  const interval = window.setInterval(() => {
    const point = baselineRoute[Math.min(index, baselineRoute.length - 1)];
    const status = statuses[Math.min(index, statuses.length - 1)];
    const etaMinutes = Math.max(1, 4 - index);

    onUpdate({
      incidentId,
      ambulanceLocation: point,
      status,
      etaMinutes,
    });

    if (index < baselineRoute.length - 1) {
      index += 1;
    }
  }, 3000);

  return () => window.clearInterval(interval);
}
