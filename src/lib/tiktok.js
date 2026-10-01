const PIXEL_ID = 'D7UA7P3C77U0A0BNDM3G';

// Loads the TikTok pixel once. Only call this after the visitor has accepted tracking.
export function loadTikTok() {
  if (typeof window === 'undefined' || window.__ttqLoaded) return;
  window.__ttqLoaded = true;

  (function (w, d, t) {
    w.TiktokAnalyticsObject = t;
    const ttq = (w[t] = w[t] || []);
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
    ttq.setAndDefer = function (target, method) {
      target[method] = function () {
        target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i += 1) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id) {
      const inst = ttq._i[id] || [];
      for (let n = 0; n < ttq.methods.length; n += 1) ttq.setAndDefer(inst, ttq.methods[n]);
      return inst;
    };
    ttq.load = function (id, opts) {
      const src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = src;
      ttq._t = ttq._t || {};
      ttq._t[id] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[id] = opts || {};
      const el = d.createElement('script');
      el.type = 'text/javascript';
      el.async = true;
      el.src = `${src}?sdkid=${id}&lib=${t}`;
      const first = d.getElementsByTagName('script')[0];
      first.parentNode.insertBefore(el, first);
    };
    ttq.load(PIXEL_ID);
    ttq.page();
  })(window, document, 'ttq');
}
