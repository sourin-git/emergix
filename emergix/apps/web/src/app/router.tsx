import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { FirstAidPage } from "../pages/FirstAidPage";
import { OpsCenterPage } from "../pages/OpsCenterPage";
import { SOSPage } from "../pages/SOSPage";
import { TrackingPage } from "../pages/TrackingPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<SOSPage />} />
        <Route path="/tracking/:incidentId" element={<TrackingPage />} />
        <Route path="/first-aid" element={<FirstAidPage />} />
        <Route path="/ops-center" element={<OpsCenterPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
