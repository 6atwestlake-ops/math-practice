/* Simple device profiles — no accounts. Optional 4-digit PIN (hashed). */
(function (global) {
  'use strict';
  var META_KEY = 'coleMathProfiles_v1';

  var PROFILES = {
    cole: {
      id: 'cole',
      name: 'Cole',
      role: 'student',
      setId: 'set1',
      sessionSize: 50,
      blurb: 'Grade 9 · Set 1 practice'
    },
    taya: {
      id: 'taya',
      name: 'Taya',
      role: 'student',
      setId: 'taya6',
      sessionSize: 30,
      blurb: 'Grade 6 · easier mix'
    },
    dad: {
      id: 'dad',
      name: 'Dad',
      role: 'dashboard',
      setId: null,
      sessionSize: 0,
      blurb: 'Progress for Cole & Taya'
    },
    guest: {
      id: 'guest',
      name: 'Guest',
      role: 'student',
      setId: 'guest',
      sessionSize: 50,
      blurb: 'Quick practice · no PIN'
    }
  };

  function loadMeta() {
    try {
      var raw = localStorage.getItem(META_KEY);
      if (!raw) return { pins: {}, active: null };
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return { pins: {}, active: null };
      if (!data.pins) data.pins = {};
      return data;
    } catch (e) {
      return { pins: {}, active: null };
    }
  }

  function saveMeta(meta) {
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {}
  }

  /** Casual PIN hash — not cryptographic security, just slows casual switching. */
  function hashPin(profileId, pin) {
    var s = 'mathPractice|' + profileId + '|' + String(pin);
    var h = 5381;
    var i;
    for (i = 0; i < s.length; i++) {
      h = ((h << 5) + h) + s.charCodeAt(i);
      h = h | 0;
    }
    return 'h' + (h >>> 0).toString(16);
  }

  function hasPin(profileId) {
    var meta = loadMeta();
    return !!(meta.pins[profileId] && meta.pins[profileId].hash);
  }

  function setPin(profileId, pin) {
    if (!/^\d{4}$/.test(String(pin))) return false;
    var meta = loadMeta();
    meta.pins[profileId] = { hash: hashPin(profileId, pin) };
    saveMeta(meta);
    return true;
  }

  function checkPin(profileId, pin) {
    var meta = loadMeta();
    var entry = meta.pins[profileId];
    if (!entry || !entry.hash) return true; // no PIN set yet
    return entry.hash === hashPin(profileId, pin);
  }

  function getActive() {
    var meta = loadMeta();
    if (!meta.active || !PROFILES[meta.active]) return null;
    return PROFILES[meta.active];
  }

  function setActive(profileId) {
    if (!PROFILES[profileId]) return null;
    var meta = loadMeta();
    meta.active = profileId;
    saveMeta(meta);
    return PROFILES[profileId];
  }

  function clearActive() {
    var meta = loadMeta();
    meta.active = null;
    saveMeta(meta);
  }

  function list() {
    return [PROFILES.cole, PROFILES.taya, PROFILES.dad, PROFILES.guest];
  }

  function get(id) {
    return PROFILES[id] || null;
  }

  function students() {
    return [PROFILES.cole, PROFILES.taya];
  }

  global.ColeMathProfiles = {
    list: list,
    get: get,
    students: students,
    getActive: getActive,
    setActive: setActive,
    clearActive: clearActive,
    hasPin: hasPin,
    setPin: setPin,
    checkPin: checkPin
  };
})(typeof window !== 'undefined' ? window : global);
