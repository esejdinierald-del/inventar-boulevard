import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

let refreshedForServiceWorkerUpdate = false;

// Register PWA service worker and activate new app versions immediately.
// This prevents staff devices from staying on an old cached PIN-verification bundle.
const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (refreshedForServiceWorkerUpdate) return;
    refreshedForServiceWorkerUpdate = true;
    updateServiceWorker(true);
  },
  onRegisteredSW(_swUrl, registration) {
    registration?.update().catch(() => {
      // Update check failed; the current cached app can continue running.
    });
  },
});

createRoot(document.getElementById("root")!).render(<App />);
