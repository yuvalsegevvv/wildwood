//@ Rifts: the numbers (energy, waves, XP x3), the energy clock (riftEnergyAt), the registry of rifts (defineRift, RIFT_DEFS, RIFT_BAD), the glass monsters (riftMobDef), the void world's platform layout (riftLayout), the tear's keep-out (riftNear). Pure; loaded by both sides
/* agent map (docs/RIFT.md)
   exports: RIFT_E_MAX, RIFT_E_FULL_H, RIFT_E_MS, RIFT_E_DOUBLE, RIFT_LV, RIFT_XP_K, RIFT_HP_K, RIFT_DMG_K, RIFT_WAVES, RIFT_NEXT_PCT, RIFT_WAVE_S, RIFT_RELEASE_S, RIFT_ALIVE_MAX,
            RIFT_HERALD_HP, RIFT_BONUS_KILLS, RIFT_RESPAWN_S, RIFT_COUNT_S, RIFT_ELEM_LV, RIFT_ESS_FULL, RIFT_ELEM_SLOTS, riftEssFor(w), defineElemRift(o), RIFT_TALK, RIFT_CLEAR, RIFT_SLOT0, riftWaveSize(n), riftEnergyAt(g,now), riftFullIn(g,now) (seconds),
            RIFT_DEFS (id -> rift, no prototype), RIFT_BAD, RIFT_DOORS (every rift's tear {id,x,z}: a var, nearPath asks it), defineRift(R), riftMobDef(base,id,name,o), RIFT_MON_DEFS,
            riftLayout(R) -> a dungeon layout ({gw, gh, start, cells}) that dgBake takes, riftNear(x,z,m), riftDoorNear(x,z,r), DG_HUD.rift (the HUD row)
   users: server/rift.js (runs, energy, waves, rewards), game/rift/*.js (the tear, the window, the void view, the glass), village-helpers.js nearPath (no tree or camp on the tear's clearing)
   test: tools/rift-smoke.js
   How a rift is built on the dungeons (docs/DUNGEONS.md section 7): a rift run is a dungeon run object in one of the far-away slots after the dungeons' own (RIFT_SLOT0 on), mission 'rift', its
   theme the rift's entry, its layout riftLayout (not dgLayout), its bake marked B.open (the void blocks walking, never a hit or a projectile). One member, always. */
const RIFT_E_MAX=100, RIFT_E_FULL_H=28, RIFT_E_MS=RIFT_E_FULL_H*3600000/RIFT_E_MAX, RIFT_E_DOUBLE=20;   // energy: 100 at most, full in 28 h (a point every 16.8 min), by the server's clock (online and offline); a doubled run costs 20
const RIFT_LV=10, RIFT_XP_K=3, RIFT_HP_K=0.6, RIFT_DMG_K=0.6;   // entry level; a kill pays 3x a same-level world kill; glass monsters are brittle: 0.6 of a world monster's health and damage
const RIFT_SPEED_K=2;   // glass monsters move twice as fast as the world kind they copy (asked 8 Nov)
const RIFT_WAVES=10, RIFT_NEXT_PCT=0.75, RIFT_WAVE_S=40, RIFT_RELEASE_S=10, RIFT_ALIVE_MAX=45;   // 10 waves; the next comes at 75% of this one dead or 40 s after it started; a wave pours in over 10 s; 45 alive at most
const RIFT_HERALD_HP=8, RIFT_BONUS_KILLS=75, RIFT_RESPAWN_S=5, RIFT_COUNT_S=5;   // the Herald's health x8; the clear bonus = 75 same-level world kills' XP; one respawn after 5 s; 5 s before wave 1
const RIFT_TALK=6, RIFT_CLEAR=16, RIFT_SLOT0=16;   // the talk key works within 6 m of the tear; no tree, prop or camp within 16 m; rift runs use slots 16.. (dungeons keep 0-15)
const riftWaveSize=n=>12+2*n;   // 14, 16 ... 32: 230 in all
/* THE ELEMENTAL RIFTS (step 17a, PLAN section 5): the same wave plan, monster count (riftWaveSize) and level rule (your level) as every rift; they differ only in the look and the monsters' element, so no
   element is easier to farm. They open at hiker level RIFT_ELEM_LV and pay Essence, no XP and no coins: a full run RIFT_ESS_FULL (12), by the waves reached (riftEssFor), x2 with the Double.
   RIFT_ELEM_SLOTS is the one kind plan: slot i of a data file's six monsters joins at wave from with weight w (the Shardmere's own plan). Data files call defineElemRift, never defineRift. */
