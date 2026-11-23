# Kingdom Reborn

A gentle, game-like habit app (offline PWA) for rebuilding your life and company: daily quests, focus blocks, boss battles for big projects, Mythic year-long goals, treasure chests, and the Keeper AI companion.

Live: https://kingdom-reborn.vercel.app

## How it's built

Plain HTML/CSS/JS, no build step. Scripts load in this order (later files extend earlier ones):

| File | What it holds |
| --- | --- |
| `app1.js`–`app4.js` | Core app: content, state, XP, quests, focus timer, views, actions |
| `keeper.js` | The Keeper (Claude API, your own key, stored only on the device) |
| `boss1.js`–`boss3.js` | Boss Battles, Lair filter/sort, Archive, Mythic (SS) bosses with minions |
| `juice.js` | Combos, treasure chests, shiny bosses, Bestiary, rested bonus |
| `sync.js` | Optional phone ⇄ computer sync through Supabase, using a private sync code |
| `voice.js` | Floating mic: spoken instructions become quest changes (offline rules, or Claude via the Keeper key when online), plus quest tags and tag filters |
| `sw.js` | Offline cache. Bump `VERSION` whenever files change |
| `supabase/sync.sql` | Database setup for sync |

## Sync setup

1. Run `supabase/sync.sql` in a Supabase project.
2. Put the project URL and publishable key in `CFG` at the top of `sync.js`.
3. Deploy. In the app: Me → Sync devices → Start syncing, then open the link on the other device.

Data is stored under a SHA-256 hash of the sync code; the table is only reachable through the two functions. The Claude API key never syncs.

## Deploy

Static files on Vercel (project `kingdom-reborn`), connected to this repo: every push to `main` deploys to production automatically. Remember to bump `VERSION` in `sw.js` when app files change.
