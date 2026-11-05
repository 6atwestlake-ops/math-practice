/* Guest practice — Number set N (1..N) and Target T; mixed + − × ÷ */
(function (global) {
  'use strict';

  var numberSet = 10;
  var target = 5;

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

  function setParams(n, t) {
    numberSet = Math.max(1, Math.min(20, parseInt(n, 10) || 10));
    target = Math.max(1, Math.min(20, parseInt(t, 10) || 5));
  }

  function getParams() {
    return { numberSet: numberSet, target: target };
  }

  function makeOne() {
    var N = numberSet;
    var T = target;
    var a = rnd(1, N);
    var ops = [];

    // addition / subtraction with T
    ops.push({ prompt: T + ' + ' + a, answer: T + a });
    ops.push({ prompt: a + ' + ' + T, answer: a + T });
    if (T >= a) ops.push({ prompt: T + ' − ' + a, answer: T - a });
    if (a >= T) ops.push({ prompt: a + ' − ' + T, answer: a - T });

    // multiplication
    ops.push({ prompt: T + ' × ' + a, answer: T * a });
    ops.push({ prompt: a + ' × ' + T, answer: a * T });

    // division — whole number results only
    if (a !== 0 && T % a === 0) ops.push({ prompt: T + ' ÷ ' + a, answer: T / a });
    if (T !== 0 && a % T === 0) ops.push({ prompt: a + ' ÷ ' + T, answer: a / T });
    // also T ÷ k where k divides T and k in 1..N
    var k, divisors = [];
    for (k = 1; k <= N; k++) {
      if (T % k === 0) divisors.push(k);
    }
    if (divisors.length) {
      k = pick(divisors);
      ops.push({ prompt: T + ' ÷ ' + k, answer: T / k });
    }

    if (!ops.length) ops.push({ prompt: T + ' + ' + a, answer: T + a });
    var ch = pick(ops);
    return {
      type: 'guest',
      label: 'Guest',
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

  function selfTest(n) {
    n = n || 200;
    var fail = 0;
    var i, q;
    setParams(12, 6);
    for (i = 0; i < n; i++) {
      q = makeOne();
      if (!q.check(String(q.answer))) fail++;
    }
    return { guest: { tested: n, fail: fail, pass: fail === 0 } };
  }

  global.ColeMathGuest = {
    id: 'guest',
    name: 'Guest',
    setParams: setParams,
    getParams: getParams,
    generateOne: generateOne,
    makeSession: makeSession,
    selfTest: selfTest,
    generators: { guest: makeOne }
  };
})(typeof window !== 'undefined' ? window : global);
