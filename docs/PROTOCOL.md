# The protocol: every message and event

Moved from CLAUDE.md section 3 (the router keeps the shape of it and the recipe for a new message). The code: `receive()` in `src/server/api.js` (its top comment lists the messages), `applyEvent` / `netHandle` in `src/game/net/client.js`, `chunkSend` / `unchunk` in `src/game/net/transport.js`.

- Client → server: `hello{acct,name,look,save[,user,pass|token]}`, `register{user,pass}`, `logout{token}`, `pos{p:[x,y,z,face,vx,vz]}`, `atk{k:'basic'|'skill'|'burst',tg,face,aim}`,
  `equip{id}`, `unequip{slot}`, `cls{cls}`, `buy/sell{id}`, `merge{id}`, `accept/turnin/abandon{id}`,
  `buyskill{id}`, `eqskill{id[,idx]}` (idx: the passive slot), `unskill{cls,slot[,idx]}` (slot `'pass'` + idx for a passive), `upskill{id}`, `soul{el}`,
  `look{look}`, `ft{cmd:'set'|'try'|'all',v}` (version 2 testing, no dev switch: unlock a skill set, put it on; never a level; `server/skillsets-free.js`), `chat{text}`, `name{name}`, `warp{to:'home'|'hanami'|'rimehold'|'highmark'}` (from a teleport circle; the client's travel window), `mq{a:'talk'|'pick'|'read',id|i}` (the main quest), `learn{id}`, `gather{i}` (starts a cast) and `sellres{id,n}` (professions), `craft{slot,tier,rar}`, `brew{id,n}` and `potion{k}` (crafting, brewing, drinking), `zt{land:'home'|'vale'|'hoar',n}` (play a land at zone tier n: in a village only), `dev{cmd,v}`.
- Server → client: `welcome{...,look?}` (`look` only for a logged-in account: its own look replaces the browser's), `mons{list}` (roster), `you{...}` (private
  state incl. `gear`), `tp`, `kicked`, `auth{user,token}`, `authfail{text}`,
  `snap{day, n, pl, mo, b (one entry per boss), w (weather), ev:[events]}` 8-20×/s, **made per player**: `mo` holds only the monsters
  you can see (within 110 m, bosses 190 m: the client draws 95 / 170 m) and only when changed since the last time they were sent to
  you (those within 40 m every snapshot, farther ones every second), `pl` yourself and the players within 250 m (the rest once a
  second), `n` the head count. Constants `SNAP_*` and the reasoning are in `server/api.js` (`broadcastSnap`). The claude.ai room
  host keeps one message for everyone (`io.broadcastSnaps`), since its channel is one shared 4 KB topic.
- Events (`ev(...)` on the server, `applyEvent` in `net/client.js`): dmg (`[id,v,crit,by[,fx]]`: fx 1 / -1 = the element helped / hurt), kill, imm, mact, aggro, respawn,
  spawn, despawn, proj, pend, tele (`[id,kind,x,z,r,dur,face,half]`), tend (`[id,fired,x,z]`), zone / zend, wall / wend, pfx (`[pid,kind,dur,vx,vz]`: root, slow, push; the client applies it to itself), roar, area, aend, chain, buff, xp, coins, loot, lvup, hurt, down,
  up, toast, qdone, qturn, pact, pjoin, pleave, pgear, plook, pname, chat, merge, skillslot, skillbuy,
  weather, thunder, lvset, warp, vale, north (`[pid,1 ice wall open|2 walked into Rimehold]`), west (`[pid,1 the Greyspine's ice fall open|2 walked into Highmark]`), gate (`[pid,'river'|'neck']`: a rock fall in the Greyspine's west wall gave way), node (`[i,1 taken|0 back]`, a resource node), cast (`[pid,i,seconds]`: your gather cast began) / castx (`[pid]`: it broke), gather (`[pid,i,resource,n]`: the cast ended), drop (`[pid,mat,n,monId]`), skillup, soul, mq (`[pid,stepId,1 started|2 handed in]`), and for the skill sets `ast` (`[pid,kind,v,dur,piece]`), `fxa` (`[pid,'heal'|'shield',piece]`), `cdr` (`[pid,slot,seconds]`: a cooldown refund) and a last field `piece` on `area` / `proj` / `chain` / `beam`: the set piece that caused it, so the client draws it in the set's look (`docs/skillkits/VISUALS.md`). Elemental reactions and skill sets: aura (`[monId,el|0,dur]`: an element's aura on a monster, 0 = gone), react (`[monId,pairKey]`), st (`[monId,kind,v,dur,by]`: `vuln` / `weak`), mk (`[monId,markId,n,dur,ownerId]`: a kit's mark, drawn only for its owner, n 0 = spent), ast (`[pid,kind,v,dur]`: an ally buff), ssget (`[pid,setId,pos]`: a piece earned); `dev{cmd:'set',v:'<set id>'}` gives a whole set.
- To add a feature that changes state: handle a message in `receive()` (server/api.js), mutate state,
  call `ev('name', ...)` and/or set `p.dirty=true` (→ a `you` update + save), then handle the event in
  `applyEvent` on the client.

## Messages that feature files register (`MSG`, `server/state.js`)

`receive()` falls back to `MSG[msg.t]`, so a feature adds a message without editing the switch: `MSG.party=(p,msg)=>...` (`server/party.js`: `a` = invite / accept / decline / kick / leave / lead...), `MSG.dg` (`server/dungeons/lobby.js`: `a` = open / start / accept / decline / leave / revive / use), `MSG.temper{id,worn}` (`server/dungeon-gear.js`: tempering), `MSG.rwdev` (the testing tool for the rewards, `S.dev` only). Their answers are messages and snapshot fields of their own (`pty`, `dgboard`, `dgi`, `dg` in the snapshot: `server/dungeons/`, `game/dungeon/`; `docs/areas/dungeons.md`). `grep -rn "MSG\." src/server` lists them all.

## Rules every message obeys

- **Sizes.** A WebSocket message is at most 1 MB (the Node host cuts the socket); in the claude.ai room (Shared mode) at most 4 KB, so bigger ones travel as parts in both directions (`chunkSend`, `docs/areas/accounts-net.md`).
- **Rate.** One socket may send 120 messages a second (burst 240); the rest are dropped (`MSG_RATE` in `node/main.js`).
- **Strings are not keys.** `receive()` drops a message that carries the name of an `Object.prototype` member (`constructor`, `__proto__`...) in any field but the free-text ones (`text`, `name`, `user`, `pass`, `token`): the registries are plain objects.
- **Looks are cut down** to flat primitives on arrival (`cleanLookS`, `server/players.js`), saves go through `sanitizeGear`, numbers are clamped (`clampInt`).
- **A handler that throws** is logged by the host and does not stop the world; `S.ctx` (the dungeon run a message belongs to) is reset in a `finally`.
- **Test.** `server-smoke` (a check per feature), `npm run fuzz` (garbage at every handler, mutated saves), `room-smoke` (parts).
