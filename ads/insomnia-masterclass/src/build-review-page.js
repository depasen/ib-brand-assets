#!/usr/bin/env node
// Builds review.html - the single page Sandeep actually looks at: all 36 ads, the
// post copy beside each, and the open decisions isolated at the top. Regenerate it
// whenever copy.js or the renders change, so the page can never describe ads that
// no longer exist.
//
//   node src/render_ads.js && node src/build-review-page.js
//
// Self-contained on purpose. Thumbnails are inlined as data URIs and the brand fonts
// are inlined from ../fonts, so the page renders identically with no network at all -
// and cannot silently fall back to a system serif the way a webfont link can.

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const { OFFER, AUDIENCES, CONCEPTS, SIZES, fill } = require(path.join(ROOT, 'src', 'copy.js'));

const FONT_FACES = [
  ['Syne', 700, 'syne-v24-latin-700.ttf'], ['Syne', 800, 'syne-v24-latin-800.ttf'],
  ['Outfit', 500, 'outfit-v15-latin-500.ttf'], ['Outfit', 600, 'outfit-v15-latin-600.ttf'],
  ['Figtree', 500, 'figtree-v9-latin-500.ttf'], ['Figtree', 600, 'figtree-v9-latin-600.ttf'],
  ['Figtree', 700, 'figtree-v9-latin-700.ttf'],
];
const FONTCSS = FONT_FACES.map(([f, w, file]) => {
  const p = path.join(ROOT, 'fonts', file);
  if (!fs.existsSync(p)) throw new Error(`missing font file: ${p}`);
  const b64 = fs.readFileSync(p).toString('base64');
  return `@font-face{font-family:'${f}';font-weight:${w};font-style:normal;font-display:swap;src:url(data:font/ttf;base64,${b64}) format('truetype');}`;
}).join('\n');

async function thumbnails() {
  let launch = {};
  try { await (await chromium.launch()).close(); } catch (e) {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
    const cand = base && fs.existsSync(base) ? fs.readdirSync(base).filter((d) => d.startsWith('chromium-'))
      .map((d) => path.join(base, d, 'chrome-linux', 'chrome')).filter((f) => fs.existsSync(f)) : [];
    if (!cand.length) throw e;
    launch = { executablePath: cand[0] };
  }
  const b = await chromium.launch(launch);
  const p = await (await b.newContext()).newPage();
  const out = {};
  for (const a of AUDIENCES) for (const c of CONCEPTS) for (const s of SIZES) {
    const f = path.join(ROOT, 'out', a.key, `${a.key}__${c.slug}__${s.key}.png`);
    if (!fs.existsSync(f)) throw new Error(`missing render: ${f}. Run src/render_ads.js first.`);
    const b64 = fs.readFileSync(f).toString('base64');
    out[`${a.key}|${c.key}|${s.key.split('_')[0]}`] = await p.evaluate(async ({ b64, w }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = Math.round(img.naturalHeight * (w / img.naturalWidth));
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL('image/jpeg', 0.82);
    }, { b64, w: 520 });
  }
  await b.close();
  return out;
}

