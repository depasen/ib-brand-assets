// IntraBalance - Insomnia Masterclass ads. SINGLE SOURCE OF TRUTH for all copy.
// The renderer (render_ads.js) and the review deck (COPY.md via build-copy-md.js)
// both read this file, so on-image text and ad-field text cannot drift apart.
//
// Voice: drafted against nishi-content-engine/VOICE-GUIDE.md and gated with
// voice_check.py. Two rules bite hardest here and are why this copy reads the way
// it does:
//   1. No scarcity mechanics (VOICE-GUIDE section 9 bans "spots are limited" and
//      every relative). The June 2025 kit carried "seats limited"; it is gone.
//   2. Her connector is the ellipsis or a comma, not the em-dash. Her own clinician
//      page: "help your patients sleep better...without reaching for your
//      prescription pad". Two-beat corrections take a comma.
//
// Copy rule from the campaign brief: sell the problem and the promise. Never reveal
// the method. No frameworks, no screener, no dosing, no CBT-I.

const OFFER = {
  dateLong: 'Wednesday, Aug 26',        // verified: 2026-08-26 is a Wednesday
  dateShort: 'Wed, Aug 26',
  time: '4:00 PM',                      // confirmed by Sandeep 2026-08-21
  tz: 'PT',
  // Confirmed by Sandeep 2026-08-21. The clinician masterclass opt-in.
  // NOT intrabalance.com/register (six-week program enrollment) and NOT
  // members.intrabalance.com/sleep-masterclass (the consumer "quiet your mind" class,
  // which is the most common masterclass URL in the corpus and the easy wrong answer).
  regUrl: 'https://members.intrabalance.com/insomnia',
  host: 'Dr. Nishi Bhopal, MD',
  // Corpus-verified credentials. Formal string per VOICE-GUIDE section 4 is
  // "ABPN Board Certified in Psychiatry & Sleep Medicine" (20 corpus hits).
  // "Harvard-trained" is used across her own IB/ES marketing (12+ corpus hits).
  credentialShort: 'Board certified in psychiatry and sleep medicine',
  credentialLong: 'board certified in psychiatry and sleep medicine',
  credentialHook: 'Harvard-trained psychiatrist and sleep specialist',

  // CREDIT: ON, AND THE WORDING IS LOAD-BEARING. Sandeep, 2026-08-21:
  // "They can get CME for the class but it's not just given it's through learner plus."
  //
  // The June kit's flat "CME available" was wrong in a way that matters: credit is not
  // granted by attending. Corpus, verbatim: "Educational credits are provided through
  // Learner+ which is a point of reflection learning platform. This means that whenever
  // you learn something in the program, you click on the Learner+ link provided." And:
  // "The number of educational credits you earn depends on how often you choose to
  // reflect."
  //
  // So every claim here names Learner+ wherever there is room, and none of them
  // promises a number of credits. Do not shorten these back to "CME available" - that
  // is the exact claim this wording exists to avoid.
  //
  // 'off' strips every mention of credit from all 63 ads; verify.js enforces it.
  creditClaim: 'on',   // 'on' | 'off'
};

// {{TIME}} {{DATE}} {{DATE_SHORT}} {{URL}} {{TZ}} are filled by fill() below.
// `lane` is the audience whose credit wording applies. Omitted, credit tokens
// resolve to nothing, which is the safe direction.
function fill(s, lane) {
  const on = OFFER.creditClaim === 'on';
  const word = on && lane ? lane.credit : '';
  return String(s)
    // Short form where space is tight (eyebrow, strip); the Learner+ mechanism is
    // named everywhere there is room for it. Never "CME available" on its own.
    .replace(/\{\{CRED_DOT\}\}/g, word ? ' \u00b7 ' + word : '')
    .replace(/\{\{CRED_CHECK\}\}/g, word ? ', **' + word + ' through Learner+**' : '')
    .replace(/\{\{CRED_SENT\}\}/g, word ? word + ' is available through Learner+.' : '')
    .replace(/\{\{CRED_AVAIL\}\}/g, word ? word + ' through Learner+' : '')
    .replace(/\{\{TIME\}\}/g, OFFER.time)
    .replace(/\{\{DATE_SHORT\}\}/g, OFFER.dateShort)
    .replace(/\{\{DATE\}\}/g, OFFER.dateLong)
    .replace(/\{\{TZ\}\}/g, OFFER.tz)
    .replace(/\{\{URL\}\}/g, OFFER.regUrl)
    // Tidy the seams a removed clause leaves behind: orphan middots, doubled
    // spaces, a space before a full stop, a dangling separator at either end.
    .replace(/\u00b7\s*\u00b7/g, '\u00b7')
    .replace(/\s*\u00b7\s*$/gm, '')
    .replace(/^\s*\u00b7\s*/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,])/g, '$1');
  // NB: deliberately no trailing-whitespace strip. Some fragments end in a
  // meaningful space - concept G's offer line is assembled from three pieces and
  // "Free " carries the gap before the bold run. Stripping it printed
  // "FreeInsomnia Masterclass".
}

