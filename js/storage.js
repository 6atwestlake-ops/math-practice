/* Per-profile localStorage progress — offline-first */
(function (global) {
  'use strict';

  function storageKey(profileId) {
    return 'coleMathProgress_' + (profileId || 'cole') + '_v1';
  }

  function todayKey() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function empty() {
    return {
      streak: 0,
      bestStreak: 0,
      days: {},
      history: [],
      missed: {},
      lifetime: { attempted: 0, correct: 0, byType: {}, missed: {}, totalSec: 0 },
      syncDirty: false
    };
  }

  function activeId() {
    var p = global.ColeMathProfiles && ColeMathProfiles.getActive();
    return p && p.role === 'student' ? p.id : null;
  }

  function load(profileId) {
    profileId = profileId || activeId();
    if (!profileId) return empty();
    try {
      var raw = localStorage.getItem(storageKey(profileId));
      if (!raw) return empty();
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return empty();
      if (!data.lifetime) data.lifetime = { attempted: 0, correct: 0, byType: {}, missed: {}, totalSec: 0 };
      if (!data.missed) data.missed = data.lifetime.missed || {};
      if (!data.days) data.days = {};
      if (!data.history) data.history = [];
      return data;
    } catch (e) {
      return empty();
    }
  }

  function save(data, profileId) {
    profileId = profileId || activeId();
    if (!profileId) return;
    try {
      localStorage.setItem(storageKey(profileId), JSON.stringify(data));
    } catch (e) {}
  }

  function recordAnswer(type, correct, prompt, profileId) {
    profileId = profileId || activeId();
    var data = load(profileId);
    var day = todayKey();
    if (!data.days[day]) data.days[day] = { attempted: 0, correct: 0, byType: {}, seconds: 0 };
    var d = data.days[day];
    d.attempted += 1;
    data.lifetime.attempted = (data.lifetime.attempted || 0) + 1;
    if (correct) {
      d.correct += 1;
      data.lifetime.correct = (data.lifetime.correct || 0) + 1;
      data.streak = (data.streak || 0) + 1;
      if (data.streak > (data.bestStreak || 0)) data.bestStreak = data.streak;
    } else {
      data.streak = 0;
      if (prompt) {
        if (!data.missed) data.missed = {};
        data.missed[prompt] = (data.missed[prompt] || 0) + 1;
        if (!data.lifetime.missed) data.lifetime.missed = {};
        data.lifetime.missed[prompt] = (data.lifetime.missed[prompt] || 0) + 1;
      }
    }
    if (!d.byType[type]) d.byType[type] = { attempted: 0, correct: 0 };
    d.byType[type].attempted += 1;
    if (correct) d.byType[type].correct += 1;
    if (!data.lifetime.byType[type]) data.lifetime.byType[type] = { attempted: 0, correct: 0 };
    data.lifetime.byType[type].attempted += 1;
    if (correct) data.lifetime.byType[type].correct += 1;
    data.syncDirty = true;
    save(data, profileId);
    return data;
  }

  function addTime(seconds, profileId) {
    if (!seconds || seconds < 0) return load(profileId);
    var data = load(profileId);
    var day = todayKey();
    if (!data.days[day]) data.days[day] = { attempted: 0, correct: 0, byType: {}, seconds: 0 };
    data.days[day].seconds = (data.days[day].seconds || 0) + seconds;
    data.lifetime.totalSec = (data.lifetime.totalSec || 0) + seconds;
    data.syncDirty = true;
    save(data, profileId);
    return data;
  }

  function resetStreak(profileId) {
    var data = load(profileId);
    data.streak = 0;
    save(data, profileId);
    return data;
  }

  function getStreak(profileId) {
    return load(profileId).streak || 0;
  }

  function saveSessionSummary(summary, profileId) {
    var data = load(profileId);
    data.history = data.history || [];
    data.history.unshift({
      date: todayKey(),
      attempted: summary.attempted,
      correct: summary.correct,
      accuracy: summary.accuracy,
      durationSec: summary.durationSec
    });
    if (data.history.length > 60) data.history = data.history.slice(0, 60);
    data.syncDirty = true;
    save(data, profileId);
    return data;
  }

  function todayStats(profileId) {
    var data = load(profileId);
    var d = data.days[todayKey()] || { attempted: 0, correct: 0, byType: {}, seconds: 0 };
    return {
      attempted: d.attempted,
      correct: d.correct,
      accuracy: d.attempted ? Math.round(100 * d.correct / d.attempted) : 0,
      byType: d.byType,
      streak: data.streak || 0,
      bestStreak: data.bestStreak || 0,
      history: data.history || [],
      totalSec: (data.lifetime && data.lifetime.totalSec) || 0,
      missed: data.missed || {}
    };
  }

  function topMissed(n, profileId) {
    n = n || 10;
    var missed = load(profileId).missed || {};
    var keys = Object.keys(missed);
    keys.sort(function (a, b) { return missed[b] - missed[a]; });
    var out = [];
    var i;
    for (i = 0; i < keys.length && i < n; i++) {
      out.push({ fact: keys[i], misses: missed[keys[i]] });
    }
    return out;
  }

  function accuracyByTopic(profileId) {
    var life = load(profileId).lifetime || {};
    var byType = life.byType || {};
    var out = {};
    Object.keys(byType).forEach(function (k) {
      var t = byType[k];
      out[k] = {
        attempted: t.attempted,
        correct: t.correct,
        accuracy: t.attempted ? Math.round(100 * t.correct / t.attempted) : 0
      };
    });
    return out;
  }

  function dailySessions(profileId) {
    var hist = load(profileId).history || [];
    return hist.map(function (h) {
      return {
        date: h.date,
        questions: h.attempted,
        accuracy: h.accuracy,
        minutes: Math.round(((h.durationSec || 0) / 60) * 10) / 10
      };
    });
  }

  function buildSyncPayload(profileId) {
    profileId = profileId || activeId();
    var data = load(profileId);
    var cfg = global.ColeMathConfig || {};
    var life = data.lifetime || { attempted: 0, correct: 0, totalSec: 0 };
    var prof = global.ColeMathProfiles && ColeMathProfiles.get(profileId);
    return {
      key: cfg.syncKey || '',
      profile: prof ? prof.name : profileId,
      attempted: life.attempted || 0,
      correct: life.correct || 0,
      accuracy: life.attempted ? Math.round(100 * life.correct / life.attempted) : 0,
      totalMinutes: Math.round(((life.totalSec || 0) / 60) * 10) / 10,
      topics: accuracyByTopic(profileId),
      missedFacts: topMissed(10, profileId),
      dailySessions: dailySessions(profileId),
      syncedAt: new Date().toISOString()
    };
  }

  function markSynced(profileId) {
    var data = load(profileId);
    data.syncDirty = false;
    data.lastSyncedAt = new Date().toISOString();
    save(data, profileId);
    return data;
  }

  function isDirty(profileId) {
    return !!load(profileId).syncDirty;
  }

  function clearAll(profileId) {
    profileId = profileId || activeId();
    if (!profileId) return;
    try { localStorage.removeItem(storageKey(profileId)); } catch (e) {}
  }

  /** Snapshot for Dad dashboard (local). */
  function snapshot(profileId) {
    var data = load(profileId);
    var life = data.lifetime || {};
    return {
      profileId: profileId,
      attempted: life.attempted || 0,
      correct: life.correct || 0,
      accuracy: life.attempted ? Math.round(100 * life.correct / life.attempted) : 0,
      totalMinutes: Math.round(((life.totalSec || 0) / 60) * 10) / 10,
      topics: accuracyByTopic(profileId),
      missedFacts: topMissed(10, profileId),
      dailySessions: dailySessions(profileId),
      lastSyncedAt: data.lastSyncedAt || null,
      bestStreak: data.bestStreak || 0
    };
  }

  global.ColeMathStorage = {
    load: load,
    save: save,
    recordAnswer: recordAnswer,
    addTime: addTime,
    resetStreak: resetStreak,
    getStreak: getStreak,
    saveSessionSummary: saveSessionSummary,
    todayStats: todayStats,
    topMissed: topMissed,
    accuracyByTopic: accuracyByTopic,
    dailySessions: dailySessions,
    buildSyncPayload: buildSyncPayload,
    markSynced: markSynced,
    isDirty: isDirty,
    clearAll: clearAll,
    snapshot: snapshot,
    todayKey: todayKey,
    storageKey: storageKey
  };
})(typeof window !== 'undefined' ? window : global);
