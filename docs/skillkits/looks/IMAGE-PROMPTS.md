# Prompts for 2D pictures of the eight outfits

Prompts for an image generator (Midjourney, Flux, Stable Diffusion, DALL-E or similar) to draw **concept art of the eight signature outfits**: the 3D kits in `src/game/outfits/` are the truth,
these pictures are for the owner's eyes, for UI art (skill-set cards, loot screens, a character-select portrait) and as a reference if a model is ever hand-painted. Nothing here is built into the game.
They were written from the finished outfits and the look documents next to this file (`<id>.md`); when an outfit changes, change its prompts. Everything is original: no prompt names an existing franchise, character or artist.

## How to use them

1. Paste the **style block** first, then one **character prompt**, then (if the tool has one) the **negative prompt**. Use the same style block and the same seed / style reference for all eight, so they read as one cast.
2. Four prompts per character: **A** a full-body turnaround (front, side, back), **B** a three-quarter portrait, **C** a costume breakdown sheet (every item on its own), **D** the weapon dressing on all three weapons (sword and shield, bow and quiver, wand), with the charm in close-up.
3. Suggested sizes: A `--ar 3:2` (wide sheet), B `--ar 4:5`, C `--ar 3:2`, D `--ar 3:2`. Generate A first, then feed it back as an image reference for B, C and D so the costume stays the same.
4. Hex colours are in each look document; the prompts use colour words because most generators ignore hex codes.

## Style block (put this first, every time)

```
semi-realistic anime-style character concept art for a fantasy forest RPG, clean confident linework with soft painterly cel shading, natural believable proportions about six heads tall
with a slightly elongated head, moderate-sized eyes (not exaggerated), a softly rounded chin and jaw, a broad flat chest on men and a natural figure on women, richly layered fabrics with visible
stitching, piping, trim and texture, every garment in two or more colours, soft studio light from the upper left, plain light-grey background, no text, no watermark
```

## Negative prompt (generic; adapt to the tool)

```
huge eyes, pointed chin, chibi, exaggerated bust, big chest on a man, plain single-colour clothes, modern clothing, text, logo, watermark, extra fingers, deformed hands, cropped head, blurry,
photo, 3D render, game screenshot, copyrighted costume, mascot animal, sailor collar, sunburst emblem
```

---

## 1. Tansy: the farm-hand (grind, no element)

**Core** (reuse in every Tansy prompt): a sturdy young woman in her late twenties, short and strong, round cheeks and freckles, warm amber round eyes, wheat-gold hair under a wide coil-straw sun hat, always smiling.

**A. Turnaround.** `character turnaround sheet, front view, side view and back view of the same woman, a sturdy farm-hand in her late twenties with freckles and warm amber eyes, wide coil-straw sun hat with a high round crown and a field-green band between cream threads, brim dipping at the front and turning up at the back, lined in field green, three wheat sprigs tucked in the band, wheat-gold braid wound round her head, loose oat-cream smock with a field-green yoke and a laced green bib, clay-red neckerchief, rolled sleeves with clay and green elbow patches, wheat-yellow sash knotted at the back with two tails, A-line skirt to mid-thigh with a scalloped clay hem and two big clay patch pockets, a wheat-ear sheaf appliqued on the back, baggy khaki patchwork breeches with squares in clay red, green and cream and a leather strap with a wheat buckle at each knee, green cloth wraps spiralled up her shins, short round-toed leather work boots with cream laces and a clay toe cap, full body, bell-shaped silhouette widest at the hat`

**B. Portrait.** `three-quarter portrait of a cheerful farm-hand woman with freckles over her nose and cheeks, warm amber eyes, a wide coil-straw hat with a field-green band and wheat sprigs, a wheat-gold braid wound round her head with a clay thread in it, a clay neckerchief with a cream border over a ruffled cream collar and a field-green laced bib, golden hour light, gentle smile`

**C. Breakdown.** `costume breakdown sheet on a light background, the pieces of one farm-hand outfit laid out separately and labelled by position only: coil-straw sun hat with wheat sprigs, wound wheat-gold braid, oat-cream smock with green yoke and laced bib and clay patch pockets, wheat sash with tails, patchwork canvas breeches with leather strap and wheat buckle, green leg wraps, leather work boots with clay toe cap and wheat cuff, a freckle pattern swatch, colour palette strip of wheat gold, field green, clay red, oat cream and leather brown`

