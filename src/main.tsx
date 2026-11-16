import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

const hadController =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  Boolean(navigator.serviceWorker.controller);

let reloadingForSwUpdate = false;
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloadingForSwUpdate) return;
    reloadingForSwUpdate = true;
    window.location.reload();
  });
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    void updateSW(true);
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    window.addEventListener('focus', () => {
      if (navigator.onLine) {
        void registration.update();
      }
    });
  },
});

createRoot(document.getElementById('root')!).render(<App />);

