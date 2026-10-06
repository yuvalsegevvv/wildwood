# Skill kits: themes (the only place to change a theme, a gender, a first name or an element)

> The owner asked for **themes and genders only** (plus the elements), no looks, no backstories, **first names only**, so that changing something costs **one row**. A **theme is an idea, not a kit**: the kits are the six archetypes in the `kit-*.md` files (risk DPS, safe DPS, grind, support, healer, tank). A set is one theme on one kit (or on two, for a mixed set). The kit files are theme-neutral: their piece names are cosmetic. **The Kit column holds only archetypes**; the description column is where a theme idea is named.

| First name | Gender | Kit (archetype) | Element(s) | Theme (one line) | Alternate (swap it in if you dislike the theme) |
|---|---|---|---|---|---|
| **Tansy** | female | grind (the first grinder) | **none: pure basic** | a farm-hand who harvests a whole field at once: sweeping blades, bundled wheat | a lumberjack who fells whole stands: great axes, log-driving |
| **Torgeir** | male | tank | earth | a northern shield-wall veteran: round shield, heavy mantle, unhurried | a mountain-pass gatekeeper: tower shield, a warden's keys |
| **Sazanka** | female | risk DPS | dark + air (a hybrid: DPS only) | a night courier of lantern-lit streets (the shadow-runner genre) | a forest poacher turned guide: snares, hood, knife |
| **Corvin** | male | support (debuff) | light | a lamplighter and mine surveyor: light that shows where a thing is weak | a hedge-witch of hexes and curses: charms, knotted cords (dark instead of light) |
| **Sorrel** | female | safe DPS | air | a mountain lookout who waits for one clean shot | a marsh heron-hunter with a reed bow |
| **Ambrose** | male | healer | water | a marsh herbalist and field medic | a river ferryman who tends travellers |
| **Dunstan** | male | support (buff) | fire | a standard-bearer and drummer who rallies the line | a village bell-ringer and festival caller |
| **Marigold** | female | safe DPS + support (a mixed set, the only one of the first eight) | light | a stage idol / magical girl (the genres; everything original): **a theme idea, not a kit** | none: the owner's own concept |

## Elements

- A set is **one element, or none** (`basic`). **A hybrid of two elements is for risk DPS, safe DPS and grind only** (pure: no second role, and never two soul opposites). **Support, healer, tank and a mixed set are one element or none.** How each character uses its element (flavour, which pieces, the soul, the wheel): `ELEMENTS.md`.
- **The hybrid is a trade-off** (the owner's design): only the pieces of the **soul's** element get the soul's x1.5, so it never fully uses the soul bonus; in exchange it can **react with itself** (its own earth hit then its own water hit is a reaction), which mostly helps a player **on their own**, who has no partner to react with. That is why only the roles that fight on their own get it (DPS and grind): a support, healer or tank is there for the party, where reactions already come from other players, and a mixed set has a support half. In a hybrid each piece takes one of the two elements, at least two pieces each; a single-element set has at least four of its six pieces in it.
- **The first grinder a player gets (Tansy) is pure basic**: every piece element-less, so it never has an elemental disadvantage (the owner's one requirement); a later grinder may be elemental or a hybrid.
- **The first four use disjoint element sets** (none; earth; dark + air; light), so any two of them react when partied. The second wave overlaps freely.
- Marigold's set is a mixed role (a DPS half and a support half): a mixed set is never a hybrid (the owner), so it is single-element.
- A debuff support's debuff is the **flavour of its element** (light `vuln`, dark `weak`; fire a burn, water a slow, earth a short stun): changing that theme's element changes its debuff, so it is stated in `kit-support.md`.

## Checks

- **Gender ratio: four and four** (female: Tansy, Sazanka, Sorrel, Marigold; male: Torgeir, Corvin, Ambrose, Dunstan), **two and two in the first four** (grind F, tank M, risk DPS F, debuff support M). Any character can use any skill and outfit regardless of gender (`RULES.md` section 6).
- **Names** are working first names, searched only against this repository (one clash, an existing NPC, was found earlier and dropped); a person searches the outside world before art starts.
- **IP:** a theme is a genre or a trade, never an existing character; no copied names, catchphrases, signature moves or costumes. A licensed exception is allowed only if the licence clearly makes it legal, and it is then stated directly (`RULES.md` section 6).

## How to change something

- **A theme, a gender, a first name or an element:** edit its row here (and, for an element, its row in `ELEMENTS.md`). If the first name changes, the id used for the files when built (`shared/skillsets/<id>.js`, `game/outfits/<id>.js`) is the new first name in lowercase; nothing else refers to it.
- **Keep the gender ratio** (four and four, two and two in the first four), the first four's **disjoint elements**, and **hybrids on risk DPS, safe DPS and grind rows only** (never two soul opposites); the smoke test reports all three. After changing an element, update that character's row in `ELEMENTS.md`.
- **A theme can move to another kit** (change the Kit column; the theme line may then need a rewrite). The kit files do not mention themes.

## Life of a theme

`THEME` (a row here) -> `LOOK DRAFT` (a `look.md` in `parked/` style, written only when the owner asks, from the approved theme) -> `DESIGNED` (names, numbers, icons, the IP check by a person) -> `BUILT`. Today every theme is at `THEME`; the kits' mechanics are at `DRAFT`.
