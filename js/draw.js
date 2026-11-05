/* Practice-screen scribble overlay — thin red stroke; never steals taps */
(function (global) {
  'use strict';

  var canvas, ctx, enabled = false, drawing = false, lastX = 0, lastY = 0;

  function ensure() {
    canvas = document.getElementById('drawCanvas');
    if (!canvas) return false;
    ctx = canvas.getContext('2d');
    return true;
  }

  function resize() {
    if (!ensure()) return;
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 2;
  }

  function clear() {
    if (!ensure()) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    var dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#e53935';
    ctx.lineWidth = 2;
  }

  function setEnabled(on) {
    enabled = !!on;
    if (!ensure()) return;
    drawing = false;
    /* Canvas must stay pointer-events: none so the answer field and
       buttons receive taps (iPhone keyboard + Clear). */
    canvas.style.pointerEvents = 'none';
    if (enabled) {
      resize();
    } else {
      clear();
    }
  }

  function inKeyboardZone(clientY) {
    var vv = window.visualViewport;
    if (vv && typeof vv.height === 'number' && vv.height < window.innerHeight - 40) {
      var bottom = vv.offsetTop + vv.height;
      return clientY > bottom - 2;
    }
    var inp = document.getElementById('answerInput');
    if (inp && document.activeElement === inp) {
      return clientY > window.innerHeight * 0.6;
    }
    return false;
  }

  function isProtectedTarget(el) {
    var node = el;
    while (node && node !== document && node !== document.body) {
      var tag = node.tagName;
      if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'SELECT' ||
          tag === 'TEXTAREA' || tag === 'A' || tag === 'LABEL') {
        return true;
      }
      if (node.id === 'answerInput' || node.id === 'submitBtn' ||
          node.id === 'minusBtn' || node.id === 'clearMarksBtn' ||
          node.id === 'gameWrap') {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  function pointFromEvent(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function onStart(e) {
    if (!enabled) return;
    var p = pointFromEvent(e);
    if (isProtectedTarget(e.target) || inKeyboardZone(p.y)) {
      drawing = false;
      return;
    }
    drawing = true;
    lastX = p.x;
    lastY = p.y;
    if (e.cancelable) e.preventDefault();
  }

  function onMove(e) {
    if (!enabled || !drawing) return;
    var p = pointFromEvent(e);
    if (inKeyboardZone(p.y)) {
      drawing = false;
      return;
    }
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
    if (e.cancelable) e.preventDefault();
  }

  function onEnd() {
    drawing = false;
  }

  function bind() {
    if (!ensure()) return;
    canvas.style.pointerEvents = 'none';
    resize();
    document.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    document.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', function (e) {
      if (e.buttons) onMove(e);
    });
    document.addEventListener('mouseup', onEnd);
    window.addEventListener('resize', function () {
      if (enabled) { resize(); clear(); }
      else resize();
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bind);
    } else {
      bind();
    }
  }

  global.ColeMathDraw = {
    setEnabled: setEnabled,
    clear: clear,
    resize: resize
  };
})(typeof window !== 'undefined' ? window : global);
