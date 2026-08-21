# IntraBalance — Insomnia Masterclass ads (IB)

Facebook and Instagram ads for the free Insomnia Masterclass, built for **three
clinician audiences**: physicians, nurse practitioners, and psychologists / PAs /
coaches.

**72 ads: 3 audiences × 8 concepts × 3 sizes.** Four are typographic, three carry
Dr. Bhopal's portrait, and one carries a clinician photograph. Copy, renderer and rendered PNGs all
live here.

```
COPY.md                 every ad's copy, generated - review this one
src/copy.js             THE source of truth. All copy lives here and nowhere else
src/render_ads.js       HTML -> PNG renderer (Playwright + Chromium)
src/build-copy-md.js    regenerates COPY.md from copy.js
src/verify.js           pre-launch gate. Run before handing anything to Sandeep
src/build-review-page.js  builds review.html - the page Sandeep looks at
brand/                  logos, signature pattern, bhopal.jpg (the portrait)
fonts/                  Syne, Outfit, Figtree (the actual brand fonts)
out/<audience>/         the rendered PNGs
review.html             generated, gitignored - all 36 ads plus copy on one page
```

## Quick start

```bash
npm install
node src/render_ads.js      # all 72
node src/build-copy-md.js   # regenerate COPY.md
node src/build-review-page.js  # rebuild the review page
node src/verify.js          # gate: renders, voice, scope of practice, credit claims
```

Or `npm run build` for all four. Every script resolves its own location, so it
runs from anywhere.

Render one lane or one concept while iterating:

```bash
node src/render_ads.js --audience allied
node src/render_ads.js --concept B
```

## The review page

`node src/build-review-page.js` writes `review.html`: every ad with its post copy
beside it, a size toggle per ad, and the open decisions isolated at the top. It is
self-contained — thumbnails and the brand fonts are inlined, so it renders with no
network and cannot fall back to a system serif.

Published (private) at
<https://claude.ai/code/artifact/c4a8c6b7-0f08-4e9b-8b55-e90250735e79>. Regenerate
and republish to that same URL whenever the copy changes; a new URL is a second
version of the truth.

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

## The clinician photographs

`brand/photo-physicians.png`, `photo-nps.png`, `photo-allied.png` drive concept H.
They were **generated on 2026-08-21** with `gemini-3-pro-image` via
`brand-content-images`, from the IntraBalance style written for that repo. They are
generic clinicians, deliberately: the reference ad this format copies uses a model,
not the instructor.

Two things follow from them being generated:

- **They are synthetic, and of nobody.** That is fine for a stock-style clinician and
  is the reason a photograph of Dr. Bhopal was never generated — a synthetic image of
  a real, named person is a different thing entirely and is not done here.
- **Check them before they run.** Generated images can carry small artefacts that
  survive a glance. Look at each at full size once.

## The photo cuts (E and F)

Two of the six concepts carry her portrait. Each is the **face version of an existing
concept, running that concept's exact words**, so an A/B between them measures the
photograph and nothing else:

| Photo cut | Same copy as | Look |
|---|---|---|
| E — Quote card with portrait | B | White ground, small portrait beside her name, navy CTA bar |
| F — Speaker card | A | Navy ground, large centred portrait above the headline |
| G — Native post | B | White card styled as a post, not an ad. Plain-sans headline, navy CTA bar |
| H — Clinician split | C | Full-bleed clinician photo one side, headline on a pale scrim |

B, E and G run the **same words in three treatments**, so that trio is a clean test of
presentation with copy held constant.

The pairing is enforced: `src/verify.js` fails if anyone edits E's or F's copy away
from its parent, because a contaminated A/B is worse than no A/B — it still returns a
number and the number means something else.

**The portrait is the constraint.** `brand/bhopal.jpg` is 400×400, but the circle sits
inset 25px on every side, so the real portrait is **350px across** and the outer 6.3%
is black matte. The renderer scales it 1.16× inside a circular mask to crop the matte;
without that there is a dark halo inside the ring, which is what the first render did.
350px is the ceiling: F draws it at 300px and that is about as large as it can go
before it softens.

## What the Ad Inspiration folder actually contains

18 phone screenshots of competitor ads in Dr. Bhopal's own feed
(Drive: "Ad Inspiration", owner drbhopal@intrabalance.com). Three photo formats
recur, and they need different assets:

| Format | Seen in | What it needs |
|---|---|---|
| **Native post** — circular headshot, byline, plain-sans headline, dark footer bar with a bright pill CTA | eCare Behavioral Health / Colleen Carney PhD | A small circular headshot. **Buildable now — this is concept G.** |
| **Split with a clinician photo** — full-bleed photo right, white scrim left, huge condensed hook, CTA as a text line | Psychiatry Redefined, "Scholarships Available" | A licensed stock photo of a clinician. The subject is a model, **not the instructor** |
| **Full-bleed environmental portrait + pull quote** — dark scrim, huge condensed all-caps quote, name and role beneath | MasterClass (Daniel Pink, Alison Wood Brooks) | A wide environmental photo of Dr. Bhopal, not a headshot |

