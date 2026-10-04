//@ The three dungeon bosses (Amanita the Sporemother, Gawataro the Jade Elder, Haugbui the Barrow Lord): their designs as data (DG_BOSSES: moves named by primitive, signature, needs), their defs as rows shaped like BOSS_DEFS (DG_BOSS_DEFS), the hall's lamps and steam vents, and the arena of a run's boss hall. Pure.
/* Agent map: exports DG_BOSSES, DG_BOSS_DEFS (keyed by boss id = its def's id: {def, kit, add, prop, short, bar, auxBar, gloom, dungeon}), DG_HALL_LAMPS, DG_VENT_R, dgVentAt,
   dgHallArena. Used by: server/dungeons/boss-kits.js (BOSS_KITS.spore / dish / barrow read B.bd = a row), the run's boss finale (makeBossS(DG_BOSS_DEFS[theme.boss],
   dgHallArena(bake, ox, oz))), game/combat/boss-dungeon.js (the client's def lookup, bar texts, gloom), defineDungeonTheme (a theme's `boss` must be a key here).
   Tests: tools/dungeons-smoke.js (the data agrees with the kits and the primitives), tools/dungeon-boss-smoke.js (the fights). Designs: docs/DUNGEON-THEMES.md section 4. */

/* THE THREE NEW BOSSES, one for each dungeon. Built on the pieces the six bosses use (shared/monster-defs.js: bossDef, a model family with its pal flags;
   server/boss-fx.js: telegraphs, zones, walls, pfx, summons, props), so a design here is what bossDef() is given, and `moves` name what each move is made of:
     tele:<kind> a telegraph: circle kinds root slam icefall geyser gust, and the dungeon bosses' own looks of a circle: spore (a cloud's warning) puff (a puffball swelling)
                 pulse (Amanita's hall-wide pulse) vent (a steam vent) wail (Haugbui's hall-wide wail) snuff (a lamp going dark) | cone: cleave breath | line | donut | mark prison
     zone:<kind> ember whirl whiteout blizzard   wall   orb   pfx:root / pfx:slow / pfx:push   adds   props   move (a glide)   mode:hidden / shielded / airborne   stun   cast
     new:<name>  a primitive the six bosses did not have (listed in the boss's `needs`; DG_BOSS_NEEDS in server/dungeons/boss-kits.js says what implements each)
   `signature`: the one mechanic that is only this boss's. Not in BOSS_DEFS: a world boss has a fixed arena, these are made on demand in a run's round hall (r = DG_BOSS_R).
   hits 70 and level DG_LV like every boss (defAt: 23,400 health and a 718 hit at level 30); `aux` is what the boss bar's number means, auxBar how the bar says it ({n} = the number);
   gloom: the mode in which the hall goes dark for the client (Haugbui's blackout). add: what it summons (60% health, level - 1); prop: Amanita's puffballs (one swing of health) and
   Haugbui's lamps (never broken: the kit makes them immune). */