const RIFT_ELEM_LV=28, RIFT_ESS_FULL=12;
const RIFT_ELEM_SLOTS=[{from:1,w:4},{from:1,w:2},{from:2,w:3},{from:3,w:2},{from:4,w:2},{from:5,w:2}];
const riftEssFor=w=>Math.round(RIFT_ESS_FULL*Math.max(0,Math.min(RIFT_WAVES,w|0))/RIFT_WAVES);   // the Essence for the first w waves (w = 10: 12; 5: 6; 1: 1)
// the energy now (a float): what was saved plus the refill since, capped. A save without it is full.
function riftEnergyAt(g,now){ if(!g||!isFinite(g.e)) return RIFT_E_MAX; return Math.min(RIFT_E_MAX,Math.max(0,g.e)+Math.max(0,now-(+g.at||now))/RIFT_E_MS); }
const riftFullIn=(g,now)=>Math.ceil((RIFT_E_MAX-riftEnergyAt(g,now))*RIFT_E_MS/1000);
/* THE REGISTRY (rule 4: a rift is one data file in shared/rift/, one defineRift call):
   {id, name, blurb, door: {x, z} (the tear, in the wild), aura: [blue, purple, pink] (hex: the sky's veils, the light, the glass rims), kinds: [{id, from (first wave), w (weight)}],
    herald: def id (waves 5 and 10), music, lv (the hiker level it opens at, default RIFT_LV), reward ('xp' default | 'essence'), essence ('prime' | an element: what 'essence' pays), el (the rift's element, elemental rifts)} */
const RIFT_DEFS=Object.create(null), RIFT_BAD=[], RIFT_MON_DEFS=[];
var RIFT_DOORS=[];   // (a var: nearPath may ask before this file has run)
// what a rift pays, named by its data file's `reward` (default 'xp'): each mode is one entry of RIFT_PAY on the server (server/rift.js); a new mode adds its name here and its entry there
const RIFT_REWARDS=['xp','essence'];
function defineRift(R){
  let why='';
  if(!R||typeof R.id!=='string'||!/^[a-z][a-z0-9]*$/.test(R.id)) why='id must be lower-case letters and digits';
  else if(RIFT_DEFS[R.id]) why='defined twice';
  else if(!R.door||!isFinite(R.door.x)||!isFinite(R.door.z)) why='door {x,z} is missing';
  else if(!Array.isArray(R.aura)||R.aura.length!==3) why='aura needs three colours';
  else if(R.reward!==undefined&&!RIFT_REWARDS.includes(R.reward)) why='reward must be one of '+RIFT_REWARDS.join(', ');
  else if(R.reward==='essence'&&!essIdOf(R.essence)) why='essence must be an element or prime';
  else if(R.lv!==undefined&&!(R.lv>=RIFT_LV&&R.lv<=99)) why='lv must be '+RIFT_LV+' to 99';
  else if(R.shape!==undefined&&riftShapeBad(R.shape)) why=riftShapeBad(R.shape);
  else if(!Array.isArray(R.kinds)||!R.kinds.length) why='kinds is empty';
  else { const k=R.kinds.find(k=>!ALL_MON_DEFS.some(d=>d.id===k.id)); if(k) why='kind '+k.id+' is not a monster'; else if(!ALL_MON_DEFS.some(d=>d.id===R.herald)) why='herald is not a monster'; }
  if(why){ RIFT_BAD.push({id:R&&R.id,why}); if(typeof console!=='undefined') console.warn('rift '+(R&&R.id)+' left out: '+why); return null; }
  R.rift=true; R.reward=R.reward||'xp'; R.lv=R.lv||RIFT_LV; R.pal={floor:R.aura[1],wall:R.aura[0],fog:R.aura[1],light:R.aura[2]};   // (the dungeons' palette fields, for the parts of their code that read a theme: the minimap)
  RIFT_DEFS[R.id]=R; RIFT_DOORS.push({id:R.id,x:R.door.x,z:R.door.z}); return R;
}
/* An elemental rift (essence mode): the data file gives what differs, this adds what is shared (RIFT_ELEM_LV, the kind plan, the reward). o = {id, name, blurb, door, aura, music, el (the element every monster of the
   rift has), essence ('prime' or el), mobs: six glass kind ids (riftMobDef, in the order of RIFT_ELEM_SLOTS), herald}. A monster whose element is not o.el leaves the rift out (RIFT_BAD), so a file cannot drift. */
