/* Math Practice — profiles, practice, Dad dashboard */
(function () {
  'use strict';

  var STREAK_REWARD = 5;

  var state = {
    session: [],
    index: 0,
    correctCount: 0,
    attempted: 0,
    firstTryOk: true,
    startedAt: 0,
    awaitingNext: false
  };

  function $(id) { return document.getElementById(id); }

  function showScreen(name) {
    var screens = document.querySelectorAll('.screen');
    var i;
    for (i = 0; i < screens.length; i++) {
      screens[i].className = screens[i].className.replace(/\bactive\b/g, '').replace(/\s+/g, ' ').trim();
    }
    var tabs = document.querySelectorAll('nav.tabs button');
    for (i = 0; i < tabs.length; i++) {
      tabs[i].className = tabs[i].className.replace(/\bactive\b/g, '').replace(/\s+/g, ' ').trim();
      tabs[i].style.display = '';
    }
    var s = $('screen-' + name);
    if (s) s.className += ' active';
    var t = $('tab-' + name);
    if (t) t.className += ' active';

    var p = ColeMathProfiles.getActive();
    if (p && p.role === 'dashboard') {
      // Dad: hide practice tab
      if ($('tab-practice')) $('tab-practice').style.display = 'none';
      if ($('tab-progress')) $('tab-progress').style.display = 'none';
      if ($('tab-home')) $('tab-home').textContent = 'Dashboard';
    } else {
      if ($('tab-home')) $('tab-home').textContent = 'Home';
    }

    if (name === 'progress' && p && p.role === 'student') {
      ColeMathProgress.render($('progressRoot'));
    }
    if (name === 'dashboard') {
      ColeMathDashboard.refresh($('dashboardRoot'));
    }
  }

  function updateChrome() {
    var p = ColeMathProfiles.getActive();
    var title = p ? (p.name + ' Math') : 'Math Practice';
    if ($('appTitle')) $('appTitle').textContent = title;
    if ($('streakHud')) {
      if (p && p.role === 'student') {
        $('streakHud').textContent = 'Streak ' + ColeMathStorage.getStreak();
      } else {
        $('streakHud').textContent = p ? p.name : '';
      }
    }
  }

  function showProfilePicker() {
    ColeMathProfiles.clearActive();
    state.session = [];
    updateChrome();
    var root = $('profileList');
    var html = '';
    ColeMathProfiles.list().forEach(function (p) {
      html += '<button type="button" class="btn profile-btn" data-id="' + p.id + '">';
      html += '<strong>' + p.name + '</strong><span class="hint">' + p.blurb + '</span>';
      html += '</button>';
    });
    root.innerHTML = html;
    var btns = root.querySelectorAll('.profile-btn');
    var i;
    for (i = 0; i < btns.length; i++) {
      btns[i].onclick = function (ev) {
        var id = (ev.currentTarget.getAttribute('data-id'));
        beginProfile(id);
      };
    }
    $('pinPanel').style.display = 'none';
    showScreen('profiles');
    // hide main tabs on picker
    var tabs = document.querySelectorAll('nav.tabs button');
    for (i = 0; i < tabs.length; i++) tabs[i].style.display = 'none';
  }

  var pendingProfileId = null;

  function beginProfile(id) {
    pendingProfileId = id;
    var needsSet = !ColeMathProfiles.hasPin(id);
    $('pinPanel').style.display = 'block';
    $('pinInput').value = '';
    if (needsSet) {
      $('pinTitle').textContent = 'Choose a 4-digit PIN for ' + ColeMathProfiles.get(id).name;
      $('pinHint').textContent = 'Optional lock so others do not switch by accident. You can use 0000 if you want it easy.';
      $('pinSubmit').textContent = 'Save PIN & continue';
    } else {
      $('pinTitle').textContent = 'Enter PIN for ' + ColeMathProfiles.get(id).name;
      $('pinHint').textContent = '';
      $('pinSubmit').textContent = 'Unlock';
    }
    setTimeout(function () { try { $('pinInput').focus(); } catch (e) {} }, 50);
  }

  function submitPin() {
    var id = pendingProfileId;
    if (!id) return;
    var pin = ($('pinInput').value || '').trim();
    if (!/^\d{4}$/.test(pin)) {
      $('pinHint').textContent = 'Please enter exactly 4 digits.';
      return;
    }
    if (!ColeMathProfiles.hasPin(id)) {
      ColeMathProfiles.setPin(id, pin);
    } else if (!ColeMathProfiles.checkPin(id, pin)) {
      $('pinHint').textContent = 'That PIN does not match. Try again.';
      return;
    }
    enterProfile(id);
  }

  function enterProfile(id) {
    ColeMathProfiles.setActive(id);
    pendingProfileId = null;
    $('pinPanel').style.display = 'none';
    updateChrome();
    var tabs = document.querySelectorAll('nav.tabs button');
    var i;
    for (i = 0; i < tabs.length; i++) tabs[i].style.display = '';

    var p = ColeMathProfiles.getActive();
    if (p.role === 'dashboard') {
      showScreen('dashboard');
    } else {
      // update home blurb
      if ($('homeBlurb')) {
        $('homeBlurb').textContent = p.id === 'taya'
          ? 'About 30 questions: times tables, division, decimals, fractions, and rectangle perimeter/area.'
          : 'About 50 questions in the Set 1 mix: times tables, division, integers, BEDMAS, and geometry.';
      }
      if ($('homeTitle')) $('homeTitle').textContent = p.name + ' — today’s set';
      showScreen('home');
      try { if (window.ColeMathSync) ColeMathSync.trySync(); } catch (e) {}
    }
  }

  function currentQ() {
    return state.session[state.index] || null;
  }

  function updateHud() {
    var total = state.session.length;
    var pct = total ? Math.round(100 * state.index / total) : 0;
    $('barFill').style.width = pct + '%';
    $('qCount').textContent = Math.min(state.index + 1, total) + ' / ' + total;
    $('streakHud').textContent = 'Streak ' + ColeMathStorage.getStreak();
  }

  function renderQuestion() {
    var q = currentQ();
    state.awaitingNext = false;
    state.firstTryOk = true;
    if (!q) {
      finishSession();
      return;
    }
    $('typeTag').textContent = q.label || q.type;
    var prompt = $('prompt');
    prompt.textContent = q.prompt + (q.hint || '');
    prompt.className = 'prompt' + (q.promptClass ? ' ' + q.promptClass : '');
    $('answerInput').value = '';
    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
    updateHud();
    setTimeout(function () {
      try { $('answerInput').focus(); } catch (e) {}
    }, 50);
  }

  function startSession() {
    var p = ColeMathProfiles.getActive();
    if (!p || p.role !== 'student') {
      showProfilePicker();
      return;
    }
    var mod = ColeMathQuestions.current();
    if (!mod) {
      alert('Question module not loaded.');
      return;
    }
    state.session = mod.makeSession(p.sessionSize || 50);
    state.index = 0;
    state.correctCount = 0;
    state.attempted = 0;
    state.startedAt = Date.now();
    ColeMathStorage.resetStreak();
    showScreen('practice');
    renderQuestion();
  }

  function finishSession() {
    var elapsed = Math.round((Date.now() - state.startedAt) / 1000);
    var acc = state.attempted ? Math.round(100 * state.correctCount / state.attempted) : 0;
    try { ColeMathStorage.addTime(elapsed); } catch (e0) {}
    ColeMathStorage.saveSessionSummary({
      attempted: state.attempted,
      correct: state.correctCount,
      accuracy: acc,
      durationSec: elapsed
    });
    try { if (window.ColeMathSync) ColeMathSync.trySync(); } catch (e1) {}
    $('summaryBody').innerHTML =
      '<div class="summary-grid">' +
      '<div class="stat"><div class="n">' + state.correctCount + '</div><div class="l">Correct (first try)</div></div>' +
      '<div class="stat"><div class="n">' + state.attempted + '</div><div class="l">Questions</div></div>' +
      '<div class="stat"><div class="n">' + acc + '%</div><div class="l">Accuracy</div></div>' +
      '<div class="stat"><div class="n">' + elapsed + 's</div><div class="l">Time</div></div>' +
      '</div>' +
      '<button class="btn" id="againBtn" type="button">Do another set</button>' +
      '<button class="btn secondary" id="toProgressBtn" type="button">See progress</button>' +
      '<button class="btn secondary" id="switchAfterBtn" type="button">Switch profile</button>';
    showScreen('summary');
    $('againBtn').onclick = startSession;
    $('toProgressBtn').onclick = function () { showScreen('progress'); };
    $('switchAfterBtn').onclick = showProfilePicker;
  }

  function afterCorrect() {
    var streak = ColeMathStorage.getStreak();
    $('feedback').textContent = '✓';
    $('feedback').className = 'feedback ok';
    state.awaitingNext = true;
    updateHud();
    if (streak > 0 && streak % STREAK_REWARD === 0) {
      setTimeout(function () {
        ColeMathGame.start(function () { advance(); });
      }, 450);
    } else {
      setTimeout(advance, 450);
    }
  }

  function advance() {
    state.index += 1;
    if (state.index >= state.session.length) finishSession();
    else renderQuestion();
  }

  function submit() {
    if (state.awaitingNext) return;
    var q = currentQ();
    if (!q) return;
    var raw = $('answerInput').value;
    var ok = q.check(raw);
    if (ok) {
      if (state.firstTryOk) {
        state.attempted += 1;
        state.correctCount += 1;
        ColeMathStorage.recordAnswer(q.type, true, q.prompt);
      } else {
        ColeMathStorage.recordAnswer(q.type, true, q.prompt);
      }
      afterCorrect();
    } else {
      if (state.firstTryOk) {
        state.attempted += 1;
        ColeMathStorage.recordAnswer(q.type, false, q.prompt);
        state.firstTryOk = false;
      } else {
        ColeMathStorage.recordAnswer(q.type, false, q.prompt);
      }
      $('feedback').textContent = '✗  Try again';
      $('feedback').className = 'feedback bad';
      updateHud();
      try { $('answerInput').select(); } catch (e) {}
    }
  }

  function bind() {
    $('tab-home').onclick = function () {
      var p = ColeMathProfiles.getActive();
      if (!p) return showProfilePicker();
      if (p.role === 'dashboard') showScreen('dashboard');
      else showScreen('home');
    };
    $('tab-practice').onclick = function () {
      var p = ColeMathProfiles.getActive();
      if (!p || p.role !== 'student') return showProfilePicker();
      if (!state.session.length) startSession();
      else showScreen('practice');
    };
    $('tab-progress').onclick = function () {
      var p = ColeMathProfiles.getActive();
      if (!p || p.role !== 'student') return showProfilePicker();
      showScreen('progress');
    };
    $('startBtn').onclick = startSession;
    $('submitBtn').onclick = submit;
    $('minusBtn').onclick = function () {
      var inp = $('answerInput');
      var v = inp.value || '';
      if (v.charAt(0) === '-') inp.value = v.slice(1);
      else inp.value = '-' + v;
      try { inp.focus(); } catch (e) {}
    };
    $('answerInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        submit();
      }
    });
    $('pinSubmit').onclick = submitPin;
    $('pinInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        submitPin();
      }
    });
    $('pinCancel').onclick = function () {
      pendingProfileId = null;
      $('pinPanel').style.display = 'none';
    };
    $('switchProfileBtn').onclick = showProfilePicker;
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js').then(function (reg) {
      console.log('[sw] registered', reg.scope);
    }).catch(function (err) {
      console.warn('[sw] failed', err);
    });
  }

  function init() {
    if (window.ColeMathSet1 && window.ColeMathQuestions) ColeMathQuestions.register(ColeMathSet1);
    if (window.ColeMathTaya6 && window.ColeMathQuestions) ColeMathQuestions.register(ColeMathTaya6);
    bind();
    var p = ColeMathProfiles.getActive();
    if (!p) {
      showProfilePicker();
    } else {
      updateChrome();
      if (p.role === 'dashboard') showScreen('dashboard');
      else {
        if ($('homeBlurb')) {
          $('homeBlurb').textContent = p.id === 'taya'
            ? 'About 30 questions: times tables, division, decimals, fractions, and rectangle perimeter/area.'
            : 'About 50 questions in the Set 1 mix: times tables, division, integers, BEDMAS, and geometry.';
        }
        if ($('homeTitle')) $('homeTitle').textContent = p.name + ' — today’s set';
        showScreen('home');
        try { if (window.ColeMathSync) ColeMathSync.trySync(); } catch (e) {}
      }
    }
    registerSW();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ColeMathApp = {
    startSession: startSession,
    submit: submit,
    getState: function () { return state; },
    STREAK_REWARD: STREAK_REWARD,
    showProfilePicker: showProfilePicker,
    enterProfile: enterProfile,
    beginProfile: beginProfile,
    submitPin: submitPin,
    trySync: function () {
      return window.ColeMathSync ? ColeMathSync.trySync() : Promise.resolve({ skipped: true });
    }
  };
})();
