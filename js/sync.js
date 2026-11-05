/* Optional progress sync — text/plain POST; Dad dashboard GET. */
(function (global) {
  'use strict';

  var syncing = false;

  function endpoint() {
    var cfg = global.ColeMathConfig || {};
    return (cfg.endpointUrl || '').replace(/^\s+|\s+$/g, '');
  }

  function enabled() {
    return !!endpoint() && !!(global.ColeMathConfig && ColeMathConfig.syncKey);
  }

  function trySync(profileId) {
    if (!enabled()) return Promise.resolve({ skipped: true, reason: 'disabled' });
    if (syncing) return Promise.resolve({ skipped: true, reason: 'in-flight' });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return Promise.resolve({ skipped: true, reason: 'offline' });
    }
    var pid = profileId;
    if (!pid) {
      var p = global.ColeMathProfiles && ColeMathProfiles.getActive();
      pid = p && p.role === 'student' ? p.id : null;
    }
    if (!pid) return Promise.resolve({ skipped: true, reason: 'no-profile' });
    if (!ColeMathStorage.isDirty(pid)) {
      return Promise.resolve({ skipped: true, reason: 'clean' });
    }

    syncing = true;
    var payload;
    try {
      payload = ColeMathStorage.buildSyncPayload(pid);
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
      try { ColeMathStorage.markSynced(pid); } catch (e4) {}
      return { ok: true };
    }).catch(function () {
      if (timer) clearTimeout(timer);
      syncing = false;
      return { ok: false, error: timedOut ? 'timeout' : 'network' };
    });
  }

  /** Dad dashboard: GET ?key=... for remote totals. Never throws. */
  function fetchRemote() {
    if (!enabled()) return Promise.resolve({ skipped: true, reason: 'disabled' });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return Promise.resolve({ skipped: true, reason: 'offline' });
    }
    var cfg = ColeMathConfig || {};
    var url = endpoint();
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    var full = url + sep + 'key=' + encodeURIComponent(cfg.syncKey || '');
    return fetch(full, { method: 'GET', mode: 'cors', cache: 'no-store' }).then(function (res) {
      if (!res || !res.ok) return { ok: false, status: res && res.status };
      return res.json().then(function (data) {
        return { ok: true, data: data };
      }).catch(function () {
        return { ok: false, error: 'json' };
      });
    }).catch(function () {
      return { ok: false, error: 'network' };
    });
  }

  try {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', function () { trySync(); });
    }
  } catch (e) {}

  global.ColeMathSync = {
    trySync: trySync,
    fetchRemote: fetchRemote,
    enabled: enabled
  };
})(typeof window !== 'undefined' ? window : global);
