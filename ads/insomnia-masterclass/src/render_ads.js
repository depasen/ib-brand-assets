#!/usr/bin/env node
// Renders every audience x concept x size to PNG.
//
//   node src/render_ads.js                 # all 36
//   node src/render_ads.js --audience nps  # one lane
//   node src/render_ads.js --concept B     # one concept
//
// Resolves its own location, so it runs from anywhere.
//
// WHY THE TYPE SCALE IS A CSS VARIABLE
// The June kit hard-coded a per-size scale factor tuned by eye against ONE audience's
// copy. Three audiences means longer strings ("For Psychologists, PAs & Coaches" is
// more than twice "For Physicians"), and a hard-coded scale silently overflows or
// clips them. Every dimension here is calc(var(--u) * N), so an in-page fit pass can
// shrink the whole artboard until the content actually fits, and single-line items
// (eyebrow, strip, chip) shrink independently to their own width. Nothing ships on
// the assumption that it fit.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { OFFER, AUDIENCES, CONCEPTS, SIZES, fill } = require('./copy.js');

const ROOT = path.resolve(__dirname, '..');
const FONTS = path.join(ROOT, 'fonts');
const BRAND = path.join(ROOT, 'brand');
const OUT = path.join(ROOT, 'out');

const NAVY = '#144A7F', TEAL = '#3DD1CD', LBLUE = '#AED0F4', LACC = '#EEFFFF', WHITE = '#FFFFFF';
const SUB_LIGHT = '#37587a', SUB_WHITE = '#3a5a7a', SUB_BLUE = '#123f6b';

// Only the weights that exist on disk. The June kit declared Outfit 400 and Figtree 400
// with no such files, so every 400-weight request silently fell back.
const FACES = [
  ['Syne', 600, 'syne-v24-latin-600.ttf'], ['Syne', 700, 'syne-v24-latin-700.ttf'],
  ['Syne', 800, 'syne-v24-latin-800.ttf'],
  ['Outfit', 300, 'outfit-v15-latin-300.ttf'], ['Outfit', 500, 'outfit-v15-latin-500.ttf'],
  ['Outfit', 600, 'outfit-v15-latin-600.ttf'],
  ['Figtree', 500, 'figtree-v9-latin-500.ttf'], ['Figtree', 600, 'figtree-v9-latin-600.ttf'],
  ['Figtree', 700, 'figtree-v9-latin-700.ttf'], ['Figtree', 800, 'figtree-v9-latin-800.ttf'],
];
const FONTCSS = FACES.map(([f, w, file]) => {
  const p = path.join(FONTS, file);
  if (!fs.existsSync(p)) throw new Error(`missing font file: ${p}`);
  return `@font-face{font-family:'${f}';font-weight:${w};font-style:normal;src:url('file://${p}') format('truetype');}`;
}).join('\n');

const u = (n) => `calc(var(--u) * ${n})`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Only **bold** is honoured inside copy strings; everything else is escaped.
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b style="font-weight:700;">$1</b>');
const asset = (f) => `file://${path.join(BRAND, f)}`;

const arrow = '&nbsp;&rarr;';

function check() {
  return `<span style="flex:none;width:${u(44)};height:${u(44)};border-radius:50%;background:${TEAL};display:flex;align-items:center;justify-content:center;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${NAVY}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" style="width:${u(24)};height:${u(24)};"><path d="M5 13l4 4L19 7"/></svg></span>`;
}

// ---------------------------------------------------------------- concepts