**D. Weapons.** `three weapons dressed in the same farmhand style on a light background: a sword with ash-wood grip and clay-red guard and a round shield with hazel face and clay-red rim, a hazel longbow with clay-red tips and a quiver, a wand with a hazel shaft and a dull-steel head, each tied with cream twine and a small tied sheaf of seven golden wheat ears with a clay cord hung beside the grip, close-up inset of the wheat sheaf charm, no glow, no magic effects`

## 2. Torgeir: the shield-wall veteran (tank, earth)

**Core**: a broad, tall man in his fifties, weathered, a short grey beard with one braid from the chin, a pale scar through the left brow, pale slate-blue eyes under heavy lids, small head on a wall of a body.

**A. Turnaround.** `character turnaround sheet, front, side and back of the same man, a northern shield-wall veteran in his fifties, widest silhouette, iron spangen cap-helm with two riveted bands meeting under a bone knob, nasal bar, cheek plates and a thick grey fur rim, two heavy iron-grey braids over the chest with bone rings, short grey beard with a chin braid, quilted slate-blue coat to mid-thigh with a bone-grey placket and five bone toggles, rolled collar, leather belt with iron rings, leather bracers with iron bands, a heavy grey fur mantle over the right shoulder pinned with an iron ring brooch, a banded iron spaulder on the left shoulder, lichen-olive wool trousers bound with leather and bone cords, strapped iron greaves with rounded knee guards, fur-cuffed leather boots with iron toe caps, a drinking horn at the left hip, full body, heavy and unhurried stance`

**B. Portrait.** `three-quarter portrait of a weathered northern veteran, iron cap-helm with bone rivets and a fur rim, pale scar through the left eyebrow, heavy-lidded slate-blue eyes, grey beard fading into the skin with a braid and a bone bead, two thick braids with bone rings over a grey fur mantle, overcast cold light`

**C. Breakdown.** `costume breakdown sheet, the pieces of one shield-wall veteran outfit separately: iron cap-helm with fur rim, paired braids with bone rings, quilted slate coat with toggles, fur mantle with ring brooch, banded iron spaulder, leather belt with iron rings and drinking horn, lichen-green trousers, strapped iron greaves with knee guards, fur-cuffed boots, colour palette strip of slate blue, bone white, iron grey, lichen green and fur grey`

**D. Weapons.** `three weapons dressed in the same style: a sword with a leather grip, iron collar, bone pommel and a lichen-green wrapped blade fuller, a round shield with ash planks, a bone-and-iron rim and a lichen-green boss, a bow with lichen-green rings on the limbs and bone tips, a wand with an ash shaft and a bone cap, a charm of three bone rings, a tiny iron shield disc and one dull ochre bead, close-up inset of the charm`

## 3. Sazanka: the night courier (risk DPS, dark + air)

**Core**: a lean young woman in her twenties, violet-grey eyes with narrow vertical slit pupils, blue-black hair, three small ink tally ticks under the right eye, wry and quick.

**A. Turnaround.** `character turnaround sheet, front, side and back of the same woman, a night courier of lantern-lit streets, close ink-black hood pushed back off the face with a deep-indigo hem and a peak that curls up and back tied with a vermilion cord and a moon-grey tassel, a tiny violet glow bead with two white-blue wisps at the tip, tall stand collar with a vermilion frog knot, one long blue-black lock over the left collarbone tied with three vermilion cords, deep-indigo crossover wrap with ink sleeves and light-indigo lapel bands, cord-wound bracers with six turns of thin vermilion cord, a low cord sash knotted at the left hip with two moon-grey tails embroidered with small camellias, a flat message pouch on the right hip, deep-indigo leggings with vermilion seam cords, loose thigh-flaps with notched hems, cord wraps from ankle to knee, soft low shoes with a split toe, narrowest and lowest silhouette, caught mid-stride, vermilion only as thin trim lines`

