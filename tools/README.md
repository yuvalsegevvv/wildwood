# Tools

Headless helpers, made so changes can be checked without a browser and without reading the game.
Install once: `npm install` (three@0.128 for these tools). The model preview also needs Python 3 with numpy and pillow.

| Tool | What it does | Needs a build? |
|---|---|---|
| `node tools/server-smoke.js` | 16 checks of the world server straight from `src/`: join, combat, quests, shop, forge, skill slots, per-player snapshots (only monsters near you), 2-player boss, snapshot sizes, weather, chat | no |
| `node tools/accounts-smoke.js` | 17 checks of registered accounts (register, login, tokens, unique names, the account's look) with an in-memory store | no |
| `node tools/mainquest-smoke.js` | 91 checks of the main quest: a character walked through acts I-III (talks, heartleaf, kills, grey monsters, the night, lore spots, old-save flags, the profession steps W6a / W7b / W11b / V7b, Rimehold, the Wayfarers' Lodge, tools, gathering, brewing, the teleport circles, the Rimeking), broken saves and the migration of saves from before the inserted steps | no |
| `node tools/boss-smoke.js` | 36 checks of the six bosses' move sets: each is fought through its three phases by two players that cannot die; every boss must do its own moves (telegraph kinds, zones, waves, orbs, effects on players, modes, summons), have moves no other boss has, and leave nothing behind when reset or killed; also the Tide King's arena, music, skills and material | no |
| `node tools/hoarfrost-smoke.js` | 37 checks of the Hoarfrost Reach: shape (plateau, Frostgate Pass, frozen lakes, sea cliffs), nine zones and their monsters, the two bosses, the ice wall and how Akaoni opens it, Rimehold, quest board and XP for levels 22-30, mining there with a tool of the right tier (learn, tool, gather, respawn, saves) | no |
| `node tools/professions-smoke.js` | 73 checks of the professions, crafting and potions: the three tools and their slots (buy, wear, merge, saves), the 314 nodes of every land and the tool tier each needs, gathering with a tool and its cast (start, finish, broken by walking off or a knock-out), the double-yield rule, selling resources, crafting gear from ore and logs, brewing, and drinking potions (healing, might, guard) | no |
| `node tools/client-smoke.js` | 35 checks running `dist/wildwood.html` headless in solo mode: streaming, monster views, attacking, equip, inventory, skills panel, chat, map, rain, and the Hoarfrost Reach's client side (ice wall, music, the Lodge and travel windows, resource nodes and their cast bar, snow instead of rain, the tool slots, the Craft tab, the Brewing panel, the potion belt) | yes (`python3 build.py`) |
| `node tools/start-smoke.js` | 31 checks of the start card against a real world server in the same process (fake WebSocket): guest, log in, register, errors, the character editor after registering (class, look), Continue as, no-server page | yes |
| `python3 tools/unused.py` | dead-code candidates: names nothing uses, CSS nobody mentions | no |
| `node tools/model-preview.js out.png [--head] [--looks '[...]']` | renders characters (front + side) from `src/game/character/model.js` to a PNG | no |
| `tools/load.js` | `loadServer(io, names)` / `loadShared(names)` for your own quick scripts | no |
| `tools/headless.js` | `bootClient({online, expose})`: the built page in Node with a stub DOM, renderer and (online) a fake WebSocket to an in-process world server; fake elements remember listeners, so `el('#stGuest').click()` works. Used by the two client tests | yes |

Quick custom check of a server rule:

```js
const {loadServer}=require('./tools/load');
const {api:W, x}=loadServer({send(){},broadcast(){}}, ['MONS','genQuest']);
W.join('a',{save:{level:5}}); console.log(W.players.get('a').gear.q.offers.map(q=>q.title));
```