function A_offerstack(c) { // offer stack, light-accent ground
  return {
    bg: LACC,
    pattern: `<div style="position:absolute;inset:0;background:url('${asset('pattern_navy.png')}') center/cover no-repeat;opacity:0.55;"></div>`,
    color: NAVY,
    pad: 80,
    body: `
      <img src="${asset('logo_color.png')}" style="height:${u(54)};width:auto;align-self:flex-start;">
      <div data-fit-line style="font-family:'Outfit';font-weight:600;letter-spacing:0.18em;font-size:${u(25)};margin-top:${u(40)};white-space:nowrap;">${esc(c.eyebrow)}</div>
      <div style="font-family:'Syne';font-weight:700;line-height:1.14;text-wrap:balance;font-size:${u(90)};letter-spacing:-0.5px;margin-top:${u(22)};">${esc(c.h.lead)} <span style="text-decoration:underline;text-decoration-color:${TEAL};text-decoration-thickness:${u(7)};text-underline-offset:${u(14)};">${esc(c.h.accent)}</span></div>
      <div style="font-family:'Figtree';font-weight:500;font-size:${u(34)};line-height:1.45;color:${SUB_LIGHT};margin-top:${u(34)};max-width:92%;">${esc(c.sub)}</div>
      <div style="display:flex;flex-direction:column;gap:${u(28)};margin-top:${u(56)};">
        ${c.checks.map((t) => `<div style="display:flex;align-items:center;gap:${u(22)};">${check()}<span style="font-size:${u(33)};font-weight:500;">${md(t)}</span></div>`).join('')}
      </div>
      <span style="align-self:flex-start;background:${TEAL};color:${NAVY};font-family:'Syne';font-weight:700;font-size:${u(36)};padding:${u(24)} ${u(50)};border-radius:6px;margin-top:${u(52)};white-space:nowrap;">${esc(c.button)} ${arrow}</span>`,
  };
}

function B_quotecard(c) { // quote card, white ground, navy CTA bar
  return {
    bg: WHITE, color: NAVY, pad: 80, footer: 150,
    pattern: `<div style="position:absolute;top:0;left:0;right:0;height:${u(14)};background:${TEAL};"></div>`,
    body: `
      <img src="${asset('logo_color.png')}" style="height:${u(58)};width:auto;align-self:flex-start;">
      <div style="margin-top:${u(40)};">
        <div style="font-family:'Syne';font-weight:700;font-size:${u(30)};">${esc(c.kicker)}</div>
        <div data-fit-line style="font-family:'Outfit';font-weight:500;font-size:${u(24)};color:${SUB_WHITE};margin-top:${u(6)};white-space:nowrap;">${esc(c.kickerSub)}</div>
      </div>
      <div style="font-family:'Syne';font-weight:600;line-height:1.18;text-wrap:balance;font-size:${u(66)};letter-spacing:-0.3px;margin-top:${u(38)};">${esc(c.h.lead)} <span style="text-decoration:underline;text-decoration-color:${TEAL};text-decoration-thickness:${u(7)};text-underline-offset:${u(12)};">${esc(c.h.accent)}</span></div>
      <div style="font-family:'Figtree';font-weight:500;font-size:${u(35)};line-height:1.5;color:${SUB_WHITE};margin-top:${u(36)};max-width:94%;">${esc(c.sub)}</div>
      <div style="display:inline-flex;align-self:flex-start;align-items:center;gap:${u(14)};background:${LACC};border:2px solid ${LBLUE};border-radius:999px;padding:${u(16)} ${u(28)};margin-top:${u(44)};">
        <span style="flex:none;width:${u(12)};height:${u(12)};border-radius:50%;background:${TEAL};"></span>
        <span data-fit-line style="font-family:'Outfit';font-weight:600;font-size:${u(26)};white-space:nowrap;">${esc(c.chip)}</span></div>`,
    footerHtml: `<div style="position:absolute;left:0;right:0;bottom:0;height:${u(150)};background:${NAVY};display:flex;align-items:center;justify-content:space-between;padding:0 ${u(56)};">
        <span style="background:${TEAL};color:${NAVY};font-family:'Syne';font-weight:700;font-size:${u(33)};padding:${u(19)} ${u(40)};border-radius:6px;white-space:nowrap;">${esc(c.button)} ${arrow}</span>
        <img src="${asset('logo_white.png')}" style="height:${u(44)};width:auto;"></div>`,
  };
}