**B. Portrait.** `three-quarter portrait of a young woman in a dark ink-and-indigo hood with a curled peak, violet-grey eyes with slit pupils and a long sharp lash, three small ink ticks under her right eye, a long blue-black lock tied with vermilion cords, moonlit alley, a violet glow bead and two white wisps near the hood's tip, wry half smile`

**C. Breakdown.** `costume breakdown sheet, the pieces of one courier outfit separately: hood with curled peak and tassel, tall stand collar, long side lock with cords, crossover wrap, cord-wound bracer, sash with two embroidered moon-grey tails, message pouch, leggings with thigh-flaps, cord leg wraps, split-toe shoes, a tally-tick face mark, palette strip of ink black, indigo, vermilion cord, moon grey and violet glow`

**D. Weapons.** `three weapons dressed in the same style: black lacquer sword and shield, bow and quiver, and wand, vermilion cord spirals on every grip, an indigo inlay band with a tiny vermilion dot every few centimetres, dark steel, a wooden courier's tag as a charm with a violet edge and two white wisps, close-up inset of the tag`

## 4. Corvin: the lamplighter and surveyor (support debuff, light)

**Core**: a narrow, precise man in his forties, silver-grey combed-back hair with a short tail, pale silver slightly narrowed eyes behind round brass spectacles, a soot smudge on the right cheekbone.

**A. Turnaround.** `character turnaround sheet, front, side and back of the same man, a lamplighter and mine surveyor, tall narrow column silhouette, leather cap of six gores in two shades sewn with brass welts, a verdigris-green band engraved with brass tick marks, a stiff short brim, rolled ear flaps, a hooded brass lamp on the front with a small warm-white glow, round brass-rimmed spectacles, silver-grey waved hair with a short tail bound with a brass ring, long waxed charcoal coat to mid-calf with a double row of brass buttons (three with verdigris faces), a wide V collar over a lamp-white cravat with a brass pin, leather shoulder caps and cuffs with brass tick bands, a belt with a ticked brass ruler, a tape-measure case and a plumb bob, close dark leather leggings with brass-buckled straps, heavy lace-up nailed boots with brass toe caps and stirrup heel plates, full body`

**B. Portrait.** `three-quarter portrait of a precise middle-aged surveyor, leather cap with a hooded brass lamp glowing warm white, round brass spectacles with a glint on each lens, pale silver eyes, a soot smudge on his cheekbone, silver waves, a verdigris band with engraved brass tick marks, a lamp-white cravat with a brass pin, dim mine light`

**C. Breakdown.** `costume breakdown sheet, the pieces of one surveyor outfit separately: cap with lamp and verdigris tick band, spectacles, hair with brass ring, long charcoal coat with brass buttons, belt with ruler and tape case and plumb bob, strapped leather leggings, nailed boots with stirrup heel plates, a soot-smudge face mark, palette strip of brass, charcoal, lamp white, verdigris and leather brown`

**D. Weapons.** `three weapons dressed in the same style: brushed steel sword and walnut shield with brass and verdigris bands, a walnut bow with brass bands, a staff, leather grips with brass bands, a charm on chains made of a hooded lantern with a warm-white glow, a plumb bob and an engraved tally tag, close-up inset of the charm`

## 5. Sorrel: the mountain lookout (safe DPS, air)

**Core**: a tall, slim, very still young woman in her twenties, pale sky-grey narrowed upturned eyes, two faint windburn streaks on each cheek, long white-blond hair fading to pale sky at the ends, blown to one side.

**A. Turnaround.** `character turnaround sheet, front, side and back of the same woman, a mountain lookout, tallest and lightest silhouette, leather browband with cream piping and brass rivets, brass snow goggles pushed up into the hair with sky-blue glass, one long grey-white barred feather behind the right ear, white-blond hair fading to pale sky with a middle parting, two thin plaited temple braids tied with sky thread and small feathers, a long back curtain of hair blown back and to the left ending in separate long locks, cream layered tunic with a slate yoke edged in sky piping, a sky placket with cream toggles, a leather chest strap with a carabiner, bell cuffs lined in sky, two cream-and-sky striped scarf loops and two very long scarf tails streaming back and to the left, slate climbing trousers, a tunic skirt in two halves with a snow hem, leather knee pads, rope coils at the hips, climbing boots with a snow-fleece top and rope wrapped twice round each ankle`

