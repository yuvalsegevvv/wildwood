//@ Cosmetics (version 3): auras (a glow, a ring or drifting particles around the character) and capes, made at a Wayfarers' Lodge from the materials of the three professions. Pure.
/* The professions no longer give gear (that comes from the dungeons), so their main reward is looks. Two new parts of the character's look (look.aura, look.cape: a short id, '' = none):
   - an AURA: COS_AURAS, drawn by game/character/cosmetics.js as additive particles (style 'orbit' motes circling the body, 'rise' sparks climbing, 'fall' petals drifting down) and/or a glowing ring on
     the ground (ring: true);
   - a CAPE: COS_CAPES, a cloth on the back with a trim and a hem, swaying with the walk.
   Both are made at a Lodge for resources and coins (cosCost): ore (for auras) or logs (for capes) of the cosmetic's grade, a herb, and a fee. What you own is gear.cos, a list like ['a:firefly','c:wayfarer'];
   the server throws out any aura or cape of a look that you do not own (cosCleanLook), so a hacked client cannot wear another's. Ids are keys of plain objects: always check own properties.
   owns: COS_AURAS, COS_CAPES, COS_AURA, COS_CAPE, cosCost, cosKey, cosOwns, sanitizeCos, cosCleanLook.   used by: server/cosmetics.js, game/character/cosmetics.js, game/economy/cosmetics.js, the editor.   test: tools/revamp-smoke.js */
// [id, name, grade 1..6, colour, second colour, style, ring, how many particles, a short line]
const COS_AURAS=[
  ['firefly','Firefly Veil',1,0xffe27a,0xfff6c0,'orbit',false,10,'Warm motes circle you, slowly.'],
  ['ember','Emberdrift',2,0xff7a2a,0xffd070,'rise',false,14,'Sparks climb off your shoulders.'],
  ['verdant','Verdant Halo',3,0x7aff9a,0xd0ffd8,'rise',true,8,'A green ring glows at your feet and leaves float up.'],
  ['blossom','Blossom Fall',4,0xffa8c8,0xffe0ec,'fall',false,16,'Petals drift down around you.'],
  ['frost','Frostglint',5,0x9ae0ff,0xffffff,'rise',true,12,'An icy ring and glittering flakes.'],
  ['wisp','Gloamwisps',6,0xb07aff,0xe0c8ff,'orbit',false,8,'Violet wisps circle you.'],
  ['stellar','Stellar Crown',6,0xffd860,0xffffff,'orbit',true,14,'A golden ring and a ring of stars.']
];
// [id, name, grade, cloth colour, trim colour, length (1 = to the knee), a short line]
const COS_CAPES=[
  ['wayfarer','Wayfarer\'s Cloak',1,0x4a6a3a,0xc9a86a,1.0,'Green wool with a leather hem.'],
  ['ember','Emberwool Cape',2,0xa83a2a,0xe8b84a,1.05,'Red wool trimmed with gold.'],
  ['midnight','Midnight Cape',3,0x2a2c52,0x9aa6e0,1.1,'Deep blue, a silver-blue hem.'],
  ['sunrise','Sunrise Cape',4,0xe0a040,0xfff0c0,1.1,'Warm gold, a cream hem.'],
  ['petal','Petal Mantle',5,0xe89ab8,0xffffff,1.15,'Soft pink, as the Vale wears it.'],
  ['rime','Rimehold Mantle',6,0xdfeaf2,0x7aa6c8,1.2,'White fur-edged wool.'],
  ['regal','Highmark Regalia',6,0x2a3a8a,0xe8c860,1.3,'A deep blue train with a golden hem.']
];
const COS_AURA={}, COS_CAPE={};
// resources: ore (an aura) or logs (a cape) of the grade, and a herb; the herbs by grade are the home grounds' (shared/professions.js HOME_HERBS)
const COS_HERB=['sunpetal','ironroot','kikyo','yomogi','frostbloom','snowmoss'];
for(const a of COS_AURAS) COS_AURA[a[0]]={id:a[0],name:a[1],grade:a[2],col:a[3],col2:a[4],style:a[5],ring:a[6],n:a[7],text:a[8],type:'a'};
for(const c of COS_CAPES) COS_CAPE[c[0]]={id:c[0],name:c[1],grade:c[2],col:c[3],trim:c[4],len:c[5],text:c[6],type:'c'};
const cosKey=(type,id)=>type+':'+id;
const cosDef=(type,id)=>typeof id!=='string'?null:type==='a'?(Object.prototype.hasOwnProperty.call(COS_AURA,id)?COS_AURA[id]:null):type==='c'?(Object.prototype.hasOwnProperty.call(COS_CAPE,id)?COS_CAPE[id]:null):null;
const COS_MAX=40;
// what making one costs: {res:[[resource id, n], ...], coins}. An aura wants ore of its grade; a cape wants logs of its grade; both want the herb of the grade
function cosCost(type,id){
  const D=cosDef(type,id); if(!D) return null;
  const g=D.grade, main=type==='a'?ORE_GRADES[g-1][0]:LOG_GRADES[g-1][0], big=D.id==='stellar'||D.id==='regal';
  return {res:[[main,(big?10:6)+4*g],[COS_HERB[g-1],(big?8:4)+2*g]],coins:(big?1500:0)+80*g*g};
}
const cosOwns=(owned,type,id)=>Array.isArray(owned)&&owned.includes(cosKey(type,id))&&!!cosDef(type,id);
function sanitizeCos(g){
  const out=[]; if(!g||!Array.isArray(g.cos)) return out;
  for(const k of g.cos){ if(typeof k!=='string'||k.length>40||out.includes(k)) continue; const m=/^([ac]):([a-z]+)$/.exec(k); if(m&&cosDef(m[1],m[2])) out.push(k); if(out.length>=COS_MAX) break; }
  return out;
}
// a look with the aura and cape it may not wear taken off (a copy; the look is already flat primitives: cleanLookS)
function cosCleanLook(look,owned){
  if(!look||typeof look!=='object') return look;
  const o=Object.assign({},look);
  o.aura=cosOwns(owned,'a',look.aura)?look.aura:''; o.cape=cosOwns(owned,'c',look.cape)?look.cape:'';
  return o;
}
