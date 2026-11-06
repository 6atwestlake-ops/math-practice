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
    if (window.ColeMathDraw) {
      ColeMathDraw.setEnabled(name === 'practice');
      if (name === 'practice') ColeMathDraw.clear();
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
        if (id === 'guest') beginGuest();
        else beginProfile(id);
      };
    }
    $('pinPanel').style.display = 'none';
    if ($('guestSetup')) $('guestSetup').style.display = 'none';
    showScreen('profiles');
    // hide main tabs on picker
    var tabs = document.querySelectorAll('nav.tabs button');
    for (i = 0; i < tabs.length; i++) tabs[i].style.display = 'none';
  }

  var pendingProfileId = null;
  var GUEST_LEVEL_KEY = 'coleMathGuestLevel';

  function fillGuestLevels() {
    var sel = $('guestLevel');
    if (!sel) return;
    if (!sel.options.length) {
      var i, opt;
      for (i = 1; i <= 20; i++) {
        opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = 'Level ' + i;
        sel.appendChild(opt);
      }
    }
    var saved = '10';
    try { saved = localStorage.getItem(GUEST_LEVEL_KEY) || '10'; } catch (e) {}
    if (parseInt(saved, 10) >= 1 && parseInt(saved, 10) <= 20) sel.value = saved;
    sel.onchange = updateGuestLevelDesc;
    updateGuestLevelDesc();
  }

  function updateGuestLevelDesc() {
    var sel = $('guestLevel');
    var el = $('guestLevelDesc');
    if (!sel || !el) return;
    if (window.ColeMathGuest && ColeMathGuest.describe) el.textContent = ColeMathGuest.describe(sel.value);
  }

  function beginGuest() {
    pendingProfileId = 'guest';
    if ($('pinPanel')) $('pinPanel').style.display = 'none';
    fillGuestLevels();
    if ($('guestSetup')) $('guestSetup').style.display = 'block';
  }

  var COLE_LEVEL_KEY = 'coleMathColeLevel';
  function levelKeyFor(pid) { return pid === 'guest' ? GUEST_LEVEL_KEY : 'coleMath' + pid.charAt(0).toUpperCase() + pid.slice(1) + 'Level'; }
  function savedLevel(pid) {
    var v = NaN;
    try { v = parseInt(localStorage.getItem(levelKeyFor(pid)), 10); } catch (e) {}
    if (!(v >= 1 && v <= 20)) v = pid === 'guest' ? 10 : 1;
    return v;
  }
  function fillHomeLevels(pid) {
    var sel = $('homeLevel');
    if (!sel) return;
    if (!sel.options.length) {
      var i, opt;
      for (i = 1; i <= 20; i++) {
        opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = 'Set ' + i;
        sel.appendChild(opt);
      }
    }
    sel.value = String(savedLevel(pid));
    sel.onchange = function () {
      try { localStorage.setItem(levelKeyFor(pid), sel.value); } catch (e) {}
      updateHomeLevelDesc();
    };
    updateHomeLevelDesc();
  }
  function updateHomeLevelDesc() {
    var sel = $('homeLevel'), el = $('homeLevelDesc');
    if (sel && el && window.ColeMathGuest && ColeMathGuest.describe) el.textContent = ColeMathGuest.describe(sel.value);
  }

  function startGuestPractice() {
    var sel = $('guestLevel');
    var level = sel ? parseInt(sel.value, 10) : 10;
    if (!(level >= 1 && level <= 20)) level = 10;
    try { localStorage.setItem(GUEST_LEVEL_KEY, String(level)); } catch (e2) {}
    if (window.ColeMathGuest && ColeMathGuest.setLevel) ColeMathGuest.setLevel(level);
    if ($('guestSetup')) $('guestSetup').style.display = 'none';
    enterProfile('guest');
    startSession();
  }


  function beginProfile(id) {
    if (id === 'guest') { beginGuest(); return; }
    pendingProfileId = id;
    if ($('guestSetup')) $('guestSetup').style.display = 'none';
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
        if (p.id === 'taya') {
          $('homeBlurb').textContent = 'About 30 questions: times tables, division, decimals, fractions, and rectangle perimeter/area.';
        } else if (p.id === 'guest') {
          $('homeBlurb').textContent = '50 questions at Level ' + savedLevel('guest') + ' on the Grade 5 to 9 path (' + (window.ColeMathGuest ? ColeMathGuest.describe(savedLevel('guest')) : '') + ').';
        } else if (p.setId === 'guest') {
          $('homeBlurb').textContent = '50 questions per set. Sets 1–4 are 6×6 to 10×10 facts and division, then Grade 5 to 9 work. Pick your set below.';
        } else {
          $('homeBlurb').textContent = 'About 50 questions in the Set 1 mix: times tables, division, integers, BEDMAS, and geometry.';
        }
      }
      if ($('homeLevelWrap')) {
        var showLv = p.setId === 'guest' && p.id !== 'guest';
        $('homeLevelWrap').style.display = showLv ? 'block' : 'none';
        if (showLv) fillHomeLevels(p.id);
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
    state.wrongTries = 0;
    if (!q) {
      finishSession();
      return;
    }
    $('typeTag').textContent = q.label || q.type;
    var prompt = $('prompt');
    prompt.textContent = q.prompt + (q.hint ? '\n' + q.hint : '');
    prompt.className = 'prompt' + (q.promptClass ? ' ' + q.promptClass : '');
    $('answerInput').value = '';
    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
    if (window.ColeMathDraw) ColeMathDraw.clear();
    if ($('skipBtn')) $('skipBtn').disabled = (state.session.length - state.index) <= 1;
    updateHud();
  }

  function answerText(q) {
    var a = q.answer;
    if (typeof a === 'number') return String(a);
    if (a && a.kind === 'qr') return a.q + ' r ' + a.r;
    return String(a);
  }

  function skip() {
    if (state.awaitingNext) return;
    var remaining = state.session.length - state.index;
    if (remaining <= 1) return;
    var q = state.session.splice(state.index, 1)[0];
    state.session.push(q);
    renderQuestion();
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
    if (p.setId === 'guest' && mod.setLevel) mod.setLevel(savedLevel(p.id));
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
        if (window.ColeMathDraw) ColeMathDraw.setEnabled(false);
        ColeMathGame.start(function () {
          if (window.ColeMathDraw) ColeMathDraw.setEnabled(true);
          advance();
        });
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
      state.wrongTries = (state.wrongTries || 0) + 1;
      if (state.wrongTries >= 3) {
        state.awaitingNext = true;
        $('feedback').textContent = 'The answer is ' + answerText(q) + '. Next one!';
        $('feedback').className = 'feedback bad';
        ColeMathStorage.resetStreak();
        updateHud();
        setTimeout(advance, 2200);
        return;
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
    if ($('skipBtn')) $('skipBtn').onclick = skip;
    if ($('remBtn')) {
      $('remBtn').onclick = function () {
        var inp = $('answerInput');
        var v = (inp.value || '').replace(/\s+$/, '');
        if (!/r/i.test(v)) inp.value = v + ' r ';
        try { inp.focus(); } catch (e) {}
      };
    }
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
    if ($('clearMarksBtn')) {
      $('clearMarksBtn').onclick = function () {
        if (window.ColeMathDraw) ColeMathDraw.clear();
      };
    }
    if ($('guestStartBtn')) $('guestStartBtn').onclick = startGuestPractice;
    if ($('guestCancelBtn')) {
      $('guestCancelBtn').onclick = function () {
        pendingProfileId = null;
        if ($('guestSetup')) $('guestSetup').style.display = 'none';
      };
    }
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
    if (window.ColeMathGuest && window.ColeMathQuestions) ColeMathQuestions.register(ColeMathGuest);
    bind();
    showProfilePicker();
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
    skip: skip,
    STREAK_REWARD: STREAK_REWARD,
    showProfilePicker: showProfilePicker,
    beginGuest: beginGuest,
    startGuestPractice: startGuestPractice,
    enterProfile: enterProfile,
    beginProfile: beginProfile,
    submitPin: submitPin,
    trySync: function () {
      return window.ColeMathSync ? ColeMathSync.trySync() : Promise.resolve({ skipped: true });
    }
  };
})();