**B. Portrait.** `three-quarter portrait of a calm young woman on a windy ridge, narrowed upturned pale sky-grey eyes, windburn streaks on her cheeks, white-blond hair streaming to one side, brass goggles pushed up into her hair, a leather browband and a barred feather behind her ear, a striped cream-and-sky scarf, cold clear light`

**C. Breakdown.** `costume breakdown sheet, the pieces of one lookout outfit separately: browband with goggles and feathers, long hair with temple braids, layered cream-and-slate tunic with chest strap, very long striped scarf, climbing trousers with split tunic skirt and knee pads, rope coils, snow-fleece boots with rope ankles, windburn face streaks, palette strip of sky blue, cream, slate, snow white and feather grey`

**D. Weapons.** `three weapons dressed in the same style: cream wax-wrapped grips with sky thread bands, silver-white metal, cream ash wood, slate feather-vein lines along blades and limbs, a charm of a small wind lens in a brass ring with a feather tuft and a pale sky glint, close-up inset of the charm`

## 6. Ambrose: the marsh herbalist (healer, water)

**Core**: a soft-spoken tired man in his thirties, brown hair with warm streaks in a low nape knot pinned with a pale reed, warm green gentle eyes with a drooping outer lid, a thumb-smear of marsh clay on the left cheekbone.

**A. Turnaround.** `character turnaround sheet, front, side and back of the same man, a marsh herbalist and field medic, soft rounded triangle silhouette, white linen head-wrap with green edge stripes knotted at the left temple with a sprig of mint, a tall woven reed cone hat with a river-green band slung on his back by a cord, brown hair in a low knot pinned with a reed, a river-green open apron-robe with shell-white piping and a reed-leaf patch over a shell-white shirt with rolled sleeves and linen wrist wraps, a skirt of two half-robes with a reed-coloured wave hem, a leather belt with five small glass vials glowing faintly aqua, a canvas herb satchel on the left hip with a green scalloped flap and herbs sticking out, clay-coloured breeches rolled above the knee, bare calves with leather shin guards and brass-shell buckles, wide soft river-green wading boots with a folded reed cuff and a dried-mud patch`

**B. Portrait.** `three-quarter portrait of a gentle tired herbalist, white linen head-wrap with a mint sprig, warm green eyes with a drooping outer lid, a thumb-smear of grey-brown clay on his left cheekbone with two drips, a tall woven reed hat on his back, a belt of small glass vials with a faint aqua glow, misty marsh morning`

**C. Breakdown.** `costume breakdown sheet, the pieces of one marsh herbalist outfit separately: linen head-wrap with mint, woven reed cone hat, hair knot with reed pin, open green apron-robe over a white shirt, vial belt, herb satchel with herbs, rolled breeches with shin guards, folded wading boots, a clay-smear face mark, palette strip of river green, shell white, clay brown, aqua and reed yellow`

**D. Weapons.** `three weapons dressed in the same style: reed-and-linen wrapped grips, willow wood, pale shell-brass metal, river-green thread bindings, a wave pattern, a soft aqua orb on the wand, a charm of a drying herb bundle with a tiny shell bell and a small glowing glass vial, close-up inset of the charm`

## 7. Dunstan: the standard-bearer (support buff, fire)

**Core**: a big warm man in his forties, copper hair in a long braided queue, warm brown eyes with lifted brows, a waxed copper handlebar moustache, three ember-red finger stripes on one cheek.

**A. Turnaround.** `character turnaround sheet, front, side and back of the same man, a standard-bearer and drum-major, tall plumed silhouette, a tall flared ember-red shako with a gold braid band, a gold flame badge in a ring, a black visor with a gold edge, a gold chin cord and a plume of white feathers with ember tips, a thick braided copper queue bound with three gold rings, waxed copper handlebar moustache, a soot jerkin with a gold-edged stand collar and rank stripes, an ember-red tabard with a gold border and a gold three-tongued flame emblem, flaring to the thigh, gold epaulets with fringe, a leather belt with a gold-and-red buckle, leather sling straps crossing chest and back, a cream snare drum with red hoops and brass rods slung at the left hip, soot parade breeches with a gold stripe down each outer seam, tall soot marching boots with gold rim, rivets and toe caps`

