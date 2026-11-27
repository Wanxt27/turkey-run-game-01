// rng.js — a tiny seeded random generator so runs and screenshots are repeatable.
(function (global) {
  'use strict';

  // Mulberry32: small, fast, deterministic for a given seed.
  function makeRng(seed) {
    var s = seed >>> 0;
    return function next() {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRange(rng, min, max) {
    return min + rng() * (max - min);
  }

  function makePick(rng, list) {
    return list[Math.floor(rng() * list.length) % list.length];
  }

  global.GobbleRng = { makeRng: makeRng, makeRange: makeRange, makePick: makePick };
})(typeof window !== 'undefined' ? window : globalThis);
