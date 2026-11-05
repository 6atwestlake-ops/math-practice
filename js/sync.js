/* Optional progress sync — text/plain POST for Apps Script (no CORS preflight).
   Failures never break offline use. */
(function (global) {
  'use strict';

  var syncing = false;

  function endpoint() {
    var cfg = global.ColeMathConfig || {};
    var url = (cfg.endpointUrl || '').replace(/^\s+|\s+$/g, '');
    return url;
  }

  function enabled() {
    return !!endpoint() && !!(global.ColeMathConfig && global.ColeMathConfig.syncKey);
  }

  function trySync() {
    if (!enabled()) return Promise.resolve({ skipped: true, reason: 'disabled' });
    if (syncing) return Promise.resolve({ skipped: true, reason: 'in-flight' });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return Promise.resolve({ skipped: true, reason: 'offline' });
    }
    if (!global.ColeMathStorage || !ColeMathStorage.isDirty()) {
      return Promise.resolve({ skipped: true, reason: 'clean' });
    }

    syncing = true;
    var payload;
    try {
      payload = ColeMathStorage.buildSyncPayload();
    } catch (e) {
      syncing = false;
      return Promise.resolve({ ok: false, error: 'payload' });
    }

    var body = JSON.stringify(payload);
    var ctrl = null;
    var timedOut = false;
    try {
      if (typeof AbortController !== 'undefined') ctrl = new AbortController();
    } catch (e2) { ctrl = null; }
    var timer = null;
    if (ctrl) {
      timer = setTimeout(function () {
        timedOut = true;
        try { ctrl.abort(); } catch (e3) {}
      }, 12000);
    }

    var opts = {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: body,
      mode: 'cors',
      cache: 'no-store'
    };
    if (ctrl) opts.signal = ctrl.signal;

    return fetch(endpoint(), opts).then(function (res) {
      if (timer) clearTimeout(timer);
      syncing = false;
      if (!res || !res.ok) return { ok: false, status: res && res.status };
      try { ColeMathStorage.markSynced(); } catch (e4) {}
      return { ok: true };
    }).catch(function () {
      if (timer) clearTimeout(timer);
      syncing = false;
      return { ok: false, error: timedOut ? 'timeout' : 'network' };
    });
  }

  function bind() {
    try {
      if (typeof window !== 'undefined') {
        window.addEventListener('online', function () { trySync(); });
      }
    } catch (e) {}
  }

  bind();

  global.ColeMathSync = {
    trySync: trySync,
    enabled: enabled
  };
})(typeof window !== 'undefined' ? window : global);
