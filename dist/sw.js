// Service Worker بسيط - بيخلي المتصفح يعتبر الموقع "قابل للتثبيت" كتطبيق
// مش بنعمل offline caching معقد دلوقتي، ده كفاية للـ MVP

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // بدون caching حاليًا - أي طلب بيروح للسيرفر عادي
  // ممكن نضيف offline support في مرحلة لاحقة لو احتجنا
});
