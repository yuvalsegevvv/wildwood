//@ Kin features (version 3 racial features, open to every player from the first minute): the registry of ears, tails, muzzles, horns and mane, the fur colours and markings, the hats' ear rule. Pure data
/* Players have no race: like the elf-ear slider and the zombie skin tone, the Kin parts are optional features anyone picks in the character editor (Body > Kin, Clothes > Decor). Pure data; the drawing is game/character/model-kin.js.
   FOUR WAYS TO WEAR: ears (look.kinEars), a tail (look.kinTail), a muzzle (look.kinMuzzle), and horns / a mane as decorations (look.deco1..3, ids 'lyrehorns', 'rhinohorn', 'mane'); plus fur:
   look.furColor (-1 = your skin tone), look.furColor2 (the second colour: tips, stripes, spots; -1 = each part's own), look.furMark ('' = none, KIN_MARKS).
   FREE or CRAFTED: a part with free:true is a base part (worn by anyone, never stored, like a base hat); the others are crafted at a Wayfarers' Lodge: kinDefine feeds them to CP_PIECES / CP_RECIPE (shared/cospieces.js, which loads after this file),
   so the slot letters e (ears), k (tail), m (muzzle) and d (decorations) own them in gear.cos as 'e:fox', 'k:bushy', 'm:tusks', 'd:mane'; the lock, try-on and server stripping rules are the other pieces' (cosLocked, cosCleanLook).
   A bad entry is left out and listed in KIN_BAD (tools/cospieces-smoke.js fails naming it). A look field is untrusted: every lookup goes through kinPart (an own-property check on a prototype-less map), never a bare key.
   owns: KIN_SLOTS, KIN_PARTS, KIN_BAD, KIN_MARKS, KIN_FUR, KIN_LOOK, kinDefine, kinPart, kinList, kinHatMode, kinCleanLook.   used by: shared/cospieces.js, game/character/model-kin.js, model.js (the look defaults), ui/character-editor.js, ui/character-thumbs.js.   test: tools/cospieces-smoke.js, tools/character-smoke.js. Doc: docs/KIN.md */
// slot letter: [look field, name of the slot]. d (decorations) is the existing slot: its rows are only listed here so their recipes sit beside the other Kin parts
const KIN_SLOTS={e:['kinEars','Ears'],k:['kinTail','Tail'],m:['kinMuzzle','Muzzle']};
const KIN_PARTS=[], KIN_BAD=[], KIN_BY=Object.create(null);
// the look fields this feature adds, with their defaults (merged into LOOK_M / LOOK_F in model.js)
const KIN_LOOK={kinEars:'',kinTail:'',kinMuzzle:'',furColor:-1,furColor2:-1,furMark:''};
// [id, name]: the markings painted on the skin in the second colour (vertex colours, no extra meshes)
const KIN_MARKS=[['','None'],['stripes','Stripes'],['spots','Spots'],['patches','Patches'],['mask','Mask'],['socks','Socks'],['belly','Belly']];
// the fur colours the editor offers (any colour of TINTC is fine too)
const KIN_FUR=[0xc9954a,0xe3c58a,0xf1e6cf,0xb5602a,0x8d9097,0x3a3a3f,0x7a4a2c,0xf2f2ee,0x232124,0xe0a830,0x9a6b3f,0x5c4a3a];
/* kinDefine({slot, id, name, text, free, grade, recipe}): slot e|k|m|d; id lowercase letters and digits (it becomes part of the gear.cos key 'e:fox'); grade 1..6 (the land it is for);
   a crafted part needs recipe {res:[[resource, n]...], mats:[[monster id, n]...], coins}. Whether the resources and monsters exist is checked by tools/cospieces-smoke.js. */
