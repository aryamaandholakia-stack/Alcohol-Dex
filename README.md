# AlcoholDex 🥃

A Pokédex for alcohol — browse 640 bottle silhouettes (heavy Indian focus), log the ones you've
tried in real life, and watch your personal collection reveal itself.

Dark, warm, premium. 18+ only. Drink responsibly.

## What's in the box

```
index.html          App shell (all views)
css/styles.css      Full theme — edit :root tokens to restyle everything
js/config.js        ← paste your Supabase keys here
js/catalog.js       Original 350 bottles (20 legendaries)
js/catalog-expansion.js  +290 more (India-focused). Add new bottles HERE.
js/atmosphere.js    The living room: candle flicker, gold dust, smoke
js/share.js         Shareable passport card (1080×1920 PNG / native share)
js/shapes.js        SVG silhouette shapes, one per category
js/badges.js        Badge definitions + earning rules
js/app.js           App logic: auth, grid, reveal, profile
supabase/schema.sql Database setup (paste into Supabase SQL editor)
HANDOFF.md          Build state + how to continue this project with Claude
```

## Run it right now (zero setup)

Open `index.html` in a browser, or run a local server:

```bash
cd alcoholdex && python3 -m http.server 8000
```

Without Supabase keys it runs in **demo mode** — accounts and collections
save to that browser's localStorage only. Perfect for testing the feel.

## Backend: ALREADY LIVE ✅

The Supabase backend is fully configured — keys are in `js/config.js`,
and the `alcoholdex_logs` table with Row Level Security is deployed to
the "Alcoholdex" project (shared with Futari, separate tables).

## Deploy (the only step left)

1. Push this folder to a GitHub repo
2. Netlify → Add new site → Import from Git → pick the repo → Deploy
   (`netlify.toml` handles all settings — no configuration needed)

Every future `git push` auto-deploys.

Both free tiers comfortably cover thousands of users. The catalog ships
inside the app, so the database stores only tiny "user X logged bottle Y"
rows — this is what keeps running costs at zero.

## Ads

The `.ad-slot` div in `index.html` is your placeholder. Once you have an
AdSense (or other network) account, paste their snippet inside `.ad-inner`.

## Common edits

- **Add a bottle**: copy any line in `js/catalog.js`, change the `id` (must
  be unique), name, and details. The counter updates automatically.
- **New legendary**: add `,leg:true` to a bottle (keep the total at 20 or
  update the `/20` display in `index.html` + the Pantheon badge).
- **New badge**: append to the list in `js/badges.js`.
- **Retheme**: edit the `:root` variables at the top of `css/styles.css`.
- **New category**: use a new `cat` value in the catalog, then map it to a
  shape in `CAT_SHAPE` inside `js/shapes.js`.
