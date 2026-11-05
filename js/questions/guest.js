/* Guest practice — Level N (1–20) uses numbers from 1 through N */
(function (global) {
  'use strict';

  var level = 10;

  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function checkNum(user, answer) {
    if (user === null || user === undefined) return false;
    var t = String(user).replace(/,/g, '').trim();
    if (t === '' || t === '-' || t === '.') return false;
    var n = Number(t);
    if (isNaN(n)) return false;
    return Math.abs(n - answer) < 0.051;
  }

  function setLevel(n) {
    level = Math.max(1, Math.min(20, parseInt(n, 10) || 10));
    return level;
  }

  function getLevel() { return level; }

  /* Back-compat if anything still calls setParams(N, T) — N is the level. */
  function setParams(n) { return setLevel(n); }

  function operandsInPrompt(prompt) {
    var parts = String(prompt).split(/\s+/);
    var out = [];
    var i, n;
    for (i = 0; i < parts.length; i++) {
      if (/^\d+$/.test(parts[i])) {
        n = parseInt(parts[i], 10);
        out.push(n);
      }
    }
    return out;
  }

  function makeOne() {
    var N = level;
    var a = rnd(1, N);
    var b = rnd(1, N);
    var ops = [];

    ops.push({ prompt: a + ' + ' + b, answer: a + b });
    if (a >= b) ops.push({ prompt: a + ' − ' + b, answer: a - b });
    if (b >= a && b !== a) ops.push({ prompt: b + ' − ' + a, answer: b - a });
    ops.push({ prompt: a + ' × ' + b, answer: a * b });
    if (b !== 0 && a % b === 0) ops.push({ prompt: a + ' ÷ ' + b, answer: a / b });
    if (a !== 0 && b % a === 0 && a !== b) ops.push({ prompt: b + ' ÷ ' + a, answer: b / a });

    if (!ops.length) ops.push({ prompt: a + ' + ' + b, answer: a + b });
    var ch = pick(ops);
    return {
      type: 'guest',
      label: 'Level ' + N,
      prompt: ch.prompt,
      answer: ch.answer,
      check: function (u) { return checkNum(u, ch.answer); }
    };
  }

  function makeSession(count) {
    count = count || 20;
    var out = [];
    var i;
    for (i = 0; i < count; i++) out.push(makeOne());
    return out;
  }

  function generateOne() { return makeOne(); }

  function selfTest() {
    var results = {};
    var levels = [1, 5, 10, 20];
    var li, i, q, nums, bad, maxSeen, n;
    for (li = 0; li < levels.length; li++) {
      n = levels[li];
      setLevel(n);
      bad = 0;
      maxSeen = 0;
      for (i = 0; i < 300; i++) {
        q = makeOne();
        if (!q.check(String(q.answer))) bad++;
        nums = operandsInPrompt(q.prompt);
        if (nums.length < 2) bad++;
        if (nums[0] < 1 || nums[0] > n || nums[1] < 1 || nums[1] > n) bad++;
        if (nums[0] > maxSeen) maxSeen = nums[0];
        if (nums[1] > maxSeen) maxSeen = nums[1];
      }
      results['level' + n] = { tested: 300, fail: bad, pass: bad === 0, maxOperand: maxSeen };
    }
    setLevel(1);
    var tiny = {};
    for (i = 0; i < 50; i++) {
      q = makeOne();
      nums = operandsInPrompt(q.prompt);
      tiny[nums[0] + ',' + nums[1]] = true;
    }
    results.level1OnlyUses1 = Object.keys(tiny).join(',') === '1,1';
    setLevel(20);
    var sawBig = false;
    for (i = 0; i < 400; i++) {
      q = makeOne();
      nums = operandsInPrompt(q.prompt);
      if (nums[0] > 10 || nums[1] > 10) { sawBig = true; break; }
    }
    results.level20UsesNumbersAbove10 = sawBig;
    results.levelsDiffer = results.level1OnlyUses1 && sawBig;
    return results;
  }

  global.ColeMathGuest = {
    id: 'guest',
    name: 'Guest',
    setLevel: setLevel,
    getLevel: getLevel,
    setParams: setParams,
    getParams: function () { return { numberSet: level, target: level }; },
    generateOne: generateOne,
    makeSession: makeSession,
    selfTest: selfTest,
    operandsInPrompt: operandsInPrompt,
    generators: { guest: makeOne }
  };
})(typeof window !== 'undefined' ? window : global);