function C_bigquestion(c) { // bold question, light-blue ground
  return {
    bg: LBLUE, color: NAVY, pad: 82,
    pattern: `<div style="position:absolute;inset:0;background:url('${asset('pattern_navy.png')}') center/cover no-repeat;opacity:0.4;"></div>`,
    body: `
      <img src="${asset('logo_color.png')}" style="height:${u(54)};width:auto;align-self:flex-start;">
      <div data-fit-line style="font-family:'Outfit';font-weight:600;letter-spacing:0.14em;font-size:${u(24)};margin-top:${u(44)};white-space:nowrap;">${esc(c.eyebrow)}</div>
      <div style="font-family:'Syne';font-weight:700;line-height:1.1;text-wrap:balance;font-size:${u(92)};letter-spacing:-0.5px;margin-top:${u(24)};">${esc(c.h.lead)} <span style="text-decoration:underline;text-decoration-color:${NAVY};text-decoration-thickness:${u(8)};text-underline-offset:${u(14)};">${esc(c.h.accent)}</span></div>
      <div style="display:flex;flex-direction:column;gap:${u(28)};margin-top:${u(56)};align-items:flex-start;">
        <div style="font-family:'Figtree';font-size:${u(34)};line-height:1.4;color:${SUB_BLUE};max-width:92%;font-weight:500;">${esc(c.sub)}</div>
        <div data-fit-line style="font-family:'Syne';font-weight:700;font-size:${u(26)};white-space:nowrap;">${esc(c.strip)}</div>
        <span style="background:${TEAL};color:${NAVY};font-family:'Syne';font-weight:700;font-size:${u(34)};padding:${u(22)} ${u(46)};border-radius:6px;white-space:nowrap;">${esc(c.button)} ${arrow}</span>
      </div>`,
  };
}

function D_statement(c) { // dark hot take, navy ground
  return {
    bg: NAVY, color: LACC, pad: 82,
    pattern: `<div style="position:absolute;inset:0;background:url('${asset('pattern_teal.png')}') center/cover no-repeat;opacity:0.5;"></div>`,
    body: `
      <img src="${asset('logo_white.png')}" style="height:${u(54)};width:auto;align-self:flex-start;">
      <div data-fit-line style="font-family:'Outfit';font-weight:600;letter-spacing:0.16em;font-size:${u(24)};color:${TEAL};margin-top:${u(52)};white-space:nowrap;">${esc(c.eyebrow)}</div>
      <div style="font-family:'Syne';font-weight:700;line-height:1.1;text-wrap:balance;font-size:${u(94)};letter-spacing:-0.5px;margin-top:${u(26)};">${esc(c.h.lead)} <span style="color:${TEAL};">${esc(c.h.accent)}</span></div>
      <div style="font-family:'Figtree';font-weight:500;font-size:${u(35)};line-height:1.44;color:${LBLUE};margin-top:${u(34)};max-width:92%;">${esc(c.sub)}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:${u(24)};margin-top:${u(60)};">
        <span style="background:${TEAL};color:${NAVY};font-family:'Syne';font-weight:700;font-size:${u(34)};padding:${u(22)} ${u(46)};border-radius:6px;white-space:nowrap;">${esc(c.button)} ${arrow}</span>
        <span style="font-family:'Outfit';font-weight:500;font-size:${u(25)};color:${LBLUE};white-space:nowrap;">${esc(c.credit)}</span></div>`,
  };
}


// The portrait. MEASURED, not assumed: the source is 400x400 with the circle inset
// 25px on every side, so the real portrait is 350px across and the outer 6.3% is
// black matte. A plain border-radius:50% crop therefore leaves a dark halo inside
// the ring, which is what it did on the first render. Scaling to 400/350 = 1.143
// (1.16 for margin) pushes the matte outside the crop.
// 350px is the hard ceiling on portrait resolution - see README "Still open".
const PORTRAIT_SCALE = 1.16;
function portrait(px, ring) {
  const over = ((PORTRAIT_SCALE - 1) / 2 * 100).toFixed(2);
  return `<span style="display:block;flex:none;width:${u(px)};height:${u(px)};border-radius:50%;overflow:hidden;border:${u(5)} solid ${ring};background:${WHITE};">
    <img src="${asset('bhopal.jpg')}" alt="" style="width:${PORTRAIT_SCALE * 100}%;height:${PORTRAIT_SCALE * 100}%;margin:-${over}% 0 0 -${over}%;object-fit:cover;display:block;">
  </span>`;
}

