// Headless test of skill 2 with two modes (server straight from src/): a tap casts the skill, a hold of its alt's secs casts the held mode; the server's clock decides (a hold message with no wait is a tap),
// one slot and one cooldown (the base piece's level and cooldown, the held mode's own cd when it has one), an atk during the cooldown ends the hold, a bad alt is left out alone (SH_BAD), the Proving Isle ignores it.
// Usage: node tools/skill-hold-smoke.js   (design: docs/SKILL-HOLD.md; rules: src/shared/skill-hold.js)
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['S','SKILLS','SS_BAD','SS_SETS','SH_ALT','SH_BAD','SH_TAP_MAX','ACT_SKILL','ANIM_OF','shAltOf','shArmed','shSkillRow','shHoldP','shReleaseP','defineSkillSet','abilityCd','skillLvOf','clsOfP','rlP','MONS']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6);
const quiet=fn=>{ const w=console.warn; console.warn=()=>{}; try{ return fn(); } finally{ console.warn=w; } };

// ---- the registry ----
ok('the three kits with a held mode register it (Brynja Frost Line, Tamsin Dig In, Meleni Ebb), nothing is left out',['brynja_2_any','tamsin_2_any','meleni_2_any'].every(id=>x.SH_ALT[id]&&x.SH_ALT[id].base===id&&x.SH_ALT[id].id===id+'_h')&&!x.SH_BAD.length&&!x.SS_BAD.length,JSON.stringify(x.SH_BAD));
ok('a held row is not in SKILLS (shops and loadouts iterate it) but its attack kind is in ACT_SKILL / ANIM_OF, and shSkillRow finds it by its "_h" id',!x.SKILLS.brynja_2_any_h&&x.ACT_SKILL.brynja2xh===x.SH_ALT.brynja_2_any&&x.ANIM_OF.meleni2xh==='nova'&&x.shSkillRow('tamsin_2_any_h')===x.SH_ALT.tamsin_2_any&&x.shSkillRow('brynja_2_any')===x.SKILLS.brynja_2_any&&x.shSkillRow('constructor')===null&&x.shAltOf('__proto__')===null);
ok('secs default to SH_TAP_MAX (0.5), Ebb asks 0.6 s and has its own 9 s cooldown, the others keep the tap\'s',x.SH_ALT.brynja_2_any.secs===x.SH_TAP_MAX&&x.SH_ALT.meleni_2_any.secs===0.6&&x.SH_ALT.meleni_2_any.cd===9&&x.SH_ALT.brynja_2_any.cd===x.SKILLS.brynja_2_any.cd);
ok('shArmed: a hold shorter than secs is a tap',!x.shArmed(0.49,x.SH_ALT.brynja_2_any)&&x.shArmed(0.5,x.SH_ALT.brynja_2_any)&&!x.shArmed(5,null));
// a bad alt: the set stays in, only its held mode is left out and listed
{ const E=(k,ex)=>Object.assign({name:'Hold test '+k,desc:'A test piece.',cd:6,range:5,mult:1,act:['holdt'+k,0.6,0.4],anim:'nova',fx:{ring:{r:5}}},ex);
  const d={id:'holdt',name:'Hold test',land:'home',needs:{tier:1},dev:true,el:'fire',role:{main:'safe'},char:{name:'Hold Tester',sex:'female',theme:'a test',ip:{kind:'original',riffs:'a genre'}},pal:{main:1,accent:2,glow:3},
    pos:{1:{bound:'class',skill:{warrior:E('1w',{anim:'slash',fx:{cone:{r:4,arc:1.2}}})},passive:{name:'HP1',text:'+{}%',stat:'dmg',v:0.01}},
         2:{bound:'any',skill:{any:E('2x',{alt:{name:'Bad Hold',desc:'x',secs:3,mult:1,range:5,act:['holdt2xh',0.5,0.3],fx:{ring:{r:5}}}})},passive:{name:'HP2',text:'+{}%',stat:'dmg',v:0.01}},
         3:{bound:'any',skill:{any:E('3x')},passive:{name:'HP3',text:'+{}%',stat:'dmg',v:0.01}}},bonus:{3:{name:'HB3',text:'+{}%',stat:'dmg',v:0.01},5:{name:'HB5',text:'+{}%',stat:'dmg',v:0.01}}};
  const n0=x.SH_BAD.length, S=quiet(()=>x.defineSkillSet(d));
  ok('a bad alt (secs 3) is listed in SH_BAD with its id and why, and the set still registers without it',!!S&&!!x.SKILLS.holdt_2_any&&!x.shAltOf('holdt_2_any')&&x.SH_BAD.length===n0+1&&x.SH_BAD[n0].id==='holdt_2_any_h'&&/secs/.test(x.SH_BAD[n0].why)&&!x.ACT_SKILL.holdt2xh,JSON.stringify(x.SH_BAD));
  const d2=JSON.parse(JSON.stringify(d)); d2.id='holdu'; d2.char.name='Hold Two'; for(const p of [1,2,3]) for(const k in d2.pos[p].skill){ const e=d2.pos[p].skill[k]; e.act[0]=e.act[0].replace('holdt','holdu'); e.name=e.name+'u'; } d2.pos[3].skill.any.alt=d2.pos[2].skill.any.alt; delete d2.pos[2].skill.any.alt;
  ok('an alt on position 1 or 3 leaves the set out (alt is for skill 2 only)',quiet(()=>x.defineSkillSet(d2))===null&&x.SS_BAD.some(b=>b.id==='holdu'&&/position 2/.test(b.why))); }