// ---------------------------------------------------------------------------
// AUDIENCES
//
// Three ad sets, not one ad set with the noun swapped. The pain is genuinely
// different per lane and the copy has to follow it:
//
//   physicians  prescribers. The prescription-pad framing is the whole hook.
//   nps         prescribers, and usually the first person told. Longest visit,
//               most disclosure, same short list of options.
//   allied      psychologists, PAs and coaches. MIXED prescribing status, so no
//               line in this lane may hinge on writing a script. Their shared
//               truth is the referral: sleep arrives with them after the handout
//               and the pill have already failed.
//
// Scope-of-practice guard on the allied lane: coaches do not have patients and do
// not diagnose or treat. That lane never says "patients", "diagnose" or "treat".
// It says "the people you work with" and "help". VOICE-GUIDE section 4 also bans
// "clients" in her voice, so that word is out too.
//
// CREDIT: physicians get CME. The corpus credit path is Learner+ (reflection-based)
// and the corpus phrasing for mixed audiences is "CME/CE" ("earn CME/CE credits",
// "12 CE / CME Credits"). Coaches may qualify for neither, which is why credit is
// never the lead promise in the allied lane. CONFIRM AGAINST THE LANDING PAGE
// BEFORE LAUNCH - see README "Open decisions".
// ---------------------------------------------------------------------------