function E_quotecard_photo(c) { // B, with her face instead of a typed credential
  return {
    bg: WHITE, color: NAVY, pad: 76, footer: 150,
    pattern: `<div style="position:absolute;top:0;left:0;right:0;height:${u(14)};background:${TEAL};"></div>`,
    body: `
      <img src="${asset('logo_color.png')}" style="height:${u(52)};width:auto;align-self:flex-start;">
      <div style="display:flex;align-items:center;gap:${u(26)};margin-top:${u(38)};">
        ${portrait(148, TEAL)}
        <div style="min-width:0;">
          <div style="font-family:'Syne';font-weight:700;font-size:${u(32)};">${esc(c.portraitName)}</div>
          <div style="font-family:'Outfit';font-weight:500;font-size:${u(24)};color:${SUB_WHITE};margin-top:${u(5)};">${esc(c.portraitCred)}</div>
        </div>
      </div>
      <div style="font-family:'Syne';font-weight:600;line-height:1.18;text-wrap:balance;font-size:${u(62)};letter-spacing:-0.3px;margin-top:${u(34)};">${esc(c.h.lead)} <span style="text-decoration:underline;text-decoration-color:${TEAL};text-decoration-thickness:${u(7)};text-underline-offset:${u(12)};">${esc(c.h.accent)}</span></div>
      <div style="font-family:'Figtree';font-weight:500;font-size:${u(33)};line-height:1.5;color:${SUB_WHITE};margin-top:${u(30)};max-width:94%;">${esc(c.sub)}</div>
      <div style="display:inline-flex;align-self:flex-start;align-items:center;gap:${u(14)};background:${LACC};border:2px solid ${LBLUE};border-radius:999px;padding:${u(15)} ${u(26)};margin-top:${u(36)};">
        <span style="flex:none;width:${u(12)};height:${u(12)};border-radius:50%;background:${TEAL};"></span>
        <span data-fit-line style="font-family:'Outfit';font-weight:600;font-size:${u(25)};white-space:nowrap;">${esc(c.chip)}</span></div>`,
    footerHtml: `<div style="position:absolute;left:0;right:0;bottom:0;height:${u(150)};background:${NAVY};display:flex;align-items:center;justify-content:space-between;padding:0 ${u(56)};">
        <span style="background:${TEAL};color:${NAVY};font-family:'Syne';font-weight:700;font-size:${u(33)};padding:${u(19)} ${u(40)};border-radius:6px;white-space:nowrap;">${esc(c.button)} ${arrow}</span>
        <img src="${asset('logo_white.png')}" style="height:${u(44)};width:auto;"></div>`,
  };
}

function F_speakercard(c) { // A's words as a webinar speaker announcement, face-led
  return {
    bg: NAVY, color: LACC, pad: 78,
    pattern: `<div style="position:absolute;inset:0;background:url('${asset('pattern_teal.png')}') center/cover no-repeat;opacity:0.42;"></div>`,
    body: `
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;">
        <img src="${asset('logo_white.png')}" style="height:${u(50)};width:auto;">
        <div data-fit-line style="font-family:'Outfit';font-weight:600;letter-spacing:0.16em;font-size:${u(23)};color:${TEAL};margin-top:${u(34)};white-space:nowrap;">${esc(c.eyebrow)}</div>
        ${(() => `<div style="margin-top:${u(30)};">${portrait(300, TEAL)}</div>`)()}
        <div style="font-family:'Syne';font-weight:700;font-size:${u(31)};margin-top:${u(22)};">${esc(c.portraitName)}</div>
        <div data-fit-line style="font-family:'Outfit';font-weight:500;font-size:${u(23)};color:${LBLUE};margin-top:${u(5)};white-space:nowrap;">${esc(c.portraitCred)}</div>
        <div style="font-family:'Syne';font-weight:700;line-height:1.12;text-wrap:balance;font-size:${u(66)};letter-spacing:-0.5px;margin-top:${u(32)};">${esc(c.h.lead)} <span style="color:${TEAL};">${esc(c.h.accent)}</span></div>
        <div style="font-family:'Figtree';font-weight:500;font-size:${u(30)};line-height:1.44;color:${LBLUE};margin-top:${u(24)};max-width:88%;">${esc(c.sub)}</div>
        <div data-fit-line style="font-family:'Outfit';font-weight:600;font-size:${u(26)};color:${WHITE};margin-top:${u(26)};white-space:nowrap;">${esc(c.checks[2].replace(/\*\*/g, ''))}</div>
        <span style="background:${TEAL};color:${NAVY};font-family:'Syne';font-weight:700;font-size:${u(34)};padding:${u(22)} ${u(46)};border-radius:6px;margin-top:${u(28)};white-space:nowrap;">${esc(c.button)} ${arrow}</span>
      </div>`,
  };
}


