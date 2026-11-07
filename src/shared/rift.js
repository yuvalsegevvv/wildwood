//@ Rifts: the numbers (energy, waves, XP x3), the energy clock (riftEnergyAt), the registry of rifts (defineRift, RIFT_DEFS, RIFT_BAD), the glass monsters (riftMobDef), the void world's platform layout (riftLayout), the tear's keep-out (riftNear). Pure; loaded by both sides
/* agent map (docs/RIFT.md)
   exports: RIFT_E_MAX, RIFT_E_FULL_H, RIFT_E_MS, RIFT_E_DOUBLE, RIFT_LV, RIFT_XP_K, RIFT_HP_K, RIFT_DMG_K, RIFT_WAVES, RIFT_NEXT_PCT, RIFT_WAVE_S, RIFT_RELEASE_S, RIFT_ALIVE_MAX,
            RIFT_HERALD_HP, RIFT_BONUS_KILLS, RIFT_RESPAWN_S, RIFT_COUNT_S, RIFT_TALK, RIFT_CLEAR, RIFT_SLOT0, riftWaveSize(n), riftEnergyAt(g,now), riftFullIn(g,now) (seconds),
            RIFT_DEFS (id -> rift, no prototype), RIFT_BAD, RIFT_DOORS (every rift's tear {id,x,z}: a var, nearPath asks it), defineRift(R), riftMobDef(base,id,name,o), RIFT_MON_DEFS,
            riftLayout(R) -> a dungeon layout ({gw, gh, start, cells}) that dgBake takes, riftNear(x,z,m), riftDoorNear(x,z,r), DG_HUD.rift (the HUD row)
   users: server/rift.js (runs, energy, waves, rewards), game/rift/*.js (the tear, the window, the void view, the glass), village-helpers.js nearPath (no tree or camp on the tear's clearing)
   test: tools/rift-smoke.js
   How a rift is built on the dungeons (docs/DUNGEONS.md section 7): a rift run is a dungeon run object in one of the far-away slots after the dungeons' own (RIFT_SLOT0 on), mission 'rift', its
   theme the rift's entry, its layout riftLayout (not dgLayout), its bake marked B.open (the void blocks walking, never a hit or a projectile). One member, always. */
const RIFT_E_MAX=100, RIFT_E_FULL_H=28, RIFT_E_MS=RIFT_E_FULL_H*3600000/RIFT_E_MAX, RIFT_E_DOUBLE=20;   // energy: 100 at most, full in 28 h (a point every 16.8 min), by the server's clock (online and offline); a doubled run costs 20
const RIFT_LV=10, RIFT_XP_K=3, RIFT_HP_K=0.6, RIFT_DMG_K=0.6;   // entry level; a kill pays 3x a same-level world kill; glass monsters are brittle: 0.6 of a world monster's health and damage
const RIFT_WAVES=10, RIFT_NEXT_PCT=0.75, RIFT_WAVE_S=40, RIFT_RELEASE_S=10, RIFT_ALIVE_MAX=45;   // 10 waves; the next comes at 75% of this one dead or 40 s after it started; a wave pours in over 10 s; 45 alive at most
const RIFT_HERALD_HP=8, RIFT_BONUS_KILLS=75, RIFT_RESPAWN_S=5, RIFT_COUNT_S=5;   // the Herald's health x8; the clear bonus = 75 same-level world kills' XP; one respawn after 5 s; 5 s before wave 1
const RIFT_TALK=6, RIFT_CLEAR=16, RIFT_SLOT0=16;   // the talk key works within 6 m of the tear; no tree, prop or camp within 16 m; rift runs use slots 16.. (dungeons keep 0-15)
const riftWaveSize=n=>12+2*n;   // 14, 16 ... 32: 230 in all
// the energy now (a float): what was saved plus the refill since, capped. A save without it is full.
function riftEnergyAt(g,now){ if(!g||!isFinite(g.e)) return RIFT_E_MAX; return Math.min(RIFT_E_MAX,Math.max(0,g.e)+Math.max(0,now-(+g.at||now))/RIFT_E_MS); }
const riftFullIn=(g,now)=>Math.ceil((RIFT_E_MAX-riftEnergyAt(g,now))*RIFT_E_MS/1000);
/* THE REGISTRY (rule 4: a rift is one data file in shared/rift/, one defineRift call):
   {id, name, blurb, door: {x, z} (the tear, in the wild), aura: [blue, purple, pink] (hex: the sky's veils, the light, the glass rims), kinds: [{id, from (first wave), w (weight)}],
    herald: def id (waves 5 and 10), music} */
