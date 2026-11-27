// main.js — game loop, states and the screenshot scenes for Gobble Dash.
(function (global) {
  'use strict';

  var Render = global.GobbleRender;
  var World = global.GobbleWorld;
  var Input = global.GobbleInput;
  var Audio = global.GobbleAudio;

  var BEST_KEY = 'gobble-dash-best-m';
  var canvas = null;
  var ctx = null;
  var turkey = null;
  var world = null;
  var state = 'title'; // title | play | paused | caught | escaped
  var best = 0;
  var lastTs = 0;
  var frozen = false; // screenshot scenes render one fixed frame
  var clickArmed = false;

  function loadBest() {
    try { best = parseFloat(global.localStorage.getItem(BEST_KEY)) || 0; } catch (e) { best = 0; }
  }

  function saveBest() {
    try { global.localStorage.setItem(BEST_KEY, String(Math.floor(best))); } catch (e) { /* private mode */ }
  }

  function startRun() {
    turkey = World.newTurkey();
    world = World.newWorld(20261127 + Math.floor(Math.random() * 100000));
    state = 'play';
    Audio.unlock();
    Audio.chirp();
  }

  function endRun(kind) {
    state = kind;
    if (world.distanceM > best) { best = world.distanceM; saveBest(); }
    if (kind === 'escaped') Audio.win(); else Audio.lose();
  }

  function handleEvents(events) {
    for (var i = 0; i < events.length; i++) {
      var ev = events[i];
      if (ev === 'jump') Audio.jump();
      else if (ev === 'corn') Audio.pickup();
      else if (ev === 'pie') Audio.pie();
      else if (ev === 'feather') Audio.pie();
      else if (ev === 'hit') Audio.hit();
      else if (ev === 'caught') endRun('caught');
      else if (ev === 'escaped') endRun('escaped');
    }
  }

  function tick(ts) {
    requestAnimationFrame(tick);
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    if (frozen) { render(); return; }

    if (Input.mutePressed()) Audio.toggleMute();
    if (state === 'title') {
      if (Input.jumpPressed() || Input.restartPressed()) startRun();
    } else if (state === 'play') {
      if (Input.pausePressed()) { state = 'paused'; }
      else handleEvents(World.update(world, turkey, dt, Input));
    } else if (state === 'paused') {
      if (Input.pausePressed() || Input.jumpPressed()) state = 'play';
    } else if (state === 'caught' || state === 'escaped') {
      if (Input.restartPressed()) startRun();
    }
    render();
    Input.endFrame();
  }

  function render() {
    ctx.clearRect(0, 0, Render.W, Render.H);
    var d = world ? world.distanceM : 0;
    Render.drawSky(ctx, d);
    Render.drawScenery(ctx, world ? world.scenery : []);
    Render.drawGround(ctx);
    if (world) {
      Render.drawPickups(ctx, world.pickups, world.time);
      Render.drawHazards(ctx, world.hazards, world.time);
      // The farmer chases from the left edge, right behind the turkey.
      Render.drawFarmer(ctx, turkey.x - world.farmerGap, world.time);
      Render.drawTurkey(ctx, turkey, world.time);
    }
    if (state === 'play' || state === 'paused') Render.drawHud(ctx, world, turkey);
    if (state === 'title') Render.drawTitle(ctx, best);
    else if (state === 'caught') Render.drawEnd(ctx, 'caught', world);
    else if (state === 'escaped') Render.drawEnd(ctx, 'escaped', world);
    else if (state === 'paused') Render.drawPaused(ctx);
  }

  // Deterministic staged frames for screenshots: real renders of this code.
  // ?scene=title | play | play2 | caught | escaped
  function applyScene(scene) {
    if (!scene) return false;
    frozen = true;
    turkey = World.newTurkey();
    world = World.newWorld(777);
    if (scene === 'title') {
      state = 'title';
      best = 964;
      return true;
    }
    if (scene === 'play' || scene === 'play2') {
      state = 'play';
      world.distanceM = scene === 'play' ? 812 : 1240;
      world.score = scene === 'play' ? 1240 : 1980;
      world.speed = scene === 'play' ? 340 : 430;
      world.farmerGap = scene === 'play' ? 250 : 150;
      world.time = 4.2;
      turkey.lives = scene === 'play' ? 3 : 2;
      if (scene === 'play') {
        // Turkey mid-jump over the oven, knife chopping, corn ahead.
        turkey.y = 340;
        turkey.vy = -300;
        turkey.onGround = false;
        world.hazards = [
          { kind: 'oven', x: 560, y: 460, w: 72, h: 66, phase: 0, period: 2, down: false },
          { kind: 'knife', x: 760, y: 0, w: 26, h: 150, phase: 0, period: 1.8, down: true },
          { kind: 'hay', x: 900, y: 460, w: 62, h: 58, phase: 0, period: 2, down: false }
        ];
        world.pickups = [
          { kind: 'corn', x: 640, y: 380, got: false },
          { kind: 'corn', x: 674, y: 352, got: false },
          { kind: 'corn', x: 708, y: 340, got: false },
          { kind: 'pie', x: 850, y: 350, got: false }
        ];
      } else {
        // Ducking under the fence line at dusk, farmer closing in.
        turkey.ducking = true;
        world.hazards = [
          { kind: 'fence', x: 520, y: 460, w: 30, h: 58, phase: 0, period: 2, down: false },
          { kind: 'fence', x: 640, y: 460, w: 30, h: 58, phase: 0, period: 2, down: false },
          { kind: 'knife', x: 830, y: 0, w: 26, h: 150, phase: 0, period: 1.8, down: false }
        ];
        world.pickups = [
          { kind: 'corn', x: 470, y: 414, got: false },
          { kind: 'corn', x: 504, y: 414, got: false },
          { kind: 'feather', x: 730, y: 370, got: false }
        ];
      }
      world.scenery = [
        { x: 120, kind: 'tree', s: 1 },
        { x: 420, kind: 'barn', s: 0.9 },
        { x: 700, kind: 'pumpkin', s: 1 },
        { x: 920, kind: 'tree', s: 0.8 }
      ];
      return true;
    }
    if (scene === 'caught' || scene === 'escaped') {
      state = scene;
      world.distanceM = scene === 'caught' ? 963 : 1500;
      world.score = scene === 'caught' ? 1520 : 2340;
      world.speed = 380;
      world.farmerGap = scene === 'caught' ? 40 : 300;
      world.time = 8.5;
      turkey.lives = scene === 'caught' ? 0 : 2;
      world.hazards = [{ kind: 'oven', x: 700, y: 460, w: 72, h: 66, phase: 0, period: 2, down: false }];
      world.pickups = [{ kind: 'corn', x: 620, y: 414, got: false }];
      world.scenery = [{ x: 300, kind: 'barn', s: 1 }, { x: 880, kind: 'tree', s: 0.9 }];
      return true;
    }
    return false;
  }

  function boot() {
    canvas = global.document.getElementById('game');
    ctx = canvas.getContext('2d');
    loadBest();
    Input.attach(global.document, global);
    Input.onClick(function () {
      Audio.unlock();
      if (!clickArmed) { clickArmed = true; return; } // ignore the click that focused the page
      if (state === 'title' || state === 'caught' || state === 'escaped') startRun();
    });
    Input.onAnyKey(function () { Audio.unlock(); });
    // Let the first click focus the canvas without starting the game.
    setTimeout(function () { clickArmed = true; }, 600);

    var scene = null;
    try {
      scene = new URLSearchParams(global.location.search).get('scene');
    } catch (e) { scene = null; }
    applyScene(scene);
    if (!world) { turkey = World.newTurkey(); world = World.newWorld(20261127); }
    render();
    requestAnimationFrame(tick);
  }

  global.addEventListener('DOMContentLoaded', boot);
})(typeof window !== 'undefined' ? window : globalThis);
