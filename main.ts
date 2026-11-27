// main.ts — hands Gobble Dash in: copies game/ and screenshots/ to the
// output directory and writes /output/dossier.json with buildDossier
// from vendor/makefun-game.ts. Run with: node main.ts
// (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader.)
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function clearKnownContents(dir: string): void {
  // Never delete the output directory itself: only its known contents.
  for (const name of ['game', 'screenshots', 'dossier.json']) {
    const target = join(dir, name);
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  }
}

function copyTree(src: string, dest: string): number {
  let files = 0;
  const st = statSync(src);
  if (!st.isDirectory()) throw new Error(`expected a directory: ${src}`);
  cpSync(src, dest, { recursive: true });
  const count = (d: string): void => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) count(p);
      else files += 1;
    }
  };
  count(dest);
  return files;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
clearKnownContents(OUTPUT_DIR);

const gameFiles = copyTree(join(REPO_ROOT, 'game'), join(OUTPUT_DIR, 'game'));
const shotFiles = copyTree(join(REPO_ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'));

const dossier = buildDossier(OUTPUT_DIR, CAPS);
writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
const dossierSha = createHash('sha256').update(dossier).digest('hex');

console.log(`Gobble Dash handed in: ${gameFiles} game files, ${shotFiles} screenshots`);
console.log(`dossier.json: ${dossier.length} bytes, sha256 ${dossierSha} -> ${OUTPUT_DIR}`);
