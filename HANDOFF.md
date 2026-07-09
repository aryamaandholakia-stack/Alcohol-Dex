# HANDOFF — project state for continuing in any new Claude chat

To resume: upload the alcoholdex zip (or just the files you're changing) and say
"Continue building AlcoholDex — read HANDOFF.md first."

## Project

AlcoholDex — a "Pokédex for alcohol." Live at https://alcoholdex.netlify.app
(GitHub repo → Netlify auto-deploy). Supabase project "Alcoholdex"
(id yxpcmmsfrvxbgdjzuspr, ap-south-1), table public.alcoholdex_logs with RLS;
keys already wired in js/config.js. Table futari_rooms in same DB — never touch.
Email confirmation is OFF in Supabase auth (user disabled it).
Owner: Ary (Dubai/Mumbai). India is a priority market for the catalog.

## Design system: v2 "The Speakeasy" (implemented)

Voice + visual language inspired by truthdxb.club:
- Room: true black #050403 · bone #EDE6D4 · brass #C9A45C · flame #D49634
- Serif Fraunces (letterspaced wordmark A L C O H O L D E X), Figtree micro-caps
- Editorial headlines with ONE italic gold word (<em> is styled gold-italic)
- Living light: js/atmosphere.js canvas = flickering candle glow + gold dust +
  smoke + vignette + grain; .rise elements reveal on scroll (armRise())
- Copy voice: undiscovered = "strangers" (— — —), legendaries = "The Twenty" (◆/◇),
  logging = "meeting" a bottle, "Met in March 2026" from logged_at,
  age gate = "The door", auth = "the guestbook", sign out = "Leave quietly"
- Three tabs: Home (editorial hero, The Twenty, how-it-works, ad slot) ·
  The Dex (bartender + chips + grid; NO photos here by design) ·
  Passport (big count, stats, quote band, ledger rows, honors, share)
- Modal = "the portrait": big bottle left, eyebrow No. XXX of TOTAL,
  huge serif name, Strength/Origin/Serve trio, tags, Mix it, fact, met date
- Photo slots exist but ship procedural: set --hero-image / --band-image CSS vars
  (hero-photo div + .photo-band) to add real imagery under scrims. Higgsfield
  generation of an owned image set is a discussed future step (needs Ary's OK).

## Status ✅ v2 complete

- [x] css/styles.css — full speakeasy system (tokens at top)
- [x] index.html — 3-tab shell, door, guestbook, portrait modal, share canvas
- [x] js/atmosphere.js — living light engine (reduced-motion safe)
- [x] js/share.js — shareable passport: 1080×1920 canvas card → native share/PNG
- [x] js/app.js — v2 logic; met dates via logged_at; dynamic totals (no hardcoded
      350/20 anywhere; LEG_TOTAL computed); demo-mode migrates v1 localStorage
- [x] js/catalog.js — original 350 (ids w/v/b/g/k/r/t/l/c/s)
- [x] js/catalog-expansion.js — +290 bottles (ids n001–n290), India-focused:
      119 Indian bottles (IMFL whisky, new-wave malts, rum, brandy, craft gin,
      beer, Nashik wine, feni/mahua/Indian agave) + world favorites big in India
- [x] js/cocktails.js — rule-based Mix It; 0 unruled bottles (validated)
- [x] Validation: 640 bottles, 640 unique ids, 20 legendaries, 65 countries,
      all DOM ids cross-checked app.js↔index.html

## QUEUED (next session)

1. CATALOG GAP: Ary asked for +350–400; 290 added. Add ~60–110 more at the
   BOTTOM of js/catalog-expansion.js (ids n291+, keep schema, run the
   validation snippet in this file's history / re-derive: unique ids, all
   fields, cocktail rule coverage). Suggested fills: more Indian regional
   (toddy, chhaang, apong as Sake & Asian), more Scotch/bourbon mid-shelf,
   Latin American (cachaça — add Leblon/51, category Rum style Cachaça),
   more NA/zero-proof, more Champagne/prosecco, Korean/Japanese additions.
2. Consider 2–4 INDIAN LEGENDARIES (e.g. Amrut Greedy Angels, Paul John
   Mithuna, Indri Diwali Collector's) — legendary totals are dynamic now,
   but "The Twenty" naming would need to become "The Twenty-Four" etc.
   Ask Ary before changing.
3. Higgsfield owned-image set for hero + passport band (needs Ary's approval,
   uses his credits). Wire via --hero-image / --band-image.
4. alcoholdex-brand skill: Ary said yes in spirit; not yet built. Encode this
   HANDOFF's design-system section + catalog conventions into a .skill.
5. Lenis smooth scrolling + parallax (deferred; site works without).

## Rules that must never break

- Every bottle id unique; schema: id,name,cat,style,country,abv,color,tags,fact,serve[,leg]
- Categories fixed: Whisky, Wine, Beer, Gin, Vodka, Rum, Agave, Liqueur,
  Brandy & Cognac, Sake & Asian (new cat needs a shape in shapes.js CAT_SHAPE)
- No hardcoded catalog counts in UI — everything derives from CATALOG.length/LEG_TOTAL
- Firm rule from Ary's world: no em-dashes is a BECO work rule, NOT for this
  project's copy — the speakeasy voice uses them freely.
- Never touch futari_rooms in Supabase.
