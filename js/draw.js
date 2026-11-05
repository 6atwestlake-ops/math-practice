/* Practice-screen scribble overlay — thin red stroke; skips controls/keyboard */
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
    if (enabled) {
      canvas.className = 'active';
      resize();
    } else {
      drawing = false;
      canvas.className = '';
      clear();
    }
  }

  function inKeyboardZone(clientY) {
    var vv = window.visualViewport;
    if (vv && typeof vv.height === 'number') {
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
    if (!el) return false;
    var node = el;
    while (node && node !== document.body) {
      if (node.id === 'submitBtn' || node.id === 'answerInput' || node.id === 'minusBtn' ||
          node.id === 'clearMarksBtn' || node.id === 'gameWrap' ||
          (node.className && String(node.className).indexOf('btn') >= 0 && node.tagName === 'BUTTON')) {
        /* only protect specific practice controls, not all buttons on other screens */
      }
      if (node.id === 'submitBtn' || node.id === 'answerInput' || node.id === 'minusBtn' ||
          node.id === 'clearMarksBtn') {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }

  function hitProtected(clientX, clientY) {
    if (!canvas) return false;
    canvas.style.pointerEvents = 'none';
    var el = document.elementFromPoint(clientX, clientY);
    canvas.style.pointerEvents = enabled ? 'auto' : 'none';
    return isProtectedTarget(el);
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
    if (inKeyboardZone(p.y) || hitProtected(p.x, p.y)) {
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

  function onEnd(e) {
    if (!drawing) return;
    drawing = false;
    if (e && e.cancelable) e.preventDefault();
  }

  function bind() {
    if (!ensure()) return;
    resize();
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd, { passive: false });
    canvas.addEventListener('touchcancel', onEnd, { passive: false });
    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('mousemove', function (e) {
      if (e.buttons) onMove(e);
    });
    canvas.addEventListener('mouseup', onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    window.addEventListener('resize', function () {
      if (enabled) { resize(); clear(); }
      else resize();
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        if (enabled) { /* keep marks; just note keyboard */ }
      });
    }
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
