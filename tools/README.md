# Tools

Headless helpers, made so changes can be checked without a browser and without reading the game.
Install once: `npm install` (three@0.128 for these tools). The model preview also needs Python 3 with numpy and pillow.

| Tool | What it does | Needs a build? |
|---|---|---|
| `node tools/server-smoke.js` | 14 checks of the world server straight from `src/`: join, combat, quests, shop, forge, skill slots, 2-player boss, snapshot sizes, weather, chat | no |
| `node tools/client-smoke.js` | 9 checks running `dist/wildwood.html` headless in solo mode: streaming, monster views, attacking, equip, inventory, skills panel, chat, map, rain | yes (`python3 build.py`) |
| `node tools/model-preview.js out.png [--head] [--looks '[...]']` | renders characters (front + side) from `src/game/character/model.js` to a PNG | no |
| `tools/load.js` | `loadServer(io, names)` / `loadShared(names)` for your own quick scripts | no |

Quick custom check of a server rule:

```js
const {loadServer}=require('./tools/load');
const {api:W, x}=loadServer({send(){},broadcast(){}}, ['MONS','genQuest']);
W.join('a',{save:{level:5}}); console.log(W.players.get('a').gear.q.offers.map(q=>q.title));
```
