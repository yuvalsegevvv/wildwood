//@ Cosmetic pieces (version 3.2): which general parts of every slot (hat, top, bottom, shoes, gloves, cape, aura) are free and which are crafted, from professions' materials and monsters' drops; the try-on lock rules. Pure.
/* The general pieces, the ones that belong to no signature set. Twelve slots (d is three decoration fields; w the shield; e, k, m the Kin parts of shared/kin.js), a letter each (the first letter of the key in gear.cos, 'c:regal'):
     h hat (look.hat)   t top (look.top)   b bottom (look.bottom)   s shoes (look.shoes)   g gloves (look.gloves)   c cape (look.cape)   a aura (look.aura)
   FREE: everything the game had before this update (every base hat, top, bottom, shoes and glove), the backpack (a cape, id 'pack'), two plain capes and two plain auras (CP_FREE). They are worn by anyone and nothing is stored.
   CRAFTED: a piece with a recipe (CP_RECIPE) is made at a Wayfarers' Lodge (cosmake: server/cosmetics.js) and kept in gear.cos. A recipe is {res:[[resource, n]...], mats:[[monster id, n]...], coins}:
     `res` are the professions' ore, logs and herbs (gear.res), `mats` are the drops of monsters (gear.mats: MATS in drops.js, the monster's id), and coins are the fee.
     Some pieces want only professions' resources, some only drops and some both, so every kind of player has something to make.
   TRY-ON: the editor lets anyone put any piece on to see it (the client's look), but a look that wears a crafted piece you have not made is not saved or sent: cosLocked(look, owned) lists those parts,
   cosCleanLook (the server) takes them off with the slot's default (CP_NONE), and the editor will not close on one.
   owns: CP_SLOTS, CP_NONE, CP_PIECES, CP_RECIPE, CP_FREE, cpDef, cpIsFree, cpCost, cosLocked.   used by: shared/cosmetics.js, server/cosmetics.js, game/economy/cosmetics.js, ui/character-editor.js, character/model-*.js (the lists).   test: tools/cospieces-smoke.js */
