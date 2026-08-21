# IntraBalance — Insomnia Masterclass ads (IB)

Facebook and Instagram ads for the free Insomnia Masterclass, built for **three
clinician audiences**: physicians, nurse practitioners, and psychologists / PAs /
coaches.

**36 ads: 3 audiences × 4 concepts × 3 sizes.** Copy, renderer and rendered PNGs
all live here.

```
COPY.md                 every ad's copy, generated - review this one
src/copy.js             THE source of truth. All copy lives here and nowhere else
src/render_ads.js       HTML -> PNG renderer (Playwright + Chromium)
src/build-copy-md.js    regenerates COPY.md from copy.js
src/verify.js           pre-launch gate. Run before handing anything to Sandeep
brand/                  logos + signature pattern
fonts/                  Syne, Outfit, Figtree (the actual brand fonts)
out/<audience>/         the rendered PNGs
```

## Quick start

```bash
npm install
node src/render_ads.js      # all 36
node src/build-copy-md.js   # regenerate COPY.md
node src/verify.js          # gate: renders, voice, scope of practice, credit claims
```

Or `npm run build` for all three. Every script resolves its own location, so it
runs from anywhere.

Render one lane or one concept while iterating:

```bash
node src/render_ads.js --audience allied
node src/render_ads.js --concept B
```

## The three audiences

They are three ad sets, not one ad set with the noun swapped. The pain is
genuinely different and the copy follows it.

| Lane | Who | Credit line | Prescribes? | The angle |
|---|---|---|---|---|
| `physicians` | MD / DO | CME | yes | The prescription pad is the hook |
| `nps` | NP / APRN | CME/CE | yes | Longest visit, told first, same short list of options |
| `allied` | Psychologists, PAs, coaches | CME/CE | **mixed** | The referral. Sleep reaches them after the handout and the pill failed |

**The allied lane has a hard constraint.** PAs prescribe; psychologists and coaches
do not. Coaches have neither patients nor a licence to diagnose. So no line in that
lane may hinge on writing a script, and the words *patients*, *clients*, *diagnose*
and *treat* are all out of it — "clients" because `VOICE-GUIDE.md` §4 bans it in her
voice, the rest because they are outside a coach's scope. `src/verify.js` enforces
this mechanically; it is not left to whoever edits next remembering.

## The copy rules that shaped this

1. **Sell the problem and the promise. Never reveal the method.** No frameworks, no
   screener, no dosing, no CBT-I. The class delivers the how.
2. **No scarcity.** `VOICE-GUIDE.md` §9 bans "spots are limited" and every relative.
   The June kit carried "seats limited"; it is gone, and the phrase is now on the
   `voice_check.py` banned list so it cannot come back through a different draft.
3. **Her connector is the ellipsis or a comma, not the em-dash.** Her own clinician
   page: "help your patients sleep better...without reaching for your prescription
   pad." Two-beat corrections take a comma.
4. **Never blame other clinicians** (`VOICE-GUIDE.md` §8). Every lane frames the gap
   as curriculum, not competence: "That is not a gap in you. It's a gap in the
   curriculum."

All 12 primary texts pass `nishi-content-engine/voice_check.py` and grade 97.5–99.9%
on `voice_score.py`, against a 95 threshold. The June physician copy graded 81.5%
and failed the gate outright on em-dash rate.

## Verified facts behind the copy

| Claim | Source |
|---|---|
| Wednesday, Aug 26 | 2026-08-26 is genuinely a Wednesday |
| "Harvard-trained" | 12+ corpus hits across her own IB and ES marketing |
| "Board certified in psychiatry and sleep medicine" | `VOICE-GUIDE.md` §4 formal string, 20 corpus hits |
| The audience really is this mixed | Her own words on a CSK call: "sleep coaches, sleep psychologists… the psychiatrist, the primary care doctors, nurse practitioners… we even have chiropractors" |
| CME/CE for non-physicians | Credit runs through Learner+ (reflection-based). Corpus phrasing for mixed audiences is "CME/CE" — "earn CME/CE credits", "12 CE / CME Credits" |

## Sizes and placements

| Size | Pixels | Placement |
|---|---|---|
| 4:5 | 1080×1350 | Facebook & Instagram Feed — **primary, start here** |
| 1:1 | 1080×1080 | Feed alt / universal |
| 9:16 | 1080×1920 | Stories & Reels (FB + IG) |

## Campaign setup (Meta Ads Manager)

- **Objective:** Leads, with the pixel firing CompleteRegistration on the thank-you
  page. Traffic only if the pixel is not wired.
- **Three ad sets, one per lane.** Targeting for each is in `COPY.md`.
- **Placements:** Advantage+ (uses all three sizes) or manual Feeds + Stories/Reels.
- **CTA button:** Sign Up. **Destination:** the masterclass opt-in page.
- **Test plan:** run all four concepts in each lane. Cut losers after ~50
  registrations or 3–4 days. Scale on lowest cost per registration. Compare lanes
  before concepts — a whole lane underperforming is a targeting answer, not a
  creative one.
- **Compliance:** no "cure" and no guarantees. No first-person-affliction framing
  ("do you struggle to sleep") — these target clinicians about the people they care
  for. Only claim the credit that the landing page actually offers each profession.

## Still open

1. **Two launch blanks.** `OFFER.time` and `OFFER.regUrl` in `src/copy.js` are
   placeholders. Fill them, re-render, and `verify.js` will stop saying
   "NOT launch-ready".
2. **Credit wording per profession.** Physicians get CME. The other two lanes say
   CME/CE, which matches how the corpus describes Learner+ credit. Coaches may
   qualify for neither, which is why credit is never the lead promise in that lane.
   This must match the landing page before launch.
3. **Photo cuts (face vs no-face A/B).** Still not built. The only headshot of
   Dr. Bhopal in this repo, `ib-headshot-nishi-bhopal-md-hhh8l.jpg`, is **400×400** —
   enough for a circular headshot in the quote card at 1:1, not enough for the split
   layout, which needs roughly 490×1350 on the 4:5. A ≥1200px headshot on a light
   background unblocks both layouts.
4. **1.91:1 (1200×628)** for link and right-column placements is not rendered. The
   four concepts are vertically-centred columns; at 628px tall they need a genuine
   horizontal layout, not a scale factor.

## How the renderer avoids the two failures that already bit it

**`file://` subresources.** The page must be loaded with `page.goto('file://…')`, not
`setContent`. Under `setContent` the document origin is `about:blank` and Chromium
refuses every `file://` subresource, so the logo, the pattern and all three fonts fail
silently. The artboard still screenshots cleanly, in a fallback serif with
broken-image glyphs. `assertHealthy()` now fails the run if any image, background or
font did not actually apply.

**Copy that outgrew its box.** The June renderer used a per-size scale factor tuned by
eye against one audience's copy. "For Psychologists, PAs & Coaches" is more than twice
the length of "For Physicians". Every dimension is now `calc(var(--u) * N)`, so an
in-page fit pass shrinks single-line items to their own width and the whole column to
the artboard, and the run **reports what it had to shrink** instead of assuming it fit.
