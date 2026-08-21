#!/usr/bin/env node
// Pre-launch gate. Prints WORK COUNTS, never a bare checkmark, so "nothing to do"
// and "broken" cannot look the same.
//   node src/verify.js
// exit 0 = clear to hand to Sandeep, 1 = something is wrong and is named below.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { OFFER, AUDIENCES, CONCEPTS, SIZES, fill } = require('./copy.js');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'out');
const fails = [], warns = [], notes = [];

// 1. every render present and non-trivial
let found = 0, missing = 0, tiny = 0;
for (const a of AUDIENCES) for (const c of CONCEPTS) for (const s of SIZES) {
  const f = path.join(OUT, a.key, `${a.key}__${c.slug}__${s.key}.png`);
  if (!fs.existsSync(f)) { missing++; fails.push(`missing render: ${path.relative(ROOT, f)}`); continue; }
  found++;
  const sz = fs.statSync(f).size;
  if (sz < 20000) { tiny++; fails.push(`suspiciously small (${sz}B), likely an unbranded render: ${path.relative(ROOT, f)}`); }
}
const expected = AUDIENCES.length * CONCEPTS.length * SIZES.length;
notes.push(`renders: ${found}/${expected} present, ${missing} missing, ${tiny} undersized`);

// 2. voice gate on every shipping primary text
const ENGINE_CANDIDATES = [
  path.resolve(ROOT, '../../../nishi-content-engine/voice_check.py'),
  path.resolve(os.homedir(), 'nishi-content-engine/voice_check.py'),
  path.resolve(os.homedir(), 'Documents/Claude/Projects/nishi-content-engine/voice_check.py'),
];
const checker = ENGINE_CANDIDATES.find((p) => fs.existsSync(p));
if (!checker) {
  // A skipped gate must never read as a passed gate.
  warns.push(`voice gate SKIPPED: voice_check.py not found. Looked in:\n      ${ENGINE_CANDIDATES.join('\n      ')}`);
} else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ibvoice-'));
  let pass = 0;
  for (const a of AUDIENCES) for (const c of CONCEPTS) {
    const f = path.join(tmp, `${a.key}_${c.key}.md`);
    fs.writeFileSync(f, fill(a[c.key].adPrimary) + '\n');
    try { execFileSync('python3', [checker, f], { stdio: 'pipe' }); pass++; }
    catch (e) {
      const msg = String(e.stdout || '') + String(e.stderr || '');
      fails.push(`voice gate FAIL ${a.key}/${c.key}: ` + (msg.match(/❌.*/g) || ['see voice_check output']).join(' | '));
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  notes.push(`voice gate: ${pass}/${AUDIENCES.length * CONCEPTS.length} primary texts pass (${path.basename(checker)})`);
}

// 3. launch blanks. Placeholders are FINE while drafting and fatal at launch;
//    this reports which state we are in rather than guessing.
const blanks = [];
if (OFFER.time.includes('[')) blanks.push('OFFER.time');
if (OFFER.regUrl.includes('[')) blanks.push('OFFER.regUrl');
notes.push(blanks.length
  ? `launch blanks: ${blanks.length} still unfilled (${blanks.join(', ')}) - NOT launch-ready`
  : 'launch blanks: none, time and registration URL are filled');

// 4. scope-of-practice guard on the allied lane. Coaches have neither patients nor
//    a licence to diagnose, and VOICE-GUIDE section 4 bans "clients" in her voice.
const allied = AUDIENCES.find((a) => a.key === 'allied');
const BANNED_ALLIED = /\b(patients?|clients?|diagnos\w*|prescrib\w+ for your)\b/i;
let scanned = 0;
for (const c of CONCEPTS) {
  const b = allied[c.key];
  for (const [field, val] of Object.entries(b)) {
    const text = typeof val === 'string' ? val
      : Array.isArray(val) ? val.join(' ')
      : (val && typeof val === 'object') ? Object.values(val).join(' ') : '';
    if (field === 'metaTargeting' || !text) continue;
    scanned++;
    const hit = text.match(BANNED_ALLIED);
    if (hit) fails.push(`allied lane scope-of-practice: "${hit[0]}" in ${c.key}.${field} — coaches have neither patients nor clients, and do not diagnose`);
  }
}
notes.push(`allied scope-of-practice: ${scanned} copy fields scanned`);

// 5. credit claim consistency: a lane must not promise credit its label omits
for (const a of AUDIENCES) {
  for (const c of CONCEPTS) {
    const blob = JSON.stringify(a[c.key]);
    if (a.credit === 'CME' && /CME\/CE/.test(blob)) fails.push(`${a.key}/${c.key} says CME/CE but the lane is CME-only`);
    if (a.credit === 'CME/CE' && /\bCME\b(?!\/CE)/.test(blob.replace(/CME\/CE/g, ''))) {
      fails.push(`${a.key}/${c.key} says bare "CME" but the lane is CME/CE`);
    }
  }
}
notes.push(`credit claims: ${AUDIENCES.length * CONCEPTS.length} copy sets checked against their lane's credit line`);

console.log('IntraBalance Insomnia Masterclass ads — verification\n');
for (const n of notes) console.log('  ' + n);
if (warns.length) { console.log(''); for (const x of warns) console.log('  WARN  ' + x); }
if (fails.length) {
  console.log('');
  for (const x of fails) console.log('  FAIL  ' + x);
  console.log(`\n${fails.length} problem(s).`);
  process.exit(1);
}
console.log(`\n0 problems. ${blanks.length ? 'Still needs the launch blanks filled before it goes live.' : 'Launch-ready.'}`);
