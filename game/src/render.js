// render.js — every picture in Gobble Dash is drawn with canvas primitives.
(function (global) {
  'use strict';

  var W = 960;
  var H = 540;
  var GROUND_Y = 460;

  // The sky deepens toward dusk as the turkey runs further.
  function skyColors(distanceM) {
    var t = Math.min(1, distanceM / 1500);
    function mix(a, b) {
      return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' +
        Math.round(a[1] + (b[1] - a[1]) * t) + ',' +
        Math.round(a[2] + (b[2] - a[2]) * t) + ')';
    }
    return {
      top: mix([135, 206, 235], [58, 42, 94]),
      mid: mix([255, 214, 140], [214, 110, 82]),
      low: mix([255, 183, 120], [120, 58, 88])
    };
  }

  function drawSky(ctx, distanceM) {
    var c = skyColors(distanceM);
    var g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, c.top);
    g.addColorStop(0.55, c.mid);
    g.addColorStop(1, c.low);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, GROUND_Y);
    // A low autumn sun that sinks as dusk comes on.
    var sunY = 92 + Math.min(1, distanceM / 1500) * 150;
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(800, sunY, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 215, 106, 0.25)';
    ctx.beginPath();
    ctx.arc(800, sunY, 64, 0, Math.PI * 2);
    ctx.fill();
    // Drifting clouds.
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    var cx = (700 - (distanceM * 2.2 % 1100) + 1100) % 1100 - 80;
    cloud(ctx, cx, 70, 1);
    cloud(ctx, (cx + 430) % 1100 - 80, 120, 0.7);
  }

  function cloud(ctx, x, y, s) {
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 24 * s, y - 8 * s, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 48 * s, y, 20 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround(ctx) {
    ctx.fillStyle = '#7a5a33';
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = '#8f6c3e';
    ctx.fillRect(0, GROUND_Y, W, 10);
    ctx.fillStyle = '#c98f4a';
    for (var x = 0; x < W; x += 46) {
      ctx.fillRect(x + ((Math.floor(x / 46) % 2) * 12), GROUND_Y + 26, 26, 4);
    }
    ctx.fillStyle = '#6b4c2a';
    ctx.fillRect(0, GROUND_Y + 58, W, 4);
  }

  function drawScenery(ctx, scenery) {
    for (var i = 0; i < scenery.length; i++) {
      var s = scenery[i];
      var x = s.x;
      if (s.kind === 'tree') {
        ctx.fillStyle = '#5d3a1a';
        ctx.fillRect(x - 5 * s.s, GROUND_Y - 92 * s.s, 10 * s.s, 92 * s.s);
        ctx.fillStyle = '#c65a1e';
        ctx.beginPath();
        ctx.arc(x, GROUND_Y - 108 * s.s, 34 * s.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e07b2a';
        ctx.beginPath();
        ctx.arc(x - 16 * s.s, GROUND_Y - 92 * s.s, 20 * s.s, 0, Math.PI * 2);
        ctx.fill();
      } else if (s.kind === 'barn') {
        ctx.fillStyle = '#a83226';
        ctx.fillRect(x - 60 * s.s, GROUND_Y - 96 * s.s, 120 * s.s, 96 * s.s);
        ctx.fillStyle = '#7c241b';
        ctx.beginPath();
        ctx.moveTo(x - 68 * s.s, GROUND_Y - 96 * s.s);
        ctx.lineTo(x, GROUND_Y - 138 * s.s);
        ctx.lineTo(x + 68 * s.s, GROUND_Y - 96 * s.s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f3e2c7';
        ctx.fillRect(x - 14 * s.s, GROUND_Y - 52 * s.s, 28 * s.s, 52 * s.s);
      } else if (s.kind === 'pumpkin') {
        ctx.fillStyle = '#e07b2a';
        ctx.beginPath();
        ctx.ellipse(x, GROUND_Y - 14 * s.s, 22 * s.s, 16 * s.s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3f7a2e';
        ctx.fillRect(x - 2 * s.s, GROUND_Y - 34 * s.s, 4 * s.s, 10 * s.s);
      } else {
        ctx.fillStyle = '#8a6b45';
        ctx.fillRect(x - 3, GROUND_Y - 34, 6, 34);
        ctx.fillRect(x - 16, GROUND_Y - 30, 32, 4);
      }
    }
  }

  // The turkey: brown body, fanned tail, red wattle, flapping wing.
  function drawTurkey(ctx, t, time) {
    var blink = (t.invuln > 0 && Math.floor(time * 12) % 2 === 0);
    if (blink) ctx.globalAlpha = 0.35;
    var x = t.x;
    var y = t.y;
    var h = t.ducking ? t.duckH : t.h;
    var flap = Math.sin(t.flap) * (t.onGround ? 0.5 : 0.9);

    // Fanned tail feathers.
    ctx.fillStyle = '#6b4423';
    for (var i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(x - 20, y - h + 12);
      ctx.rotate(i * 0.42 - 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -20, 7, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#c98d4b';
    for (var j = -2; j <= 2; j++) {
      ctx.save();
      ctx.translate(x - 20, y - h + 12);
      ctx.rotate(j * 0.42 - 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -34, 3, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath();
    ctx.ellipse(x, y - h / 2 - 2, 27, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a9743c';
    ctx.beginPath();
    ctx.ellipse(x + 4, y - h / 2 + 4, 18, h / 2 - 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing, flapping.
    ctx.fillStyle = '#6b4423';
    ctx.save();
    ctx.translate(x - 2, y - h / 2);
    ctx.rotate(flap * 0.7);
    ctx.beginPath();
    ctx.ellipse(-6, 0, 16, 8, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Neck and head.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(x + 14, y - h - 12, 10, 20);
    ctx.fillStyle = '#d9a066';
    ctx.beginPath();
    ctx.arc(x + 20, y - h - 14, 11, 0, Math.PI * 2);
    ctx.fill();
    // Beak.
    ctx.fillStyle = '#e8a13a';
    ctx.beginPath();
    ctx.moveTo(x + 28, y - h - 16);
    ctx.lineTo(x + 40, y - h - 12);
    ctx.lineTo(x + 28, y - h - 9);
    ctx.closePath();
    ctx.fill();
    // Red wattle.
    ctx.fillStyle = '#d21f2b';
    ctx.beginPath();
    ctx.ellipse(x + 26, y - h - 4, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eye.
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x + 23, y - h - 17, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Legs, scrambling.
    var step = t.onGround ? Math.sin(t.flap * 2) * 6 : 4;
    ctx.strokeStyle = '#e8a13a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 4);
    ctx.lineTo(x - 8 + step, y + 2);
    ctx.moveTo(x + 8, y - 4);
    ctx.lineTo(x + 8 - step, y + 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // The farmer: overalls, straw hat, and a very determined walk.
  function drawFarmer(ctx, x, time) {
    var y = GROUND_Y;
    var bob = Math.sin(time * 10) * 3;
    var legSwing = Math.sin(time * 10) * 8;
    // Legs.
    ctx.strokeStyle = '#2e4a7a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 44);
    ctx.lineTo(x - 4 + legSwing, y);
    ctx.moveTo(x + 6, y - 44);
    ctx.lineTo(x + 6 - legSwing, y);
    ctx.stroke();
    // Overalls body.
    ctx.fillStyle = '#2e4a7a';
    ctx.fillRect(x - 14, y - 78 + bob, 30, 38);
    // Shirt.
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x - 14, y - 78 + bob, 30, 14);
    // Arms reaching forward.
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x + 12, y - 70 + bob);
    ctx.lineTo(x + 34, y - 58 + bob);
    ctx.moveTo(x + 12, y - 64 + bob);
    ctx.lineTo(x + 32, y - 48 + bob);
    ctx.stroke();
    // Head.
    ctx.fillStyle = '#e8b98a';
    ctx.beginPath();
    ctx.arc(x + 2, y - 88 + bob, 12, 0, Math.PI * 2);
    ctx.fill();
    // Straw hat.
    ctx.fillStyle = '#e8c96a';
    ctx.beginPath();
    ctx.ellipse(x + 2, y - 96 + bob, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 2, y - 98 + bob, 10, Math.PI, 0);
    ctx.fill();
    // Angry moustache.
    ctx.fillStyle = '#4a2c14';
    ctx.fillRect(x + 2, y - 86 + bob, 12, 3);
  }

  function drawHazards(ctx, hazards, time) {
    for (var i = 0; i < hazards.length; i++) {
      var hz = hazards[i];
      if (hz.kind === 'oven') {
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(hz.x - 36, hz.y - 66, 72, 66);
        ctx.fillStyle = '#555';
        ctx.fillRect(hz.x - 30, hz.y - 60, 60, 8);
        ctx.fillStyle = '#ff7a1a';
        ctx.fillRect(hz.x - 24, hz.y - 44, 48, 30);
        ctx.fillStyle = '#ffd76a';
        for (var f = 0; f < 3; f++) {
          var fh = 10 + Math.sin(time * 9 + f * 2 + hz.phase) * 5;
          ctx.beginPath();
          ctx.ellipse(hz.x - 16 + f * 16, hz.y - 16, 6, fh, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#222';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OVEN', hz.x, hz.y - 72);
      } else if (hz.kind === 'hay') {
        ctx.fillStyle = '#d9a441';
        ctx.beginPath();
        ctx.arc(hz.x, hz.y - 28, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a67c2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hz.x, hz.y - 28, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hz.x, hz.y - 28, 11, 0, Math.PI * 2);
        ctx.stroke();
      } else if (hz.kind === 'fence') {
        ctx.fillStyle = '#8a6b45';
        ctx.fillRect(hz.x - 14, hz.y - 56, 5, 56);
        ctx.fillRect(hz.x + 9, hz.y - 56, 5, 56);
        ctx.fillRect(hz.x - 16, hz.y - 52, 32, 5);
        ctx.fillRect(hz.x - 16, hz.y - 30, 32, 5);
      } else if (hz.kind === 'knife') {
        // Rope from the top, blade chops down on its cycle.
        var drop = hz.down ? 108 : 0;
        ctx.strokeStyle = '#7a5a33';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hz.x, 0);
        ctx.lineTo(hz.x, 26 + drop);
        ctx.stroke();
        ctx.fillStyle = '#4a2c14';
        ctx.fillRect(hz.x - 9, 18 + drop, 18, 12);
        ctx.fillStyle = '#cfd6dd';
        ctx.beginPath();
        ctx.moveTo(hz.x - 11, 30 + drop);
        ctx.lineTo(hz.x + 11, 30 + drop);
        ctx.lineTo(hz.x, 148 + drop);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#9aa4ad';
        ctx.beginPath();
        ctx.moveTo(hz.x - 11, 30 + drop);
        ctx.lineTo(hz.x, 148 + drop);
        ctx.lineTo(hz.x - 2, 30 + drop);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawPickups(ctx, pickups, time) {
    for (var i = 0; i < pickups.length; i++) {
      var p = pickups[i];
      var bobY = p.y + Math.sin(time * 4 + p.x * 0.05) * 3;
      if (p.kind === 'corn') {
        ctx.fillStyle = '#ffd21f';
        ctx.beginPath();
        ctx.ellipse(p.x, bobY, 8, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e8a13a';
        ctx.beginPath();
        ctx.ellipse(p.x, bobY, 4, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'pie') {
        ctx.fillStyle = '#b5651d';
        ctx.beginPath();
        ctx.moveTo(p.x - 14, bobY + 8);
        ctx.lineTo(p.x + 14, bobY + 8);
        ctx.lineTo(p.x, bobY - 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f3e2c7';
        ctx.beginPath();
        ctx.arc(p.x, bobY + 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+50', p.x, bobY - 18);
      } else {
        ctx.fillStyle = '#ffd700';
        ctx.save();
        ctx.translate(p.x, bobY);
        ctx.rotate(Math.sin(time * 3) * 0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 16, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+1 LIFE', p.x, bobY - 24);
      }
    }
  }

  function featherIcon(ctx, x, y, filled) {
    ctx.fillStyle = filled ? '#ff5a6e' : 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 5, 10, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHud(ctx, world, turkey) {
    ctx.fillStyle = 'rgba(20, 16, 40, 0.55)';
    ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 19px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + Math.floor(world.score), 16, 29);
    ctx.fillText(Math.floor(world.distanceM) + ' m', 250, 29);
    ctx.fillText(Math.round(world.speed * 3.6 / 10) + ' km/h', 420, 29);
    for (var i = 0; i < 5; i++) featherIcon(ctx, 620 + i * 22, 22, i < turkey.lives);
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffd76a';
    ctx.fillText('ESCAPE AT 1500 m', W - 16, 28);
    // Danger meter: how close the farmer is.
    var danger = 1 - (world.farmerGap - 30) / 390;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(16, 52, 200, 10);
    ctx.fillStyle = danger > 0.66 ? '#e63946' : danger > 0.33 ? '#f4a261' : '#7ec850';
    ctx.fillRect(16, 52, 200 * Math.max(0, Math.min(1, danger)), 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('FARMER', 222, 61);
  }

  function panel(ctx, title, lines, accent) {
    ctx.fillStyle = 'rgba(20, 12, 40, 0.72)';
    ctx.fillRect(180, 96, 600, 330);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.strokeRect(180, 96, 600, 330);
    ctx.fillStyle = accent;
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, 168);
    ctx.fillStyle = '#fff';
    ctx.font = '21px sans-serif';
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], W / 2, 214 + i * 34);
    }
  }

  function drawTitle(ctx, best) {
    ctx.fillStyle = 'rgba(30, 16, 50, 0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOBBLE DASH', W / 2, 150);
    ctx.fillStyle = '#fff';
    ctx.font = '28px sans-serif';
    ctx.fillText('The Great Turkey Escape', W / 2, 192);
    ctx.font = '19px sans-serif';
    ctx.fillText('Thanksgiving is coming. The farmer is coming faster. RUN.', W / 2, 232);
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '18px sans-serif';
    ctx.fillText('SPACE / UP / W — jump      DOWN / S — duck-slide', W / 2, 300);
    ctx.fillText('LEFT / RIGHT — slow down / speed up      P — pause', W / 2, 328);
    ctx.fillText('Dodge the oven, the hay bales and the fences.', W / 2, 356);
    ctx.fillText('Mind the carving knife. Grab corn, pie and golden feathers.', W / 2, 384);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Press SPACE or click to start', W / 2, 440);
    if (best > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = '17px sans-serif';
      ctx.fillText('Best escape so far: ' + Math.floor(best) + ' m', W / 2, 476);
    }
  }

  function drawEnd(ctx, kind, world) {
    var accent = kind === 'escaped' ? '#7ec850' : '#e63946';
    var title = kind === 'escaped' ? 'ESCAPED!' : 'CAUGHT!';
    var lines = kind === 'escaped'
      ? ['Thanksgiving is over — and you are still here.', 'The turkey is FREE!']
      : ['The farmer got you. Dinner is served...', 'Better luck next Thanksgiving.'];
    lines.push('Distance: ' + Math.floor(world.distanceM) + ' m      Score: ' + Math.floor(world.score));
    lines.push('Press R or click to run again');
    panel(ctx, title, lines, accent);
  }

  function drawPaused(ctx) {
    ctx.fillStyle = 'rgba(20, 12, 40, 0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, H / 2 - 10);
    ctx.font = '20px sans-serif';
    ctx.fillText('Press P to keep running', W / 2, H / 2 + 30);
  }

  global.GobbleRender = {
    W: W, H: H,
    drawSky: drawSky,
    drawGround: drawGround,
    drawScenery: drawScenery,
    drawTurkey: drawTurkey,
    drawFarmer: drawFarmer,
    drawHazards: drawHazards,
    drawPickups: drawPickups,
    drawHud: drawHud,
    drawTitle: drawTitle,
    drawEnd: drawEnd,
    drawPaused: drawPaused
  };
})(typeof window !== 'undefined' ? window : globalThis);
