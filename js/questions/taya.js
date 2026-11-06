/* Taya — grade 6 BC, easier mix. No / light negatives. About 30 per day. */
(function (global) {
  'use strict';

  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function wn() {
    // up to 10x10, weighted 2-9
    var pool = [2,3,4,5,6,7,8,9, 2,3,4,5,6,7,8,9, 2,3,4,5,6,7,8,9, 10];
    return pick(pool);
  }
  function checkNum(user, answer, tol) {
    tol = tol || 0.051;
    if (user === null || user === undefined) return false;
    var t = String(user).replace(/,/g, '').trim();
    if (t === '' || t === '-' || t === '.') return false;
    // fractions like 3/4
    var fm = t.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if (fm) {
      var den = parseInt(fm[2], 10);
      if (!den) return false;
      var fv = parseInt(fm[1], 10) / den;
      return Math.abs(fv - answer) < tol;
    }
    var n = Number(t);
    if (isNaN(n)) return false;
    return Math.abs(n - answer) < tol;
  }

  function mulFact() {
    var a = wn(), b = wn();
    return { type: 'mul_fact', label: 'Multiplication', prompt: a + ' × ' + b, answer: a * b,
      check: function (u) { return checkNum(u, a * b); } };
  }
  function divFact() {
    var a = wn(), b = wn();
    var product = a * b;
    return { type: 'div_fact', label: 'Division', prompt: product + ' ÷ ' + a, answer: b,
      check: function (u) { return checkNum(u, b); } };
  }
  function shortMul() {
    var a = rnd(10, 99), b = rnd(2, 9);
    return { type: 'mul_short', label: 'Multiply', prompt: a + ' × ' + b, answer: a * b,
      check: function (u) { return checkNum(u, a * b); } };
  }
  function longDiv() {
    var dv = rnd(2, 9);
    var n = rnd(10, 999);
    var q = Math.floor(n / dv);
    var r = n % dv;
    return {
      type: 'div_long', label: 'Long division',
      prompt: n + ' ÷ ' + dv,
      hint: r ? 'Remainder OK, like 12 r 3.' : '',
      answer: r ? { kind: 'qr', q: q, r: r } : q,
      check: function (u) {
        var t = String(u).replace(/,/g, '').trim();
        var m = t.match(/^(-?\d+)\s*[rR]\s*(\d+)$/);
        if (r === 0) return checkNum(u, q);
        if (m) return parseInt(m[1], 10) === q && parseInt(m[2], 10) === r;
        var n2 = Number(t);
        return !isNaN(n2) && (n2 === q || Math.abs(n2 - n / dv) < 0.01);
      }
    };
  }
  function bedmas() {
    // grade 5/6 order of ops, no exponents
    var a = rnd(2, 12), b = rnd(2, 9), c = rnd(2, 9), d = rnd(1, 8);
    var choices = [
      { p: a + ' + ' + b + ' × ' + c, a: a + b * c },
      { p: '(' + a + ' + ' + b + ') × ' + c, a: (a + b) * c },
      { p: a + ' × ' + b + ' − ' + c, a: a * b - c },
      { p: (a * b) + ' ÷ ' + b + ' + ' + c, a: a + c },
      { p: a + ' + ' + b + ' − ' + d, a: a + b - d },
      { p: '(' + a + ' − ' + d + ') × ' + b, a: (a - d) * b }
    ];
    // ensure non-negative results for Taya
    var filtered = [];
    var i;
    for (i = 0; i < choices.length; i++) {
      if (choices[i].a >= 0) filtered.push(choices[i]);
    }
    if (!filtered.length) filtered = [{ p: a + ' + ' + b + ' × ' + c, a: a + b * c }];
    var ch = pick(filtered);
    return { type: 'bedmas', label: 'Order of operations', prompt: ch.p, answer: ch.a,
      check: function (u) { return checkNum(u, ch.a); } };
  }
  function decimals() {
    // add/sub decimals
    var a = rnd(1, 99) / 10;
    var b = rnd(1, 99) / 10;
    a = Math.round(a * 10) / 10;
    b = Math.round(b * 10) / 10;
    if (Math.random() < 0.5) {
      return { type: 'decimal', label: 'Decimals', prompt: a.toFixed(1) + ' + ' + b.toFixed(1),
        answer: Math.round((a + b) * 10) / 10,
        check: function (u) { return checkNum(u, Math.round((a + b) * 10) / 10); } };
    }
    if (b > a) { var t = a; a = b; b = t; }
    return { type: 'decimal', label: 'Decimals', prompt: a.toFixed(1) + ' − ' + b.toFixed(1),
      answer: Math.round((a - b) * 10) / 10,
      check: function (u) { return checkNum(u, Math.round((a - b) * 10) / 10); } };
  }
  function fractions() {
    // like denominators
    var den = pick([2, 3, 4, 5, 6, 8, 10]);
    var a = rnd(1, den - 1);
    var b = rnd(1, den - 1);
    if (Math.random() < 0.5) {
      var sum = a + b;
      // allow improper; student can enter improper or mixed as decimal approx — accept a/den form or decimal
      return {
        type: 'fraction', label: 'Fractions',
        prompt: a + '/' + den + ' + ' + b + '/' + den,
        answer: sum / den,
        check: function (u) { return checkNum(u, sum / den, 0.02); }
      };
    }
    if (b > a) { var tmp = a; a = b; b = tmp; }
    return {
      type: 'fraction', label: 'Fractions',
      prompt: a + '/' + den + ' − ' + b + '/' + den,
      answer: (a - b) / den,
      check: function (u) { return checkNum(u, (a - b) / den, 0.02); }
    };
  }
  function geometry() {
    var L = rnd(3, 20), W = rnd(2, 15);
    if (Math.random() < 0.5) {
      return {
        type: 'geometry', label: 'Geometry', promptClass: 'small',
        prompt: 'Perimeter of a ' + L + ' cm × ' + W + ' cm rectangle',
        answer: 2 * (L + W),
        check: function (u) { return checkNum(u, 2 * (L + W)); }
      };
    }
    return {
      type: 'geometry', label: 'Geometry', promptClass: 'small',
      prompt: 'Area of a ' + L + ' m × ' + W + ' m rectangle',
      answer: L * W,
      check: function (u) { return checkNum(u, L * W); }
    };
  }

  var GENERATORS = {
    mul_fact: mulFact,
    div_fact: divFact,
    mul_short: shortMul,
    div_long: longDiv,
    bedmas: bedmas,
    decimal: decimals,
    fraction: fractions,
    geometry: geometry
  };

  function makeSession(count) {
    count = count || 30;
    var plan = [];
    var weights = [
      { type: 'mul_fact', n: 8 },
      { type: 'div_fact', n: 6 },
      { type: 'mul_short', n: 3 },
      { type: 'div_long', n: 2 },
      { type: 'bedmas', n: 3 },
      { type: 'decimal', n: 3 },
      { type: 'fraction', n: 3 },
      { type: 'geometry', n: 2 }
    ];
    var i, j, w;
    for (i = 0; i < weights.length; i++) {
      w = weights[i];
      for (j = 0; j < w.n; j++) plan.push(w.type);
    }
    while (plan.length > count) plan.pop();
    while (plan.length < count) plan.push(pick(['mul_fact', 'div_fact', 'decimal']));
    for (i = plan.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      var tmp = plan[i]; plan[i] = plan[j]; plan[j] = tmp;
    }
    var out = [];
    for (i = 0; i < plan.length; i++) out.push(GENERATORS[plan[i]]());
    return out;
  }

  function generateOne(type) {
    if (!GENERATORS[type]) type = 'mul_fact';
    return GENERATORS[type]();
  }

  function selfTest(n) {
    n = n || 1000;
    var types = Object.keys(GENERATORS);
    var report = {};
    var t, i, q, fail;
    for (t = 0; t < types.length; t++) {
      var typ = types[t];
      fail = 0;
      for (i = 0; i < n; i++) {
        q = GENERATORS[typ]();
        var ansStr;
        if (q.answer && typeof q.answer === 'object' && q.answer.kind === 'qr') {
          ansStr = q.answer.q + ' r ' + q.answer.r;
        } else if (typ === 'fraction') {
          // prefer fraction string when possible
          ansStr = String(q.answer);
        } else {
          ansStr = String(q.answer);
        }
        if (!q.check(ansStr)) fail++;
      }
      report[typ] = { tested: n, fail: fail, pass: fail === 0 };
    }
    return report;
  }

  global.ColeMathTaya6 = {
    id: 'taya6',
    name: 'Taya Grade 6',
    generators: GENERATORS,
    generateOne: generateOne,
    makeSession: makeSession,
    selfTest: selfTest
  };
})(typeof window !== 'undefined' ? window : global);
