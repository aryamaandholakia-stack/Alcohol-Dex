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

## Status ✅ v12 — Your Globe

New top-nav tab "Your globe" (nav-globe / page-globe), a vanilla port of
the Aceternity Globe3D spec on the already-loaded three.js r128:
- js/globe.js. Blue-marble + topology-bump textures (unpkg three-globe
  assets), Phong shading, back-side fresnel ATMOSPHERE shader in the spec
  #4da6ff, autoRotateSpeed 0.3 with drag + inertia (manual controls — no
  OrbitControls at r128), pixelRatio capped 2, loop pauses when tab/page
  hidden. showPage now writes state.page (was never set — switchLedger's
  page checks were dead code, now live).
- PINS = DONE ITEMS ON THE ACTIVE LEDGER (personal or open circle;
  ledger-select present on the page; switchLedger re-renders the globe).
  Items resolve country/city strings via a ~260-entry GEO table
  (city-first, then country, "A / B" tries each, substring fallback);
  buckets per place → marker sized by count, colored by the dominant
  dex's accent, halo ring, hover = 1.6x + pill label ("Tokyo — 4
  memories"), click = toast with up to 3 item names. 84% of the full
  catalog resolves; "Anywhere"-type entries are honestly reported as
  unpinnable in the page line.
- Editors mode: framed light canvas + white pill label.
DEPLOY: replace index.html, css/styles.css, js/app.js; ADD js/globe.js.

## Status ✅ v11.1 — PlaceCard collectible cards

Grid cards rebuilt from Ary's uploaded Airbnb-style PlaceCard component,
adapted to the house (vanilla, no framer/shadcn):
- Anatomy: .card > .card-media.bottle-wrap (art + overlays) + .card-body
  (top row: name + legendary outline badge; sub; footer: № + tier pips
  left, "Open →" affordance right — arrow slides on hover).
- Frosted badges over the art, COLLECTED CARDS ONLY (hunt secrecy holds:
  locked cards stay nameless, smoke-tested against leaks): first two
  flavor tags top-left; top-right shows personal ★ rating (personal
  ledger only) or ◆ for logged legendaries.
- Motion: whileInView port — IntersectionObserver adds .in with
  per-card --stagger (i%8 × 60ms), rise+fade; hover = scale 1.03 +
  soft spring-ish shadow (cubic-bezier .34,1.56,.64,1). Reduced-motion
  shows cards instantly.
- Editors mode: same anatomy in gallery-light dress (white frosted
  badges, ink accents, 14px radius).
- Image carousel/dots from the original intentionally dropped — one art
  per collectible; chevrons over generated SVGs would be theater.
DEPLOY: replace js/app.js + css/styles.css only.

## Status ✅ v11 — the Woven Light hero

Home hero rebuilt from Ary's uploaded "Woven by Light" React/Three.js
component, ported to vanilla for the no-build stack:
- js/woven.js + three.js r128 via cdnjs (script tags after app.js).
  #woven-canvas replaces hero-scene/hero-photo (scrim kept for legibility;
  their CSS rules are now dormant).
- The silk: torus-knot particle field (30k desktop / 14k mobile / 6k
  reduced-motion) with mouse/touch repulsion, spring return, damping, slow
  rotation. Optimized: no per-particle Vector3 allocation, pixelRatio
  capped at 2, render loop pauses when #page-home is hidden or tab blurred.
- Palette is HOUSE not rainbow: brass/amber hues with 6% rare sparks in
  the dex accent colors (✦ purple, ◉ blue, ember, jade), additive
  blending. Editors mode retints live to near-mono graphite at 0.35
  opacity, normal blending — window.wovenSetMode(light) called from
  setEditors().
- Headline: Playfair Display 700 (added to the Google Fonts link),
  per-letter staggered rise (.w-ch spans, 18ms cascade from 1.2s),
  text-glow. Reduced-motion shows letters instantly.
- CTA now .btn-glass ("Explore the collection") — frosted white glass,
  ink-glass variant in editors mode.
DEPLOY: replace index.html, css/styles.css, js/app.js; ADD js/woven.js.