function defineElemRift(o){
  const bad=why=>{ RIFT_BAD.push({id:o&&o.id,why}); if(typeof console!=='undefined') console.warn('rift '+(o&&o.id)+' left out: '+why); return null; };
  if(!o||!Array.isArray(o.mobs)||o.mobs.length!==RIFT_ELEM_SLOTS.length) return bad('mobs needs '+RIFT_ELEM_SLOTS.length+' kinds');
  if(!ELEMS[o.el]||o.el==='basic') return bad('el must be one of the six elements');
  if(o.essence!=='prime'&&o.essence!==o.el) return bad('essence must be prime or the rift\'s own element');
  for(const id of [...o.mobs,o.herald]){ const d=ALL_MON_DEFS.find(m=>m.id===id); if(d&&d.el!==o.el) return bad('kind '+id+' has the element '+d.el+', not '+o.el); }
  return defineRift({id:o.id,name:o.name,blurb:o.blurb,door:o.door,aura:o.aura,music:o.music,herald:o.herald,el:o.el,reward:'essence',essence:o.essence,lv:RIFT_ELEM_LV,shape:o.shape,
    kinds:o.mobs.map((id,i)=>({id,from:RIFT_ELEM_SLOTS[i].from,w:RIFT_ELEM_SLOTS[i].w}))});
}
/* A glass monster: a copy of an existing kind (its model, family numbers, animation) with its own id, name and element, at level 10 (a run scales it to your level: dgKOf), the look flag
   pal.glass and pal.tint (game/rift/glass.js draws it as glass). Not in MON_DEFS: no zone camps, no board quests, no material (made like the cave's copies, shared/cave-map.js). */
function riftMobDef(base,id,name,o){
  const b=ALL_MON_DEFS.find(m=>m.id===base); if(!b){ RIFT_BAD.push({id,why:'no base kind '+base}); return null; }
  if(ALL_MON_DEFS.some(m=>m.id===id)){ RIFT_BAD.push({id,why:'monster id '+id+' is already used'}); return null; }   // (a second kind with an id would shadow the first)
  const d=Object.assign({},b,{id,name,level:RIFT_LV,zone:undefined,count:undefined,rift:true},o); d.pal=Object.assign({},b.pal,{glass:1},o.pal||{}); d.riftOf=base;
  for(const k of ['rad','height','hp','dmg','xp','color','res','acc','boss','drop']) delete d[k];
  if(o.scale) d.scale=o.scale;
  prepDef(d); d.speed=(d.speed||0)*RIFT_SPEED_K; ALL_MON_DEFS.push(d); RIFT_MON_DEFS.push(d); return d;   // glass monsters run twice as fast as their world kind
}
/* THE VOID WORLD: each rift has its own shape (R.shape, rows of a small grid of the dungeons' 48 m tiles): H the hub (a 16 m disc, the portal P in its middle), O a platform
   (a 12 m disc with two tears S on its far rim, where the waves come in), o a stepping stone (an 8 m disc, no tear), . the void. Every two glass tiles side by side are joined by
   an 8 m wide glass bridge. Every cell that is not glass is solid to walkers (dgBake), so nobody falls off; the bake is marked open (B.open) by both sides so the void never stops
   a hit or a projectile. A rift without a shape is the Shardmere's plus. */