// G - native post. Modelled on the eCare / Colleen Carney ad in the Ad Inspiration
// folder: the creative reads as a post, not an ad. Deliberate departures from the
// other six concepts, each for a reason:
//   - Headline is Figtree 800, not Syne. The format only works if the type reads like
//     the platform's own. Figtree is the brand's body face and is neutral enough to
//     pass; Syne is distinctive and instantly reads "designed ad".
//   - No pattern, no tinted ground. A plain white card is what a real post looks like.
//   - Brand colour appears ONLY in the footer bar, exactly as the reference does.
// What is NOT copied: the reference bakes a fake reaction and comment row into the
// image. That is invented social proof and it is not in here.
function G_nativepost(c) {
  const foot = 150;
  return {
    bg: WHITE, color: '#0F1419', pad: 66, footer: foot,
    pattern: '',
    body: `
      <div style="display:flex;align-items:center;gap:${u(22)};">
        ${portrait(120, LACC)}
        <div style="min-width:0;">
          <div style="font-family:'Figtree';font-weight:800;font-size:${u(36)};color:#0F1419;">${esc(c.portraitName)}</div>
          <div style="font-family:'Figtree';font-weight:500;font-size:${u(27)};color:#65717D;margin-top:${u(3)};">${esc(c.portraitCred)}</div>
        </div>
      </div>
      <div style="font-family:'Figtree';font-weight:800;line-height:1.22;text-wrap:balance;font-size:${u(60)};letter-spacing:-0.6px;color:#0F1419;margin-top:${u(34)};">${esc(c.h.lead)} ${esc(c.h.accent)}</div>
      <div style="font-family:'Figtree';font-weight:500;font-size:${u(35)};line-height:1.5;color:#3E4B57;margin-top:${u(28)};">${esc(c.sub)}</div>
      <div style="font-family:'Figtree';font-size:${u(35)};line-height:1.45;color:#0F1419;margin-top:${u(26)};">
        <span style="font-weight:500;">${esc(c.offerLine.lead)}</span><span style="font-weight:800;">${esc(c.offerLine.bold)}</span><span style="font-weight:500;">${esc(c.offerLine.tail)}</span></div>`,
    footerHtml: `<div style="position:absolute;left:0;right:0;bottom:0;height:${u(foot)};background:${NAVY};display:flex;align-items:center;justify-content:space-between;padding:0 ${u(52)};">
        <span style="background:${TEAL};color:${NAVY};font-family:'Syne';font-weight:700;font-size:${u(34)};padding:${u(20)} ${u(42)};border-radius:999px;white-space:nowrap;">${esc(c.button)} ${arrow}</span>
        <img src="${asset('logo_white.png')}" style="height:${u(46)};width:auto;"></div>`,
  };
}


