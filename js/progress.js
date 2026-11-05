/* Progress screen renderer (active student profile) */
(function (global) {
  'use strict';

  var TYPE_LABELS = {
    mul_fact: 'Multiplication facts',
    mul_long: 'Long multiply',
    mul_short: 'Short multiply',
    div_fact: 'Division facts',
    div_long: 'Long division',
    integer: 'Integers',
    bedmas: 'Order of operations',
    geometry: 'Geometry',
    decimal: 'Decimals',
    fraction: 'Fractions'
  };

  function render(el) {
    var p = ColeMathProfiles.getActive();
    var s = ColeMathStorage.todayStats();
    var html = '';
    html += '<div class="card">';
    html += '<h2 style="margin-top:0">' + (p ? p.name : 'Progress') + ' — today</h2>';
    html += '<div class="summary-grid">';
    html += '<div class="stat"><div class="n">' + s.attempted + '</div><div class="l">Attempted</div></div>';
    html += '<div class="stat"><div class="n">' + s.correct + '</div><div class="l">Correct</div></div>';
    html += '<div class="stat"><div class="n">' + s.accuracy + '%</div><div class="l">Accuracy</div></div>';
    html += '<div class="stat"><div class="n">' + s.streak + '</div><div class="l">Current streak</div></div>';
    html += '</div>';
    html += '<p class="hint">Best streak: ' + s.bestStreak + '</p>';

    html += '<h3>By type (today)</h3><ul class="hist-list">';
    var keys = Object.keys(s.byType || {});
    if (!keys.length) html += '<li><span>No answers yet today</span><span></span></li>';
    else keys.forEach(function (k) {
      var t = s.byType[k];
      var acc = t.attempted ? Math.round(100 * t.correct / t.attempted) : 0;
      html += '<li><span>' + (TYPE_LABELS[k] || k) + '</span><span>' + t.correct + '/' + t.attempted + ' (' + acc + '%)</span></li>';
    });
    html += '</ul>';

    html += '<h3>Most missed</h3><ul class="hist-list">';
    var missed = ColeMathStorage.topMissed(10);
    if (!missed.length) html += '<li><span>None yet</span><span></span></li>';
    else missed.forEach(function (m) {
      html += '<li><span>' + m.fact + '</span><span>' + m.misses + '</span></li>';
    });
    html += '</ul>';

    html += '<h3>Recent sessions</h3><ul class="hist-list">';
    if (!s.history.length) html += '<li><span>None yet</span><span></span></li>';
    else s.history.slice(0, 10).forEach(function (h) {
      html += '<li><span>' + h.date + '</span><span>' + h.correct + '/' + h.attempted + ' · ' + h.accuracy + '%</span></li>';
    });
    html += '</ul>';
    html += '<button class="btn secondary" id="switchFromProgress" type="button">Switch profile</button>';
    html += '<button class="btn secondary" id="resetProgressBtn" type="button">Reset this profile’s progress</button>';
    html += '</div>';
    el.innerHTML = html;
    var sw = document.getElementById('switchFromProgress');
    if (sw) sw.onclick = function () {
      if (window.ColeMathApp) ColeMathApp.showProfilePicker();
    };
    var btn = document.getElementById('resetProgressBtn');
    if (btn) {
      btn.onclick = function () {
        if (confirm('Clear saved progress for this profile on this phone?')) {
          ColeMathStorage.clearAll();
          render(el);
        }
      };
    }
  }

  global.ColeMathProgress = { render: render };
})(typeof window !== 'undefined' ? window : global);