const DG_BOSSES={
  amanita:{id:'amanita',name:'Amanita, the Sporemother',short:'Amanita',dungeon:'hollowroots',kit:'spore',lv:DG_LV,el:'earth',model:'shroom',scale:5.5,glow:0x1a3010,atk:2.6,speed:1.7,music:'boss15',
    pal:{cap:0x7a2a48,spot:0xd8f08a,stem:0xcfc3a8,gill:0x6a4a58,feet:0x8a7a68},
    add:{id:'sporeling',name:'Sporeling',scale:0.7,speed:2.4,glow:0x0a1a06,pal:{cap:0x7a2a48,spot:0xd8f08a,stem:0xcfc3a8,gill:0x6a4a58,feet:0x8a7a68}},
    prop:{id:'puffball',name:'Puffball',scale:0.9,hits:1,glow:0x14160a,pal:{cap:0xd8cfae,spot:0xf4efe4,stem:0xe8dcc0,gill:0xcdbf9c,feet:0xd8c8a4}},
    bar:{stun:'Her spores are spent: strike now!'}, aux:'puffballs about to burst', auxBar:'Puffballs swelling: {n}',
    moves:[
      {id:'capslam',   name:'Cap Slam',    phase:1,does:['tele:slam','cast'],x:1.4},
      {id:'sporecloud',name:'Spore Cloud', phase:1,does:['tele:spore','new:zone-spore'],x:0.18},
      {id:'puffballs', name:'Puffballs',   phase:1,does:['props','tele:puff','new:tele-cancel'],x:1.7,signature:true},
      {id:'sporelings',name:'Sporelings',  phase:2,does:['adds']},
      {id:'sporepulse',name:'Spore Pulse', phase:2,does:['tele:pulse','pfx:slow','new:tele-safe'],x:1.2},
      {id:'sporefall', name:'Sporefall',   phase:3,does:['tele:icefall','pfx:slow'],x:0.8}],
    needs:['new:zone-spore','new:tele-cancel','new:tele-safe']},
  gawataro:{id:'gawataro',name:'Gawataro, the Jade Elder',short:'Gawataro',dungeon:'jadesprings',kit:'dish',lv:DG_LV,el:'water',model:'goblin',scale:2.6,glow:0x06201a,atk:2.3,speed:2.4,music:'boss20',
    pal:{form:'kappa',skin:0x4f9a86,eyes:0xf2e04a,top:'tshirt',topColor:0x2f6a4a,bottom:'shorts',bottomColor:0x24443a,hat:'none',hatColor:0x2b2420,club:0x6a5a3a,shell:0x3a6a4a,weapon:'kanabo'},
    add:{id:'kappawhelp',name:'Kappa Whelp',scale:0.6,speed:3.2,pal:{form:'kappa',skin:0x5aa08a,eyes:0xf2e04a,top:'tshirt',topColor:0x3f6a4a,bottom:'shorts',bottomColor:0x2f4a3a,hat:'none',hatColor:0x2b2420,club:0x6a5a3a,shell:0x4a6a3a}},
    bar:{stun:'Dazed: strike now!'}, aux:'water left in his dish (%)', auxBar:'Dish: {n}%',
    moves:[
      {id:'sweep',  name:'Kanabo Sweep',       phase:1,does:['tele:cleave','pfx:push','cast'],x:1.2},
      {id:'vents',  name:'Vent Dance',         phase:1,does:['tele:vent'],x:1.0},
      {id:'whirls', name:'Whirlpool Shepherd', phase:1,does:['zone:whirl']},
      {id:'dish',   name:'The Dish',           phase:1,does:['stun','new:hit-hook'],signature:true},
      {id:'charge', name:'Sumo Charge',        phase:2,does:['tele:line','move','pfx:push','stun','new:stop-at-wall'],x:2.0},
      {id:'whelps', name:'Kappa Whelps',       phase:2,does:['adds']},
      {id:'surge',  name:'Spring Surge',       phase:3,does:['wall'],x:1.4}],
    needs:['new:hit-hook','new:stop-at-wall']},
  haugbui:{id:'haugbui',name:'Haugbui, the Barrow Lord',short:'Haugbui',dungeon:'bonefrostbarrow',kit:'barrow',lv:DG_LV,el:'dark',model:'wisp',scale:3.4,glow:0x0c1420,atk:2.0,speed:2.6,music:'boss26',
    pal:{body:0x7a8ca0,core:0xe8f4ff,eye:0x0a0e14,hair:0x141a24,ghost:1},
    add:{id:'gravewisp',name:'Grave Wisp',scale:0.6,speed:3.0,glow:0x0c1420,pal:{body:0x8a9cb0,core:0xe8f4ff,eye:0x0a0e14,hair:0x141a24,ghost:1}},
    prop:{id:'barrowlamp',name:'Barrow Lamp',scale:1,model:'totem',hits:9,glow:0x1a4060,pal:{crystal:0x9fd8ff,band:0xcfe8f8}},
    bar:{2:'Blackout: relight the lamps!',stun:'Unmoored: strike now!'}, aux:'lamps lit', auxBar:'Lamps lit: {n} of 4', gloom:2,
    moves:[
      {id:'chain',     name:'Grasping Chain',  phase:1,does:['tele:root','pfx:root'],x:0.9},
      {id:'coldbreath',name:'Cold Breath',     phase:1,does:['tele:breath','pfx:slow','new:tele-safe'],x:1.8},
      {id:'thralls',   name:'Raise Thralls',   phase:1,does:['adds']},
      {id:'snuff',     name:'Snuff the Lamps', phase:2,does:['props','tele:snuff','new:channel'],x:1.0,signature:true},
      {id:'wail',      name:'Barrow Wail',     phase:2,does:['tele:wail','new:tele-safe'],x:1.6},
      {id:'blackout',  name:'Blackout',        phase:3,does:['mode:hidden','adds','stun','new:gloom']}],
    needs:['new:channel','new:tele-safe','new:gloom']}};