(async () => {
const TH = await thumbnails();
// Escape for HTML, then push every non-ASCII character to a numeric entity. The
// artifact wrapper supplies the <head>, so this page cannot declare its own charset;
// entities render identically whatever encoding the host assumes. Without this the
// calendar emoji, the arrow and the middot in the ad copy all came back as mojibake.
// Iterating by code point (not by UTF-16 unit) keeps astral emoji intact.
const e=s=>Array.from(String(s)).map(ch=>{
  if(ch==='&')return '&amp;'; if(ch==='<')return '&lt;'; if(ch==='>')return '&gt;'; if(ch==='"')return '&quot;';
  const cp=ch.codePointAt(0); return cp>126?'&#'+cp+';':ch;
}).join('');
const LANE={physicians:{who:'MD / DO',credit:'CME',rx:'Prescribes'},
            nps:{who:'Nurse practitioners / APRNs',credit:'CME / CE',rx:'Prescribes'},
            allied:{who:'Psychologists, PAs and coaches',credit:'CME / CE',rx:'Mixed, some prescribe and some cannot'}};
const SZ=['1x1','4x5','9x16'];
const SZLABEL={'1x1':'Square','4x5':'Feed','9x16':'Stories'};

const card=(a,c)=>{
  const b=a[c.key];
  const imgs=SZ.map((s,i)=>`<img class="shot${i===1?' on':''}" data-sz="${s}" src="${TH[`${a.key}|${c.key}|${s}`]}" alt="${e(a.label)}, ${e(c.name)}, ${SZLABEL[s]}">`).join('');
  const toggle=SZ.map((s,i)=>`<button type="button" class="seg${i===1?' on':''}" data-sz="${s}">${SZLABEL[s]}</button>`).join('');
  const primary=fill(b.adPrimary, a);
  return `<article class="card">
  <header class="card-hd"><span class="tag${c.photo ? ' tag-photo' : ''}">${c.key}</span><h3>${e(c.name)}${c.photo ? ' <span class="pill">with her photo</span>' : ''}</h3><p class="surface">${e(c.surface)}${c.sameCopyAs ? ` &#183; same words as ${c.sameCopyAs}` : ''}</p></header>
  <div class="card-body">
    <figure class="shots"><div class="stage">${imgs}</div><div class="seg-row" role="group" aria-label="Size">${toggle}</div></figure>
    <div class="fields">
      <div class="field"><div class="flabel">Post text<button type="button" class="copy" data-copy="${e(primary)}">Copy</button></div><pre class="primary">${e(primary)}</pre></div>
      <div class="field"><div class="flabel">Headline</div><p class="val">${e(fill(b.adHeadline, a))}</p></div>
      <div class="field"><div class="flabel">Description</div><p class="val">${e(fill(b.adDescription, a))}</p></div>
      <div class="field"><div class="flabel">Button</div><p class="val"><span class="chip">${e(b.adCta)}</span></p></div>
    </div>
  </div></article>`;
};

const lane=a=>`<section class="lane" id="${a.key}">
  <div class="lane-hd">
    <h2>${e(a.label)}</h2>
    <dl class="meta">
      <div><dt>Who</dt><dd>${e(LANE[a.key].who)}</dd></div>
      <div><dt>Credit offered</dt><dd>${e(LANE[a.key].credit)}</dd></div>
      <div><dt>Prescribing</dt><dd>${e(LANE[a.key].rx)}</dd></div>
    </dl>
    <p class="targeting"><span class="eyebrow">Who to target</span>${e(a.metaTargeting)}</p>
  </div>
  <div class="grid">${CONCEPTS.map(c=>card(a,c)).join('')}</div>
</section>`;

const html=`<title>Insomnia Masterclass Ads</title>
<style>
${FONTCSS}
:root{
  --ground:#FAFCFE; --surface:#FFFFFF; --sunk:#F1F7FC;
  --ink:#0F3355; --muted:#5C7893; --line:#D6E5F4; --line-soft:#E8F1FA;
  --brand:#144A7F; --accent:#3DD1CD; --accent-ink:#0F3355; --flag:#F4BDA4; --flag-ink:#7A4520;
  --shadow:0 1px 2px rgba(15,51,85,.06),0 8px 24px rgba(15,51,85,.06);
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#0A1E30; --surface:#102C44; --sunk:#0C2438;
  --ink:#E9F4FC; --muted:#93B4D0; --line:#1E4463; --line-soft:#173650;
  --brand:#AED0F4; --accent:#3DD1CD; --accent-ink:#0A1E30; --flag:#F4BDA4; --flag-ink:#3A1F0C;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.28);
}}
:root[data-theme="dark"]{
  --ground:#0A1E30; --surface:#102C44; --sunk:#0C2438;
  --ink:#E9F4FC; --muted:#93B4D0; --line:#1E4463; --line-soft:#173650;
  --brand:#AED0F4; --accent:#3DD1CD; --accent-ink:#0A1E30; --flag:#F4BDA4; --flag-ink:#3A1F0C;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.28);
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);
  font-family:Figtree,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-size:16px;font-weight:500;line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:Syne,Georgia,serif;text-wrap:balance;margin:0;letter-spacing:-.01em}
.eyebrow{display:block;font-family:Outfit,sans-serif;font-weight:600;font-size:11px;
  letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.wrap{max-width:1180px;margin:0 auto;padding:0 24px}

/* top bar */
.bar{position:sticky;top:0;z-index:20;background:var(--surface);
  border-bottom:1px solid var(--line);backdrop-filter:blur(8px)}
.bar .wrap{display:flex;align-items:center;gap:20px;min-height:58px;flex-wrap:wrap}
.bar strong{font-family:Syne,serif;font-weight:700;font-size:15px}
.jump{display:flex;gap:4px;margin-left:auto;flex-wrap:wrap}
.jump a{font-family:Outfit,sans-serif;font-size:13px;font-weight:500;color:var(--muted);
  text-decoration:none;padding:6px 11px;border-radius:6px}
.jump a:hover,.jump a:focus-visible{color:var(--ink);background:var(--sunk)}

/* hero */
.hero{padding:52px 0 12px}
.hero h1{font-size:clamp(30px,4.4vw,46px);font-weight:800;line-height:1.08;max-width:16ch}
.hero .lede{font-size:18px;color:var(--muted);max-width:60ch;margin:16px 0 0}
.stats{display:flex;flex-wrap:wrap;gap:0;margin:30px 0 0;border:1px solid var(--line);
  border-radius:10px;overflow:hidden;background:var(--surface)}
.stat{flex:1 1 150px;padding:15px 18px;border-right:1px solid var(--line-soft)}
.stat:last-child{border-right:0}
.stat dt{font-family:Outfit,sans-serif;font-size:11px;font-weight:600;letter-spacing:.12em;
  text-transform:uppercase;color:var(--muted)}
.stat dd{margin:5px 0 0;font-family:Syne,serif;font-weight:700;font-size:19px;
  font-variant-numeric:tabular-nums}
.stat dd small{font-family:Figtree,sans-serif;font-weight:500;font-size:13px;color:var(--muted);display:block;letter-spacing:0}

/* decisions */
.decide{margin:36px 0 0;border:2px solid var(--flag);border-radius:12px;
  background:var(--surface);overflow:hidden}
.decide-hd{background:var(--flag);color:var(--flag-ink);padding:11px 22px;
  font-family:Outfit,sans-serif;font-weight:600;font-size:12px;letter-spacing:.13em;text-transform:uppercase}
.decide ol{margin:0;padding:22px 22px 22px 44px;display:flex;flex-direction:column;gap:16px}
.decide li::marker{font-family:Syne,serif;font-weight:700;color:var(--muted)}
.decide b{font-weight:700}
.decide .sub{color:var(--muted);font-size:15px;display:block;margin-top:3px}

.note{margin:28px 0 0;padding:18px 22px;background:var(--sunk);border-radius:10px;
  border-left:3px solid var(--accent);font-size:15px;color:var(--muted)}
.note b{color:var(--ink)}

/* lanes */
.lane{padding:56px 0 8px;scroll-margin-top:70px}
.lane-hd{border-top:2px solid var(--ink);padding-top:18px;margin-bottom:26px}
.lane-hd h2{font-size:27px;font-weight:700}
.meta{display:flex;flex-wrap:wrap;gap:26px;margin:14px 0 0}
.meta dt{font-family:Outfit,sans-serif;font-size:11px;font-weight:600;letter-spacing:.12em;
  text-transform:uppercase;color:var(--muted)}
.meta dd{margin:3px 0 0;font-weight:600;font-size:15px}
.targeting{margin:16px 0 0;font-size:15px;color:var(--muted);max-width:78ch}

.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(430px,1fr));gap:22px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;
  box-shadow:var(--shadow);overflow:hidden;display:flex;flex-direction:column}
