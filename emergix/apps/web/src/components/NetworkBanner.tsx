import { useConnectivityStore } from "../store/useConnectivityStore";

export function NetworkBanner() {
  const isSmsMode = useConnectivityStore((state) => state.isSmsMode);

  if (!isSmsMode) {
    return null;
  }

  return <div className="network-banner">LOW SIGNAL - SMS MODE ACTIVE</div>;
}