const AUDIENCES = [
  {
    key: 'physicians',
    label: 'Physicians',
    forLine: 'For Physicians',
    noun: 'physicians',
    credit: 'CME',
    descriptionSuffix: 'Free masterclass for physicians',
    metaTargeting: 'MD/DO. AAFP, ACP, integrative and functional medicine (IFM, A4M), CME interests, plus a lookalike from past registrants.',

    A: {
      eyebrow: 'FREE LIVE MASTERCLASS{{CRED_DOT}}',
      h: { lead: "Your patients can't sleep.", accent: "And you're out of answers." },
      sub: 'The most common complaint in your clinic, and the one your training skipped.',
      checks: [
        'Live on Zoom{{CRED_CHECK}}',
        'With **Dr. Nishi Bhopal, MD** · Harvard-trained',
        '**{{DATE}}** · {{TIME}} {{TZ}}',
      ],
      button: 'Reserve your free seat',
      adHeadline: "Out of Answers for the Patients Who Can't Sleep?",
      adDescription: 'Free masterclass for physicians · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `You did everything your training gave you. The handout, the prescription, the follow-up. And they're back, still exhausted, still asking you for an answer nobody ever taught you to give.

Insomnia is one of the most common complaints you'll see this week, and one of the most frustrating to treat. It doesn't have to be.

Join Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist, for a free masterclass built for physicians. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    B: {
      kicker: 'Dr. Nishi Bhopal, MD',
      kickerSub: 'Harvard-Trained Psychiatrist · Sleep Specialist',
      h: { lead: 'Hot take: we were trained to treat almost everything,', accent: "except the patient who can't sleep." },
      sub: "It's the most common complaint in your clinic, and the one your training skipped. A free masterclass for physicians. {{CRED_SENT}}",
      chip: 'Live · {{DATE}} · {{TIME}} {{TZ}}',
      button: 'Claim your free seat',
      adHeadline: "The Patient Who Can't Sleep, and What Training Left Out",
      adDescription: 'A free masterclass for physicians · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `Hot take: we were trained to work up almost everything, except sleep.

When a patient says "I can't sleep", most of us reach for a script, because that is what the training gave us. It's the most common complaint in the clinic and the one medical education runs straight past.

In this free masterclass, Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist, walks physicians through a better way. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    C: {
      eyebrow: 'THE INSOMNIA MASTERCLASS · FOR PHYSICIANS',
      h: { lead: 'Still prescribing for', accent: "sleep you can't fix?" },
      sub: "There's a better way to treat one of the most common complaints in medicine, and it's built for physicians.",
      strip: 'FREE{{CRED_DOT}} · DR. NISHI BHOPAL, MD',
      button: 'Save your free seat',
      adHeadline: "Still Writing Scripts for the Patients Who Can't Sleep?",
      adDescription: 'Free masterclass for physicians · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `Some patients you can help in a single visit. The ones who can't sleep usually aren't among them, and not because you're missing effort. Nobody taught you how.

This free masterclass changes that. Built for physicians, led by Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    D: {
      eyebrow: 'FREE MASTERCLASS{{CRED_DOT}} · FOR PHYSICIANS',
      h: { lead: 'The one complaint we treat', accent: 'without diagnosing.' },
      sub: 'Insomnia is everywhere in your clinic, and the reason the usual fixes keep failing may not be what you think.',
      button: 'Reserve your free seat',
      credit: 'Dr. Nishi Bhopal, MD',
      adHeadline: 'The One Complaint We Treat Without Diagnosing',
      adDescription: 'A free masterclass for physicians · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `We work up chest pain. We work up fatigue. But when a patient says "I can't sleep", most of us go straight to a prescription, without ever asking what is driving it.

Insomnia may be the one complaint we treat without diagnosing. This free masterclass, for physicians, is a better way. With Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },
  },

  {
    key: 'nps',
    label: 'Nurse Practitioners',
    forLine: 'For Nurse Practitioners',
    noun: 'nurse practitioners',
    credit: 'CME/CE',
    descriptionSuffix: 'Free masterclass for NPs',
    metaTargeting: 'NP/APRN. AANP, PMHNP and FNP groups, primary care and psych NP interests, nursing CE interests, plus a lookalike from past registrants.',

    A: {
      eyebrow: 'FREE LIVE MASTERCLASS{{CRED_DOT}}',
      h: { lead: 'They tell you first.', accent: 'Nobody taught you what comes next.' },
      sub: 'Sleep is the complaint that fills your panel, and the one your program had the least time for.',
      checks: [
        'Live on Zoom{{CRED_CHECK}}',
        'With **Dr. Nishi Bhopal, MD** · Harvard-trained',
        '**{{DATE}}** · {{TIME}} {{TZ}}',
      ],
      button: 'Reserve your free seat',
      adHeadline: 'The Sleep Complaint Your Program Had the Least Time For',
      adDescription: 'Free masterclass for NPs · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `They tell you about the sleep before they tell anyone else. The trouble falling asleep, the 3am wake-ups, the year they have spent tired.

And then you're the one holding it, with the same short list of options as everyone else, because sleep is the piece almost every training program runs out of time for.

Join Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist, for a free masterclass built for nurse practitioners. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    B: {
      kicker: 'Dr. Nishi Bhopal, MD',
      kickerSub: 'Harvard-Trained Psychiatrist · Sleep Specialist',
      h: { lead: 'Hot take: you see the most tired patients,', accent: 'and were given the least to work with.' },
      sub: "It's the complaint that fills your panel, and the one your program had least time for. A free masterclass for nurse practitioners. {{CRED_SENT}}",
      chip: 'Live · {{DATE}} · {{TIME}} {{TZ}}',
      button: 'Claim your free seat',
      adHeadline: 'You See the Most Tired Patients. You Were Given the Least.',
      adDescription: 'A free masterclass for NPs · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `Hot take: nobody hears about sleep more often than a nurse practitioner, and almost nobody gets less training in it.

You have the longest visit, the most trust, and the same short list of options as everyone else. That is not a gap in you. It's a gap in the curriculum.

In this free masterclass, Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist, walks NPs through a better way. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    C: {
      eyebrow: 'THE INSOMNIA MASTERCLASS · FOR NURSE PRACTITIONERS',
      h: { lead: 'Still reaching for', accent: 'the same short list?' },
      sub: "There's a better way to handle one of the most common complaints in your panel, and it's built for nurse practitioners.",
      strip: 'FREE{{CRED_DOT}} · DR. NISHI BHOPAL, MD',
      button: 'Save your free seat',
      adHeadline: 'Still Reaching for the Same Short List on Sleep?',
      adDescription: 'Free masterclass for NPs · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `Some visits close cleanly. The sleep ones rarely do, and it isn't for lack of time or care. Nobody taught you how.

This free masterclass changes that. Built for nurse practitioners, led by Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    D: {
      eyebrow: 'FREE MASTERCLASS{{CRED_DOT}} · FOR NURSE PRACTITIONERS',
      h: { lead: 'The complaint we hear most.', accent: 'And work up least.' },
      sub: 'Insomnia turns up in nearly every panel, and the reason the usual options keep failing may not be what you think.',
      button: 'Reserve your free seat',
      credit: 'Dr. Nishi Bhopal, MD',
      adHeadline: 'The Complaint We Hear Most, and Work Up Least',
      adDescription: 'A free masterclass for NPs · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `We work up the fatigue. We work up the thyroid. But when someone says "I can't sleep", the visit usually ends in a prescription or a sleep hygiene handout, without anyone asking what is driving it.

Insomnia may be the one complaint we hear most and work up least. This free masterclass, for nurse practitioners, is a better way. With Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },
  },

  {
    key: 'allied',
    label: 'Psychologists, PAs & Coaches',
    forLine: 'For Psychologists, PAs & Coaches',
    noun: 'psychologists, PAs and coaches',
    credit: 'CME/CE',
    descriptionSuffix: 'Free masterclass for psychologists, PAs and coaches',
    metaTargeting: 'Psychologists (APA, PsyD/PhD), PAs (AAPA), and health/sleep coaches (NBHWC). Behavioural sleep medicine, CBT and health coaching interests, plus a lookalike from past registrants.',

    A: {
      eyebrow: 'FREE LIVE MASTERCLASS{{CRED_DOT}}',
      h: { lead: 'By the time they reach you,', accent: "they've already tried the pill." },
      sub: "Sleep is what they have taken everywhere else first. Now it's in your room.",
      checks: [
        'Live on Zoom{{CRED_CHECK}}',
        'With **Dr. Nishi Bhopal, MD** · Harvard-trained',
        '**{{DATE}}** · {{TIME}} {{TZ}}',
      ],
      button: 'Reserve your free seat',
      adHeadline: "They've Already Tried the Pill. Now What?",
      adDescription: 'Free masterclass for psychologists, PAs and coaches · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `By the time someone brings their sleep to you, they have usually been round the whole loop. The handout. The pill. The advice about screens.

You're who they land with, and often without a prescription pad to fall back on. Which is closer to where the answer actually lives.

Join Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist, for a free masterclass built for psychologists, PAs and coaches. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    B: {
      kicker: 'Dr. Nishi Bhopal, MD',
      kickerSub: 'Harvard-Trained Psychiatrist · Sleep Specialist',
      h: { lead: 'Hot take: sleep gets referred out of every room,', accent: 'and it stops in yours.' },
      sub: 'It arrives with you after the handout and the pill have already been tried. A free masterclass for psychologists, PAs and coaches. {{CRED_SENT}}',
      chip: 'Live · {{DATE}} · {{TIME}} {{TZ}}',
      button: 'Claim your free seat',
      adHeadline: 'Sleep Gets Referred Out of Every Room. It Stops With You.',
      adDescription: 'A free masterclass for psychologists, PAs and coaches · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `Hot take: sleep gets referred out of nearly every room, and it stops in yours.

Psychologists, PAs and coaches end up holding the sleep problem once the handout and the prescription have been tried. Usually with no more training in it than anyone upstream had.

In this free masterclass, Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist, walks through a better way. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    C: {
      eyebrow: 'THE INSOMNIA MASTERCLASS · FOR PSYCHOLOGISTS, PAs & COACHES',
      h: { lead: 'Still the last stop for', accent: 'sleep nobody fixed?' },
      sub: "There's a better way to work with one of the most common problems people bring you, and it's built for psychologists, PAs and coaches.",
      strip: 'FREE{{CRED_DOT}} · DR. NISHI BHOPAL, MD',
      button: 'Save your free seat',
      adHeadline: 'Still the Last Stop for the Sleep Nobody Fixed?',
      adDescription: 'Free masterclass for psychologists, PAs and coaches · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `Most things people bring you, you have a way in. Sleep is often the exception, and it isn't for lack of skill. Nobody taught you how.

This free masterclass changes that. Built for psychologists, PAs and coaches, led by Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },

    D: {
      eyebrow: 'FREE MASTERCLASS{{CRED_DOT}} · FOR PSYCHOLOGISTS, PAs & COACHES',
      h: { lead: 'Everyone has a fix for sleep.', accent: 'Almost nobody asks why.' },
      sub: 'It reaches you already medicated, already advised, and still there. The reason the usual fixes keep failing may not be what you think.',
      button: 'Reserve your free seat',
      credit: 'Dr. Nishi Bhopal, MD',
      adHeadline: 'Everyone Has a Fix for Sleep. Almost Nobody Asks Why.',
      adDescription: 'A free masterclass for psychologists, PAs and coaches · {{CRED_AVAIL}}',
      adCta: 'Sign Up',
      adPrimary: `Everyone has a fix for sleep. The handout, the pill, the app, the advice about screens. By the time someone brings it to you, they have tried most of them.

Almost nobody asked why they weren't sleeping in the first place. This free masterclass, for psychologists, PAs and coaches, starts there instead. With Dr. Nishi Bhopal, MD, a Harvard-trained psychiatrist and sleep specialist. {{CRED_SENT}}

🗓 {{DATE_SHORT}} · {{TIME}} {{TZ}} → {{URL}}`,
    },
  },
];

const CONCEPTS = [
  { key: 'A', slug: 'A_offerstack',  name: 'Offer stack',      surface: 'Light accent background' },
  { key: 'B', slug: 'B_quotecard',   name: 'Expert quote card', surface: 'White background, navy CTA bar' },
  { key: 'C', slug: 'C_bigquestion', name: 'Bold question',     surface: 'Light blue background' },
  { key: 'D', slug: 'D_statement',   name: 'Dark hot take',     surface: 'Navy background' },
  // The two photo cuts. Each is a FACE VERSION OF AN EXISTING CONCEPT, running the
  // identical words, so the A/B measures the photograph and nothing else. Change the
  // copy in A or B and these change with it - that is the point, and why they carry
  // `sameCopyAs` instead of their own text.
  { key: 'E', slug: 'E_quotecard_photo', name: 'Quote card with portrait', surface: 'White background, circular portrait, navy CTA bar', photo: true, sameCopyAs: 'B' },
  { key: 'F', slug: 'F_speakercard',     name: 'Speaker card',             surface: 'Navy background, portrait above the headline', photo: true, sameCopyAs: 'A' },
  // G is drawn from the Ad Inspiration folder: the eCare / Colleen Carney ad, which is
  // a direct competitor running the same offer one day later. Its creative is styled
  // as a native post rather than an ad - profile row, plain sans headline, dark footer
  // bar with a bright pill CTA. Same words as B and E, so B / E / G is a clean
  // three-way test of TREATMENT on identical copy.
  //
  // ONE THING FROM THAT REFERENCE IS DELIBERATELY NOT COPIED: it bakes a fake
  // engagement row into the image ("Nina and 231 others - 67 comments"). That is
  // invented social proof presented as real. See README "A judgement call".
  // H is the layout Sandeep pointed at: Psychiatry Redefined's "Scholarships
  // Available" in the Ad Inspiration folder. Full-bleed clinician photo down one side,
  // type over a pale scrim on the other, a big hook, CTA as a line rather than a
  // button. Its subject is a clinician, NOT the instructor, which is why this needed a
  // photograph rather than a bigger headshot of Dr. Bhopal.
  { key: 'H', slug: 'H_splitphoto',    name: 'Clinician split',          surface: 'Full-bleed clinician photo one side, headline on a pale scrim', photo: true, sameCopyAs: 'C' },
  { key: 'G', slug: 'G_nativepost',     name: 'Native post',              surface: 'White card, portrait and byline, plain-sans headline, navy CTA bar', photo: true, sameCopyAs: 'B' },
];

const SIZES = [
  { key: '1x1_1080x1080',  w: 1080, h: 1080, s: 0.84, placement: 'Feed alt / universal' },
  { key: '4x5_1080x1350',  w: 1080, h: 1350, s: 1.0,  placement: 'Facebook & Instagram Feed (primary)' },
  { key: '9x16_1080x1920', w: 1080, h: 1920, s: 1.06, placement: 'Stories & Reels (FB + IG)' },
];

// Derive the photo cuts. Nothing here invents copy: E is B's words and F is A's,
// with only the presentational fields the photo layout needs added on top.
for (const a of AUDIENCES) {
  a.E = { ...a.B, portraitName: OFFER.host, portraitCred: 'Harvard-trained psychiatrist and sleep specialist' };
  a.F = { ...a.A, portraitName: OFFER.host, portraitCred: 'Harvard-trained psychiatrist and sleep specialist' };
  a.H = { ...a.C, photoFile: 'photo-' + a.key + '.png',
          // C's eyebrow names the audience and runs to 59 characters, which cannot fit
          // a half-width column at a readable size - it shrank to 54% and still
          // overflowed. H's sub already names the audience, so the eyebrow is short.
          eyebrow: 'FREE LIVE MASTERCLASS',
          // Photo right, type left, matching the reference ad exactly. The sources are
          // centred head-and-shoulders portraits, so the photo column crops
          // symmetrically and the side no longer has to vary per lane.
          textSide: 'left' };
  a.G = { ...a.B, portraitName: OFFER.host, portraitCred: 'Sleep specialist and psychiatrist',
          offerLine: { lead: 'Free ', bold: 'Insomnia Masterclass for ' + a.noun + '.', tail: ' ' + OFFER.dateLong } };
}

module.exports = { OFFER, AUDIENCES, CONCEPTS, SIZES, fill };