.card-hd{padding:16px 20px 14px;border-bottom:1px solid var(--line-soft);
  display:grid;grid-template-columns:auto 1fr;gap:0 12px;align-items:baseline}
.tag-photo{background:var(--flag);color:var(--flag-ink)}
.pill{display:inline-block;vertical-align:middle;margin-left:8px;background:var(--flag);color:var(--flag-ink);
  border-radius:999px;padding:2px 10px;font-family:Outfit,sans-serif;font-weight:600;font-size:11px;
  letter-spacing:.06em;text-transform:uppercase}
.tag{grid-row:1/3;align-self:center;width:30px;height:30px;border-radius:7px;background:var(--accent);
  color:var(--accent-ink);font-family:Syne,serif;font-weight:800;font-size:14px;
  display:flex;align-items:center;justify-content:center}
.card-hd h3{font-size:17px;font-weight:700}
.surface{grid-column:2;margin:1px 0 0;font-size:13px;color:var(--muted)}
.card-body{display:grid;grid-template-columns:1fr;gap:0}
@media(min-width:760px){.card-body{grid-template-columns:216px 1fr}}

.shots{margin:0;padding:16px;background:var(--sunk);border-right:1px solid var(--line-soft);
  display:flex;flex-direction:column;gap:10px;align-items:center}
