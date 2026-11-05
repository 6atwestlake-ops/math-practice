/* Cole Math Practice — main app controller */
(function () {
  'use strict';

  var SESSION_SIZE = 50;
  var STREAK_REWARD = 5;

  var state = {
    session: [],
    index: 0,
    correctCount: 0,
    attempted: 0,      // first-try attempts counted toward session score
    firstTryOk: true,  // whether current question is still first-try
    startedAt: 0,
    awaitingNext: false
  };

  var els = {};

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
    }
    var s = $('screen-' + name);
    if (s) s.className += ' active';
    var t = $('tab-' + name);
    if (t) t.className += ' active';
    if (name === 'progress') {
      ColeMathProgress.render($('progressRoot'));
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
    var mod = ColeMathQuestions.current();
    if (!mod) {
      alert('Question module not loaded.');
      return;
    }
    state.session = mod.makeSession(SESSION_SIZE);
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
      '<button class="btn secondary" id="toProgressBtn" type="button">See progress</button>';
    showScreen('summary');
    $('againBtn').onclick = startSession;
    $('toProgressBtn').onclick = function () { showScreen('progress'); };
  }

  function afterCorrect() {
    var streak = ColeMathStorage.getStreak();
    $('feedback').textContent = '✓';
    $('feedback').className = 'feedback ok';
    state.awaitingNext = true;
    updateHud();
    if (streak > 0 && streak % STREAK_REWARD === 0) {
      setTimeout(function () {
        ColeMathGame.start(function () {
          advance();
        });
      }, 450);
    } else {
      setTimeout(advance, 450);
    }
  }

  function advance() {
    state.index += 1;
    if (state.index >= state.session.length) {
      finishSession();
    } else {
      renderQuestion();
    }
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
        // retry success: don't inflate attempted again; still bump streak
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
      // keep same question; select input for retry
      try {
        $('answerInput').select();
      } catch (e) {}
    }
  }

  function bind() {
    els = {
      answerInput: $('answerInput'),
      submitBtn: $('submitBtn')
    };
    $('tab-home').onclick = function () { showScreen('home'); };
    $('tab-practice').onclick = function () {
      if (!state.session.length) startSession();
      else showScreen('practice');
    };
    $('tab-progress').onclick = function () { showScreen('progress'); };
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
    // Ensure Set 1 is registered even if script order was odd
    if (window.ColeMathSet1 && window.ColeMathQuestions) {
      ColeMathQuestions.register(ColeMathSet1);
    }
    bind();
    showScreen('home');
    registerSW();
    try { if (window.ColeMathSync) ColeMathSync.trySync(); } catch (eSync) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for tests
  window.ColeMathApp = {
    startSession: startSession,
    submit: submit,
    getState: function () { return state; },
    STREAK_REWARD: STREAK_REWARD,
    trySync: function () {
      return window.ColeMathSync ? ColeMathSync.trySync() : Promise.resolve({ skipped: true });
    }
  };
})();