## Status ✅ v10 — two shelves, Circles, the elegant editor

1. HOME = TWO SHELVES. Registry groups are now "dex" (alcohol — what you
   collect) and "list" (bars/xp/thrills/friends/countries — what you live).
   Home renders "The Collector's Dex — what you hunt and keep" then
   "The List — everything to live before it's over". Hero line updated.
2. CIRCLES — shared group passports (WhatsApp-group model, max 3/user).
   Migration `pokedex_v10_circles` APPLIED on yxpcmmsfrvxbgdjzuspr:
   alcoholdex_circles (name, unique 6-char code), alcoholdex_circle_members,
   alcoholdex_circle_logs (PK circle+dex+bottle — one tick counts for all).
   RLS via SECURITY DEFINER alcoholdex_is_member() (no policy recursion).
   RPCs: create_circle / join_circle (both raise CIRCLE_LIMIT at 3),
   leave_circle, my_circles (returns member handles). alcoholdex_duo_logs
   DROPPED — duos retired, a duo is just a 2-person circle now.
3. LEDGER SWITCHER. state.ledger = null (personal) | circle. Two
   .ledger-select dropdowns (dex controls + passport head): "My passport"
   vs "◍ circle". Switching fetches circle logs into state.logged/metAt
   (personal sets backed up in `personal`); log/unlog route to
   circles.log/unlog when a ledger is active. Ratings, intake, taste
   profile, and Year Wrapped are personal-only (hidden in circle mode).
   Passport header becomes "The Circle Passport — ◍ name" + code + members;
   share card signs as the circle.