const RIFT_SHAPE_PLUS=['.O.','OHO','.O.'];
const RIFT_SHAPE_MAX=6, RIFT_ISLE_R={H:8,O:6,o:4};   // (radius in cells of DG_CELL = 2 m)
// is a shape good? '' or why not: rows of one length, at most 6 x 6, one hub, at least one platform, every glass tile reachable from the hub
function riftShapeBad(sh){
  if(!Array.isArray(sh)||!sh.length||sh.length>RIFT_SHAPE_MAX||sh.some(r=>typeof r!=='string'||r.length!==sh[0].length||!r.length||r.length>RIFT_SHAPE_MAX||/[^HOo.]/.test(r))) return 'shape needs rows of H O o . of one length, at most '+RIFT_SHAPE_MAX+' x '+RIFT_SHAPE_MAX;
  const all=sh.join(''); if(all.split('H').length!==2) return 'shape needs exactly one hub H'; if(all.indexOf('O')<0) return 'shape needs a platform O';
  const W=sh[0].length, glass=(x,z)=>z>=0&&z<sh.length&&x>=0&&x<W&&sh[z][x]!=='.', seen=new Set(), hz=sh.findIndex(r=>r.includes('H')), st=[[sh[hz].indexOf('H'),hz]];
  while(st.length){ const [x,z]=st.pop(), k=x+','+z; if(seen.has(k)||!glass(x,z)) continue; seen.add(k); st.push([x+1,z],[x-1,z],[x,z+1],[x,z-1]); }
  return seen.size===all.replace(/\./g,'').length?'':'every glass tile of the shape must join the hub';
}
function riftTileArt(doors,radius,marks){
  const C=DG_TC/2, g=Array.from({length:DG_TC},()=>Array(DG_TC).fill('#'));
  for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++) if(Math.hypot(x+0.5-C,z+0.5-C)<=radius) g[z][x]='.';
  const fill=(x0,z0,x1,z1)=>{ for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++) g[z][x]='.'; };
  if(doors&DG_N) fill(C-2,0,C+1,C); if(doors&DG_S) fill(C-2,C,C+1,DG_TC-1); if(doors&DG_W) fill(0,C-2,C,C+1); if(doors&DG_E) fill(C,C-2,DG_TC-1,C+1);
  for(const [ch,dx,dz] of marks) g[C+dz][C+dx]=ch;
  return g.map(r=>r.join(''));
}
// the layout dgBake takes, plus isles [{x, z, r}] in metres (the view hangs crystals under them) and mid, the shape's middle in metres
function riftLayout(R){
  const sh=R&&R.shape||RIFT_SHAPE_PLUS, W=sh[0].length, H=sh.length, glass=(x,z)=>z>=0&&z<H&&x>=0&&x<W&&sh[z][x]!=='.';
  const hz=sh.findIndex(r=>r.includes('H')), hx=sh[hz].indexOf('H'), sides=[[DG_N,0,-1],[DG_E,1,0],[DG_S,0,1],[DG_W,-1,0]], cells=[], isles=[];
  for(let z=0;z<H;z++) for(let x=0;x<W;x++){ const ch=sh[z][x]; if(ch==='.') continue;
    let mask=0; for(const [b,dx,dz] of sides) if(glass(x+dx,z+dz)) mask|=b;
    let marks=[];
    if(ch==='H') marks=[['P',0,0]];
    else if(ch==='O'){   // two tears on a free rim, the one facing away from the hub if it can
      const away=Math.abs(x-hx)>=Math.abs(z-hz)?[Math.sign(x-hx)||1,0]:[0,Math.sign(z-hz)||1];
      const free=sides.filter(([b])=>!(mask&b)).map(([,dx,dz])=>[dx,dz]).sort((a,b)=>(b[0]*away[0]+b[1]*away[1])-(a[0]*away[0]+a[1]*away[1]));
      if(free.length){ const [ox,oz]=free[0], sx=-oz, sz=ox; marks=[['S',ox*4+sx*3,oz*4+sz*3],['S',ox*4-sx*3,oz*4-sz*3]]; }
      else marks=[['S',3,3],['S',-3,-3]];   // (a platform with four bridges: tears on two diagonals)
    }
    cells.push({x,z,mask,id:ch==='H'?'rift-hub':'rift-isle',rot:0,role:ch==='H'?'start':'room',dist:Math.abs(x-hx)+Math.abs(z-hz),art:riftTileArt(mask,RIFT_ISLE_R[ch],marks)});
    isles.push({x:(x+0.5)*DG_TILE,z:(z+0.5)*DG_TILE,r:RIFT_ISLE_R[ch]*DG_CELL});
  }
  return {gw:W,gh:H,start:[hx,hz],cells,isles,mid:{x:W*DG_TILE/2,z:H*DG_TILE/2},seed:0,mission:'rift',tries:1,theme:R?R.id:null,legend:{},rift:R?R.id:null};
}
const riftNear=(x,z,m)=>{ for(const d of RIFT_DOORS){ const dx=x-d.x, dz=z-d.z, r=RIFT_CLEAR+(m||0); if(dx*dx+dz*dz<r*r) return true; } return false; };
const riftDoorNear=(x,z,r)=>{ for(const d of RIFT_DOORS) if(Math.hypot(x-d.x,z-d.z)<=(r===undefined?RIFT_TALK:r)) return RIFT_DEFS[d.id]||null; return null; };
/* the HUD (shared/dungeon-hud.js reads DG_HUD[mission]): run.hud = [wave 0-10 (0 = the count-down), monsters of the run alive or on their way, seconds to the next wave, 1 when doubled, XP so far]
   (dg[3]...dg[7]) */
DG_HUD.rift=(dg,th)=>{ const w=dg[3]|0, left=dg[4]|0, next=dg[5]|0, x2=(dg[6]|0)===1, xp=dg[7]|0, R=th&&RIFT_DEFS[th], ess=R&&R.reward==='essence'?essOf(essIdOf(R.essence)):null;   // (the fifth number is the XP so far, or the Essence of an essence rift)
  return {title:'Rift'+(x2?' · reward x2':''),lines:[w?'Wave '+w+' / '+RIFT_WAVES+(next>0&&w<RIFT_WAVES?' · next in '+next+' s':''):'The rift opens in '+next+' s','Monsters: '+left,(ess?ess.name+' this run: ':'XP this run: ')+xp.toLocaleString('en-US')],
    bar:{v:w,max:RIFT_WAVES,col:'#c78cff',label:'Wave '+w+' / '+RIFT_WAVES},warn:false}; };
