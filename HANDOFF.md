# HANDOFF — project state for continuing in a new Claude chat

If you're reading this in a fresh session: upload the alcoholdex zip and say
"Continue building AlcoholDex — read HANDOFF.md first."

## Project

AlcoholDex — a "Pokédex for alcohol." Bottles appear as black silhouettes;
logging one (I've tried it IRL) triggers a color-pour reveal with name,
origin, ABV, tasting tags, fun fact, serving note. 20 legendaries get
confetti + a LEGENDARY FIND toast. Badges + per-category progress + a
personal Passport page. Email/password accounts, collections sync via
Supabase. Free stack: static site on Netlify + Supabase free tier.
Aesthetic: dark warm premium (near-black, amber/gold, Fraunces serif,
film grain, floating bottles, shimmering silhouettes). 18+ gate,
"drink responsibly" footer. Owner: Ary. House rule: bottles catalog must
stay at exactly 350 with exactly 20 leg:true.

## Status: v1.1 COMPLETE ✅ — backend LIVE

Supabase project "Alcoholdex" (id yxpcmmsfrvxbgdjzuspr, ap-south-1) is
configured via MCP: table public.alcoholdex_logs + RLS policies deployed,
keys wired into js/config.js. Old empty prototype tables (logged_bottles,
earned_badges, profiles) dropped. futari_rooms coexists — do not touch.
Only remaining step: push to GitHub + connect Netlify.

New in v1.1 — "Tell the Bartender": fuzzy identification (token + style +
Dice bigram typo tolerance) so users log by naming what they drank instead
of guessing silhouettes; plus Bartender's hints (country/strength/one note)
on locked bottle cards for browse-side hunting.

- [x] index.html — age gate, auth, dex grid, profile, modal, ad slot, footer
- [x] css/styles.css — full theme, reveal/pour animation, shimmer, grain
- [x] js/config.js — Supabase keys placeholder + DEMO_MODE fallback
- [x] js/catalog.js — 350 bottles validated (350 unique ids, 20 legendaries, 62 countries)
- [x] js/shapes.js — 9 SVG silhouettes mapped to 10 categories
- [x] js/badges.js — 14 badges
- [x] js/app.js — auth (Supabase + localStorage demo), grid, search/filters,
      reveal flow, unlog, badges, profile, toast, confetti
- [x] supabase/schema.sql — logs table + RLS policies
- [x] Smoke-tested: catalog integrity via node; app logic reviewed

## Sensible next steps (v1.1+ backlog)

- Migrate to React + Vite once vanilla version is stable (Ary's stated plan)
- Tasting notes: let users attach a rating/note per logged bottle
  (add `note text, rating int` columns to logs table)
- Social: shareable passport page / compare with a friend
- "Bottle of the day" spotlight on the dex page
- PWA manifest for install-to-homescreen
- Real AdSense integration in .ad-slot

## Key implementation notes

- DEMO_MODE auto-activates while config.js has placeholder keys
- Search deliberately does NOT match hidden bottle names (no spoilers)
- Badge toasts fire only for newly-crossed thresholds in a session
- prefers-reduced-motion is respected globally