function kinDefine(o){
  const bad=m=>{ KIN_BAD.push((o&&o.slot)+':'+(o&&o.id)+' '+m); return null; };
  if(!o||typeof o!=='object') return bad('is not an object');
  if(!(o.slot==='d'||Object.prototype.hasOwnProperty.call(KIN_SLOTS,o.slot))) return bad('has no slot');
  if(typeof o.id!=='string'||!/^[a-z0-9]{2,16}$/.test(o.id)) return bad('has a bad id');
  const key=o.slot+':'+o.id; if(KIN_BY[key]) return bad('is defined twice');
  if(typeof o.name!=='string'||!o.name||typeof o.text!=='string'||!o.text) return bad('needs a name and a line of text');
  const free=o.free===true;
  if(!free){
    if(!(o.grade>=1&&o.grade<=6)) return bad('needs a grade 1..6');
    const r=o.recipe; if(!r||!Array.isArray(r.res)||!Array.isArray(r.mats)||!(r.coins>0)) return bad('needs a recipe {res, mats, coins}');
  }
  const P={slot:o.slot,id:o.id,name:o.name,text:o.text,free,grade:free?0:+o.grade,recipe:free?null:o.recipe};
  KIN_PARTS.push(P); KIN_BY[key]=P; return P;
}
// a part by slot and id, or null (an own-property check: look.kinEars comes from other players)
function kinPart(slot,id){ return typeof id==='string'&&id?(KIN_BY[slot+':'+id]||null):null; }
// every part of one slot, in the order they were defined (the editor's tiles)
const kinList=slot=>KIN_PARTS.filter(p=>p.slot===slot);
// ---- ears: free ones first, then the crafted ones (hide, cloth and coins) ----
kinDefine({slot:'e',id:'cat',name:'Cat Ears',text:'Two upright pointed ears with a pale inside.',free:true});
kinDefine({slot:'e',id:'round',name:'Round Ears',text:'Small round ears with a pale centre, like a bear\'s or a mouse\'s.',free:true});
kinDefine({slot:'e',id:'fox',name:'Fox Ears',text:'Tall pointed ears tipped in a darker colour.',grade:3,recipe:{res:[],mats:[['shadowfox',4],['kitsune',3]],coins:250}});
kinDefine({slot:'e',id:'hare',name:'Hare Ears',text:'Two very long soft ears with a pink inside.',grade:2,recipe:{res:[['sunpetal',4],['yomogi',3]],mats:[],coins:150}});
kinDefine({slot:'e',id:'antelope',name:'Antelope Ears',text:'Broad leaf-shaped ears held out to the sides, dark at the tip.',grade:4,recipe:{res:[],mats:[['ibex',5],['cliffboar',3]],coins:400}});
kinDefine({slot:'e',id:'rhino',name:'Rhino Ears',text:'Small thick rounded ears with a dark fringe.',grade:4,recipe:{res:[],mats:[['warthog',5],['direboar',4]],coins:350}});
kinDefine({slot:'e',id:'crest',name:'Crest Feathers',text:'A swept crest of feathers on each side of the crown, tipped in the second colour.',grade:5,recipe:{res:[['silver',2]],mats:[['tengu',4],['cragwyvern',3]],coins:650}});
// ---- tails ----
kinDefine({slot:'k',id:'thin',name:'Slim Tail',text:'A long slim tail with a curl at the end.',free:true});
kinDefine({slot:'k',id:'puff',name:'Puff Tail',text:'A small round cotton-tuft tail.',free:true});
kinDefine({slot:'k',id:'bushy',name:'Bushy Tail',text:'A thick brush of a tail with a pale tip.',grade:3,recipe:{res:[],mats:[['kitsune',6],['shadowfox',4]],coins:450}});
kinDefine({slot:'k',id:'tufted',name:'Tufted Tail',text:'A slim tail ending in a dark tuft.',grade:4,recipe:{res:[],mats:[['duneprowler',5],['warthog',4]],coins:400}});
kinDefine({slot:'k',id:'spotted',name:'Spotted Tail',text:'A long muscular tail dotted with spots and ringed at the tip.',grade:4,recipe:{res:[],mats:[['snowleopard',5],['lynx',4]],coins:500}});
kinDefine({slot:'k',id:'striped',name:'Striped Tail',text:'A long tail banded in the second colour from root to tip.',grade:4,recipe:{res:[['yew',3]],mats:[['duneprowler',6]],coins:550}});
kinDefine({slot:'k',id:'plume',name:'Plume Tail',text:'A fan of long feathers held up behind the hips.',grade:5,recipe:{res:[['yomogi',4],['sunwood',3]],mats:[['tengu',6],['galedrake',3]],coins:800}});
// ---- muzzles ----
kinDefine({slot:'m',id:'nose',name:'Animal Nose',text:'A small dark nose pad and a line down to the mouth.',free:true});
kinDefine({slot:'m',id:'whiskers',name:'Whiskers',text:'Three fine whiskers on each cheek.',free:true});
kinDefine({slot:'m',id:'snout',name:'Snout',text:'A short furred snout with a dark nose and a paler jaw.',grade:3,recipe:{res:[],mats:[['wolf',6],['lynx',3]],coins:300}});
kinDefine({slot:'m',id:'tusks',name:'Tusks',text:'Two curved tusks rising from the upper lip.',grade:3,recipe:{res:[],mats:[['warthog',6],['seaboar',4]],coins:400}});
kinDefine({slot:'m',id:'beak',name:'Beak',text:'A hooked beak in place of nose and mouth.',grade:5,recipe:{res:[['silver',2]],mats:[['tengu',6],['galedrake',2]],coins:600}});
// ---- horns and a mane: decorations (slot d), worn in any of the three decoration fields ----
kinDefine({slot:'d',id:'lyrehorns',name:'Lyre Horns',text:'Two long ridged horns that sweep up and curve back in.',grade:4,recipe:{res:[],mats:[['ibex',6],['ramboar',4]],coins:700}});
kinDefine({slot:'d',id:'rhinohorn',name:'Nose Horn',text:'A thick horn on the bridge of the nose with a smaller one behind it.',grade:5,recipe:{res:[],mats:[['rocktroll',4],['granitegolem',2]],coins:800}});
kinDefine({slot:'d',id:'mane',name:'Great Mane',text:'A full mane round the face and down the neck. It replaces your hair while you wear it.',grade:5,recipe:{res:[['snowmoss',4]],mats:[['alphawolf',5],['yeti',4]],coins:900}});
/* How a hat treats the ears: 'poke' (they stand through the cloth), 'flat' (folded down against the head, smaller), 'hide' (the hat covers them or brings its own).
   A hat that is not listed (an outfit's hat, a helmet of armour) folds them flat. The mane's hair rule is kinLook (game/character/model-kin.js). */
const KIN_HAT_EARS={none:'poke',beanie:'poke',cap:'poke',bandana:'poke',circlet:'poke',laurel:'poke',hood:'hide',helm:'hide',catphones:'hide',ranger:'flat',kasa:'flat',wizard:'flat',straw:'flat',viking:'flat',tricorn:'flat'};
const kinHatMode=hat=>typeof hat==='string'&&Object.prototype.hasOwnProperty.call(KIN_HAT_EARS,hat)?KIN_HAT_EARS[hat]:'flat';
// a look with the Kin fields cut down to what is valid: an unknown part id is empty, a colour outside 0..0xffffff is -1, an unknown marking is none (a copy). The drawing code does the same checks; this is for the editor and the smoke test.
function kinCleanLook(L){
  const o=Object.assign({},L), col=v=>typeof v==='number'&&v>=0&&v<=0xffffff?Math.floor(v):-1;
  for(const s of Object.keys(KIN_SLOTS)){ const f=KIN_SLOTS[s][0]; if(!kinPart(s,o[f])) o[f]=''; }
  o.furColor=col(o.furColor); o.furColor2=col(o.furColor2); if(!KIN_MARKS.some(m=>m[0]===o.furMark)) o.furMark='';
  return o;
}
