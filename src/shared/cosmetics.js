//@ Cosmetics (version 3): auras (a glow, a ring or drifting particles around the character) and capes, made at a Wayfarers' Lodge (the free ones need no making). Pure.
/* The professions no longer give gear (that comes from the dungeons), so their main reward is looks. Two new parts of the character's look (look.aura, look.cape: a short id, '' = none):
   - an AURA: COS_AURAS, drawn by game/character/cosmetics.js as additive particles (style 'orbit' motes circling the body, 'rise' sparks climbing, 'fall' petals drifting down) and/or a glowing ring on
     the ground (ring: true);
   - a CAPE: COS_CAPES, a cloth on the back with a trim and a hem, swaying with the walk.
   Two plain auras and three plain capes (the backpack among them) are free; the rest are made at a Lodge (cosCost, recipes in shared/cospieces.js: professions' resources, monsters' drops, coins). What you own is gear.cos, a list like ['a:firefly','c:wayfarer'];
   the server throws out any aura or cape of a look that you do not own (cosCleanLook), so a hacked client cannot wear another's. Ids are keys of plain objects: always check own properties.
   owns: COS_AURAS, COS_CAPES, COS_AURA, COS_CAPE, cosCost, cosKey, cosOwns, sanitizeCos, cosCleanLook.   used by: server/cosmetics.js, game/character/cosmetics.js, game/economy/cosmetics.js, the editor.   test: tools/revamp-smoke.js, tools/cospieces-smoke.js */
