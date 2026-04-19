import { useEffect } from "react";
import { AppRouter } from "./app/router";
import { useConnectivityStore } from "./store/useConnectivityStore";

function App() {
  const initialize = useConnectivityStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <AppRouter />;
}

export default App;
