//@ The Deep Cave's place in the world: the floor registry (defineCaveFloor), where each floor lies (fixed squares east of the dungeon run slots), the floor under a point, its baked map, walking and height queries, the lifts and the floors a hiker may take. Pure.
/* Agent map. Doc: docs/CAVE.md section 14. Test: tools/cave-smoke.js. Floor rows: shared/cave/floor-<n>-<id>.js. The map itself is made by shared/cave-gen.js.
   exports: CAVE_FLOOR_DEFS (n -> row), CAVE_FLOOR_N (the floor numbers in order), CAVE_FLOOR_BAD ({id, why}), defineCaveFloor(def), caveFloorDef(n), CAVE_X0, CAVE_Z0, CAVE_SPACING, CAVE_SIZE, caveFloorOrigin(n) -> {x,z},
            caveFloorAt(x,z) -> floor n or -1, caveBake(n) -> B (cached), caveGroundY(x,z), caveFree(x,z,r), caveSlide(ox,oz,nx,nz,r), caveLos(x0,z0,x1,z1), caveWallAt(x,z),
            caveLiftOf(n) -> {x,z,r} (n = 0: the mouth's), caveArrival(n) -> {x,z,face}, caveFloorOpen(p,n), caveLiftRefusal(p,n) -> a refusal text or '', CAVE_FLOOR_Y (a floor's base height).
   users: server/world.js getH, server/cave-zone.js (setPos, the lift, camps), game/cave/*.js, game/world/heightmap.js getH, tools/cave-smoke.js.
   WHERE THE FLOORS LIVE (decided in C1): in the same world, as FIXED squares east of the dungeon run slots (x from CAVE_X0), one per floor, CAVE_SPACING apart in z. Not an instanced run: nobody is
   moved to a copy, every player on a floor shares its monsters, snapshots and chat like any land; the squares lie inside dgInSlots(x) (shared/dungeon-slots.js), so the machinery that already treats that
   strip as "underground, not the world" keeps working (flat-floor getH, no ambience of the forest, fish and dragonflies off), while dgSlotAt(x,z) is -1 there (no run is ever placed on a floor).
   The squares are CAVE_SIZE m (168 cells of 2 m) and CAVE_SPACING (600 m) apart: further than the widest snapshot radius (250 m) from each other and from the run slots, so no floor ever sees another.
   caveFloorOpen: floor 1 is open to everyone from level 23; floor n > 1 once the hiker owns at least CAVE_OPEN_NEED (2) skills of the floor above (C3 turns on the earning of skills, the rule is already right). */