// [id, name, grade 1..6, colour, second colour, style, ring, how many particles, a short line, shape of a particle, the ring's decoration]
// shapes (game/character/cosmetics.js): mote (a spark with a halo), flame (a tongue of fire), leaf, petal (five petals), flake (a six-armed snowflake), wisp (a head and a fading tail), star (a four-point star), drop (a falling bead), grain (a spinning fleck)
// ring decorations: runes (ticks round the ring), spikes (crystals standing on it), halo (a second ring turning over the head), double (a second, wider ring), none
const COS_AURAS=[
  ['firefly','Firefly Veil',1,0xffe27a,0xfff6c0,'orbit',false,10,'Warm motes circle you, slowly.','mote','none'],
  ['dew','Dewfall',1,0x8ad0ff,0xe6f6ff,'fall',false,12,'Bright beads of dew fall past you.','drop','none'],
  ['ember','Emberdrift',2,0xff7a2a,0xffd070,'rise',false,14,'Tongues of flame climb off your shoulders.','flame','none'],
  ['verdant','Verdant Halo',3,0x7aff9a,0xd0ffd8,'rise',true,8,'A green rune ring glows at your feet and leaves float up.','leaf','runes'],
  ['blossom','Blossom Fall',4,0xffa8c8,0xffe0ec,'fall',false,16,'Five-petal blossoms drift down around you.','petal','none'],
  ['gale','Gale Ring',4,0xdff4ff,0x9ad8e8,'orbit',true,10,'Streaks of wind wheel round you inside a pale ring.','wisp','double'],
  ['frost','Frostglint',5,0x9ae0ff,0xffffff,'rise',true,12,'An ice-crystal ring and turning snowflakes.','flake','spikes'],
  ['dune','Sunscar Heat',5,0xffb43a,0xff5a2a,'orbit',true,12,'Glowing sand circles you above a rune ring.','grain','runes'],
  ['wisp','Gloamwisps',6,0xb07aff,0xe0c8ff,'orbit',false,8,'Violet wisps with long tails circle you.','wisp','none'],
  ['spore','Sporeglow',2,0xd8f060,0xfff8c0,'rise',false,12,'Pale spores drift up around you, glowing faintly.','grain','none'],
  ['bubble','Tidebubbles',3,0x9ae8ff,0xffffff,'rise',false,10,'Round bubbles float up from your feet and shimmer.','bubble','none'],
  ['spirit','Spirit Lanterns',4,0x7ad8ff,0xe0f6ff,'orbit',false,8,'Pale blue lanterns of spirit-fire circle you.','wisp','none'],
  ['rune','Rune Circle',5,0x9ab8ff,0xe8f0ff,'orbit',true,10,'A ring of turning runes with four-point stars circling above it.','star','runes'],
  ['stellar','Stellar Crown',6,0xffd860,0xffffff,'orbit',true,14,'A golden ring, a halo over your head and a ring of stars.','star','halo'],
  // side quests' rewards (CP_QUEST in cospieces.js: earned, never made)
  ['foxfire','Foxfire',5,0x8ad4ff,0xffffff,'rise',true,9,'Nine pale-blue foxfire flames climb round you from a rune ring. The Nine Tails\' reward.','flame','runes'],
  ['sunwept','Where the Sun Wept',6,0xffc45a,0x3a2a4a,'orbit',true,14,'Flecks of sun-gold and black glass circle you above a crystal ring. Where the Sun Wept\'s reward.','grain','spikes'],
  ['lamplight','Keeper\'s Lamplight',6,0xfff0b0,0xffcf6a,'orbit',true,6,'Slow motes of lamplight turn round you, under a halo. The Keeper\'s Light\'s reward.','mote','halo'],
  ['herdsong','Herdsong',6,0xe8b44a,0xfff0c8,'rise',true,10,'Gold grass-seed and slow motes drift up round you from a ring of turning marks. The Drought Song\'s reward.','grain','runes']
];
// [id, name, grade, cloth colour, trim colour, length (1 = to the knee), a short line, pattern, mantle (a short shoulder cape over it)]
// patterns (game/character/cosmetics.js cosPattern): stitch, flames, stars, rays, petals, fur, ermine, moss, ash, waves, dunes, gloam
const COS_CAPES=[
  ['pack','Backpack',1,0x566437,0x8a3b2c,0,'A canvas pack with a bedroll, a flap pocket and two shoulder straps. Free.','pack',0],
  ['wayfarer','Wayfarer\'s Cloak',1,0x4a6a3a,0xc9a86a,1.0,'Green wool with a stitched leather hem and a bone clasp.','stitch',0],
  ['moss','Mossback Cloak',1,0x4d6a3c,0x8a6a3c,1.0,'Patchy moss and lichen, a rough cloak of the deep forest.','moss',0],
  ['hunter','Hunter\'s Mantle',2,0x7a5a3a,0xe8dcc0,1.05,'Tanned hide with a fur collar and a ragged, stitched hem.','hide',1],
  ['ember','Emberwool Cape',2,0xa83a2a,0xe8b84a,1.05,'Red wool with golden flames stitched along the hem.','flames',0],
  ['ashen','Ashen Rags',2,0x6c6862,0xc8622a,1.05,'A scorched grey cape, torn at the hem and glowing along the tears.','ash',0],
  ['midnight','Midnight Cape',3,0x2a2c52,0x9aa6e0,1.1,'Deep blue, scattered with silver stars.','stars',0],
  ['tide','Tidecaller Cape',3,0x2a7a8a,0xd8f0f0,1.1,'Sea-green with rolling white wave embroidery.','waves',0],
  ['sunrise','Sunrise Cape',4,0xe0a040,0xfff0c0,1.1,'Warm gold, rays spreading from the collar.','rays',0],
  ['leafweave','Leafweave Cloak',3,0x4a7a3a,0xb8d870,1.1,'Overlapping woven leaves in green and gold.','leaves',0],
  ['drake','Drakescale Cape',5,0x3a6a8a,0xc0e0f0,1.15,'Rows of blue drake scales edged in pale bone.','scales',0],
  ['petal','Petal Mantle',5,0xe89ab8,0xffffff,1.15,'Soft pink with drifting blossoms and a short shoulder cape.','petals',1],
  ['dune','Sandsilk Cape',5,0xd8a850,0xb83a2a,1.15,'Layered desert silk with crimson dune lines.','dunes',0],
  ['rime','Rimehold Mantle',6,0xdfeaf2,0x7aa6c8,1.2,'White wool with a fur collar and a fur-edged shoulder cape.','fur',1],
  ['gloam','Duskweave Cape',6,0x3a2a5a,0xc8a0ff,1.2,'Dusk violet with glimmering threads and a moon clasp.','gloam',0],
  ['regal','Highmark Regalia',6,0x2a3a8a,0xe8c860,1.3,'A deep blue train with ermine trim, gold crests and a shoulder cape.','ermine',1],
  // side quests' rewards (CP_QUEST in cospieces.js: earned, never made)
  ['tideking','Tide King\'s Mantle',4,0x1d5866,0xf2a07a,1.15,'Sea-green with coral-pink waves and a short shoulder cape. The Grey Tide\'s reward.','waves',1],
  ['wyrmscale','Wyrmscale Cloak',5,0x4a6a80,0xe0f0ff,1.2,'Pale blue scales that never freeze, edged in white. The Wyrm\'s Saga\'s reward.','scales',1],
  ['greatcoat','Captain\'s Greatcoat',5,0x1a2636,0xd8b860,1.2,'A long sea-captain\'s coat in deep navy with a gold-stitched hem. The Drowned Captain\'s reward.','stitch',1],
  ['dawnseat','Dawn Seat Mantle',6,0xb8742c,0xf6d98a,1.2,'Dry-grass gold with rays of pale thread spreading from the collar and a short shoulder cape. The Dawn Seat\'s reward.','rays',1]
];
const COS_AURA={}, COS_CAPE={};
const COS_HERB=['sunpetal','ironroot','kikyo','yomogi','frostbloom','snowmoss'];   // the herbs by grade (the recipes in shared/cospieces.js use them by name)
for(const a of COS_AURAS) COS_AURA[a[0]]={id:a[0],name:a[1],grade:a[2],col:a[3],col2:a[4],style:a[5],ring:a[6],n:a[7],text:a[8],shape:a[9],deco:a[10],type:'a'};
for(const c of COS_CAPES) COS_CAPE[c[0]]={id:c[0],name:c[1],grade:c[2],col:c[3],trim:c[4],len:c[5],text:c[6],pat:c[7],mantle:c[8],type:'c'};
const cosKey=(type,id)=>type+':'+id;
const cosDef=(type,id)=>typeof id!=='string'?null:type==='a'?(Object.prototype.hasOwnProperty.call(COS_AURA,id)?COS_AURA[id]:null):type==='c'?(Object.prototype.hasOwnProperty.call(COS_CAPE,id)?COS_CAPE[id]:null):null;
const COS_MAX=120;
const cosCost=(type,id)=>cpCost(type,id);   // {res, mats, coins} of a crafted piece (shared/cospieces.js), null for a free one
// do you wear / own it? a free piece is everybody's; a crafted one is in your gear.cos (and only the catalog's crafted pieces are ever in it)
const cosOwns=(owned,type,id)=>{ const D=cpDef(type,id); return !!D&&(D.free||(Array.isArray(owned)&&owned.includes(cosKey(type,id)))); };
function sanitizeCos(g){
  const out=[]; if(!g||!Array.isArray(g.cos)) return out;
  for(const k of g.cos){ if(typeof k!=='string'||k.length>40||out.includes(k)) continue; const m=/^([a-z]):([a-z0-9]+)$/.exec(k); if(m&&CP_SLOTS[m[1]]&&cpDef(m[1],m[2])&&!cpDef(m[1],m[2]).free) out.push(k); if(out.length>=COS_MAX) break; }
  return out;
}
// a look with every crafted piece it may not wear taken off (a copy; the look is already flat primitives: cleanLookS). A cape or aura that is not in the catalog goes too; a base garment, 'none' and a set's piece stay.
function cosCleanLook(look,owned){
  if(!look||typeof look!=='object') return look;
  const o=Object.assign({},look);
  o.aura=cosOwns(owned,'a',look.aura)?look.aura:''; o.cape=cosOwns(owned,'c',look.cape)?look.cape:'';
  for(const l of cosLocked(look,owned)) if(l.slot!=='c'&&l.slot!=='a') o[l.field||CP_SLOTS[l.slot][0]]=CP_NONE[l.slot];
  return o;
}