// ---- on the server: a real player wearing Brynja's set ----
W.join('a',{name:'Holder',look:{cls:'archer'},save:{level:60}}); for(let i=0;i<3;i++) W.tick(0.05);
const p=W.players.get('a'); p.level=60; W.receive('a',{t:'dev',cmd:'set',v:'brynja'}); W.receive('a',{t:'eqskill',id:'brynja_2_any'}); W.receive('a',{t:'dev',cmd:'set',v:'meleni'});
const fresh=()=>{ p.act=null; p.dead=false; p.hp=p.maxHp; p.cd={basic:0,skill:0,burst:0,cave:0,ult:0}; p.holdT2=null; };
const atk=()=>W.receive('a',{t:'atk',k:'skill',face:0,aim:[0,0,-1]});
const SK=()=>p.gear.skills, base=()=>x.SKILLS[SK().eq[x.clsOfP(p)].skill];
ok('the player wears Glide and Cut in slot 2',base()&&base().id==='brynja_2_any');
fresh(); atk(); ok('a tap (no hold message) casts the skill itself',p.act&&p.act.kind==='brynja2x'&&p.act.sid==='brynja_2_any'&&!p.act.src);
fresh(); W.receive('a',{t:'hold',on:1,k:'skill'}); x.S.t+=0.6; atk();
ok('a hold of its secs casts the held mode: its own act and fx, under the base piece\'s id; its events name "<piece>_h"',p.act&&p.act.kind==='brynja2xh'&&p.act.sid==='brynja_2_any'&&p.act.src==='brynja_2_any_h'&&!!p.act.fx.cone&&!p.act.fx.dash&&p.holdT2===null,p.act&&p.act.kind);
const cd0=x.abilityCd(base(),SK(),60,x.clsOfP(p),x.rlP(p,'cdr'));
ok('...one slot, one cooldown: the base piece\'s (its level and passives), the held mode\'s level is the piece\'s',near(p.cd.skill,cd0,1e-6)&&p.act.lvl===x.skillLvOf(SK(),'brynja_2_any'),p.cd.skill+' vs '+cd0);
fresh(); W.receive('a',{t:'hold',on:1,k:'skill'}); x.S.t+=0.2; atk(); ok('a hold message with no wait casts the tap: the server\'s clock decides, the client never sends a duration',p.act&&p.act.kind==='brynja2x');
fresh(); p.cd.skill=3; W.receive('a',{t:'hold',on:1,k:'skill'}); ok('a hold that starts during the cooldown is not timed',p.holdT2===null);
fresh(); W.receive('a',{t:'hold',on:1,k:'skill'}); p.cd.skill=3; atk(); ok('an atk during the cooldown ends a hold of skill 2',p.holdT2===null&&!p.act);
fresh(); W.receive('a',{t:'hold',on:1,k:'skill'}); W.receive('a',{t:'hold',on:0,k:'skill'}); x.S.t+=1; atk(); ok('a hold message with on 0 cancels it: the release casts the tap',p.act&&p.act.kind==='brynja2x');
fresh(); W.receive('a',{t:'hold',on:1}); ok('the basic hold is separate: a hold without k still times skill 1 (p.holdT0), never skill 2',p.holdT2===null&&p.holdT0!=null); p.holdT0=null;
// Meleni: Ebb has its own cooldown (9 s, under the same slot)
W.receive('a',{t:'eqskill',id:'meleni_2_any'}); fresh(); W.receive('a',{t:'hold',on:1,k:'skill'}); x.S.t+=0.7; atk();
{ const ab=Object.assign({},base(),{cd:9}); ok('Meleni: a held Ebb starts its own 9 s cooldown in the skill slot (a tap starts Landfall\'s 14 s)',p.act&&p.act.kind==='meleni2xh'&&near(p.cd.skill,x.abilityCd(ab,SK(),60,x.clsOfP(p),x.rlP(p,'cdr')),1e-6),String(p.cd.skill));
  fresh(); atk(); ok('...and the tap is Landfall with its own 14 s',p.act&&p.act.kind==='meleni2x'&&near(p.cd.skill,x.abilityCd(base(),SK(),60,x.clsOfP(p),x.rlP(p,'cdr')),1e-6)); }
// the Proving Isle's fixed loadout has no held modes
fresh(); p.pv=1; x.shHoldP(p,{on:1,k:'skill'}); const pvHold=p.holdT2; p.holdT2=x.S.t-5; const pvRel=x.shReleaseP(p,x.SKILLS.meleni_2_any); p.pv=0;
ok('on the Proving Isle a hold is never timed and never released as a held mode',pvHold===null&&pvRel===null&&p.holdT2===null);
ok('the world still ticks',(()=>{ try{ for(let i=0;i<40;i++) W.tick(0.05); return true; }catch(e){ console.log(e); return false; } })());
console.log(fails?('\n'+fails+' FAILED'):'\nall passed'); process.exit(fails?1:0);