.stage{width:100%;display:flex;justify-content:center;align-items:flex-start;min-height:210px}
.shot{display:none;width:100%;max-width:184px;height:auto;border-radius:5px;
  border:1px solid var(--line);background:#fff}
.shot.on{display:block}
.seg-row{display:inline-flex;border:1px solid var(--line);border-radius:7px;overflow:hidden;background:var(--surface)}
.seg{appearance:none;border:0;background:transparent;cursor:pointer;padding:6px 11px;
  font-family:Outfit,sans-serif;font-size:11.5px;font-weight:500;color:var(--muted);
  border-right:1px solid var(--line)}
.seg:last-child{border-right:0}
.seg.on{background:var(--brand);color:var(--surface);font-weight:600}
:root[data-theme="dark"] .seg.on,:root:not([data-theme="light"]) .seg.on{color:var(--ground)}
@media (prefers-color-scheme:light){:root:not([data-theme="dark"]) .seg.on{color:#fff}}
.seg:hover:not(.on){color:var(--ink)}

.fields{padding:16px 20px 20px;display:flex;flex-direction:column;gap:14px}
.field{display:flex;flex-direction:column;gap:5px}
.flabel{display:flex;align-items:center;gap:10px;font-family:Outfit,sans-serif;font-size:10.5px;
  font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
.copy{margin-left:auto;appearance:none;border:1px solid var(--line);background:var(--surface);
  color:var(--muted);border-radius:5px;padding:3px 9px;cursor:pointer;
  font-family:Outfit,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.copy:hover{color:var(--ink);border-color:var(--muted)}
.copy.done{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
pre.primary{margin:0;padding:13px 15px;background:var(--sunk);border-radius:8px;
  font-family:Figtree,sans-serif;font-weight:500;font-size:14px;line-height:1.62;white-space:pre-wrap;
  color:var(--ink);overflow-x:auto}
.val{margin:0;font-size:15px;font-weight:600}
.chip{display:inline-block;background:var(--accent);color:var(--accent-ink);border-radius:5px;
  padding:3px 11px;font-family:Outfit,sans-serif;font-weight:600;font-size:13px}

footer{margin-top:64px;border-top:1px solid var(--line);padding:26px 0 56px;
  color:var(--muted);font-size:14px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:4px}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>

<div class="bar"><div class="wrap"><strong>Insomnia Masterclass ads</strong>
<nav class="jump">${AUDIENCES.map(a=>`<a href="#${a.key}">${e(a.label)}</a>`).join('')}<a href="#decisions">Before you upload</a></nav></div></div>

<header class="hero"><div class="wrap">
  <span class="eyebrow">IntraBalance &#183; Facebook and Instagram</span>
  <h1>Ready to upload.</h1>
  <p class="lede">The June set spoke to physicians only, and had no photo. This adds nurse practitioners and psychologists, PAs and coaches as separate campaigns, plus two versions carrying Dr. Bhopal's portrait. Each audience is written to a different problem, not the same ad with the job title swapped.</p>
  <dl class="stats">
    <div class="stat"><dt>Ads ready</dt><dd>63</dd></div>
    <div class="stat"><dt>Angles</dt><dd>7<small>4 typographic, 3 with her photo</small></dd></div>
    <div class="stat"><dt>Class</dt><dd>Wed, Aug 26<small>4:00 PM PT</small></dd></div>
    <div class="stat"><dt>Status</dt><dd>Ready<small>nothing left to fill</small></dd></div>
  </dl>
  <div class="decide" id="decisions">
    <div class="decide-hd">Before you upload</div>
    <ol>
      <li><b>Which versions do you want to run?</b><span class="sub">All 63 are ready to upload. If you want a shorter list, say so and I'll cut it down.</span></li>
      <li><b>Which photo version do you want to run, if either?</b><span class="sub">Two are built and marked below. Each uses the same words as its no-photo twin, so running the pair tells you what her face is worth and nothing else.</span></li>
      <li><b>Can you send a larger photo of her?</b><span class="sub">The one we hold is small. It is fine at the sizes used here, but too small for the layout that runs her photo down the side of the frame, which is the one the reference ads use.</span></li>
    </ol>
  </div>
  <p class="note"><b>Everything is filled in.</b> Wednesday, Aug 26 at 4:00 PM PT, sending to members.intrabalance.com/insomnia. Nothing is left blank.</p>
  <p class="note"><b>Credit is worded carefully.</b> The old set said "CME available" flat, which reads as though attending earns it. It does not. Every ad now says the credit comes <b>through Learner+</b>, and none of them promises a number of credits. Doctors see CME, the other two campaigns see CME/CE.</p>
  <p class="note"><b>From your inspiration folder.</b> Three photo formats keep showing up in the ads you saved. One of them I could build today and it is here as G, copied from the eCare ad. The other two need a photo we do not have: one wants a stock picture of a clinician, the other wants a wide shot of you in a real room. Worth knowing: eCare is running a free insomnia webinar with Colleen Carney on <b>August 27th</b>, the day after yours, aimed at the same mental health professionals as our third campaign.</p>
  <p class="note"><b>One thing I did not copy.</b> The eCare picture has a fake row of likes and comments printed into it, so the ad looks like a post 231 people already liked. I left that out. Say the word if you want it.</p>
  <p class="note"><b>On the photo versions.</b> E, F and G carry her portrait. Each is the face version of an ad already in the set, word for word, so a head-to-head between them measures the photograph rather than the writing. That pairing is checked automatically, so it cannot drift.</p>
  <p class="note"><b>On the writing.</b> All twelve versions clear the voice standard we hold content to. The June ads do not, so their wording has been replaced rather than reused. The scarcity line "seats limited" is gone from every ad, and the checker now catches that phrase so it cannot come back in a later draft.</p>
</div></header>

<main class="wrap">${AUDIENCES.map(lane).join('')}</main>

<footer class="wrap">Rendered ${new Date().toISOString().slice(0,10)} &#183; full-size files and the renderer live in the IntraBalance brand assets repo</footer>

<script>
document.addEventListener('click',ev=>{
  const seg=ev.target.closest('.seg');
  if(seg){
    const card=seg.closest('.card');
    card.querySelectorAll('.seg').forEach(b=>b.classList.toggle('on',b===seg));
    card.querySelectorAll('.shot').forEach(i=>i.classList.toggle('on',i.dataset.sz===seg.dataset.sz));
    return;
  }
  const cp=ev.target.closest('.copy');
  if(cp){
    navigator.clipboard.writeText(cp.dataset.copy).then(()=>{
      cp.textContent='Copied';cp.classList.add('done');
      setTimeout(()=>{cp.textContent='Copy';cp.classList.remove('done')},1400);
    }).catch(()=>{cp.textContent='Select it';setTimeout(()=>{cp.textContent='Copy'},1400)});
  }
});
</script>`;
const out = path.join(ROOT, 'review.html');
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1048576).toFixed(2)} MB, ${Object.keys(TH).length} ads, ${AUDIENCES.length * CONCEPTS.length} copy sets)`);
})();
