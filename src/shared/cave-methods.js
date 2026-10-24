//@ The Deep Cave's eight ways to earn a skill (methods A-H): the registry (defineCaveMethod), the 10-minute cooldown, the Echo Shard amounts, and the questions "which skill does this place give" and "where does this skill come from". Pure.
/* Agent map. Plan: docs/CAVE.md sections 6, 7 and 15. Test: tools/cave-smoke.js. Method rows: shared/cave/method-<a..h>.js (one defineCaveMethod each). The engine: server/cave/ (methods.js and method-<a..h>.js).
   exports: CAVE_METHOD_CD (seconds), CAVE_SHARDS (Echo Shards per completion by floor), CAVE_METHOD_DEFS (letter -> row), CAVE_METHOD_IDS, CAVE_METHOD_BAD ({id, why}), defineCaveMethod(d), caveMethodDef(id),
            caveSkillAt(floor, method) -> the cave skill that place gives, or null (the place pays Echo Shards), caveWhereText(skill) -> 'Mural fragments, The Glowworm Grotto', caveBoardRows(floor),
            CAVE_FEAT_DEFAULT, caveFeatOf(floor) (method C's feat on that floor: the skill's own `feat`, else the general one).
   defineCaveMethod({id 'A'-'H', name, short (what the HUD says it is), blurb (one sentence for the board), dress [4 strings: the floor's name for the props, floors 1-4], p: {numbers the engine and the view read}}).
   Users: server/cave/*.js, game/cave/methods.js (HUD, board, skills panel), game/economy/skills.js (the locked tile's text). */
const CAVE_METHOD_CD=600;                  // seconds before the same player can finish the same method on the same floor again
const CAVE_SHARDS=[0,1,2,4,8];             // Echo Shards for one completion that pays shards, by floor (index 1-4)
const CAVE_METHOD_DEFS=Object.create(null), CAVE_METHOD_IDS=[], CAVE_METHOD_BAD=[];
function defineCaveMethod(d){
  const bad=why=>{ CAVE_METHOD_BAD.push({id:d&&typeof d.id==='string'?d.id:'?',why}); if(typeof console!=='undefined') console.warn('cave method left out:',d&&d.id,why); return null; };
  if(!d||typeof d!=='object') return bad('not an object');
  if(typeof d.id!=='string'||d.id.length!==1||!CAVE_METHODS.includes(d.id)) return bad('id must be a letter A-H');
  if(Object.prototype.hasOwnProperty.call(CAVE_METHOD_DEFS,d.id)) return bad('method already defined');
  if(typeof d.name!=='string'||!d.name||d.name.length>32) return bad('name must be 1-32 characters');
  if(typeof d.short!=='string'||!d.short||d.short.length>60) return bad('short must be 1-60 characters');
  if(typeof d.blurb!=='string'||!d.blurb||d.blurb.length>200) return bad('blurb must be 1-200 characters');
  if(!Array.isArray(d.dress)||d.dress.length!==4||d.dress.some(x=>typeof x!=='string'||!x)) return bad('dress must be 4 names, one per floor');
  if(!d.p||typeof d.p!=='object') return bad('p (the numbers) is required');
  CAVE_METHOD_DEFS[d.id]=d; CAVE_METHOD_IDS.push(d.id); CAVE_METHOD_IDS.sort(); return d;
}
const caveMethodDef=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(CAVE_METHOD_DEFS,id)?CAVE_METHOD_DEFS[id]:null;
function caveSkillAt(floor,method){ for(const id of CAVE_SKILL_IDS){ const s=CAVE_SKILLS[id]; if(s.floor===floor&&s.method===method) return s; } return null; }
function caveWhereText(sk){ const M=caveMethodDef(sk&&sk.method), F=sk&&caveFloorDef(sk.floor); return M&&F?M.name+', '+F.name:'the Deep Cave'; }
function caveBoardRows(floor){ return CAVE_METHODS.split('').map(m=>{ const M=caveMethodDef(m), sk=caveSkillAt(floor,m); return {m,name:M?M.name:m,skill:sk,short:M?M.short:''}; }); }
const CAVE_FEAT_DEFAULT={kind:'pack',n:5,time:90,noHit:true};   // floor 1's feat and the one for a place with no skill: win a fight against five spawned monsters without being hit once
function caveFeatOf(floor){ const sk=caveSkillAt(floor,'C'); return sk&&sk.feat?sk.feat:CAVE_FEAT_DEFAULT; }
