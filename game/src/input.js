// input.js — keyboard and mouse controls for Gobble Dash.
(function (global) {
  'use strict';

  var keys = {};
  var pressed = {}; // edge-triggered: true only on the frame the key went down
  var clickHandlers = [];
  var anyKeyHandlers = [];

  var JUMP_CODES = ['Space', 'ArrowUp', 'KeyW'];
  var DUCK_CODES = ['ArrowDown', 'KeyS'];
  var SLOW_CODES = ['ArrowLeft', 'KeyA'];
  var FAST_CODES = ['ArrowRight', 'KeyD'];

  function codeOf(e) { return e.code || ('Key' + (e.key || '').toUpperCase()); }

  function onKeyDown(e) {
    var c = codeOf(e);
    if (JUMP_CODES.indexOf(c) >= 0 || DUCK_CODES.indexOf(c) >= 0 ||
        SLOW_CODES.indexOf(c) >= 0 || FAST_CODES.indexOf(c) >= 0 ||
        c === 'KeyP' || c === 'KeyR' || c === 'KeyM' || c === 'Enter') {
      e.preventDefault();
    }
    if (!keys[c]) pressed[c] = true;
    keys[c] = true;
    for (var i = 0; i < anyKeyHandlers.length; i++) anyKeyHandlers[i](c);
  }

  function onKeyUp(e) { keys[codeOf(e)] = false; }

  function onMouseDown(e) {
    for (var i = 0; i < clickHandlers.length; i++) clickHandlers[i](e.clientX, e.clientY);
  }

  function attach(targetDoc, targetWin) {
    targetDoc.addEventListener('keydown', onKeyDown);
    targetDoc.addEventListener('keyup', onKeyUp);
    targetDoc.addEventListener('mousedown', onMouseDown);
    if (targetWin) targetWin.addEventListener('blur', function () { keys = {}; });
  }

  function jumpPressed() {
    return JUMP_CODES.some(function (c) { return !!pressed[c]; });
  }

  function duckHeld() {
    return DUCK_CODES.some(function (c) { return !!keys[c]; });
  }

  function slowHeld() { return SLOW_CODES.some(function (c) { return !!keys[c]; }); }
  function fastHeld() { return FAST_CODES.some(function (c) { return !!keys[c]; }); }

  function pausePressed() { return !!pressed.KeyP; }
  function restartPressed() { return !!pressed.KeyR || !!pressed.Enter; }
  function mutePressed() { return !!pressed.KeyM; }

  function endFrame() { pressed = {}; }

  global.GobbleInput = {
    attach: attach,
    jumpPressed: jumpPressed,
    duckHeld: duckHeld,
    slowHeld: slowHeld,
    fastHeld: fastHeld,
    pausePressed: pausePressed,
    restartPressed: restartPressed,
    mutePressed: mutePressed,
    onClick: function (fn) { clickHandlers.push(fn); },
    onAnyKey: function (fn) { anyKeyHandlers.push(fn); },
    endFrame: endFrame
  };
})(typeof window !== 'undefined' ? window : globalThis);