**B. Portrait.** `three-quarter portrait of a warm, booming drum-major, tall ember-red shako with a gold badge and a white plume tipped in ember, waxed copper handlebar moustache with curled tips, warm brown eyes, three ember-red finger stripes on his cheek, gold epaulets and a gold-edged soot collar, a cream drum at his hip, late afternoon parade light`

**C. Breakdown.** `costume breakdown sheet, the pieces of one drum-major outfit separately: plumed shako, braided queue with gold rings, soot jerkin, red tabard with a flame emblem, epaulets, sling straps and belt, snare drum with sticks, striped breeches, marching boots, handlebar moustache, palette strip of ember red, gold, soot black, drum cream and copper`

**D. Weapons.** `three weapons dressed in the same style: ember-red leather grips with gold wire, bright steel with gold fittings, dark ash wood, a gold flame-notch pattern every few centimetres, a swallow-tail ember-and-gold pennant and a tiny drum hanging as a charm, a faint ember glow at the pennant's edge, close-up inset of the charm`

## 8. Marigold: the stage idol (mixed safe DPS and support, light)

**Core**: a small bright young woman in her twenties, big glossy hazel eyes with a lantern-shaped highlight, marigold-orange hair in high twin tails with drill-curl ends and an antenna strand, a tiny gold lantern glyph under her left eye.

**A. Turnaround.** `character turnaround sheet, front, side and back of the same young woman, a stage idol, a little stage of a silhouette, a thin gold halo above her hair with six softly glowing paper lanterns hanging on gold cords with plum-and-marigold tassels, marigold-orange high twin tails ending in drill curls with plum bows and trailing ribbons and a gold bead, a short plum curtain-pleated bolero jacket with marigold piping and puffed sleeves with cream frills, a cream laced bodice with marigold laces and a gold lantern button, a cream ruffled collar with a plum bow and a tiny gold bell, a plum waist sash with a big cream back bow, a bell skirt of three tulle tiers in cream, plum and marigold with scalloped ruffled hems, plum-and-marigold sash streamers, cream thigh-high stockings with plum garters, tall plum lace-up boots with gold toe caps, a cream frill and three tiny gold bells at each top, saturated colours, original design`

**B. Portrait.** `three-quarter portrait of a radiant small stage idol, big glossy hazel eyes with lantern-shaped highlights, marigold-orange twin tails with drill curls and plum ribbon bows, a floating gold ring of six glowing paper lanterns above her head, a cream ruffled collar with a plum bow and a tiny gold bell, a tiny gold lantern glyph under her left eye, warm stage light, shy smile`

**C. Breakdown.** `costume breakdown sheet, the pieces of one stage idol outfit separately: lantern halo crown, twin tails with bows and ribbons, plum curtain bolero with cream laced bodice, cream collar with bow, waist sash with back bow, three-tier tulle skirt with streamers, stockings with garters, plum lace-up boots with bells, a lantern-glyph face mark, palette strip of marigold orange, cream, plum and glowing gold`

**D. Weapons.** `three weapons dressed in the same style: plum grips wrapped with marigold ribbon, cream lacquer limbs and shafts, pale-gold metal with gold filigree vines, a small paper lantern charm with a gold cap, a plum tassel and two plum-and-marigold ribbons, glowing warm gold, close-up inset of the lantern charm`

---

## A cast sheet (all eight together)

`character lineup of eight original fantasy heroes standing side by side on a plain light-grey ground, heights varying from the small stage idol to the tall lookout, the broad veteran in the middle, each clearly different in silhouette and colour: a wheat-and-green farm-hand with a straw hat, a slate-and-fur shield-wall veteran, an ink-and-indigo night courier, a charcoal-and-brass surveyor with a glowing cap lamp, a cream-and-sky lookout with a long scarf, a river-green herbalist with a reed hat on his back, an ember-red drum-major with a plumed shako, a marigold-and-plum stage idol with floating lanterns`
