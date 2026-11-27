// world.js — the farmyard: hazards, collectibles, the chasing farmer, scoring.
(function (global) {
  'use strict';

  var Rng = global.GobbleRng;

  var GROUND_Y = 460;
  var WIN_DISTANCE_M = 1500;
  var BASE_SPEED = 260;
  var MAX_SPEED = 540;

  function newTurkey() {
    return {
      x: 180, y: GROUND_Y, vy: 0,
      w: 54, h: 48, duckH: 30,
      onGround: true, ducking: false,
      lives: 3, invuln: 0, // seconds of post-hit invulnerability
      flap: 0 // wing-flap animation phase
    };
  }

  function newWorld(seed) {
    return {
      rng: Rng.makeRng(seed || 20261127),
      time: 0,
      distanceM: 0,
      score: 0,
      speed: BASE_SPEED,
      farmerGap: 260, // pixels between the farmer and the turkey
      farmerCatch: 46, // gap at or below this means caught
      hazards: [], // {kind:'oven'|'knife'|'hay'|'fence', x, y, w, h, phase, period, down}
      pickups: [], // {kind:'corn'|'pie'|'feather', x, y, got}
      spawnIn: 1.1, // seconds until the next spawn
      scenery: [], // {x, kind:'tree'|'barn'|'pumpkin'|'fencepost', s}
      cornStreak: 0
    };
  }

  function speedFor(world) {
    var ramp = Math.min(1, world.distanceM / 1200);
    return BASE_SPEED + (MAX_SPEED - BASE_SPEED) * ramp;
  }

  function spawnScenery(world) {
    var rng = world.rng;
    var kinds = ['tree', 'tree', 'pumpkin', 'barn', 'fencepost', 'tree'];
    world.scenery.push({
      x: 980,
      kind: Rng.makePick(rng, kinds),
      s: 0.8 + rng() * 0.5
    });
  }

  // One hazard or one pickup pattern. Spacing keeps the run fair at any speed.
  function spawnNext(world) {
    var rng = world.rng;
    var roll = rng();
    var x = 1020;
    if (roll < 0.30) {
      var kind = Rng.makePick(rng, ['oven', 'hay', 'fence']);
      var dims = { oven: { w: 72, h: 66 }, hay: { w: 62, h: 58 }, fence: { w: 30, h: 58 } }[kind];
      world.hazards.push({
        kind: kind, x: x, y: GROUND_Y, w: dims.w, h: dims.h,
        phase: rng() * 6.28, period: 1.5 + rng() * 0.7, down: false
      });
    } else if (roll < 0.44) {
      // The carving knife: hangs from the top and chops down on a timer.
      world.hazards.push({
        kind: 'knife', x: x, y: 0, w: 26, h: 150,
        phase: rng() * 6.28, period: 1.7 + rng() * 0.5, down: false
      });
    } else if (roll < 0.86) {
      // A trail of corn kernels, sometimes arced so a jump collects them all.
      var n = 3 + Math.floor(rng() * 3);
      var arc = rng() < 0.4;
      for (var i = 0; i < n; i++) {
        world.pickups.push({
          kind: 'corn', x: x + i * 34,
          y: GROUND_Y - 46 - (arc ? Math.sin((i / (n - 1)) * Math.PI) * 70 : 0),
          got: false
        });
      }
    } else if (roll < 0.95) {
      world.pickups.push({ kind: 'pie', x: x, y: GROUND_Y - 110, got: false });
    } else {
      world.pickups.push({ kind: 'feather', x: x, y: GROUND_Y - 90, got: false });
    }
    if (rng() < 0.55) spawnScenery(world);
    world.spawnIn = 0.85 + rng() * 0.75;
  }

  function turkeyBox(t) {
    var h = t.ducking ? t.duckH : t.h;
    return { x: t.x - t.w / 2 + 6, y: t.y - h, w: t.w - 12, h: h };
  }

  function boxesOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hazardBox(hz) {
    if (hz.kind === 'knife') {
      // Only dangerous while the blade is down low.
      if (!hz.down) return null;
      return { x: hz.x - 10, y: 118, w: 20, h: 150 };
    }
    if (hz.kind === 'hay') return { x: hz.x - 26, y: hz.y - 52, w: 52, h: 52 };
    if (hz.kind === 'oven') return { x: hz.x - 34, y: hz.y - 62, w: 68, h: 62 };
    return { x: hz.x - 13, y: hz.y - 54, w: 26, h: 54 }; // fence
  }

  // Advance the world one tick. Returns events: 'hit', 'corn', 'pie', 'feather', 'caught', 'escaped'.
  function update(world, turkey, dt, input) {
    var events = [];
    world.time += dt;

    var target = speedFor(world);
    if (input.slowHeld()) target -= 70;
    if (input.fastHeld()) target += 70;
    world.speed += (target - world.speed) * Math.min(1, dt * 2.5);

    var px = world.speed * dt;
    world.distanceM += px / 50;
    world.score += px / 50; // one point per metre survived

    // The farmer: gains when the turkey dawdles, loses when it sprints.
    if (input.slowHeld()) world.farmerGap -= 26 * dt;
    else if (input.fastHeld()) world.farmerGap += 30 * dt;
    else world.farmerGap -= 1.5 * dt; // the farmer never quite gives up
    world.farmerGap = Math.max(30, Math.min(420, world.farmerGap));

    // Turkey physics.
    if (input.jumpPressed() && turkey.onGround) {
      turkey.vy = -840;
      turkey.onGround = false;
      events.push('jump');
    }
    turkey.ducking = input.duckHeld() && turkey.onGround;
    turkey.vy += 2400 * dt;
    turkey.y += turkey.vy * dt;
    if (turkey.y >= GROUND_Y) {
      turkey.y = GROUND_Y;
      turkey.vy = 0;
      turkey.onGround = true;
    }
    turkey.flap += dt * (turkey.onGround ? world.speed / 28 : 6);
    if (turkey.invuln > 0) turkey.invuln -= dt;

    // Spawning and scrolling.
    world.spawnIn -= dt;
    if (world.spawnIn <= 0) spawnNext(world);
    var i;
    for (i = world.hazards.length - 1; i >= 0; i--) {
      var hz = world.hazards[i];
      hz.x -= px;
      if (hz.kind === 'knife') {
        // The blade chops down for part of each cycle.
        var cyc = (world.time + hz.phase) % hz.period;
        hz.down = cyc < hz.period * 0.38;
      }
      if (hz.x < -120) world.hazards.splice(i, 1);
    }
    for (i = world.pickups.length - 1; i >= 0; i--) {
      var pk = world.pickups[i];
      pk.x -= px;
      if (pk.x < -60) world.pickups.splice(i, 1);
    }
    for (i = world.scenery.length - 1; i >= 0; i--) {
      world.scenery[i].x -= px * 0.55; // background scrolls slower
      if (world.scenery[i].x < -160) world.scenery.splice(i, 1);
    }

    // Collisions.
    var tb = turkeyBox(turkey);
    for (i = world.hazards.length - 1; i >= 0; i--) {
      var hb = hazardBox(world.hazards[i]);
      if (!hb) continue;
      if (boxesOverlap(tb, hb) && turkey.invuln <= 0) {
        turkey.lives -= 1;
        turkey.invuln = 1.6;
        world.farmerGap = Math.max(34, world.farmerGap - 72); // the farmer gains ground
        world.hazards.splice(i, 1);
        events.push('hit');
        break;
      }
    }
    for (i = world.pickups.length - 1; i >= 0; i--) {
      var p = world.pickups[i];
      if (p.got) continue;
      var pb = { x: p.x - 13, y: p.y - 13, w: 26, h: 26 };
      if (boxesOverlap(tb, pb)) {
        p.got = true;
        world.pickups.splice(i, 1);
        if (p.kind === 'corn') { world.score += 10; events.push('corn'); }
        else if (p.kind === 'pie') { world.score += 50; events.push('pie'); }
        else { turkey.lives = Math.min(5, turkey.lives + 1); events.push('feather'); }
      }
    }

    if (turkey.lives <= 0 || world.farmerGap <= world.farmerCatch) events.push('caught');
    else if (world.distanceM >= WIN_DISTANCE_M) events.push('escaped');
    return events;
  }

  global.GobbleWorld = {
    GROUND_Y: GROUND_Y,
    WIN_DISTANCE_M: WIN_DISTANCE_M,
    newTurkey: newTurkey,
    newWorld: newWorld,
    update: update,
    turkeyBox: turkeyBox,
    spawnNext: spawnNext
  };
})(typeof window !== 'undefined' ? window : globalThis);