const RIFT_DEFS=Object.create(null), RIFT_BAD=[], RIFT_MON_DEFS=[];
var RIFT_DOORS=[];   // (a var: nearPath may ask before this file has run)
function defineRift(R){
  let why='';
  if(!R||typeof R.id!=='string'||!/^[a-z][a-z0-9]*$/.test(R.id)) why='id must be lower-case letters and digits';
  else if(RIFT_DEFS[R.id]) why='defined twice';
  else if(!R.door||!isFinite(R.door.x)||!isFinite(R.door.z)) why='door {x,z} is missing';
  else if(!Array.isArray(R.aura)||R.aura.length!==3) why='aura needs three colours';
  else if(!Array.isArray(R.kinds)||!R.kinds.length) why='kinds is empty';
  else { const k=R.kinds.find(k=>!ALL_MON_DEFS.some(d=>d.id===k.id)); if(k) why='kind '+k.id+' is not a monster'; else if(!ALL_MON_DEFS.some(d=>d.id===R.herald)) why='herald is not a monster'; }
  if(why){ RIFT_BAD.push({id:R&&R.id,why}); if(typeof console!=='undefined') console.warn('rift '+(R&&R.id)+' left out: '+why); return null; }
  R.rift=true; R.pal={floor:R.aura[1],wall:R.aura[0],fog:R.aura[1],light:R.aura[2]};   // (the dungeons' palette fields, for the parts of their code that read a theme: the minimap)
  RIFT_DEFS[R.id]=R; RIFT_DOORS.push({id:R.id,x:R.door.x,z:R.door.z}); return R;
}
/* A glass monster: a copy of an existing kind (its model, family numbers, animation) with its own id, name and element, at level 10 (a run scales it to your level: dgKOf), the look flag
   pal.glass and pal.tint (game/rift/glass.js draws it as glass). Not in MON_DEFS: no zone camps, no board quests, no material (made like the cave's copies, shared/cave-map.js). */
function riftMobDef(base,id,name,o){
  const b=ALL_MON_DEFS.find(m=>m.id===base); if(!b){ RIFT_BAD.push({id,why:'no base kind '+base}); return null; }
  const d=Object.assign({},b,{id,name,level:RIFT_LV,zone:undefined,count:undefined,rift:true},o); d.pal=Object.assign({},b.pal,{glass:1},o.pal||{});
  for(const k of ['rad','height','hp','dmg','xp','color','res','acc','boss','drop']) delete d[k];
  if(o.scale) d.scale=o.scale;
  prepDef(d); ALL_MON_DEFS.push(d); RIFT_MON_DEFS.push(d); return d;
}
/* THE VOID WORLD: a 3 x 3 grid of the dungeons' 48 m tiles. The hub (the middle tile: a 16 m disc, the portal P in its middle) has four 8 m wide glass bridges to four outer
   platforms (12 m discs), each with two tears (S) on its far rim where the waves come in; the corners are void. Every cell that is not glass is solid to walkers (dgBake), so nobody
   falls off; the bake is marked open (B.open) by both sides so the void never stops a hit or a projectile. */
function riftTileArt(doors,radius,marks){
  const C=DG_TC/2, g=Array.from({length:DG_TC},()=>Array(DG_TC).fill('#'));
  for(let z=0;z<DG_TC;z++) for(let x=0;x<DG_TC;x++) if(Math.hypot(x+0.5-C,z+0.5-C)<=radius) g[z][x]='.';
  const fill=(x0,z0,x1,z1)=>{ for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++) g[z][x]='.'; };
  if(doors&DG_N) fill(C-2,0,C+1,C); if(doors&DG_S) fill(C-2,C,C+1,DG_TC-1); if(doors&DG_W) fill(0,C-2,C,C+1); if(doors&DG_E) fill(C,C-2,DG_TC-1,C+1);
  for(const [ch,dx,dz] of marks) g[C+dz][C+dx]=ch;
  return g.map(r=>r.join(''));
}
function riftLayout(R){
  const outer=[[1,0,DG_S,[0,-1]],[2,1,DG_W,[1,0]],[1,2,DG_N,[0,1]],[0,1,DG_E,[-1,0]]];   // x, z, the door toward the hub, the way out (the tears' side)
  const cells=[{x:1,z:1,mask:15,id:'rift-hub',rot:0,role:'start',dist:0,art:riftTileArt(15,8,[['P',0,0]])}];
  for(const [x,z,door,[ox,oz]] of outer){
    const sx=-oz, sz=ox;   // across the way out
    cells.push({x,z,mask:door,id:'rift-isle',rot:0,role:'room',dist:1,art:riftTileArt(door,6,[['S',ox*4+sx*3,oz*4+sz*3],['S',ox*4-sx*3,oz*4-sz*3]])});
  }
  return {gw:3,gh:3,start:[1,1],cells,seed:0,mission:'rift',tries:1,theme:R?R.id:null,legend:{},rift:R?R.id:null};
}
const riftNear=(x,z,m)=>{ for(const d of RIFT_DOORS){ const dx=x-d.x, dz=z-d.z, r=RIFT_CLEAR+(m||0); if(dx*dx+dz*dz<r*r) return true; } return false; };
const riftDoorNear=(x,z,r)=>{ for(const d of RIFT_DOORS) if(Math.hypot(x-d.x,z-d.z)<=(r===undefined?RIFT_TALK:r)) return RIFT_DEFS[d.id]||null; return null; };
/* the HUD (shared/dungeon-hud.js reads DG_HUD[mission]): run.hud = [wave 0-10 (0 = the count-down), monsters of the run alive or on their way, seconds to the next wave, 1 when doubled, XP so far]
   (dg[3]...dg[7]) */
DG_HUD.rift=dg=>{ const w=dg[3]|0, left=dg[4]|0, next=dg[5]|0, x2=(dg[6]|0)===1, xp=dg[7]|0;
  return {title:'Rift'+(x2?' · reward x2':''),lines:[w?'Wave '+w+' / '+RIFT_WAVES+(next>0&&w<RIFT_WAVES?' · next in '+next+' s':''):'The rift opens in '+next+' s','Monsters: '+left,'XP this run: '+xp.toLocaleString('en-US')],
    bar:{v:w,max:RIFT_WAVES,col:'#c78cff',label:'Wave '+w+' / '+RIFT_WAVES},warn:false}; };
