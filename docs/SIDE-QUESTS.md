# Side quests

Chains of small, objective-based stories. Each chain is a run of linked steps: a person sends you to a place, what you find there sends
you to the next person, and the last step is a land's great beast. They are optional. They pay mostly in ore, logs and herbs with a
little XP (much less than the main quest), and the last step of every chain gives a cape or an aura that cannot be made at a Lodge.
Test: `node tools/sidequests-smoke.js`. Story rules: `docs/STORY.md` section 0 (hints only; every hint has two readings).

## The chains

| Chain | Land | From level | Starts with | Steps | Ends at | Cosmetic |
|---|---|---|---|---|---|---|
| The Grey Tide | the home forest | 15 | Oskar | the old boat and the tide slimes, grey pearls from the crabs (Bram, Linnea), dull scarab wings and ironroot, crag moss from the foothills, green smoke on the beach after dark | Carapax | Tide King's Mantle (cape) |
| The Nine Tails | the Sakura Vale | 21 | Grandmother Chiyo | grey foxfire ash, Jade Falls' clouded jade (Ryu), the tengu's "the sky went quiet", the painted wall of the Warlord Ruins (Kaede), elder blossoms from the Thunder Grove | Kyuubi | Foxfire (aura) |
| The Wyrm's Saga | the Hoarfrost Reach | 26 | Old Sigrun | the Glacier Tongue, the barrow wights (Hallvard), Ylva's frostbloom tea and the frost trolls, the iron bird and the Frostfang alphas | Vetrmaw | Wyrmscale Cloak (cape) |
| Where the Sun Wept | the Sunscar | 31 | Captain Omar | the singing glass of the Glass Fields, Amal's sick of the Lantern Wash, Bellrock at noon (Zahra), the Singing Dunes' two-sided embers | the Sand Wyrm | Where the Sun Wept (aura) |
| The Drowned Captain | the Gloamhorn | 30 | Reeve Maeve | the wreckers' flameless lanterns, the iron wreck below the cliffs (Brannoch), "hold the light" on the Cairn Fields (Nuala), Keeper Maelis and the sirens | Captain Dredge | Captain's Greatcoat (cape) |
| The Keeper's Light | the Gloamhorn | 35, after The Drowned Captain | Keeper Maelis | the Mourning Stones, the lamp room's door after dark, Warden Ross and the hum, Lanternfall | the Gloam Warden | Keeper's Lamplight (aura) |

The chains link to each other too: each one's last words point at the next land's giver (Oskar to Chiyo, Chiyo to Sigrun, Sigrun south-west,
Omar to Wraithwick), and The Keeper's Light opens only once The Drowned Captain is finished. The Greyspine has no chain: its second boss
(the Mountain Golem) is the main quest's G9. Keeper Maelis is a new villager of Wraithwick (`game/village/villagers.js`); the lamp room stays
locked (`docs/STORY.md`, Act V-b).

## Rules

- A chain opens at one level (`lv`) for all its steps, like the main quest's acts; `after` names a chain that must be finished first.
- A step is a main quest step's shape (`shared/main-quest.js`): `from` offers it (`null`: it starts by itself when the step before ends),
  `to` takes it back (`null`: done where you stand, `doneLine` toasted). Parts: talk (`say`, `night`, `wait`), kill, collect (a quest drop),
  read (a lore spot), gather, boss, and `visit` (a place in `SQ_PLACES`; `night`; `say` is a scene shown in the speech bubble when you arrive).
- Several chains run at once. The quest log shows one, the tracked chain (`gear.sq.t`: the last one started, or the one you pick with Track).
- Pay (`sqReward`): the chain's three resources, 3 + the step's index of each (herbs 70%), double on the last step; XP is 6% of a level at the
  chain's level (double on the last step), a sixth or less of a main quest step's. Coins: none.
- The cosmetics are in `COS_CAPES` / `COS_AURAS` (`shared/cosmetics.js`) and `CP_QUEST` (`shared/cospieces.js`): no recipe, so the Lodge does not
  list them and `cosMake` refuses them; `sanitizeCos` keeps them like a made piece.

## Code map

| What | Where |
|---|---|
| Chains, places, the talk rules (`sqTalk`), pay (`sqReward`), saves (`sanitizeSq`) | `shared/side-quests.js` |
| Progress, rewards, the `sq` message, `sqsay` scenes, the dev command `sq` (jump to a step id) | `server/side-quests.js`, `server/economy.js` (`devP`) |
| Lines, marks (teal `!` / `?`), the quest panel's Side quests tab, the log row, the map marker, scenes | `game/economy/side-quests.js` |
| Quest-only cosmetics | `shared/cosmetics.js`, `shared/cospieces.js` (`CP_QUEST`), `server/cosmetics.js`, `game/economy/cosmetics.js` |

Hooks (`grep -rn "// sidequests:" src`): `rewardKill` (combat.js), `mqMsgP` read (server/main-quest.js), the gather hook (server/professions.js),
`sqTickP` (server/players.js), `sanitizeGear` (players.js), `cosMakeP` (server/cosmetics.js), `cosRecipeText` (economy/cosmetics.js), `startTalk`,
`interact` and the prompt (village/talking.js), the label mark (village/npc-labels.js), the tab, the track button and the log row (economy/quests.js),
the map marker (ui/map.js), the events (net/client.js), the testing tools (ui/settings-testing.js).

## Adding a chain

Append a row to `SQ` (people in `SQ_NPC_VIL` and `SQ_NAMES`, new places in `SQ_PLACES`), add its cosmetic to `COS_CAPES` or `COS_AURAS` and
`CP_QUEST`, and run `node tools/sidequests-smoke.js`: it checks that every person, monster, boss, lore spot, place, node and cosmetic exists.

## The Amber Reach chains

`dawnseat` (The Dawn Seat, level 37, Warden Oruvi, to Old Thunder, pays the Dawn Seat Mantle) and `drought` (The Drought Song, level 41 after the first, Kesi and Elder Tamsa, to Oldhorn, pays the Herdsong aura). Their people are `oruvi`, `hask`, `wiru`, `ennu`, `kesi`, `tamsa` (village 7, Tallgrass): the villagers must use these ids. The bosses are checked through `rdBossRow` until they are in `BOSS_DEFS`; places come from the atlas (`SAV_*`).

## The Emberwake Isles chains (W4)

Three chains, all given and taken in Coralhaven (village 8; the waystations have no quest givers). Base settings only: Yuval writes the isles' story zone by zone, the lines here are placeholders for that pass (`docs/EMBERWAKE.md`).
- `saltwatch` (The Salt Watch, level 42, Lani / Eleaka / Elder Hina, to Ocelo; Salt Light aura): the shrinking stars seen from the Lagoon Shallows at night, the verse of the Jaguar-Lord, the Overgrown Plaza.
- `strait` (The Drowned Strait, level 44 after the first, Eleaka / Healer Nalu / Kekoa, to Tuila; Tidecaller's Cape): the tide that stays in, salt in the herbs, the drowned causeway.
- `terraces` (The Terrace Road, level 46 after the second, Makoa / Mele / Hina; Condor Wind aura): the road east, the notice "WE ARE STILL COUNTING", the seven gates. It ends with a talk, not a boss: it leads to the Seven Gates raid (W7).
New places in `SQ_PLACES`: `lagoon`, `plaza`, `strait`, `terraces`. Their cosmetics are in `COS_AURAS` / `COS_CAPES` and `CP_QUEST`.
