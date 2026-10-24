import { useEffect, useState } from 'react';
import { useStore } from '../store';

// ============================================================
// useOnlineStatus
// ============================================================
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ============================================================
// useToast
// ============================================================
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, toast]);

    // حذف خودکار پس از ۴ ثانیه
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, dismissToast };
}

// ============================================================
// useWeather (refetch خودکار)
// ============================================================
export function useWeather() {
  const { fetchAndEvaluate, lastFetch } = useStore();

  useEffect(() => {
    // refetch هر ۳۰ دقیقه
    const interval = setInterval(() => {
      if (lastFetch && Date.now() - lastFetch > 30 * 60 * 1000) {
        fetchAndEvaluate();
      }
    }, 60 * 1000); // بررسی هر دقیقه

    return () => clearInterval(interval);
  }, [fetchAndEvaluate, lastFetch]);

  return { fetchAndEvaluate };
}

// ============================================================
// useProfile
// ============================================================
export function useProfile() {
  const { profiles, activeProfileId, setActiveProfile, updateProfile } = useStore();

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const switchProfile = (id: string) => {
    setActiveProfile(id);
  };

  const editProfile = (id: string, updates: Partial<typeof activeProfile>) => {
    updateProfile(id, updates);
  };

  return {
    profiles,
    activeProfile,
    activeProfileId,
    switchProfile,
    editProfile,
  };
}

// ============================================================
// useNotifications (Notification API اختیاری)
// ============================================================
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    }
    return false;
  };

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
      });
    }
  };

  return {
    permission,
    requestPermission,
    sendNotification,
    isSupported: 'Notification' in window,
  };
}