// H - clinician split. Modelled on Psychiatry Redefined's "Scholarships Available".
// The photo is a real image with a subject in it, so two things drive the layout:
//   - The type column sits on the side the subject ISN'T, per c.textSide.
//   - A scrim fades from the type side across the photo rather than a hard edge, so
//     the headline always has something to sit on even where the photo is busy.
// On 9:16 the split goes horizontal instead: a 1080-wide source upscales 1.27x for a
// full-width band but 1.5x for a half-width column, and the face is the first thing
// to soften. Portrait sources are ~848x1264.
function H_splitphoto(c, size) {
  const left = c.textSide === 'left';
  const img = asset(c.photoFile);
  const edge = left ? 'right' : 'left';
  // Side split at every size, including 9:16. A full-width horizontal band was tried
  // there to limit upscaling, and it was worse: the sources are 2:3 portraits and a
  // 1080x806 band crops them to an extreme close-up of the eyes and nose. A narrow
  // tall column crops to shoulders instead, which is what a portrait should do. The
  // ~1.5x upscale that costs is the cheaper defect.
  return {
    bg: LACC, color: NAVY, pad: 74,
    pattern: `<div style="position:absolute;top:0;bottom:0;${edge}:0;width:56%;background:url('${img}') center 30%/cover no-repeat;"></div>
       <div style="position:absolute;top:0;bottom:0;${edge}:0;width:56%;background:linear-gradient(to ${left ? 'left' : 'right'}, rgba(238,255,255,0) 38%, ${LACC} 96%);"></div>`,
    stageStyle: `top:0;bottom:0;${left ? 'left' : 'right'}:0;width:52%;`,
    body: `
      <img src="${asset('logo_color.png')}" style="height:${u(50)};width:auto;align-self:flex-start;">
      <div data-fit-line style="font-family:'Outfit';font-weight:600;letter-spacing:0.13em;font-size:${u(22)};margin-top:${u(30)};white-space:nowrap;">${esc(c.eyebrow)}</div>
      <div style="font-family:'Syne';font-weight:800;line-height:1.06;text-wrap:balance;font-size:${u(52)};letter-spacing:-0.5px;margin-top:${u(18)};text-transform:uppercase;" data-fit-wrap>${esc(c.h.lead)} <span style="color:${TEAL};">${esc(c.h.accent)}</span></div>
      <div style="font-family:'Figtree';font-weight:500;font-size:${u(28)};line-height:1.42;color:${SUB_LIGHT};margin-top:${u(22)};">${esc(c.sub)}</div>
      <div style="font-family:'Figtree';font-size:${u(28)};line-height:1.4;margin-top:${u(26)};"><b style="font-weight:800;">${esc(c.button)}</b><br>${esc(c.strip)}</div>`,
  };
}

const RENDERERS = { A: A_offerstack, B: B_quotecard, C: C_bigquestion, D: D_statement, E: E_quotecard_photo, F: F_speakercard, G: G_nativepost, H: H_splitphoto };

// Deep-fills every {{TOKEN}} in a concept block.
function filled(block, lane) {
  const walk = (v) => Array.isArray(v) ? v.map(walk)
    : (v && typeof v === 'object') ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]))
    : typeof v === 'string' ? fill(v, lane) : v;
  return walk(block);
}