4. CIRCLES MANAGER lives where the old leaderboard was ("The circles —
   shared passports"): rows with code chip + Open/Leave, create + join
   forms (hidden at the 3-circle cap). Old friend-leaderboard UI removed
   (alcoholdex_friends table remains, unused).
5. EDITOR'S MODE refined — clean/minimal/elegant: #FCFCFB canvas, hairline
   #EEEEEA borders, 10–14px radii, ghost buttons that fill black on hover,
   thinner chip underlines, letterspaced micro-eyebrows, soft 5% shadows.
   All appended as a v10 override block (wins cascade over v7 skin).
DEPLOY: replace index.html, css/styles.css, js/app.js, js/features.js,
js/dexes.js. No new files beyond v9's. Migration already live.

## Status ✅ v9 — the big rebalance (1,000 bottles, all countries, xp restored)

Ary's five changes, all shipped:
1. ALCOHOLDEX → EXACTLY 1,000 bottles. New file js/catalog-expansion-2.js
   (ids x001–x360, pushes onto CATALOG; script tag after catalog-expansion.js).
   Adds: deep Scotch (Campbeltown, Islay cult, GlenDronach/GlenAllachie),
   allocated bourbon (Weller, Stagg, Taylor, Booker's), Irish pot still,
   Japanese craft (Chichibu, Mars, Kanosuke), world whisky; Bordeaux first
   growths + Pétrus, Burgundy villages, Champagne houses, Super Tuscans,
   sherry/madeira/vin jaune/orange wine; German/Czech/Belgian/US-craft/world
   beers; Foursquare/Hampden/agricole/cachaça/clairin rums; boutique tequila
   (Fortaleza, G4, Ocho, El Tesoro) + village mezcals; world gins; amari +
   vermouth + absinthe/falernum/allspice; cognac/armagnac/calvados/jerez/
   pisco/pálinka/slivovitz; deep sake + shochu + soju + baijiu + SE-Asian
   spirits; final vodkas. Cats now: Whisky 255, Wine 149, Beer 139, Liqueur
   82, Rum 80, Agave 70, Sake & Asian 69, Gin 66, Brandy & Cognac 50, Vodka 40.
2. BARDEX = top bars of the world + the Bourdain trail: +38 (br054–br091),
   new cats "The World's Best" (30: Connaught, Paradiso, Handshake, Tayēr,
   Dante, Attaboy, DCP, Katana Kitten, Limantour, Jigger & Pony, Coa,
   Benfiddich, Gen Yamamoto…) and "Hotel Classics" (8: Savoy American Bar,
   Bar Hemingway, Dukes, Artesian, Raffles Long Bar, Bemelmans, Harry's Bar
   Venice, Café La Habana). 91 total, tiers 11/50/23/7.
3. EXPERIENCEDEX RESTORED (id "xp", js/dex-xp.js recovered verbatim from the
   v2 build via transcript extraction). Original 50 intact (The Once = 6 legs:
   eclipse, aurora storm, whale shark, Holi Vrindavan, turtle hatch, midnight
   sun). Bourdain wing appended as xp051–xp080 (Bún chả, omakase, kitchen
   shift, stranger's-home meal, fixer-for-a-day, scooter chaos, land border,
   cold plunge, iftar, Día de los Muertos, "headlines said don't"…) — camera
   stunts (coin flip, ask-a-stranger, 24h-of-yes, busking) deliberately
   EXCLUDED per Ary. New cats Strangers & Kin + Seek Discomfort. All 80
   tiered (14/31/29/6). Keeper: the fixer. Tagline "Live like Tony taught".
   BourdainDex (dex-bourdain.js) DELETED — its best content lives in xp now.
4. COUNTRYDEX = ALL nations: co091–co196 appended (every remaining UN member
   + Kosovo; Israel & Palestine and Zambia & Zimbabwe remain combined legacy
   entries). 196 entries. The Far Ends unchanged (7 legs).
5. BOOKDEX REMOVED entirely (file, script tag, registry row, intake). Logged
   bk ids harmless via byId guard.

Totals: 6 dexes, 1,472 collectibles, 50 legendaries, 30 per-dex badges.
Bourdain quotes retained (home/dex/passport). Tiers live on bars + xp.
DEPLOY: delete js/dex-books.js + js/dex-bourdain.js from repo; add
js/catalog-expansion-2.js + js/dex-xp.js; replace index.html, js/dexes.js,
js/dex-bars.js, js/dex-countries.js.

## Status ✅ v8 — The Bourdain restructure

Per Ary: DubaiDex REMOVED (didn't like it), ExperienceDex REMOVED, replaced by
BourdainDex — the whole non-alcohol wing is now Bourdain-universe.

- NEW: js/dex-bourdain.js — id "bourdain", 60 experiences, keeper "the fixer"
  (every episode had one), verb "lived", legName "The Rules", accent #7D6BAF,
  glyph ✦, tiers c/u/r/l = 11/21/21/7. Cats: At the Table / Strangers & Kin /
  The Road / Seek Discomfort (Yes Theory school) / Rituals. The Rules
  (legendaries): Bún Chả on Plastic Stools, A Meal in a Stranger's Home,
  Grandmother's Kitchen, A Tattoo to Remember a Journey, Coin-Flip Destination,
  Break Bread Where the Headlines Said Don't, Work a Kitchen Shift.
  Sources: Bourdain episodes + Yes Theory + street-food-show canon. Best xp/
  dubai entries carried over (aarti, tea ceremony, fish auction, iftar…).
- DELETED: dex-xp.js, dex-dubai.js, their registry rows + intakes. Legacy
  logged xp/du ids are harmless (byId guard). City-dex home section renders
  only when a city dex exists (currently none — MumbaiDex pattern still valid).
- PER-DEX BADGES: badges.js buildDexBadges() → DEX_BADGES (7 dexes × 5:
  first / ten / half-shelf / legendaries complete / dex complete). Passport
  scoped to a dex shows ITS five honors; global "all" keeps house honors.
  checkNewBadges(dexId) toasts dex honors; login seeds earned set silently.
- BOURDAIN QUOTES: BOURDAIN_QUOTES (14 short aphorisms, each <15 words,
  attributed "— Anthony Bourdain") + bourdainQuote() in dexes.js. Rendered:
  home hero (#home-quote), every dex page under the note (#dex-quote,
  refreshes per dex switch), passport (#pass-bourdain). .dex-quote/.q-attr CSS.
- Registry re-voiced: thrills "Seek discomfort, survive it", friends "The
  people are the destination", countries "Parts known and unknown".
- Totals: 1,448 collectibles, 77 legendaries, 7 dexes.

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
