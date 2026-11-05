/* ~30s tap/dodge mini-game reward — canvas, no external assets */
(function (global) {
  'use strict';

  var wrap, canvas, ctx, hud, running, raf, startTs, score, player, threats, W, H;

  function ensureDom() {
    wrap = document.getElementById('gameWrap');
    canvas = document.getElementById('gameCanvas');
    hud = document.getElementById('gameHud');
    if (!wrap || !canvas) return false;
    ctx = canvas.getContext('2d');
    return true;
  }

  function resize() {
    var maxW = Math.min(420, window.innerWidth - 32);
    var maxH = Math.min(520, window.innerHeight - 140);
    W = maxW; H = maxH;
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }

  function reset() {
    player = { x: W / 2, y: H - 40, r: 18 };
    threats = [];
    score = 0;
    startTs = Date.now();
  }

  function spawn() {
    threats.push({
      x: Math.random() * (W - 20) + 10,
      y: -20,
      r: 12 + Math.random() * 10,
      vy: 2 + Math.random() * 3.5
    });
  }

  function draw() {
    ctx.fillStyle = '#10243c';
    ctx.fillRect(0, 0, W, H);
    // player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fillStyle = '#7CFF9A';
    ctx.fill();
    // threats
    var i;
    for (i = 0; i < threats.length; i++) {
      var t = threats[i];
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fillStyle = '#ff7a7a';
      ctx.fill();
    }
  }

  function hit(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) < (a.r + b.r - 2);
  }

  function tick() {
    if (!running) return;
    var elapsed = (Date.now() - startTs) / 1000;
    var left = Math.max(0, 30 - elapsed);
    if (Math.random() < 0.04) spawn();
    var i, t;
    for (i = threats.length - 1; i >= 0; i--) {
      t = threats[i];
      t.y += t.vy;
      if (t.y - t.r > H) {
        threats.splice(i, 1);
        score += 1;
      } else if (hit(player, t)) {
        threats.splice(i, 1);
        score = Math.max(0, score - 2);
      }
    }
    draw();
    hud.textContent = 'Dodge the reds · ' + left.toFixed(0) + 's left · score ' + score;
    if (left <= 0) {
      stop();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  function onPointer(e) {
    if (!running) return;
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var cx, cy;
    if (e.touches && e.touches.length) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else {
      cx = e.clientX;
      cy = e.clientY;
    }
    player.x = Math.max(player.r, Math.min(W - player.r, cx - rect.left));
    player.y = Math.max(player.r, Math.min(H - player.r, cy - rect.top));
  }

  function start(onDone) {
    if (!ensureDom()) { if (onDone) onDone(0); return; }
    resize();
    reset();
    running = true;
    wrap.className = 'active';
    canvas.ontouchstart = onPointer;
    canvas.ontouchmove = onPointer;
    canvas.onmousedown = onPointer;
    canvas.onmousemove = function (e) { if (e.buttons) onPointer(e); };
    wrap._onDone = onDone;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    wrap.className = '';
    var done = wrap._onDone;
    wrap._onDone = null;
    if (done) done(score);
  }

  // Early exit button
  function bindSkip() {
    var btn = document.getElementById('gameSkipBtn');
    if (btn) btn.onclick = function () { stop(); };
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindSkip);
    } else {
      bindSkip();
    }
  }

  global.ColeMathGame = { start: start, stop: stop };
})(typeof window !== 'undefined' ? window : global);