function document_(spec, size) {
  const footer = spec.footer ? u(spec.footer) : '0px';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
#frame{--u:${size.s}px;width:${size.w}px;height:${size.h}px;background:${spec.bg};position:relative;overflow:hidden;font-family:'Figtree',sans-serif;color:${spec.color};}
#stage{position:absolute;${spec.stageStyle || `top:0;left:0;right:0;bottom:${footer};`}padding:${u(spec.pad)};display:flex;flex-direction:column;justify-content:center;}
#content{display:flex;flex-direction:column;min-width:0;}
${FONTCSS}
</style></head><body>
<div id="frame">${spec.pattern || ''}<div id="stage"><div id="content">${spec.body}</div></div>${spec.footerHtml || ''}</div>
</body></html>`;
}


// Asserts the artboard is actually WEARING the brand: real Syne/Outfit/Figtree, real
// logo, real pattern. Every one of these can fail without throwing and without
// changing the exit code, so each is checked explicitly.
const HEALTH = () => {
  const probe = (url) => new Promise((res) => {
    const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = url;
  });
  const bgUrls = Array.from(document.querySelectorAll('*'))
    .map((el) => getComputedStyle(el).backgroundImage)
    .filter((v) => v && v !== 'none')
    .map((v) => (v.match(/url\("?([^")]+)"?\)/) || [])[1])
    .filter(Boolean);
  return Promise.all(bgUrls.map(probe)).then((bg) => ({
    images: Array.from(document.images).map((i) => ({ src: i.currentSrc || i.src, ok: i.naturalWidth > 0 })),
    backgrounds: bgUrls.map((u, i) => ({ src: u, ok: bg[i] })),
    // Check the faces this artboard ACTUALLY asks for, at the weight and size it
    // asks for them. Asserting all three families were applied was wrong: concept G
    // uses no Outfit by design, so a correct render failed the check. A gate that
    // fires on a correct render gets switched off.
    fonts: (() => {
      const want = new Map();
      for (const el of document.querySelectorAll('*')) {
        if (!el.textContent.trim()) continue;
        const cs = getComputedStyle(el);
        const fam = cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        if (!['Syne', 'Outfit', 'Figtree'].includes(fam)) continue;
        want.set(`${cs.fontWeight} ${Math.round(parseFloat(cs.fontSize))}px ${fam}`, fam);
      }
      return [...want.keys()].map((spec) => ({ spec, ok: document.fonts.check(spec) }));
    })(),
  }));
};

function assertHealthy(h, label) {
  const bad = [];
  for (const i of h.images) if (!i.ok) bad.push(`image did not load: ${i.src}`);
  for (const b of h.backgrounds) if (!b.ok) bad.push(`background did not load: ${b.src}`);
  for (const f of h.fonts) if (!f.ok) bad.push(`font not applied: ${f.spec}`);
  if (!h.fonts.length) bad.push('no brand typeface used anywhere on the artboard');
  if (!h.images.length) bad.push('no <img> on the artboard, expected the logo');
  if (bad.length) throw new Error(`${label} rendered unbranded:\n  ` + bad.join('\n  '));
}

// In-page fit. Returns what it actually had to do, so the caller can report it
// rather than assume the artboard fit.
const FIT = () => {
  const frame = document.getElementById('frame');
  const stage = document.getElementById('stage');
  const content = document.getElementById('content');
  const report = { shrunkLines: [], u0: parseFloat(getComputedStyle(frame).getPropertyValue('--u')), u1: null, overflow: false };

  // 1a. wrapped blocks: shrink until the longest word fits the column. Without this
  // a narrow column either overflows or, with overflow-wrap:break-word, hyphenates a
  // headline mid-word - "STILL PRESCR / IBING FOR" shipped that way once.
  for (const el of document.querySelectorAll('[data-fit-wrap]')) {
    const base = parseFloat(getComputedStyle(el).fontSize);
    let f = base;
    while (el.scrollWidth > el.clientWidth + 1 && f > base * 0.6) {
      f -= base * 0.02;
      el.style.fontSize = f + 'px';
    }
    if (f < base - 0.01) report.shrunkLines.push({ text: el.textContent.trim().slice(0, 28), pct: Math.round(f / base * 100) });
  }

  // 1b. single-line items shrink to their own width before anything global moves.
  for (const el of document.querySelectorAll('[data-fit-line]')) {
    const base = parseFloat(getComputedStyle(el).fontSize);
    let f = base;
    while (el.scrollWidth > el.clientWidth + 1 && f > base * 0.55) {
      f -= base * 0.02;
      el.style.fontSize = f + 'px';
    }
    if (f < base - 0.01) report.shrunkLines.push({ text: el.textContent.trim().slice(0, 40), pct: Math.round(f / base * 100) });
  }

  // 2. global type scale shrinks until the column fits the padded box.
  const avail = () => {
    const cs = getComputedStyle(stage);
    return stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  };
  let u = report.u0;
  let guard = 0;
  while (content.getBoundingClientRect().height > avail() + 1 && guard++ < 120) {
    u *= 0.985;
    frame.style.setProperty('--u', u + 'px');
  }
  report.u1 = u;
  report.overflow = content.getBoundingClientRect().height > avail() + 1;
  report.widthOverflow = content.scrollWidth > content.clientWidth + 1;
  return report;
};


// Chromium resolution. A pinned playwright package and a preinstalled browser
// directory drift apart constantly (the package wants build N, the image ships
// build M), and the failure is an opaque "Executable doesn't exist". Try the
// normal path first, then fall back to whatever chromium the image actually has.
async function launchChromium() {
  try {
    return await chromium.launch();
  } catch (err) {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
    if (!base || !fs.existsSync(base)) throw err;
    const cand = fs.readdirSync(base)
      .filter((d) => d.startsWith('chromium-'))
      .map((d) => path.join(base, d, 'chrome-linux', 'chrome'))
      .filter((f) => fs.existsSync(f));
    if (!cand.length) throw err;
    console.log(`playwright chromium missing, using ${cand[0]}`);
    return await chromium.launch({ executablePath: cand[0] });
  }
}

(async () => {
  const argv = process.argv.slice(2);
  const pick = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : null; };
  const onlyAud = pick('--audience'), onlyCon = pick('--concept');

  const auds = AUDIENCES.filter((a) => !onlyAud || a.key === onlyAud);
  const cons = CONCEPTS.filter((c) => !onlyCon || c.key === onlyCon);
  if (!auds.length) throw new Error(`no audience matching ${onlyAud}`);
  if (!cons.length) throw new Error(`no concept matching ${onlyCon}`);

  const browser = await launchChromium();
  const ctx = await browser.newContext({ deviceScaleFactor: 1 });
  let n = 0; const notes = [];

  for (const aud of auds) {
    const dir = path.join(OUT, aud.key);
    fs.mkdirSync(dir, { recursive: true });
    for (const con of cons) {
      const block = filled(aud[con.key], aud);
      for (const size of SIZES) {
        const page = await ctx.newPage();
        await page.setViewportSize({ width: size.w, height: size.h });
        // MUST be a real file:// document, not setContent. Under setContent the page
        // origin is about:blank and Chromium refuses every file:// subresource, so the
        // logos, the pattern and all three @font-face files fail silently and the
        // artboard renders in a fallback serif with broken-image glyphs. It still
        // screenshots cleanly, which is exactly what makes it dangerous.
        const tmp = path.join(ROOT, `.render-tmp-${aud.key}-${con.slug}-${size.key}.html`);
        fs.writeFileSync(tmp, document_(RENDERERS[con.key](block, size), size));
        try {
          await page.goto('file://' + tmp, { waitUntil: 'load' });
          await page.evaluate(async () => { try { await document.fonts.ready; } catch (e) {} });
          assertHealthy(await page.evaluate(HEALTH), path.basename(tmp));
          var fit = await page.evaluate(FIT);
        } finally { fs.unlinkSync(tmp); }
        await page.waitForTimeout(120);
        const file = path.join(dir, `${aud.key}__${con.slug}__${size.key}.png`);
        await page.screenshot({ path: file });
        await page.close();
        n++;
        const scale = Math.round(fit.u1 / fit.u0 * 100);
        if (fit.overflow || fit.widthOverflow) notes.push(`OVERFLOW ${path.basename(file)}`);
        if (scale < 100 || fit.shrunkLines.length) {
          notes.push(`fit ${path.basename(file)}: block ${scale}%` +
            (fit.shrunkLines.length ? `, lines ${fit.shrunkLines.map((l) => `"${l.text}" ${l.pct}%`).join('; ')}` : ''));
        }
      }
    }
  }
  await browser.close();

  // A job that exits 0 states what it DID.
  console.log(`rendered ${n} PNG(s) into ${OUT}`);
  for (const line of notes) console.log('  ' + line);
  const bad = notes.filter((l) => l.startsWith('OVERFLOW'));
  if (bad.length) { console.error(`${bad.length} artboard(s) still overflow after fit`); process.exit(1); }
  if (n === 0) { console.error('rendered nothing'); process.exit(1); }
})();
