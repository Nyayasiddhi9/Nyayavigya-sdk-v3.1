import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { logError } from "./lib/errorHandler";
import { initializeSentry } from "./lib/sentry";

// Initialize Sentry BEFORE rendering the app
initializeSentry();

// Unregister any existing service workers to clear cache
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Service Worker unregistered successfully');
      }
      // Force page reload to clear all caches
      if (registrations.length > 0) {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Service Worker unregistration failed:', error);
    }
  });
}

// Global error handlers to prevent unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason, 'Unhandled Promise Rejection');
  event.preventDefault(); // Prevents the default browser behavior
});

window.addEventListener('error', (event) => {
  logError(event.error, 'Global JavaScript Error');
});

// Handle WebSocket connection errors gracefully
window.addEventListener('online', () => {
  console.log('🟢 Connection restored');
});

window.addEventListener('offline', () => {
  console.log('🔴 Connection lost');
});

createRoot(document.getElementById("root")!).render(<App />);
