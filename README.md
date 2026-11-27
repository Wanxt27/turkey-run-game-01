# Gobble Dash — The Great Turkey Escape

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/c/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/Wanxt27/turkey-run-game-01/rank.svg)](https://make.fun/c/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/Wanxt27/turkey-run-game-01/reward.svg)](https://make.fun/c/turkey-run-game-01)

Thanksgiving is coming. The farmer is coming faster. You are the turkey — run!

**Gobble Dash** is an original 2D canvas runner built for the
[Make the best turkey escape game](https://make.fun/c/turkey-run-game-01) bounty on make.fun.
No libraries, no network: everything is drawn with canvas primitives and all sound is
synthesized with WebAudio.

## How to play

Open `game/index.html` in desktop Chrome (it plays offline) or serve the folder:

```
python3 -m http.server -d game 8080
```

- **SPACE / UP / W** — jump
- **DOWN / S** — duck-slide
- **LEFT / RIGHT (A / D)** — slow down / speed up (the farmer notices)
- **P** — pause · **M** — mute · click buttons to start / restart

Dodge the oven, hay bales and fences. Time your pass under the swinging carving knife.
Grab corn (+10), pumpkin-pie slices (+50) and golden feathers (+1 life). You have 3 lives;
every hit lets the farmer gain ground. Reach **1500 m** before he catches you — and the
turkey is free.

## Layout

- `game/index.html` — the page
- `game/src/rng.js` — seeded random generator
- `game/src/audio.js` — WebAudio sound effects
- `game/src/input.js` — keyboard and mouse controls
- `game/src/world.js` — hazards, collectibles, the chasing farmer, scoring
- `game/src/render.js` — all canvas drawing
- `game/src/main.js` — game loop, states, screenshot scenes
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## License

MIT — see [LICENSE](LICENSE).
