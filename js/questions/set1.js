/* Set 1 question modules — matches printable sheet mix.
   Exposes window.ColeMathSet1 with generateOne(type) and makeSession(count).
   Conservative JS for older iOS Safari. */
(function (global) {
  'use strict';

  function rnd(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function wn() {
    // weighted toward 6-10
    var pool = [6, 7, 8, 9, 10, 6, 7, 8, 9, 10, 6, 7, 8, 9, 10, 6, 7, 8, 9, 10, 2, 3, 4, 5, 11, 12];
    return pick(pool);
  }
  function almostEqual(a, b) {
    return Math.abs(a - b) < 0.051;
  }
  function parseUser(s) {
    if (s === null || s === undefined) return NaN;
    var t = String(s).replace(/,/g, '').trim();
    if (t === '' || t === '-' || t === '.') return NaN;
    // allow "12 r 3" for long division remainders
    var m = t.match(/^(-?\d+)\s*[rR]\s*(\d+)$/);
    if (m) {
      return { kind: 'qr', q: parseInt(m[1], 10), r: parseInt(m[2], 10) };
    }
    var n = Number(t);
    return n;
  }
  function checkNum(user, answer, tol) {
    tol = tol || 0.051;
    var u = parseUser(user);
    if (u && typeof u === 'object' && u.kind === 'qr') {
      if (answer && typeof answer === 'object' && answer.kind === 'qr') {
        return u.q === answer.q && u.r === answer.r;
      }
      return false;
    }
    if (typeof u !== 'number' || isNaN(u)) return false;
    if (typeof answer === 'number') return Math.abs(u - answer) < tol;
    return false;
  }

  /* ---- generators ---- */
  function mulFact() {
    var a = wn(), b = wn();
    return {
      type: 'mul_fact',
      label: 'Multiplication',
      prompt: a + ' × ' + b,
      answer: a * b,
      check: function (u) { return checkNum(u, a * b); }
    };
  }
  function squareFact() {
    var b = pick([6, 7, 8, 9, 10, 11, 12]);
    return {
      type: 'mul_fact',
      label: 'Multiplication',
      prompt: b + '²',
      answer: b * b,
      check: function (u) { return checkNum(u, b * b); }
    };
  }
  function cubeFact() {
    var b = rnd(1, 5);
    return {
      type: 'mul_fact',
      label: 'Multiplication',
      prompt: b + '³',
      answer: b * b * b,
      check: function (u) { return checkNum(u, b * b * b); }
    };
  }
  function bigMul() {
    var a = rnd(100, 999), b = rnd(11, 99);
    return {
      type: 'mul_long',
      label: 'Multiply',
      prompt: a + ' × ' + b,
      answer: a * b,
      check: function (u) { return checkNum(u, a * b); }
    };
  }
  function divFact() {
    var a = wn(), b = wn();
    var product = a * b;
    return {
      type: 'div_fact',
      label: 'Division',
      prompt: product + ' ÷ ' + a,
      answer: b,
      check: function (u) { return checkNum(u, b); }
    };
  }
  function longDiv() {
    var dv = rnd(2, 9);
    var n = rnd(100, 9999);
    var q = Math.floor(n / dv);
    var r = n % dv;
    var ans = r === 0 ? q : { kind: 'qr', q: q, r: r };
    var hint = r === 0 ? '' : ' (remainder OK: e.g. ' + q + ' r ' + r + ')';
    return {
      type: 'div_long',
      label: 'Long division',
      prompt: n + ' ÷ ' + dv,
      hint: hint,
      answer: ans,
      check: function (u) {
        var parsed = parseUser(u);
        if (r === 0) return checkNum(u, q);
        // accept exact quotient if they ignore remainder only when r==0; otherwise require qr OR decimal close
        if (parsed && typeof parsed === 'object' && parsed.kind === 'qr') {
          return parsed.q === q && parsed.r === r;
        }
        // also accept exact floating quotient within tol
        if (typeof parsed === 'number' && !isNaN(parsed)) {
          return Math.abs(parsed - (n / dv)) < 0.01 || parsed === q;
        }
        return false;
      }
    };
  }
  function integerQ() {
    var a = rnd(-15, 15);
    var b = rnd(-12, 12);
    while (a === 0) a = rnd(-15, 15);
    while (b === 0) b = rnd(-12, 12);
    if (a > 0 && b > 0) {
      if (Math.random() < 0.5) a = -a; else b = -b;
    }
    var ops = ['+', '-', '×', '÷'];
    var op = pick(ops);
    var answer;
    if (op === '÷') {
      var q = rnd(-9, 9);
      if (q === 0) q = 3;
      if (q > 0 && b > 0) {
        if (Math.random() < 0.5) q = -q; else b = -b;
      }
      a = q * b;
      answer = q;
    } else if (op === '+') {
      answer = a + b;
    } else if (op === '-') {
      answer = a - b;
    } else {
      answer = a * b;
    }
    function fmt(n) { return n < 0 ? '(' + n + ')' : String(n); }
    return {
      type: 'integer',
      label: 'Integers',
      prompt: fmt(a) + ' ' + op + ' ' + fmt(b),
      answer: answer,
      check: function (u) { return checkNum(u, answer); }
    };
  }
  function bedmas() {
    var a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9), d = rnd(2, 9);
    var choices = [
      { p: a + ' + ' + b + ' × ' + c, a: a + b * c },
      { p: '(' + a + ' + ' + b + ') × ' + c, a: (a + b) * c },
      { p: (a * b) + ' ÷ ' + b + ' + ' + c + ' × ' + d, a: (a * b) / b + c * d },
      { p: a + ' × (' + b + ' + ' + c + ') − ' + d, a: a * (b + c) - d },
      { p: (c * d + a) + ' − ' + a + ' × 2 + ' + b, a: (c * d + a) - a * 2 + b },
      { p: '(' + (a + b) + ' − ' + b + ') × ' + c + ' ÷ 1', a: ((a + b) - b) * c / 1 }
    ];
    var ch = pick(choices);
    return {
      type: 'bedmas',
      label: 'BEDMAS',
      prompt: ch.p,
      answer: ch.a,
      check: function (u) { return checkNum(u, ch.a); }
    };
  }
  function geometry() {
    var L = rnd(3, 15), W = rnd(2, 12);
    var pool = [
      {
        p: 'Perimeter of a ' + L + ' cm × ' + W + ' cm rectangle',
        a: 2 * (L + W),
        tol: 0.1
      },
      {
        p: 'Area of a ' + L + ' m × ' + W + ' m rectangle',
        a: L * W,
        tol: 0.1
      },
      {
        p: 'Area of a triangle, base ' + (2 * L) + ' cm, height ' + W + ' cm',
        a: (2 * L) * W / 2,
        tol: 0.1
      }
    ];
    var a1 = rnd(30, 80), a2 = rnd(30, 80);
    if (a1 + a2 < 170) {
      pool.push({
        p: 'Triangle angles ' + a1 + '° and ' + a2 + '°. Third angle?',
        a: 180 - a1 - a2,
        tol: 0.1
      });
    }
    pool.push({
      p: 'Circumference, radius ' + W + ' cm (π ≈ 3.14)',
      a: 2 * 3.14 * W,
      tol: 0.1
    });
    var ang = rnd(20, 160);
    pool.push({
      p: 'Straight line. One angle is ' + ang + '°. Other?',
      a: 180 - ang,
      tol: 0.1
    });
    var ch = pick(pool);
    return {
      type: 'geometry',
      label: 'Geometry',
      prompt: ch.p,
      promptClass: 'small',
      answer: ch.a,
      check: function (u) { return checkNum(u, ch.a, ch.tol); }
    };
  }

  var GENERATORS = {
    mul_fact: mulFact,
    mul_long: bigMul,
    div_fact: divFact,
    div_long: longDiv,
    integer: integerQ,
    bedmas: bedmas,
    geometry: geometry,
    square: squareFact,
    cube: cubeFact
  };

  /** Build a ~50-question session mirroring Set 1 sheet proportions. */
  function makeSession(count) {
    count = count || 50;
    var plan = [];
    // Rough proportions from a sheet (~50 items when long work is counted as 1 each)
    var weights = [
      { type: 'mul_fact', n: 14 },
      { type: 'square', n: 3 },
      { type: 'cube', n: 1 },
      { type: 'mul_long', n: 2 },
      { type: 'div_fact', n: 14 },
      { type: 'div_long', n: 2 },
      { type: 'integer', n: 6 },
      { type: 'bedmas', n: 5 },
      { type: 'geometry', n: 3 }
    ];
    var i, j, w;
    for (i = 0; i < weights.length; i++) {
      w = weights[i];
      for (j = 0; j < w.n; j++) plan.push(w.type);
    }
    // trim / pad to count
    while (plan.length > count) plan.pop();
    while (plan.length < count) plan.push(pick(['mul_fact', 'div_fact', 'integer', 'bedmas']));
    // shuffle
    for (i = plan.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      var tmp = plan[i]; plan[i] = plan[j]; plan[j] = tmp;
    }
    var out = [];
    for (i = 0; i < plan.length; i++) {
      out.push(GENERATORS[plan[i]]());
    }
    return out;
  }

  function generateOne(type) {
    if (!GENERATORS[type]) type = 'mul_fact';
    return GENERATORS[type]();
  }

  /** Self-test helper: generate n of each type and verify answers. */
  function selfTest(n) {
    n = n || 1000;
    var types = Object.keys(GENERATORS);
    var report = {};
    var t, i, q, ok, fail;
    for (t = 0; t < types.length; t++) {
      var typ = types[t];
      fail = 0;
      for (i = 0; i < n; i++) {
        q = GENERATORS[typ]();
        ok = q.check(String(typeof q.answer === 'object' ? (q.answer.q + ' r ' + q.answer.r) : q.answer));
        if (!ok) fail++;
        // also ensure integer prompts always contain a negative
        if (typ === 'integer') {
          if (q.prompt.indexOf('-') === -1) fail++;
        }
      }
      report[typ] = { tested: n, fail: fail, pass: fail === 0 };
    }
    return report;
  }

  global.ColeMathSet1 = {
    id: 'set1',
    name: 'Set 1',
    generators: GENERATORS,
    generateOne: generateOne,
    makeSession: makeSession,
    selfTest: selfTest
  };
})(typeof window !== 'undefined' ? window : global);
