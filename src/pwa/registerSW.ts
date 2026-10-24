// ثبت Service Worker
export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] SW registered:', registration.scope);

    // بررسی به‌روزرسانی
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // نسخه جدید آماده است
            console.log('[PWA] New version available');
            // می‌توان Toast نمایش داد
            if (confirm('نسخه جدید اسکای‌چی آماده است. برای به‌روزرسانی صفحه را reload کنید؟')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          } else {
            console.log('[PWA] Content cached for offline use');
          }
        }
      });
    });
  } catch (error) {
    console.error('[PWA] SW registration failed:', error);
  }
}