// slot letter: [look field, what a stripped slot falls back to, the name of the slot]
const CP_SLOTS={h:['hat','none','Hat'],t:['top','tshirt','Top'],b:['bottom','trousers','Bottom'],s:['shoes','boots','Shoes'],g:['gloves','none','Gloves'],c:['cape','','Cape'],a:['aura','','Aura'],d:['deco1','','Decoration'],w:['shield','','Shield'],e:['kinEars','','Ears'],k:['kinTail','','Tail'],m:['kinMuzzle','','Muzzle']};   // d: three look fields, CP_DECO; e, k, m: the Kin parts (shared/kin.js)
const CP_LETTERS=['h','t','b','s','g','c','a','d','w','e','k','m'];
const CP_DECO=['deco1','deco2','deco3'];   // up to three decorations, any of them in any field
const CP_NONE={}; for(const k of CP_LETTERS) CP_NONE[k]=CP_SLOTS[k][1];
// the crafted pieces of the five garment slots: [slot, id, name, grade 1..6 (the land it is for), a short line]; the models are in game/character/model-*.js (their ids are listed there too)
const CP_PIECES=[
  ['h','viking','Horned Cap','1','A hammered iron cap with a nose guard and two curved horns.'],
  ['h','laurel','Laurel Wreath','2','A ring of gathered leaves and small berries.'],
  ['h','catphones','Cat-ear Headphones','4','Padded headphones on a headband with two pointed cat ears, a glowing ring on each cup.'],
  ['h','tricorn','Captain\'s Tricorn','5','A three-cornered felt hat with a gold braid, a white plume and a brass button.'],
  ['t','robe','Scholar\'s Robe','3','A long wrap robe with wide sleeves, a sash and a trimmed collar.'],
  ['t','poncho','Hillside Poncho','2','A heavy woven poncho with a fringed hem and a stitched neck slit.'],
  ['t','jerkin','Studded Jerkin','2','A leather jerkin with a laced front and rows of brass studs.'],
  ['t','crop','Crop Top','1','A short fitted top that ends under the ribs, bare midriff, with a ribbed hem and shoulder straps.'],
  ['t','halter','Halter Wrap','3','A knotted halter that crosses the chest and ties behind the neck, bare shoulders and back.'],
  ['t','harness','Leather Harness','2','Crossed leather straps with a brass ring over a bare chest.'],
  ['b','loincloth','Raider\'s Loincloth','4','A hip wrap with two long cloth flaps over a belt, briefs under it, thighs bare.'],
  ['b','shortshorts','Short Shorts','1','Very short, low-slung shorts with a drawstring waist.'],
  ['b','wrapskirt','Slit Wrap Skirt','3','A short wrapped skirt, open up the side to the hip over briefs, tied with a sash.'],
  ['b','breeches','Riding Breeches','1','Tight breeches with a patched knee and a leather seat.'],
  ['b','hakama','Hakama','4','Wide pleated trousers tied high at the waist, with a stiff back plate.'],
  ['b','greaves','Plated Leggings','3','Dark leggings with steel plates over the thigh and knee.'],
  ['s','geta','Geta','2','Wooden clogs on two tall teeth, with cloth straps.'],
  ['s','furboots','Fur-lined Boots','5','Thick winter boots with a fur cuff and a toggled strap.'],
  ['s','sabatons','Steel Sabatons','6','Boots of overlapping steel plates with a pointed toe.'],
  ['g','lace','Lace Gloves','2','Fine open lace to the wrist with a small bow.'],
  ['g','furmitts','Fur Mitts','5','Deep fur mitts with a stitched hide palm.'],
  ['w','round','Buckler','1','A small round wooden shield with an iron rim and boss. Worn on the left forearm, for looks only.'],
  ['w','heater','Heater Shield','2','A classic shield with a straight top and a pointed foot, a stripe cross in its trim colour.'],
  ['w','kite','Kite Shield','3','A long tapering shield with a diamond emblem.'],
  ['w','tower','Tower Shield','5','A tall banded shield with a rivet row.'],
  ['d','flower','Hairpin Blossom','1','A small blossom pinned above the ear.'],
  ['d','feather','Plume Feather','2','A long feather standing off the back of the crown.'],
  ['d','bell','Ribbon Bell','1','A little bell on a ribbon round the neck.'],
  ['d','scarf','Woollen Scarf','2','A thick wrap with one tail hanging down the front.'],
  ['d','glasses','Round Spectacles','2','Round lenses in a thin frame.'],
  ['d','eyepatch','Eyepatch','1','A leather patch on a strap.'],
  ['d','kitsunemask','Fox Mask','3','A white fox mask pushed up to the side of the head.'],
  ['d','earrings','Hoop Earrings','2','A hoop and a drop on each ear.'],
  ['d','horns','Little Horns','3','Two small curved horns above the brow.'],
  ['d','halo','Floating Halo','5','A small ring of light over the head.'],
  ['d','brooch','Gem Brooch','2','A gem in a metal setting pinned to the chest.'],
  ['d','pouch','Belt Pouch','1','A belt with a pouch on the right hip.'],
  ['d','lantern','Belt Lantern','3','A small glowing lantern hanging from the belt.'],
  ['d','tail','Soft Tail','4','A long fluffy tail with a pale tip.'],
  ['d','wings','Feathered Wings','5','A pair of small wings on the back.'],
  ['d','bow','Ribbon Bow','1','A big hair bow tied at the back of the head.'],
  ['d','moth','Glow Moth','4','A small glowing moth resting on the shoulder.'],
  ['d','bracelet','Charm Bangle','1','A bangle with a charm on the left wrist.'],
  ['d','anklet','Bell Anklet','1','A chain with a bell round the left ankle.'],
  ['g','studded','Studded Gloves','2','Black leather with brass studs along the knuckles.']
];
// [key, recipe]: every crafted piece, themed to what it is (metal from ore, wood from logs, cloth and flowers from herbs, and the drops of the monsters it looks like).
const CP_RECIPE={
  'h:viking':{res:[['iron',6]],mats:[['boar',10],['beetle',6]],coins:150},
  'h:laurel':{res:[['sunpetal',6],['ironroot',6],['oak',4]],mats:[],coins:200},
  'h:catphones':{res:[['silver',4],['sunstone',2]],mats:[['lynx',6],['shadowfox',6]],coins:500},
  'h:tricorn':{res:[],mats:[['drownedsailor',8],['wrecker',6]],coins:700},
  't:robe':{res:[['kikyo',8],['cherry',6]],mats:[],coins:400},
  't:poncho':{res:[['ironroot',4]],mats:[['yamaboar',8],['ramboar',6]],coins:300},
  't:jerkin':{res:[['iron',10]],mats:[['goblin',10],['hobgoblin',5]],coins:350},
  't:crop':{res:[['sunpetal',6]],mats:[['slime',8]],coins:100},
  't:halter':{res:[['yomogi',5],['sunwood',3]],mats:[['scarab',6]],coins:250},
  't:harness':{res:[['iron',4]],mats:[['boar',8],['direboar',4]],coins:200},
  'b:loincloth':{res:[['yomogi',3]],mats:[['raider',6],['warthog',6]],coins:300},
  'b:shortshorts':{res:[['pine',3]],mats:[['crab',6],['tideslime',4]],coins:150},
  'b:wrapskirt':{res:[['cherry',4],['kikyo',4]],mats:[['kitsune',6]],coins:300},
  'b:breeches':{res:[['pine',4]],mats:[['boar',8]],coins:120},
  'b:hakama':{res:[['kikyo',5]],mats:[['kitsune',6],['ashigaru',6]],coins:500},
  'b:greaves':{res:[['silver',8]],mats:[['ironshell',8]],coins:450},
  's:geta':{res:[['oak',6],['cherry',4]],mats:[],coins:200},
  's:furboots':{res:[],mats:[['wolf',8],['snowboar',6]],coins:450},
  's:sabatons':{res:[['hagane',8]],mats:[['reaver',6]],coins:800},
  'g:lace':{res:[['yomogi',6],['kikyo',4]],mats:[],coins:250},
  'g:furmitts':{res:[],mats:[['yeti',6],['wolf',4]],coins:400},
  'g:studded':{res:[['iron',6]],mats:[['goblin',6]],coins:200},
  'c:ember':{res:[['sunpetal',4]],mats:[['magmaslime',6],['rotwood',4]],coins:160},
  'c:ashen':{res:[['pine',4]],mats:[['rotwood',8],['magmaslime',4]],coins:140},
  'c:midnight':{res:[['yew',4]],mats:[['shadowfox',6],['yurei',6]],coins:350},
  'c:tide':{res:[['oak',4]],mats:[['tideslime',8],['crab',6]],coins:320},
  'c:sunrise':{res:[['sunwood',6],['yomogi',6]],mats:[['tengu',6]],coins:450},
  'c:petal':{res:[['cherry',8],['kikyo',6]],mats:[['sakuraslime',8],['sakuratreant',4]],coins:600},
  'c:dune':{res:[['sunwood',6],['yomogi',4]],mats:[['mummy',8],['gildedscarab',6]],coins:650},
  'c:rime':{res:[['frostwood',8],['frostbloom',6]],mats:[['yeti',8],['wolf',6]],coins:800},
  'c:gloam':{res:[['snowmoss',6]],mats:[['banshee',8],['wraith',6]],coins:900},
  'c:regal':{res:[['silver',10],['snowmoss',8]],mats:[['gryphonqueen',4]],coins:2500},
  'c:hunter':{res:[],mats:[['wolf',8],['boar',8]],coins:250},
  'c:drake':{res:[['hagane',4]],mats:[['galedrake',8],['cragwyvern',6]],coins:900},
  'c:leafweave':{res:[['sunpetal',8],['ironroot',6],['kikyo',4],['pine',6]],mats:[],coins:300},
  'a:ember':{res:[['copper',4]],mats:[['magmaslime',8]],coins:150},
  'a:verdant':{res:[['ironroot',8],['oak',4]],mats:[['treant',6]],coins:300},
  'a:blossom':{res:[['kikyo',6],['cherry',4]],mats:[['sakuraslime',8],['kodama',4]],coins:400},
  'a:gale':{res:[['yomogi',4]],mats:[['tengu',8],['raiju',4]],coins:420},
  'a:frost':{res:[['rimeore',6],['frostbloom',6]],mats:[['frostslime',8],['rimewisp',6]],coins:600},
  'a:dune':{res:[['sunstone',6]],mats:[['glasswisp',6],['dustdjinn',6]],coins:650},
  'a:wisp':{res:[['snowmoss',6]],mats:[['lanternwisp',8],['candlewisp',6]],coins:800},
  'a:stellar':{res:[['hagane',8],['rimeore',6],['snowmoss',8]],mats:[['glassguardian',3]],coins:2500},
  'w:round':{res:[['pine',4],['iron',2]],mats:[],coins:120},
  'w:heater':{res:[['iron',6]],mats:[['hobgoblin',5]],coins:300},
  'w:kite':{res:[['silver',5]],mats:[['kabuto',4],['ashigaru',4]],coins:600},
  'w:tower':{res:[['hagane',8]],mats:[['ironshell',8],['rocktroll',3]],coins:1100},
  'd:flower':{res:[['sunpetal',3],['kikyo',2]],mats:[],coins:80},
  'd:feather':{res:[],mats:[['tengu',3],['gryphonqueen',1]],coins:300},
  'd:bell':{res:[['silver',1]],mats:[['wolf',3]],coins:120},
  'd:scarf':{res:[['yomogi',4]],mats:[['wolf',4],['snowboar',2]],coins:200},
  'd:glasses':{res:[['silver',2]],mats:[['crystalbeetle',3]],coins:300},
  'd:eyepatch':{res:[['pine',1]],mats:[['boar',4]],coins:100},
  'd:kitsunemask':{res:[['cherry',4]],mats:[['kitsune',6]],coins:400},
  'd:earrings':{res:[['silver',2],['sunstone',1]],mats:[],coins:250},
  'd:horns':{res:[],mats:[['ramboar',5],['oni',2]],coins:350},
  'd:halo':{res:[['sunstone',4],['silver',4]],mats:[['lanternwisp',4]],coins:900},
  'd:brooch':{res:[['silver',2],['sunstone',1]],mats:[],coins:200},
  'd:pouch':{res:[['pine',2]],mats:[['boar',6]],coins:100},
  'd:lantern':{res:[['iron',3]],mats:[['onibi',4]],coins:300},
  'd:tail':{res:[],mats:[['kitsune',8],['shadowfox',4]],coins:500},
  'd:wings':{res:[['silver',4]],mats:[['gryphonqueen',3],['tengu',4]],coins:1200},
  'd:bow':{res:[['yomogi',3],['sunpetal',2]],mats:[],coins:120},
  'd:moth':{res:[],mats:[['glasswisp',3],['rimewisp',3]],coins:450},
  'd:bracelet':{res:[['iron',2]],mats:[['beetle',3]],coins:100},
  'd:anklet':{res:[['silver',1]],mats:[['crab',3]],coins:100},
  'a:spore':{res:[],mats:[['shroom',10],['deathcap',6]],coins:150},
  'a:bubble':{res:[],mats:[['tideslime',8],['crab',6]],coins:250},
  'a:spirit':{res:[],mats:[['kodama',8],['onibi',6]],coins:500},
  'a:rune':{res:[['silver',8],['sunstone',4],['kikyo',3]],mats:[],coins:600}
};
// kin: the crafted Kin parts (ears, tails, muzzles, horns, mane: shared/kin.js, which loads first) join the catalog; the free ones are base parts like a base hat and are not in it
for(const P of KIN_PARTS) if(!P.free){ CP_PIECES.push([P.slot,P.id,P.name,String(P.grade),P.text]); CP_RECIPE[P.slot+':'+P.id]=P.recipe; }
// worn by anyone, made by nobody: the plain pieces of the two slots whose pieces used to be crafted (the backpack is a cape)
const CP_FREE=['c:pack','c:wayfarer','c:moss','a:firefly','a:dew'];
// earned, never made: the last step of a side quest chain gives it (shared/side-quests.js, its chain id here); no recipe, the Lodge does not list it
const CP_QUEST={'c:tideking':'tide','a:foxfire':'ninetails','c:wyrmscale':'wyrm','a:sunwept':'sunwept','c:greatcoat':'drowned','a:lamplight':'keeper','c:dawnseat':'dawnseat','a:herdsong':'drought'};
const CP_PIECE={};
for(const r of CP_PIECES) CP_PIECE[r[0]+':'+r[1]]={slot:r[0],id:r[1],name:r[2],grade:+r[3],text:r[4],type:r[0]};
const cpHas=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const cpKey=(type,id)=>type+':'+id;
// a piece's definition {slot, id, name, grade, text, free, recipe} when it is part of the catalog (a crafted garment piece, or any cape or aura), else null: a base garment, 'none' and a set's piece are not in it
function cpDef(type,id){
  if(typeof id!=='string'||typeof type!=='string') return null;
  const k=cpKey(type,id);
  if(type==='c'||type==='a'){ const D=cosDef(type,id); if(!D) return null; const free=CP_FREE.includes(k); return {slot:type,id,name:D.name,grade:D.grade,text:D.text,free,recipe:free?null:cpCost(type,id),quest:cpHas(CP_QUEST,k)?CP_QUEST[k]:null}; }
  if(!cpHas(CP_PIECE,k)) return null;
  const P=CP_PIECE[k]; return {slot:type,id,name:P.name,grade:P.grade,text:P.text,free:false,recipe:cpCost(type,id)};
}
const cpIsFree=(type,id)=>{ const D=cpDef(type,id); return !D||D.free; };   // not in the catalog = free (a base garment)
// what making one costs {res, mats, coins}, or null for a free piece or an unknown one
function cpCost(type,id){
  if(typeof id!=='string') return null;
  const k=cpKey(type,id);
  if(CP_FREE.includes(k)) return null;
  if(cpHas(CP_RECIPE,k)){ const r=CP_RECIPE[k]; return {res:r.res.map(a=>a.slice()),mats:r.mats.map(a=>a.slice()),coins:r.coins}; }
  return null;
}
// the crafted pieces a look wears that you have not made: [{slot, id, name}]; `owned` is gear.cos
function cosLocked(look,owned){
  const out=[]; if(!look||typeof look!=='object') return out;
  for(const k of CP_LETTERS) for(const field of (k==='d'?CP_DECO:[CP_SLOTS[k][0]])){
    const id=look[field]; if(typeof id!=='string'||!id) continue;
    const D=cpDef(k,id); if(!D||D.free) continue;
    if(Array.isArray(owned)&&owned.includes(cpKey(k,id))) continue;
    out.push({slot:k,id,name:D.name,field});
  }
  return out;
}
