// audio.js — all sound is synthesized with WebAudio. No audio files.
(function (global) {
  'use strict';

  var ctx = null;
  var muted = false;

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  // Unlock audio on the first user gesture; browsers block it before that.
  function unlock() {
    var c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    var c = ensureCtx();
    if (!c) return;
    try {
      var now = c.currentTime;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
      gain.gain.setValueAtTime(vol || 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch (e) { /* sound is decoration; never break the game */ }
  }

  function chirp() { tone(520, 0.12, 'triangle', 0.14, 880); }

  function jumpSound() { tone(300, 0.18, 'square', 0.08, 620); }

  function pickupSound() {
    tone(880, 0.09, 'sine', 0.12);
    setTimeout(function () { tone(1318, 0.12, 'sine', 0.12); }, 70);
  }

  function pieSound() {
    tone(660, 0.1, 'triangle', 0.14);
    setTimeout(function () { tone(990, 0.1, 'triangle', 0.14); }, 80);
    setTimeout(function () { tone(1320, 0.16, 'triangle', 0.14); }, 160);
  }

  function hitSound() {
    tone(180, 0.25, 'sawtooth', 0.16, 60);
    setTimeout(function () { tone(90, 0.2, 'sawtooth', 0.12, 50); }, 90);
  }

  function winSound() {
    var notes = [523, 659, 784, 1046];
    notes.forEach(function (f, i) {
      setTimeout(function () { tone(f, 0.22, 'triangle', 0.14); }, i * 130);
    });
  }

  function loseSound() {
    var notes = [392, 330, 262, 196];
    notes.forEach(function (f, i) {
      setTimeout(function () { tone(f, 0.28, 'triangle', 0.13); }, i * 160);
    });
  }

  global.GobbleAudio = {
    unlock: unlock,
    chirp: chirp,
    jump: jumpSound,
    pickup: pickupSound,
    pie: pieSound,
    hit: hitSound,
    win: winSound,
    lose: loseSound,
    toggleMute: function () { muted = !muted; return muted; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
