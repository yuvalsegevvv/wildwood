# The main quest (code map)

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### The main quest line (acts I-IV: steps W1-W18 with W6a, W7b, W11b; V3-V11 with V7b; F1-F9; G1-G9; Wren, Linnea, Odran, Sigrun, Brenna, Ansgar; talks, herbs, gathering, professions, crafting, brewing, grey monsters, lore spots; acts V-VII (the Sunscar onward) are only planned in `docs/MAIN-QUEST.md` section 7; act IV is its section 3c)

data and talk logic `shared/main-quest.js` (`MQ`, `mqTalk`, `mqReward`, `HERBS`, `LORE`, `VIL.bed`, `V.cart`; **a step inserted in the middle of `MQ` shifts every later step's index in saves: bump `MQ_VER` and add it to `MQ_INSERTED`**); server `server/main-quest.js` (message `mq{a:'talk'|'pick'|'read'}`, `mqKillP`, `mqActP` hooks in economy/players/combat, `mqTickP`, grey monsters `GREY_DEFS` in `monster-defs.js`, dev `mq`); client `game/economy/main-quest.js` (`mqLinesFor`, `mqMark`, `mqLogRow`, `mqTarget`, `wrenAwake`, `odranHere`), talking and reading `village/talking.js`, props `world/lore-props.js`; the people in `VILLAGERS` (`kin`, `show`, pose `bed`); design `docs/MAIN-QUEST.md`, story `docs/STORY.md`; test `node tools/mainquest-smoke.js`
