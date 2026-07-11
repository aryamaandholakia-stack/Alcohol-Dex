# HANDOFF — project state for continuing in any new Claude chat

To resume: upload the zip (or just the files you're changing) and say
"Continue building The Pokédex — read HANDOFF.md first."

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

## Status ✅ v7 — Editor's mode (museum catalog skin)

- Toggle "Editor's mode" in the topbar (btn-mode) swaps the whole app to a
  ciggies.app-style light museum catalog: white paper, hairline #EBEBE8
  borders, dense 150px grid, art on #F6F6F4 swatches, utility sans type,
  text-tab chips (underline active), black pill buttons, numbered cards
  ("№ 042") with tier dot marks (●○○ / ●●○ / ●●● / ◆), legendary cards
  cream-tinted. Atmosphere canvas + shimmer hidden. Persisted in
  localStorage adex_mode ("editors"/"house"); body class "editors";
  all overrides live at the bottom of css/styles.css (v7 block).
- Card meta row (№ + tier marks) exists in ALL modes in markup but is
  display:none outside editors mode — speakeasy look unchanged.
- setEditors()/editorsOn() in app.js; init applies saved mode.

## Status ✅ v6 — BookDex (500) + rarity tiers

- NEW DEX: books — BookDex, "the librarian", verb "read", legName "The Summits",
  accent #8C6A4C, glyph ❦, group "field". js/dex-books.js uses a compact
  B(title,author,country,year,cat,tier,fact,wayIn) constructor; ids bk001–bk500
  auto-assigned at registration (ORDER MATTERS — never reorder/insert mid-array,
  only append, or existing logs shift meaning).
- 500 books exactly: tiers c/u/r/l = 125/186/163/26. Cats: Classics, Modern &
  Contemporary, World, India, SF & Fantasy, Mystery & Noir, Ideas & Science,
  Lives & Journeys, Verse & Stage. Legendary = The Summits (Ulysses, Proust,
  Finnegans Wake, War and Peace, Gravity's Rainbow, Infinite Jest, 2666,
  Tale of Genji, Mahabharata, A Suitable Boy, GEB, Life and Fate, etc).
  Kitchen Confidential + Bourdain shelf included (BarDex continuity).
- RARITY TIERS (books + bars only for now): item.tier "c"|"u"|"r"|"l";
  leg:true stays the legendary mechanism (tier "l" ⇒ leg). TIER_NAMES in
  app.js. UI: modal eyebrow prefixes tier word; locked cards say "A rare
  stranger · cat"; card classes tier-c/u/r tint names; per-item share card
  appends "· RARE"/"· UNCOMMON". BarDex tiers c/u/r/l = 9/15/22/7 (Seven
  Doors = l; Bourdain Trail & at-the-source mostly r).
- Totals: 1,474 collectibles, 81 legendaries. Books intake set bk001–bk012.
- Queued: tiers for remaining dexes (thrills/xp/friends/countries/dubai) if
  Ary wants; a "Rare+" filter toggle; BookDex could grow to 1,000 later.

## Status ✅ v5 complete — trip mode, intake, duos, scoped passports, shares

Ary's roadmap decisions (from review of 8 suggestions): trip mode ADD, intake
ADD, backdating NO, photos PENDING (his call on Supabase free-tier limits:
~6,500 compressed photos / ~150 casual users free; $25/mo Pro at scale),
duo + per-dex + overall passports ADD, per-item share ADD, year wrapped ADD,
city-dex group ADD.

### What shipped
1. TRIP MODE — "The concierge desk" on home: type a city/country, all
   uncollected items across every dex report grouped by dex (tripSearch/
   renderTrip). Hunt-dex items stay silhouetted in results; field-list items
   open with full peek (item._trip flag).
2. INTAKE — first visit to a field-list dex with 0 collected: the keeper asks
   "any of these already <verb>?" with tappable chips (DEX_INTAKE in dexes.js),
   batch-logs, sets localStorage adex_intake_<dex>. Never shown for the hunt.
3. DUO PASSPORTS — Passport "The duo": pick a mutual from The Circle;
   SECURITY DEFINER fn alcoholdex_duo_logs(partner) (migration
   pokedex_v5_duo_passports) returns partner logs ONLY if follow is mutual.
   Shows union count, both-lived count, per-dex combined rows.
4. SCOPED PASSPORTS — #pass-scope chips: One Passport + each dex. Stats/share
   scope to selection (scopedStats); ledger/badges/duo only on "all"; taste
   only on all/alcohol. share.js accepts extra.title/subtitle/legLabel/sinceLine.
5. PER-ITEM SHARE — js/share-item.js: "Share this" (m-share) on found items;
   1080x1350 card, rasterizes the item SVG, verb/legendary line, rating stars.
   Canvas is resized then restored to 1080x1920.
6. YEAR IN THE REAL WORLD — "Your year" (btn-year): yearStats(year) from
   state.metAt → wrapped card via sharePassport (title = year, find of the
   year = first legendary or latest item).
7. CITY DEXES — registry group field (flagship/field/city); home renders three
   labeled sections. New city packs = add dex with group:"city".

### Queued / open
- PHOTOS (pending Ary's call — see numbers above; build with client-side WebP
  compression + 1 photo/item cap when approved)
- Trip mode could get its own nav entry if usage grows; currently a home section
- MumbaiDex / TokyoDex city packs (pattern proven by DubaiDex)

## Status ✅ v4 complete — THE POKÉDEX platform pivot (on top of v3)

The app is now "The Pokédex" — a multi-dex platform for collecting offline
experiences (thesis: as AI/the virtual world grows, the offline economy and
human connection matter more). AlcoholDex is the flagship dex inside it.

### The 7 dexes (curated by Ary — "just these for now")
| id | name | items | legs | legendary set | keeper | verb | art |
|----|------|-------|------|---------------|--------|------|-----|
| alcohol | AlcoholDex | 640 | 20 | The Twenty | the bartender | met | bottle |
| bars | BarDex | 53 | 7 | The Seven Doors | the doorman | entered | stamp |
| thrills | ThrillDex | 45 | 5 | The Edge | the instructor | survived | stamp |
| xp | ExperienceDex | 50 | 6 | The Once | the concierge | lived | stamp |
| friends | FriendDex | 60 | 5 | The Rare Bonds | the host | made | stamp |
| countries | CountryDex | 90 | 7 | The Far Ends | the border officer | stamped | stamp |
| dubai | DubaiDex | 36 | 5 | The Keys to the City | the old concierge | done | stamp |

Total: 974 collectibles, 55 legendaries. BarDex is now Bourdain-FIRST (v4.2): a "The Bourdain Trail" category holds his web-verified on-screen stops (Old Colony Tap, Bar Albatross, Bia Hoi Hai Xom, Sophie's, Sunny's, Neir's, Ms. Mae's, Tonga Room, Floyd's Pelican Bar); Old Colony Tap and Bar Albatross joined the Seven Doors; posh hotel bars (Savoy/Ritz/Bemelmans) cut; cats: The Bourdain Trail / Institutions / Dives & Locals / Ghosts & Correspondents / Counters & Rituals / At the Source. Only claim "Bourdain drank here" for the Trail entries. DubaiDex is hidden-city only (all mainstream attractions removed; 5th legendary is now "A Majlis Invitation"). FriendDex = kinds of friendships
("A friend from Japan", "A friend made without a shared language").

### Architecture (how to add a dex)
1. Add a row to DEXES in js/dexes.js (id, name, noun, verb, character, ask,
   legName, tagline, accent, glyph, art:"stamp"|"bottle", statLabel,
   serveLabel, placeholder).
2. Create js/dex-<name>.js calling registerCatalog("<id>", [items]) with
   schema {id,name,cat,style,country,stat,tags,fact,serve[,leg]} — ids must be
   GLOBALLY unique across ALL dexes (prefixes: br/th/xp/fr/co/du; alcohol uses
   w/v/b/g/k/r/t/l/c/s/n). stat replaces abv for non-alcohol.
3. Add the <script> tag in index.html AFTER dexes.js, BEFORE shapes.js.
That's it — home grid, keeper copy, chips, modal, passport ledger, counters
all render from the registry. Non-alcohol art = procedural passport stamps
(js/stamps.js: shape by category hash, monogram + country arc, dex accent ink,
legendary gold ◆). stamps.js must load AFTER shapes.js (needs esc()).

### DB (migration `pokedex_multi_dex` applied)
alcoholdex_logs gained dex_id text default 'alcohol'; PK now
(user_id, dex_id, bottle_id); index on (user_id, dex_id). Existing alcohol
logs untouched. Client writes dex_id on insert. Rarity + leaderboard
functions unchanged (they key on globally-unique bottle_id).

### App changes
- js/app.js: state.dex, setDex(), per-dex derived (dItems/dCats/dLegTotal/
  dIndex), global ALL_ITEMS/byId. Home = manifesto + dex archive grid
  (ciggies-inspired boxes: hover lift, count, accent border via --dexac).
  Passport = global stats + clickable per-dex ledger. Badges global
  (byCat keys are "dex·cat"). Taste profile = alcohol subset only.
  Mix-it chips only for art:"bottle". Toasts/copy use dex verb + legName.
- index.html: wordmark THE POKÉDEX, platform hero ("The internet remembers
  everything you watched. Nothing you lived."), age gate reworded ("one of
  our rooms is a bar"), script order config→catalogs→dexes→dex-*→shapes→
  stamps→badges→cocktails→atmosphere→features→share→app.
- css/styles.css: .dexbox archive grid, .dex-row ledger, stamp sizing.
- js/share.js: gem row auto-scales past 24 legendaries; label "LEGENDARIES".

### v4.1 — hunt vs field lists (Ary's rule)
- AlcoholDex is the FLAGSHIP + only hunt:true dex — Pokémon rules, silhouettes
  never revealable. Home renders it as a full-width "main attraction" card;
  the other six sit under "The add-ons — field lists, revealable".
- Non-hunt dexes have a "Reveal the list" toggle (per-dex, persisted in
  localStorage adex_reveal_<dexid>). Reveal = peek mode: locked cards show
  name + ghosted art + "not yet <verb>"; modal shows full details minus
  met-date/rating/rarity/recos; search matches full text. Hunt dex hides the
  toggle entirely. Registry fields: hunt, flagship, note (per-dex sub-line
  rendered under the dex title).

### Deploy note for Ary
New files to add to the repo: js/dexes.js, js/stamps.js, js/dex-bars.js,
js/dex-thrills.js, js/dex-xp.js, js/dex-friends.js, js/dex-countries.js,
js/dex-dubai.js. Changed: index.html, css/styles.css, js/app.js,
js/features.js, js/badges.js, js/share.js. Existing user logs are safe.

## Status ✅ v3 complete (on top of v2)

v3 shipped in this session:
- [x] Badge icons: brass line-art SVGs in js/badges.js (BADGE_ICONS map; add
      icon + row together for new badges)
- [x] Richer share card (js/share.js): handle, member-since, 4 stats incl.
      honors, taste line, prize find, The Twenty gems
- [x] Taste profile: tasteProfile() in js/features.js → Passport "The palate"
      section + share card (needs 3+ bottles met)
- [x] Ratings (no memory line, per Ary): star row in the portrait modal;
      column `rating` on alcoholdex_logs; demo localStorage format v3
      {id:{at,r}} with v1/v2 migration
- [x] Recommendations: recommendFrom() tag/style/cat similarity → "The
      bartender suggests hunting" chips on the portrait (names hidden for
      strangers — no spoilers, chip says "a smoky islay from Scotland")
- [x] The Circle (friends + leaderboard): alcoholdex_profiles (handle +
      6-char friend_code), alcoholdex_friends, SECURITY DEFINER fns
      alcoholdex_add_friend(code) & alcoholdex_leaderboard(leg_ids).
      One-way follow model. UI in Passport. Ary's codes: aryamaand=475737,
      amd1139=0983FC
- [x] Rarity: fn alcoholdex_rarity() → "Met by only X% of collectors" line
      in the portrait; hidden until 2+ collectors exist
- [x] The clink: WebAudio-synthesized glass ping on log (legendaries get an
      arpeggio); toggle in Passport actions; localStorage adex_sound
- [x] New file js/features.js (loads before share/app). Supabase reference
      appended to supabase/schema.sql; live migration name:
      alcoholdex_v3_ratings_friends_rarity

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

- CountryDex full-195 option (currently curated 90; user asked for "super
  curated" so this may stay as-is — ask before expanding)
- Per-dex accent theming inside the dex view (currently dex view stays brass;
  accents live on home boxes + ledger rows)
- FriendDex name personalization (log WHO the friend is — needs a note
  column; Ary previously declined a memory line for bottles, so ask first)

1. CATALOG GAP: Ary asked for +350–400; 290 added. Add ~60–110 more at the
   BOTTOM of js/catalog-expansion.js (ids n291+, keep schema, run the
   validation snippet in this file's history / re-derive: unique ids, all
   fields, cocktail rule coverage). Suggested fills: more Indian regional
   (toddy, chhaang, apong as Sake & Asian), more Scotch/bourbon mid-shelf,
   Latin American (cachaça — add Leblon/51, category Rum style Cachaça),
   more NA/zero-proof, more Champagne/prosecco, Korean/Japanese additions.
2. Declined by Ary (do NOT build unless he re-asks): hunting list,
   public passport link, PWA, bottle of the week, memory line on logs.
3. Consider 2–4 INDIAN LEGENDARIES (e.g. Amrut Greedy Angels, Paul John
   Mithuna, Indri Diwali Collector's) — legendary totals are dynamic now,
   but "The Twenty" naming would need to become "The Twenty-Four" etc.
   Ask Ary before changing.
4. Higgsfield owned-image set for hero + passport band (needs Ary's approval,
   uses his credits). Wire via --hero-image / --band-image.
5. alcoholdex-brand skill: Ary said yes in spirit; not yet built. Encode this
   HANDOFF's design-system section + catalog conventions into a .skill.
6. Lenis smooth scrolling + parallax (deferred; site works without).

## Rules that must never break

- Every bottle id unique; schema: id,name,cat,style,country,abv,color,tags,fact,serve[,leg]
- Categories fixed: Whisky, Wine, Beer, Gin, Vodka, Rum, Agave, Liqueur,
  Brandy & Cognac, Sake & Asian (new cat needs a shape in shapes.js CAT_SHAPE)
- No hardcoded catalog counts in UI — everything derives from CATALOG.length/LEG_TOTAL
- Firm rule from Ary's world: no em-dashes is a BECO work rule, NOT for this
  project's copy — the speakeasy voice uses them freely.
- Never touch futari_rooms in Supabase.