// a design as a row shaped like BOSS_DEFS (what makeBossS(bd, A) takes): the boss's def at its level, its add and its prop as monster defs
function dgBossRow(b){
  const def=bossDef({id:b.id,name:b.name,level:b.lv,el:b.el,model:b.model,scale:b.scale,boss:true,heavy:true,glow:b.glow,atk:b.atk,speed:b.speed,aggro:0,music:b.music,dungeon:b.dungeon,pal:b.pal});
  const add={id:b.add.id,name:b.add.name,level:b.lv-1,el:b.el,model:b.add.model||b.model,scale:b.add.scale,hpK:0.6,dmgPct:0.07,bossAdd:true,atk:1.6,speed:b.add.speed,aggro:30,glow:b.add.glow,pal:b.add.pal};
  prepDef(add);
  let prop=null;
  if(b.prop){ prop={id:b.prop.id,name:b.prop.name,level:b.lv,el:b.el,model:b.prop.model||b.model,scale:b.prop.scale,hits:b.prop.hits,heavy:true,noAttack:true,noXp:true,speed:0,aggro:0,glow:b.prop.glow,pal:b.prop.pal}; prepDef(prop); }
  return {def,kit:b.kit,add,prop,short:b.short,bar:b.bar,aux:b.aux,auxBar:b.auxBar,gloom:b.gloom,dungeon:b.dungeon};
}
const DG_BOSS_DEFS=Object.assign(Object.create(null),{amanita:dgBossRow(DG_BOSSES.amanita),gawataro:dgBossRow(DG_BOSSES.gawataro),haugbui:dgBossRow(DG_BOSSES.haugbui)});   // (no prototype: a lookup by any def id is safe)

/* Where the kits put things in the hall, in metres from its middle (the hall's pillars and mouths are DG_HALL_PILLARS / DG_HALL_MOUTHS in shared/dungeons.js):
   Haugbui's four lamps stand at the inner corner of each pillar, 9.6 m from the middle (8 m round a lit lamp shelters you from the wail, which leaves the middle open);
   Gawataro's five steam vents are a ring of DG_VENT_R, vent i at i x 72 degrees clockwise from north (the ring misses the pillars). */
const DG_HALL_LAMPS=[[-6.8,-6.8],[6.8,-6.8],[-6.8,6.8],[6.8,6.8]], DG_VENT_R=12;
const dgVentAt=(A,i)=>[A.x+Math.sin(i*TAU/5)*DG_VENT_R,A.z-Math.cos(i*TAU/5)*DG_VENT_R];
// the arena of a run's boss hall in world coordinates (B: the run's bake, placed with its north-west corner at ox, oz): the circle {x,z,r} every boss arena is, plus solid(x,z)
// (a wall or a pillar there?), which the dungeon bosses' moves use (cover behind a pillar, a charge that stops at one). Without solid (an open arena) nothing gives cover.
function dgHallArena(B,ox,oz){ return {x:B.boss.x+ox,z:B.boss.z+oz,r:B.boss.r,solid:(x,z)=>dgSolid(B,x-ox,z-oz)}; }