const CAVE_FLOOR_DEFS=Object.create(null), CAVE_FLOOR_N=[], CAVE_FLOOR_BAD=[];
const CAVE_X0=DG_X0+DG_ACROSS*DG_SLOT+300, CAVE_Z0=DG_Z0, CAVE_SPACING=600, CAVE_SIZE=168*CAVE_CELL, CAVE_FLOOR_Y=DG_FLOOR_Y, CAVE_OPEN_NEED=2;
const CAVE_THEMES=['grotto','prism','drowned','magma'];
const CAVE_WALK_R=0.45;   // a hiker's radius against the walls (server and client alike); the drawn wall is smoothed to at most 0.6 m from the grid's, and monsters use their own
function defineCaveFloor(d){
  const bad=why=>{ CAVE_FLOOR_BAD.push({id:d&&typeof d.id==='string'?d.id:'?',why}); if(typeof console!=='undefined') console.warn('cave floor left out:',d&&d.id,why); return null; };
  if(!d||typeof d!=='object') return bad('not an object');
  if(typeof d.id!=='string'||!/^[a-z][a-z0-9]{1,23}$/.test(d.id)) return bad('id must be 2-24 lowercase letters or digits');
  if(!Number.isInteger(d.n)||d.n<1||d.n>9) return bad('n must be a floor number 1-9');
  if(CAVE_FLOOR_DEFS[d.n]) return bad('floor '+d.n+' already defined');
  if(typeof d.name!=='string'||!d.name||d.name.length>32) return bad('name must be 1-32 characters');
  if(typeof d.theme!=='string'||!CAVE_THEMES.includes(d.theme)) return bad('theme must be one of '+CAVE_THEMES.join(', '));
  if(!Array.isArray(d.lv)||d.lv.length!==2||!Number.isInteger(d.lv[0])||!Number.isInteger(d.lv[1])||d.lv[0]<1||d.lv[1]<d.lv[0]) return bad('lv must be [min, max] levels');
  if(!Number.isInteger(d.seed)) return bad('seed must be an integer');
  if(!d.gen||typeof d.gen!=='object') return bad('gen (the generator options) is required');
  if(!d.look||typeof d.look!=='object') return bad('look (colours and light for the client) is required');
  if(d.mobs!==undefined&&(!Array.isArray(d.mobs)||d.mobs.some(x=>typeof x!=='string'))) return bad('mobs must be a list of monster ids');
  CAVE_FLOOR_DEFS[d.n]=d; CAVE_FLOOR_N.push(d.n); CAVE_FLOOR_N.sort((a,b)=>a-b); return d;
}
const caveFloorDef=n=>Number.isInteger(n)&&CAVE_FLOOR_DEFS[n]||null;
const caveFloorOrigin=n=>({x:CAVE_X0,z:CAVE_Z0+(n-1)*CAVE_SPACING});
function caveFloorAt(x,z){
  if(x<CAVE_X0||x>=CAVE_X0+CAVE_SIZE) return -1;
  const n=Math.floor((z-CAVE_Z0)/CAVE_SPACING)+1;
  return n>=1&&n<=9&&CAVE_FLOOR_DEFS[n]&&z>=CAVE_Z0+(n-1)*CAVE_SPACING&&z<CAVE_Z0+(n-1)*CAVE_SPACING+CAVE_SIZE?n:-1;
}
const CAVE_BAKES=Object.create(null);
function caveBake(n){ if(CAVE_BAKES[n]===undefined){ const F=caveFloorDef(n); CAVE_BAKES[n]=F?caveGen(F):null; } return CAVE_BAKES[n]; }
// the floor's height under a point: the base plus the baked corner heights (bilinear); outside a floor (or while no floor is defined) the dungeons' flat 10 m
function caveGroundY(x,z){
  const n=caveFloorAt(x,z); if(n<0) return DG_FLOOR_Y;
  const B=caveBake(n); if(!B) return DG_FLOOR_Y;
  const o=caveFloorOrigin(n), gx=(x-o.x)/CAVE_CELL, gz=(z-o.z)/CAVE_CELL, ix=Math.min(B.w-1,Math.max(0,Math.floor(gx))), iz=Math.min(B.h-1,Math.max(0,Math.floor(gz))), fx=Math.min(1,Math.max(0,gx-ix)), fz=Math.min(1,Math.max(0,gz-iz)), W1=B.w+1;
  const a=B.hgt[iz*W1+ix], b=B.hgt[iz*W1+ix+1], c=B.hgt[(iz+1)*W1+ix], d=B.hgt[(iz+1)*W1+ix+1];
  return CAVE_FLOOR_Y+a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;
}
// walking: the baked grid is shaped like a dungeon bake (w, h, cells), so the dungeons' own tests are the walls here too
function caveFree(x,z,r){ const n=caveFloorAt(x,z); if(n<0) return false; const B=caveBake(n), o=caveFloorOrigin(n); return !!B&&dgFree(B,x-o.x,z-o.z,r); }
function caveSlide(ox,oz,nx,nz,r){ const n=caveFloorAt(ox,oz); if(n<0) return [ox,oz]; const B=caveBake(n), o=caveFloorOrigin(n); if(!B) return [ox,oz]; const s=dgSlide(B,ox-o.x,oz-o.z,nx-o.x,nz-o.z,r); return [s[0]+o.x,s[1]+o.z]; }
function caveLos(x0,z0,x1,z1){ const n=caveFloorAt(x0,z0); if(n<0) return true; const B=caveBake(n), o=caveFloorOrigin(n); return !B||dgLos(B,x0-o.x,z0-o.z,x1-o.x,z1-o.z); }
function caveWallAt(x,z){ const n=caveFloorAt(x,z); if(n<0) return false; const B=caveBake(n), o=caveFloorOrigin(n); return !!B&&dgSolid(B,x-o.x,z-o.z); }
// the lifts: n = 0 is the one beside the mouth (shared/cave-mouth.js), n >= 1 the floor's own at its start
function caveLiftOf(n){ if(n===0) return CAVE_LIFT_SURFACE; const B=caveBake(n); if(!B) return null; const o=caveFloorOrigin(n); return {x:o.x+B.lift.x,z:o.z+B.lift.z,r:B.lift.r}; }
function caveArrival(n){ if(n===0){ const L=CAVE_LIFT_SURFACE, M=CAVE_MOUTH; return {x:L.x+M.fx*3.4,z:L.z+M.fz*3.4,face:Math.atan2(M.fx,M.fz)}; }
  const B=caveBake(n), o=caveFloorOrigin(n), s=B.start, dx=Math.sin(s.face), dz=Math.cos(s.face); return {x:o.x+s.x+dx*3.4,z:o.z+s.z+dz*3.4,face:s.face}; }
