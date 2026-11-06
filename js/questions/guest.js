/* Guest practice — Levels 1–20 follow a BC Math path:
   1–5 Grade 5 fact fluency, 6–7 Grade 6, 8–9 Grade 7, 10 review,
   11–16 Grade 8, 17–19 Grade 9 exponents & polynomials, 20 linear equations.
   Every sheet keeps ~10 facts from the 6–10 times tables (× and ÷). */
(function (global) {
  'use strict';

  var level = 10;
  var PI = 3.14;

  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function nz(a, b) { var n = 0; while (n === 0) n = rnd(a, b); return n; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function neg(n) { return n < 0 ? '(−' + (-n) + ')' : String(n); }
  function sgn(n) { return n < 0 ? '−' + (-n) : String(n); }
  function r2(n) { return Math.round(n * 100) / 100; }

  function parseNum(user) {
    if (user === null || user === undefined) return NaN;
    var t = String(user).replace(/,/g, '').replace(/[−–]/g, '-').replace(/\s+/g, '').trim();
    t = t.replace(/^[a-z]=/i, '');
    if (t === '' || t === '-' || t === '.') return NaN;
    var m = /^(-?)(\d+)\/(\d+)$/.exec(t);
    if (m) {
      if (Number(m[3]) === 0) return NaN;
      return (m[1] ? -1 : 1) * Number(m[2]) / Number(m[3]);
    }
    m = /^(-?)(\d+)\s*(\d+)\/(\d+)$/.exec(t);
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
    return Number(t);
  }

  function mkCheck(val, tol) {
    return function (u) {
      var n = parseNum(u);
      if (isNaN(n)) return false;
      return Math.abs(n - val) <= tol;
    };
  }

  function Q(type, label, prompt, answer, opts) {
    opts = opts || {};
    var val = typeof answer === 'number' ? answer : parseNum(answer);
    var tol = opts.tol !== undefined ? opts.tol : 0.051;
    var q = { type: type, label: label, prompt: prompt, answer: answer, value: val, check: mkCheck(val, tol) };
    if (opts.hint) q.hint = opts.hint;
    if (opts.small) q.promptClass = 'small';
    return q;
  }

  function fracStr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d); n = n / g; d = d / g;
    return d === 1 ? String(n) : n + '/' + d;
  }

  /* ---------- generators ---------- */
  var G = {};

  G.fact = function () {
    var a = rnd(6, 10), b = rnd(2, 12);
    if (Math.random() < 0.5) { var t = a; a = b; b = t; }
    if (Math.random() < 0.5) return Q('fact', 'Times tables', a + ' × ' + b, a * b, { tol: 0 });
    var d = a >= 6 && a <= 10 ? a : b, other = d === a ? b : a;
    return Q('fact', 'Division facts', (d * other) + ' ÷ ' + d, other, { tol: 0 });
  };

  G.factCore = function () {
    var a = rnd(6, 10), b = rnd(6, 10);
    if (Math.random() < 0.5) return Q('fact', 'Times tables', a + ' × ' + b, a * b, { tol: 0 });
    return Q('fact', 'Division facts', (a * b) + ' ÷ ' + a, b, { tol: 0 });
  };

  function solvePrompt(eq, v) { return 'Solve:\n' + eq + '\nSolve for ' + v + '.'; }

  /* Grade 5 */
  G.rectArea = function () {
    var l = rnd(2, 12), w = rnd(2, 10);
    return Q('rectArea', 'Area of a rectangle', 'A rectangle is ' + l + ' cm long and ' + w + ' cm wide. What is its area (cm²)?', l * w, { small: true, tol: 0 });
  };
  G.rectPerim = function () {
    var l = rnd(2, 15), w = rnd(2, 12);
    return Q('rectPerim', 'Perimeter of a rectangle', 'A rectangle is ' + l + ' m long and ' + w + ' m wide. What is its perimeter (m)?', 2 * (l + w), { small: true, tol: 0 });
  };

  /* Grade 6 */
  G.bedmas6 = function () {
    var a = rnd(2, 12), b = rnd(2, 9), c = rnd(2, 9), d = rnd(1, 20), f = pick([0, 1, 2, 3]);
    if (f === 0) return Q('bedmas', 'Order of operations', '(' + a + ' + ' + b + ') × ' + c, (a + b) * c, { tol: 0 });
    if (f === 1) return Q('bedmas', 'Order of operations', d + ' + ' + b + ' × ' + c, d + b * c, { tol: 0 });
    if (f === 2) return Q('bedmas', 'Order of operations', (b * c) + ' ÷ ' + b + ' + ' + a, c + a, { tol: 0 });
    var big = a + b + d;
    return Q('bedmas', 'Order of operations', c + ' × (' + big + ' − ' + d + ')', c * (a + b), { tol: 0 });
  };
  G.eq1 = function () {
    var x = rnd(2, 15), a = rnd(2, 12), f = pick([0, 1, 2, 3]), v = pick(['x', 'n', 'y', 'm']);
    var p;
    if (f === 0) p = v + ' + ' + a + ' = ' + (x + a);
    else if (f === 1) p = v + ' − ' + a + ' = ' + (x - a);
    else if (f === 2) p = a + v + ' = ' + (a * x);
    else p = v + ' ÷ ' + a + ' = ' + x, x = x * a;
    return Q('eq1', 'One-step equation', solvePrompt(p, v), x, { tol: 0 });
  };
  G.triArea = function () {
    var b = rnd(2, 10) * 2, h = rnd(2, 12);
    return Q('triArea', 'Area of a triangle', 'A triangle has base ' + b + ' cm and height ' + h + ' cm. What is its area (cm²)?', b * h / 2, { small: true });
  };
  G.paraArea = function () {
    var b = rnd(3, 15), h = rnd(2, 12);
    return Q('paraArea', 'Area of a parallelogram', 'A parallelogram has base ' + b + ' m and height ' + h + ' m. What is its area (m²)?', b * h, { small: true, tol: 0 });
  };
  G.trapArea = function () {
    var a = rnd(2, 10), b = a + rnd(1, 8), h = rnd(1, 6) * 2;
    return Q('trapArea', 'Area of a trapezoid', 'A trapezoid has parallel sides ' + a + ' cm and ' + b + ' cm and height ' + h + ' cm. What is its area (cm²)?', (a + b) * h / 2, { small: true });
  };

  /* Grade 7 */
  G.intOps = function () {
    var a = nz(-15, 15), b = nz(-15, 15), f = pick([0, 1, 2, 3]);
    if (a > 0 && b > 0) a = -a;
    if (f === 0) return Q('integers', 'Integers', sgn(a) + ' + ' + neg(b), a + b, { tol: 0 });
    if (f === 1) return Q('integers', 'Integers', sgn(a) + ' − ' + neg(b), a - b, { tol: 0 });
    var x = nz(-9, 9), y = nz(-9, 9);
    if (x > 0 && y > 0) y = -y;
    if (f === 2) return Q('integers', 'Integers', sgn(x) + ' × ' + neg(y), x * y, { tol: 0 });
    return Q('integers', 'Integers', sgn(x * y) + ' ÷ ' + neg(y), x, { tol: 0 });
  };
  G.bedmas7 = function () {
    var a = nz(-9, -1), b = rnd(2, 6), c = nz(-8, 8), d = rnd(2, 9), f = pick([0, 1, 2]);
    if (f === 0) return Q('bedmasInt', 'Order of operations (integers)', sgn(a) + ' + ' + b + ' × ' + neg(c), a + b * c, { tol: 0 });
    if (f === 1) return Q('bedmasInt', 'Order of operations (integers)', '(' + sgn(a) + ' − ' + d + ') × ' + b, (a - d) * b, { tol: 0 });
    return Q('bedmasInt', 'Order of operations (integers)', (a * b) + ' ÷ ' + b + ' − ' + d, a - d, { tol: 0 });
  };
  G.eq2 = function () {
    var x = rnd(1, 12), a = rnd(2, 9), b = rnd(1, 20), v = pick(['x', 'n', 'y']);
    if (Math.random() < 0.5) return Q('eq2', 'Two-step equation', solvePrompt(a + v + ' + ' + b + ' = ' + (a * x + b), v), x, { tol: 0 });
    return Q('eq2', 'Two-step equation', solvePrompt(a + v + ' − ' + b + ' = ' + (a * x - b), v), x, { tol: 0 });
  };
  G.circC = function () {
    var r = rnd(1, 12), useD = Math.random() < 0.5;
    var ans = r2(2 * PI * r);
    return Q('circle', 'Circumference of a circle', 'A circle has ' + (useD ? 'diameter ' + (2 * r) : 'radius ' + r) + ' cm. Find its circumference (cm). Use π ≈ 3.14.', ans, { small: true, tol: Math.max(0.1, ans * 0.01) });
  };
  G.circA = function () {
    var r = rnd(1, 10);
    var ans = r2(PI * r * r);
    return Q('circle', 'Area of a circle', 'A circle has radius ' + r + ' m. Find its area (m²). Use π ≈ 3.14.', ans, { small: true, tol: Math.max(0.1, ans * 0.01) });
  };

  /* Grade 8 */
  G.sqcube = function () {
    var f = pick([0, 1, 2, 3]), n;
    if (f === 0) { n = rnd(2, 15); return Q('squares', 'Perfect squares', n + '²', n * n, { tol: 0 }); }
    if (f === 1) { n = rnd(2, 6); return Q('cubes', 'Perfect cubes', n + '³', n * n * n, { tol: 0 }); }
    if (f === 2) { n = rnd(2, 15); return Q('roots', 'Square root', '√' + (n * n), n, { tol: 0 }); }
    n = rnd(2, 6); return Q('roots', 'Cube root', '∛' + (n * n * n), n, { tol: 0 });
  };
  G.frac = function () {
    var d1 = rnd(2, 9), d2 = rnd(2, 9), n1 = rnd(1, d1 - 1 || 1), n2 = rnd(1, d2 - 1 || 1), f = pick([0, 1, 2, 3]);
    var p = n1 + '/' + d1, s = n2 + '/' + d2, ans, op;
    if (f === 0) { op = ' + '; ans = fracStr(n1 * d2 + n2 * d1, d1 * d2); }
    else if (f === 1) { op = ' − '; ans = fracStr(n1 * d2 - n2 * d1, d1 * d2); }
    else if (f === 2) { op = ' × '; ans = fracStr(n1 * n2, d1 * d2); }
    else { op = ' ÷ '; ans = fracStr(n1 * d2, d1 * n2); }
    return Q('fractions', 'Fraction operations', p + op + s + '\nAnswer as a fraction, like 3/4.', ans, { tol: 0.0001 });
  };
  var TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [12, 16, 20], [9, 40, 41], [15, 20, 25]];
  G.pyth = function () {
    var t = pick(TRIPLES);
    if (Math.random() < 0.6) return Q('pythagoras', 'Pythagorean theorem', 'A right triangle has legs ' + t[0] + ' cm and ' + t[1] + ' cm. How long is the hypotenuse (cm)?', t[2], { small: true, tol: 0 });
    return Q('pythagoras', 'Pythagorean theorem', 'A right triangle has hypotenuse ' + t[2] + ' m and one leg ' + t[0] + ' m. How long is the other leg (m)?', t[1], { small: true, tol: 0 });
  };
  G.solid = function () {
    var f = pick([0, 1, 2, 3]), l = rnd(2, 10), w = rnd(2, 8), h = rnd(2, 10), r = rnd(1, 6), ans;
    if (f === 0) return Q('volume', 'Volume of a prism', 'A rectangular prism is ' + l + ' cm × ' + w + ' cm × ' + h + ' cm. What is its volume (cm³)?', l * w * h, { small: true, tol: 0 });
    if (f === 1) return Q('surfaceArea', 'Surface area of a prism', 'A rectangular prism is ' + l + ' cm × ' + w + ' cm × ' + h + ' cm. What is its surface area (cm²)?', 2 * (l * w + l * h + w * h), { small: true, tol: 0 });
    if (f === 2) { ans = r2(PI * r * r * h); return Q('volume', 'Volume of a cylinder', 'A cylinder has radius ' + r + ' m and height ' + h + ' m. What is its volume (m³)? Use π ≈ 3.14.', ans, { small: true, tol: Math.max(0.1, ans * 0.01) }); }
    ans = r2(2 * PI * r * r + 2 * PI * r * h);
    return Q('surfaceArea', 'Surface area of a cylinder', 'A cylinder has radius ' + r + ' cm and height ' + h + ' cm. What is its surface area (cm²)? Use π ≈ 3.14.', ans, { small: true, tol: Math.max(0.1, ans * 0.01) });
  };
  G.subst = function () {
    var a = rnd(2, 9), b = nz(-10, 10), x = nz(-6, 6);
    return Q('substitution', 'Substitution', 'Evaluate ' + a + 'x ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + ' when x = ' + sgn(x), a * x + b, { tol: 0 });
  };
  G.eq2int = function () {
    var x = nz(-10, 10), a = nz(-8, 8), b = nz(-12, 12);
    if (a === 1 || a === -1) a = a * 3;
    return Q('eq2int', 'Two-step equation (integers)', solvePrompt(sgn(a) + 'x ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + ' = ' + sgn(a * x + b), 'x'), x, { tol: 0 });
  };

  /* Grade 9 */
  G.expo = function () {
    var f = pick([0, 1, 2, 3, 4]), b = rnd(2, 5), m = rnd(2, 9), n = rnd(2, 9), v = pick(['x', 'a', 'y']);
    if (f === 0) { var e = rnd(2, b === 2 ? 6 : 3); return Q('exponents', 'Evaluate a power', b + '^' + e + '  (that is, ' + b + ' to the power ' + e + ')', Math.pow(b, e), { small: true, tol: 0 }); }
    if (f === 1) return Q('exponentLaws', 'Exponent laws', v + '^' + m + ' × ' + v + '^' + n + ' = ' + v + '^?  What is the exponent?', m + n, { small: true, tol: 0 });
    if (f === 2) { var big = m + n; return Q('exponentLaws', 'Exponent laws', v + '^' + big + ' ÷ ' + v + '^' + n + ' = ' + v + '^?  What is the exponent?', m, { small: true, tol: 0 }); }
    if (f === 3) { var p = rnd(2, 4); return Q('exponentLaws', 'Exponent laws', '(' + v + '^' + m + ')^' + p + ' = ' + v + '^?  What is the exponent?', m * p, { small: true, tol: 0 }); }
    return Q('exponents', 'Exponent laws', 'Evaluate ' + b + '^0 + ' + b + '^1', 1 + b, { tol: 0 });
  };
  function term(c, pw, first) {
    var s = c < 0 ? (first ? '−' : ' − ') : (first ? '' : ' + ');
    var a = Math.abs(c);
    var co = (a === 1 && pw > 0) ? '' : String(a);
    return s + co + (pw === 0 ? '' : pw === 1 ? 'x' : 'x²');
  }
  function poly(cs) { /* cs = [c2, c1, c0] */
    var s = '', first = true, i;
    for (i = 0; i < 3; i++) if (cs[i] !== 0) { s += term(cs[i], 2 - i, first); first = false; }
    return s || '0';
  }
  G.poly = function () {
    var a = [nz(-6, 6), nz(-9, 9), nz(-9, 9)], b = [nz(-6, 6), nz(-9, 9), nz(-9, 9)], f = pick([0, 1, 2, 3, 4]);
    if (f === 0) { var deg = pick([1, 2, 3]); var s = deg === 3 ? nz(2, 7) + 'x³ ' + term(a[1], 1, false) + term(a[2], 0, false) : (deg === 2 ? poly(a) : poly([0, a[1], a[2]]));
      return Q('polyDegree', 'Polynomials', 'What is the degree of ' + s + '?', deg, { tol: 0 }); }
    if (f === 1) return Q('polyTerms', 'Polynomials', 'How many terms are in ' + poly(a) + '?', 3, { tol: 0 });
    if (f === 2) return Q('polyAdd', 'Add polynomials', '(' + poly(a) + ') + (' + poly(b) + ')  What is the coefficient of x?', a[1] + b[1], { small: true, tol: 0 });
    if (f === 3) return Q('polySub', 'Subtract polynomials', '(' + poly(a) + ') − (' + poly(b) + ')  What is the coefficient of x²?', a[0] - b[0], { small: true, tol: 0 });
    var x = nz(-3, 3);
    return Q('polyEval', 'Evaluate a polynomial', 'Evaluate ' + poly(a) + ' when x = ' + sgn(x), a[0] * x * x + a[1] * x + a[2], { small: true, tol: 0 });
  };
  G.monoPoly = function () {
    var m = nz(-6, 6), p = nz(-9, 9), q = nz(-9, 9), f = pick([0, 1, 2]);
    if (m === 1 || m === -1) m = m * 2;
    var mono = sgn(m) + 'x', inner = term(p, 1, true) + term(q, 0, false);
    if (f === 0) return Q('monoPoly', 'Monomial × polynomial', 'Expand ' + mono + '(' + inner + ').  What is the coefficient of x²?', m * p, { small: true, tol: 0 });
    if (f === 1) return Q('monoPoly', 'Monomial × polynomial', 'Expand ' + mono + '(' + inner + ').  What is the coefficient of x?', m * q, { small: true, tol: 0 });
    var x = nz(-3, 3);
    return Q('monoPoly', 'Monomial × polynomial', 'Evaluate ' + mono + '(' + inner + ') when x = ' + sgn(x), m * x * (p * x + q), { small: true, tol: 0 });
  };
  G.multiEq = function () {
    var x = nz(-10, 10), f = pick([0, 1, 2]), a, b, c, d;
    if (f === 0) { /* a(x + b) = c */
      a = nz(2, 6); b = nz(-8, 8);
      return Q('multiEq', 'Multi-step equation', solvePrompt(a + '(x ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + ') = ' + sgn(a * (x + b)), 'x'), x, { tol: 0 });
    }
    if (f === 1) { /* ax + b = cx + d */
      a = rnd(3, 9); c = rnd(1, a - 1); b = nz(-12, 12); d = (a - c) * x + b;
      return Q('multiEq', 'Multi-step equation', solvePrompt(a + 'x ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + ' = ' + (c === 1 ? '' : c) + 'x ' + (d < 0 ? '− ' + (-d) : '+ ' + d), 'x'), x, { small: true, tol: 0 });
    }
    /* a(x + b) + c = d */
    a = nz(2, 5); b = nz(-6, 6); c = nz(-10, 10); d = a * (x + b) + c;
    return Q('multiEq', 'Multi-step equation', solvePrompt(a + '(x ' + (b < 0 ? '− ' + (-b) : '+ ' + b) + ') ' + (c < 0 ? '− ' + (-c) : '+ ' + c) + ' = ' + sgn(d), 'x'), x, { small: true, tol: 0 });
  };

  /* ---------- level plans ---------- */
  var G5 = ['rectArea', 'rectArea', 'rectPerim'];
  var G6 = ['bedmas6', 'eq1', 'triArea', 'paraArea', 'trapArea'];
  var G7 = ['intOps', 'bedmas7', 'eq2', 'circC', 'circA'];
  var G8 = { 11: ['sqcube'], 12: ['frac'], 13: ['pyth'], 14: ['solid'], 15: ['subst', 'eq2int'] };
  var REVIEW57 = G5.concat(G6, G7);

  var DESCRIPTIONS = {
    1: 'Facts: 6×6 to 10×10 and matching division',
    5: 'Grade 5: 6–10 facts plus rectangle area & perimeter',
    6: 'Grade 6: brackets, one-step equations, triangle & parallelogram area',
    8: 'Grade 7: integers, two-step equations, circles',
    10: 'Review of Grades 5–7',
    11: 'Grade 8: squares, cubes & roots',
    12: 'Grade 8: fraction operations',
    13: 'Grade 8: Pythagorean theorem',
    14: 'Grade 8: surface area & volume',
    15: 'Grade 8: substitution & integer equations',
    16: 'Grade 8 review',
    17: 'Grade 9: exponents & exponent laws',
    18: 'Grade 9: intro to polynomials',
    19: 'Grade 9: monomial × polynomial',
    20: 'Grade 9: multi-step linear equations'
  };
  function describe(n) {
    n = Math.max(1, Math.min(20, parseInt(n, 10) || 1));
    while (!DESCRIPTIONS[n]) n--;
    return DESCRIPTIONS[n];
  }

  /* returns array of [pool, count] filling the rest after facts */
  function plan(L) {
    var g8upto = [], i;
    for (i = 11; i < L && i <= 15; i++) g8upto = g8upto.concat(G8[i]);
    var g8all = [].concat(G8[11], G8[12], G8[13], G8[14], G8[15]);
    if (L <= 4) return { facts: 0, parts: [[['factCore'], 50]] };
    if (L === 5) return { facts: 30, parts: [[G5, 20]] };
    if (L <= 7) return { facts: 10, parts: [[G6, 34], [G5, 6]] };
    if (L <= 9) return { facts: 10, parts: [[G7, 30], [G6, 10]] };
    if (L === 10) return { facts: 10, parts: [[G5, 6], [G6, 17], [G7, 17]] };
    if (L <= 15) return { facts: 10, parts: [[G8[L], 25], [REVIEW57.concat(g8upto, g8upto), 15]] };
    if (L === 16) return { facts: 10, parts: [[g8all, 32], [REVIEW57, 8]] };
    if (L === 17) return { facts: 10, parts: [[['expo'], 28], [g8all, 12]] };
    if (L === 18) return { facts: 10, parts: [[['poly'], 28], [['expo'], 6], [g8all, 6]] };
    if (L === 19) return { facts: 10, parts: [[['monoPoly'], 25], [['poly'], 8], [['expo'], 7]] };
    return { facts: 10, parts: [[['multiEq'], 28], [['monoPoly', 'poly', 'expo', 'eq2int', 'eq2'], 12]] };
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function build(name) {
    var q = G[name]();
    q.label = q.label + ' · L' + level;
    return q;
  }

  function makeSession(count) {
    count = count || 50;
    var p = plan(level), list = [], i, j, pool, seen = {};
    for (i = 0; i < p.facts; i++) list.push('fact');
    for (i = 0; i < p.parts.length; i++) {
      pool = p.parts[i][0];
      /* cycle through a shuffled pool so every type shows up */
      var order = shuffle(pool.slice());
      for (j = 0; j < p.parts[i][1]; j++) list.push(order[j % order.length]);
    }
    /* scale to requested count while keeping proportions */
    var names = [];
    for (i = 0; i < count; i++) names.push(list[Math.floor(i * list.length / count)]);
    var out = [], tries, q;
    for (i = 0; i < names.length; i++) {
      tries = 0;
      do { q = build(names[i]); tries++; } while (seen[q.prompt] && tries < 8);
      seen[q.prompt] = true;
      out.push(q);
    }
    return shuffle(out);
  }

  function generateOne() {
    var p = plan(level), all = ['fact'], i;
    for (i = 0; i < p.parts.length; i++) all = all.concat(p.parts[i][0]);
    return build(pick(all));
  }

  function setLevel(n) {
    level = Math.max(1, Math.min(20, parseInt(n, 10) || 10));
    return level;
  }
  function getLevel() { return level; }
  function setParams(n) { return setLevel(n); }

  function selfTest() {
    var res = { levels: {}, pass: true }, L, s, i, q, facts, types, bad, keep = level;
    for (L = 1; L <= 20; L++) {
      setLevel(L);
      s = makeSession(50); facts = 0; types = {}; bad = [];
      for (i = 0; i < s.length; i++) {
        q = s[i];
        if (!q.prompt || q.value === undefined || isNaN(q.value)) bad.push('nan:' + q.prompt);
        else if (!q.check(String(q.answer))) bad.push('check:' + q.prompt);
        if (q.check('banana')) bad.push('accepts junk:' + q.prompt);
        if (q.type === 'fact') facts++;
        types[q.type] = (types[q.type] || 0) + 1;
      }
      var factOk = L <= 4 ? facts === 50 : L === 5 ? facts > 12 : (facts >= 8 && facts <= 12);
      var ok = s.length === 50 && bad.length === 0 && factOk;
      if (!ok) res.pass = false;
      res.levels[L] = { n: s.length, facts: facts, types: Object.keys(types).sort().join(','), bad: bad.slice(0, 3), pass: ok };
    }
    setLevel(keep);
    return res;
  }

  global.ColeMathGuest = {
    id: 'guest',
    name: 'Guest',
    setLevel: setLevel,
    getLevel: getLevel,
    setParams: setParams,
    getParams: function () { return { level: level }; },
    describe: describe,
    generateOne: generateOne,
    makeSession: makeSession,
    selfTest: selfTest,
    parseNum: parseNum,
    generators: G
  };
})(typeof window !== 'undefined' ? window : global);
