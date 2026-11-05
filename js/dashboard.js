/* Dad dashboard — local snapshots + optional remote GET */
(function (global) {
  'use strict';

  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/19CPb7IIJUie1fovmWgtbQ-ycaU3xx6v38UUMGdcS9-M/edit';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderProfileCard(name, snap, sourceLabel) {
    var html = '<div class="card" style="margin-bottom:14px">';
    html += '<h3 style="margin-top:0">' + esc(name);
    if (sourceLabel) html += ' <span class="type-tag">' + esc(sourceLabel) + '</span>';
    html += '</h3>';
    if (!snap || (!snap.attempted && !(snap.dailySessions && snap.dailySessions.length))) {
      html += '<p class="hint">No practice data yet.</p></div>';
      return html;
    }
    html += '<div class="summary-grid">';
    html += '<div class="stat"><div class="n">' + (snap.attempted || 0) + '</div><div class="l">Attempted</div></div>';
    html += '<div class="stat"><div class="n">' + (snap.correct || 0) + '</div><div class="l">Correct</div></div>';
    html += '<div class="stat"><div class="n">' + (snap.accuracy || 0) + '%</div><div class="l">Accuracy</div></div>';
    html += '<div class="stat"><div class="n">' + (snap.totalMinutes || 0) + '</div><div class="l">Minutes</div></div>';
    html += '</div>';

    html += '<h4>By topic</h4><ul class="hist-list">';
    var topics = snap.topics || {};
    var tkeys = Object.keys(topics);
    if (!tkeys.length) html += '<li><span>None yet</span><span></span></li>';
    else tkeys.forEach(function (k) {
      var t = topics[k];
      html += '<li><span>' + esc(k) + '</span><span>' + t.correct + '/' + t.attempted + ' (' + t.accuracy + '%)</span></li>';
    });
    html += '</ul>';

    html += '<h4>Most missed</h4><ul class="hist-list">';
    var missed = snap.missedFacts || [];
    if (!missed.length) html += '<li><span>None yet</span><span></span></li>';
    else missed.forEach(function (m) {
      html += '<li><span>' + esc(m.fact) + '</span><span>' + m.misses + '</span></li>';
    });
    html += '</ul>';

    html += '<h4>Daily sessions</h4><ul class="hist-list">';
    var days = snap.dailySessions || [];
    if (!days.length) html += '<li><span>None yet</span><span></span></li>';
    else days.slice(0, 14).forEach(function (d) {
      html += '<li><span>' + esc(d.date) + '</span><span>' + d.questions + ' Q · ' + d.accuracy + '% · ' + d.minutes + ' min</span></li>';
    });
    html += '</ul></div>';
    return html;
  }

  function mergePreferRemote(localSnap, remoteProf) {
    if (!remoteProf) return { snap: localSnap, label: 'This device' };
    // Prefer remote totals when present (kids' phones), still show local if remote empty
    if ((remoteProf.attempted || 0) >= (localSnap.attempted || 0)) {
      return {
        snap: {
          attempted: remoteProf.attempted,
          correct: remoteProf.correct,
          accuracy: remoteProf.accuracy,
          totalMinutes: remoteProf.totalMinutes,
          topics: remoteProf.topics || {},
          missedFacts: remoteProf.missedFacts || [],
          dailySessions: remoteProf.dailySessions || [],
          lastSyncedAt: remoteProf.syncedAt || remoteProf.lastSyncedAt || null
        },
        label: 'Synced'
      };
    }
    return { snap: localSnap, label: 'This device' };
  }

  function render(el, remote) {
    var students = ColeMathProfiles.students();
    var html = '';
    html += '<div class="card" style="margin-bottom:14px">';
    html += '<h2 style="margin-top:0">Dad dashboard</h2>';
    html += '<p class="hint">Local progress on this device';
    if (remote && remote.ok) html += ' · remote totals loaded';
    else if (remote && remote.skipped) html += ' · remote sync off or offline';
    else if (remote && remote.ok === false) html += ' · remote fetch failed (showing local)';
    html += '.</p>';
    var lastSync = null;
    if (remote && remote.data && remote.data.syncedAt) lastSync = remote.data.syncedAt;
    if (!lastSync && remote && remote.data && remote.data.profiles) {
      Object.keys(remote.data.profiles).forEach(function (k) {
        var s = remote.data.profiles[k] && (remote.data.profiles[k].syncedAt || remote.data.profiles[k].lastSyncedAt);
        if (s && (!lastSync || s > lastSync)) lastSync = s;
      });
    }
    html += '<p><strong>Last synced:</strong> ' + (lastSync ? esc(lastSync) : '—') + '</p>';
    html += '<p><a class="sheet-link" href="' + SHEET_URL + '" target="_blank" rel="noopener">Open Google Sheet</a></p>';
    html += '<button class="btn secondary" type="button" id="dashRefreshBtn">Refresh remote</button>';
    html += '<button class="btn secondary" type="button" id="dashSwitchBtn">Switch profile</button>';
    html += '</div>';

    var remoteProfiles = (remote && remote.data && remote.data.profiles) || {};
    students.forEach(function (p) {
      var local = ColeMathStorage.snapshot(p.id);
      var remoteOne = remoteProfiles[p.name] || remoteProfiles[p.id] || null;
      var merged = mergePreferRemote(local, remoteOne);
      html += renderProfileCard(p.name, merged.snap, merged.label);
    });

    el.innerHTML = html;
    var rb = document.getElementById('dashRefreshBtn');
    if (rb) rb.onclick = function () { refresh(el); };
    var sb = document.getElementById('dashSwitchBtn');
    if (sb) sb.onclick = function () {
      ColeMathProfiles.clearActive();
      if (global.ColeMathApp && ColeMathApp.showProfilePicker) ColeMathApp.showProfilePicker();
    };
  }

  function refresh(el) {
    el.innerHTML = '<div class="card"><p>Loading…</p></div>';
    var localOnly = function () { render(el, { skipped: true, reason: 'disabled' }); };
    if (!ColeMathSync.enabled()) {
      localOnly();
      return;
    }
    ColeMathSync.fetchRemote().then(function (remote) {
      render(el, remote);
    }).catch(function () {
      localOnly();
    });
  }

  global.ColeMathDashboard = {
    render: render,
    refresh: refresh,
    SHEET_URL: SHEET_URL
  };
})(typeof window !== 'undefined' ? window : global);
