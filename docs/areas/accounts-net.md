# Start card, accounts, connections

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Start card: Log in / Register / Play as guest (Solo / Shared without a server), loading state, connecting, `beginPlay`; the first steps of a new account (character editor in creating mode, `openEditor({create:true})`)

`game/ui/start-screen.js` (`enterWorld`, `showStart`), markup `#start` in `index.html`, `styles/04-start-screen.css`; session token and the server's auth answers `game/ui/account.js`; `netReset` in `game/net/transport.js`; test `node tools/start-smoke.js`

## Pitfalls

- A class chip that "did nothing" (history): it only sent a message, so it could not work before a connection existed. The editor has **no class row any more**: your class is the weapon you hold (`clsOf`), never a cosmetic choice, and nothing in the editor resets your level. The start card does not offer class or sex before connecting; anything on it that needs the server must wait for `NET.ready`.
- A page whose server was stopped (or restarted) used to look alive but ignore everything (equip, attack, buy: the message went to a closed socket, the clock froze). It now shows a Reconnect message (`netDown` in `net/transport.js`: on a closed socket, a send to a closed socket, or no message for `NET_STALL_MS` while playing on the Node server). Remember it when testing: stopping the dev server under an open tab is what triggers it, and a recording of "nothing works" with a frozen clock is a dead connection, not a UI bug.
- The Shared (room) mode is only testable against the mock in `tools/`-style harnesses; the host tab
  must stay visible (browser timers throttle in background tabs).
- **A room message is at most 4 KB, in both directions.** The host's snapshots / `you` go out through `chunkSend(room,'s',{to,m})`, a joiner's messages through `chunkSend(room,'c',msg)`: a joiner's `hello` carries the saved gear (2 KB for a fresh hiker, 4-7 KB with items, skills and materials) plus the look, and was once emitted whole, which the room refuses (silently: only `not_permitted` is handled), so a player with a few items could never join a shared world. Parts have `c:1` because the messages have a `k` of their own (`atk{k:'basic'}`, `potion{k}`) and `unchunk()` must not take those for parts. Anything new that a joiner sends goes through `NET.send` and so is split for free; anything the host sends through `io.send` / `io.broadcast` likewise. Test: `node tools/room-smoke.js` (the real functions against a mock 4 KB room).

## Accounts

**Accounts** (`server/accounts.js`, client `game/ui/start-screen.js` + `account.js`, only in "This server" mode):
- Guest = progress under the browser's secret account code (every player from before accounts is a guest
  with their old progress). Log in = name + password; the browser then keeps a session token
  (`wildwood-session`) and the start card then offers "Continue as <name>". The start card's **Register** connects as a guest,
  registers (the guest's progress moves to the account) and opens the character editor in creating mode; guests can also register in
  Settings → Account. The guest record becomes `{movedTo}` (can't be replayed as a second copy).
- An account's look is kept in its record and comes back in `welcome` when logging in, so a new device shows the same hiker.
- Names are unique (case-insensitive): registered names can't be taken or renamed; a guest whose name is
  taken (registered or online) gets a number added. Registered names are loaded at start (`store.users()`).
- Passwords: scrypt in `AUTH` (`node/main.js`), 6-100 chars; 5 wrong tries lock that account for 1 minute.
- `GIFT_LEVELS` in `accounts.js`: restores a level on register/login (`hayru: 9`, a friend who lost progress).
- While logged in, the client does not write its local save (`saveGear`/`saveProgress`), so a guest on
  the same browser can't inherit the account's progress.
- Tests: `node tools/accounts-smoke.js` (server, in-memory store), `node tools/start-smoke.js` (the start card and editor on top of it).
