import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { NetworkBanner } from "./NetworkBanner";
import { useConnectivityStore } from "../store/useConnectivityStore";

export function AppShell() {
  const networkType = useConnectivityStore((state) => state.networkType);
  const batteryLevel = useConnectivityStore((state) => state.batteryLevel);
  const isLowBattery = useConnectivityStore((state) => state.isLowBattery);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      <NetworkBanner />
      <header className="top-nav">
        <Link to="/" className="brand">
          EMERGIX Web
        </Link>
        <nav>
          <NavLink to="/" end>
            SOS
          </NavLink>
          <NavLink to="/first-aid">First Aid</NavLink>
          <NavLink to="/ops-center">AI Copilot</NavLink>
        </nav>
      </header>
      <section className="status-bar" aria-label="Emergency telemetry">
        <div className="status-chip">
          <span className={networkType === "ONLINE" ? "dot online" : "dot offline"} />
          {networkType === "ONLINE" ? "Network Stable" : "Fallback Mode"}
        </div>
        <div className="status-chip">Battery {batteryLevel}%</div>
        <div className={isLowBattery ? "status-chip warning" : "status-chip"}>
          {isLowBattery ? "Low Battery Protocol" : "Power OK"}
        </div>
        <div className="status-chip time">{currentTime.toLocaleTimeString()}</div>
      </section>
      <main className="page-wrap">
        <Outlet />
      </main>
    </div>
  );
}