**The competitor worth knowing about.** eCare Behavioral Health is running a free
6-hour Insomnia and CBT-I webinar with Colleen E. Carney PhD on **August 27th**, one
day after ours, targeting "licensed mental health professionals" — the same people as
our allied lane. 6 CE credits. Their hook is "Hot take: most clinicians are treating
chronic insomnia with advice built for healthy sleepers."

Two of the references also confirm choices already made here: Psychiatry Redefined
writes credit as "CE/CMEs" for a mixed audience, and the Rooted PMHNP webinar sells
NPs on exactly the training-gap framing this kit uses ("the foundations I wish had
been part of my NP training").

## A judgement call

The eCare creative bakes a **fake engagement row** into the image — reaction icons and
"Nina and 231 others · 67 comments" — so the ad looks like a post that has already
been liked 231 times. Concept G copies the layout and does **not** copy that. Invented
social proof presented as real is a different thing from a native-feeling layout, and
it is not a call to make silently. If it is wanted, it is Sandeep's to ask for.

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

## Credit: CME/CE through Learner+, and the wording matters

`OFFER.creditClaim` is `'on'`. Sandeep, 2026-08-21: *"They can get CME for the class
but it's not just given it's through learner plus."*

That makes the June kit's flat **"CME available" wrong in a way that matters** —
credit is not granted by attending it. Corpus, verbatim:

> Educational credits are provided through Learner+ which is a point of reflection
> learning platform. This means that whenever you learn something in the program, you
> click on the Learner+ link provided.

and *"The number of educational credits you earn depends on how often you choose to
reflect."*

So every claim in these ads **names Learner+ wherever there is room** and **none
promises a number of credits**:

| Where | Physicians | NPs and allied |
|---|---|---|
| Eyebrow / strip (tight) | `· CME` | `· CME/CE` |
| Checklist | `Live on Zoom, CME through Learner+` | `…CME/CE through Learner+` |
| Ad description | `· CME through Learner+` | `· CME/CE through Learner+` |
| Post text | `CME is available through Learner+.` | `CME/CE is available through Learner+.` |

**Do not shorten these back to "CME available."** That is the exact claim this wording
exists to avoid. Setting `creditClaim: 'off'` strips every mention from all 63 ads;
`verify.js` enforces the switch in both directions.

## The registration URL

`https://members.intrabalance.com/insomnia` — confirmed 2026-08-21.

Two wrong ones to keep out: `intrabalance.com/register` is six-week program
enrollment, and `members.intrabalance.com/sleep-masterclass` is the **consumer**
"quiet your mind" class. That second one appears 39 times in the corpus, which makes
it the easy wrong answer.

## Still open
3. **Full-bleed environmental portrait** (the MasterClass pull-quote format) is still
   not built. It needs a **wide photograph of Dr. Bhopal in a real setting**, roughly
   1200px or more. The 350px circular headshot cannot carry it, and generating a
   stand-in is not an option — it would be a synthetic image of a real, named person.

   `brand-content-images` is the right tool for this and it is already built and
   shared across the three businesses. Two things stand between it and these images:

   - **No credential in this session.** `generate.py` reads `OPENAI_API_KEY` from the
     environment or from `~/Documents/Claude/Projects/pip-funnel-report/.env`, and
     `GEMINI_API_KEY` from the environment or `brand-content-images/.env.gemini`.
     Neither is set here and neither fallback file exists on this machine — both live
     on the Mac. Set either key in this session and the generator runs.
   - **No `ib` style.** `styles/` holds `es` and `pip` only. An IntraBalance style
     folder needs a `style.txt` and two or three reference images before it will
     produce anything that looks like IntraBalance rather than generic stock.

   The 5.7 MB file in Drive named `Nishi Bhopal_DL.jpg` is **not** a headshot — it is
   a scan of her driver's licence. Do not use it, and do not copy it into any repo.
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

**A portrait matte nobody measured.** The first photo render had a dark halo inside
the ring because the source circle is inset in its square. The fix came from measuring
the inset in the actual pixels, not from nudging a scale factor until it looked right.

**Copy that outgrew its box.** The June renderer used a per-size scale factor tuned by
eye against one audience's copy. "For Psychologists, PAs & Coaches" is more than twice
the length of "For Physicians". Every dimension is now `calc(var(--u) * N)`, so an
in-page fit pass shrinks single-line items to their own width and the whole column to
the artboard, and the run **reports what it had to shrink** instead of assuming it fit.