// owned cave skills of a floor: gear.cave.own is {skill id: level}; the skill rows say which floor they belong to
function caveOwnedOn(gear,floor){ const own=gear&&gear.cave&&gear.cave.own; if(!own) return 0; let n=0; for(const id in own){ if(own[id]>0&&Object.prototype.hasOwnProperty.call(own,id)){ const s=caveSkillDef(id); if(s&&s.floor===floor) n++; } } return n; }
const caveFloorOpen=(p,n)=>{ const g=p&&p.gear||p; return Number.isInteger(n)&&n>=1&&!!caveFloorDef(n)&&(n===1||caveOwnedOn(g,n-1)>=CAVE_OPEN_NEED); };
// why a hiker may not take the lift to floor n ('' = may); n = 0 (the surface) is always allowed
function caveLiftRefusal(p,n){
  if(n===0) return '';
  if(!caveFloorDef(n)) return 'There is no such floor.';
  if((p.level|0)<CAVE_SLOT_LV) return 'The lift cage will not move: the Deep Cave is for hikers of level '+CAVE_SLOT_LV+' and up.';
  if(!caveFloorOpen(p,n)) return 'Floor '+n+' is still shut: own '+CAVE_OPEN_NEED+' skills from floor '+(n-1)+' first ('+caveOwnedOn(p.gear||p,n-1)+' so far).';
  return '';
}
/* A cave monster: a copy of an existing kind (its model, family numbers and look) with its own id, name, level and colours, made like the grey-veined copies of monster-defs.js. Not in MON_DEFS (no zone camps, no board
   quests, no material); in ALL_MON_DEFS so the server's DEF_BY_ID and the client's roster find it. The server puts a floor's camps out (server/cave-zone.js), one kind per level of the floor's band. */
const CAVE_MON_DEFS=[];
function caveMobDef(base,id,name,o){
  const b=MON_DEFS.find(m=>m.id===base); if(!b){ if(typeof console!=='undefined') console.warn('cave monster left out:',id,'(no base kind '+base+')'); return null; }
  const d=Object.assign({},b,{id,name,zone:undefined,count:undefined,cave:true},o); d.pal=Object.assign({},b.pal,o.pal||{});
  for(const k of ['rad','height','hp','dmg','xp','color']) delete d[k];
  prepDef(d); ALL_MON_DEFS.push(d); CAVE_MON_DEFS.push(d); return d;
}
