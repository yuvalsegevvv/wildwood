# Start card, accounts, connections

Area guide. Moved word for word from `CLAUDE.md` (sections 4, 8 and 9), where each item now has a short row; open this file when your task touches this area.

## Where to change what

### Start card: Log in / Register / Play as guest (Solo / Shared without a server), loading state, connecting, `beginPlay`; the first steps of a new account (character editor in creating mode, `openEditor({create:true})`)

`game/ui/start-screen.js` (`enterWorld`, `showStart`), markup `#start` in `index.html`, `styles/04-start-screen.css`; session token and the server's auth answers `game/ui/account.js`; `netReset` in `game/net/transport.js`; test `node tools/start-smoke.js`

## Pitfalls

- A class chip that "did nothing": `equipClass` only sends a message, so it can't work before a connection exists, and the editor
  did not redraw when the server confirmed the new weapon. The start card no longer offers class or sex before connecting; the editor
  redraws in `applyGear`. Anything on the start card that needs the server must wait for `NET.ready`.
- A page whose server was stopped (or restarted) used to look alive but ignore everything (equip, attack, buy: the message went to a closed socket, the clock froze). It now shows a Reconnect message (`netDown` in `net/transport.js`: on a closed socket, a send to a closed socket, or no message for `NET_STALL_MS` while playing on the Node server). Remember it when testing: stopping the dev server under an open tab is what triggers it, and a recording of "nothing works" with a frozen clock is a dead connection, not a UI bug.
- The Shared (room) mode is only testable against the mock in `tools/`-style harnesses; the host tab
  must stay visible (browser timers throttle in background tabs).

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
