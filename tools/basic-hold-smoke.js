// Headless test of skill 1 as an attack-speed skill with press and hold (server straight from src/): the speed and charge maths, a tap vs a hold, what a held release does for each class,
// attack speed on every slot's cast time but not the cooldowns of skill 2 and burst, the rolled stats that replaced accuracy and resistance. Usage: node tools/basic-hold-smoke.js  (docs/BASIC-HOLD.md)
const {loadServer}=require('./load');
const {api:W,x}=loadServer({dev:true,send(){}},['MONS','S','SKILLS','SS_BAD','SS_ORDER','RL_STATS','RL_CAPS','bhSpeedK','bhChargeK','bhFrac','bhInterval','bhActDur','bhHoldAb','BH_TAP','BH_FULL','rlP','bhSpeedP','bhChargeP','handleAttack','CLASSES','abilityOf','rlRefreshP','caveCastS','caveHitS','caveChargeGain']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const near=(a,b,e)=>Math.abs(a-b)<=(e||1e-6);
ok('every shipped set loads with a skill 1 for exactly one class',x.SS_ORDER.length>=18&&!x.SS_BAD.length&&x.SS_ORDER.every(id=>{ const ids=Object.keys(x.SKILLS).filter(k=>k.startsWith(id+'_1_')); return ids.length===1; }),JSON.stringify(x.SS_BAD));
ok('the classes are spread over the sets (warrior 7, archer 6, mage 5)',['warrior','archer','mage'].every(c=>Object.keys(x.SKILLS).filter(k=>/^[a-z]+_1_(warrior|archer|mage)$/.test(k)&&x.SKILLS[k].cls===c&&x.SKILLS[k].set).length>=5));
ok('accuracy and resistance are gone, attack speed and charge gain took their keys',!x.RL_STATS.some(s=>s.id==='acc'||s.id==='res')&&x.RL_STATS.find(s=>s.k==='l').id==='aspd'&&x.RL_STATS.find(s=>s.k==='m').id==='chg'&&x.RL_STATS.length===13&&x.RL_CAPS.aspd===0.6);
ok('attack speed: 1 + the stat, capped at +60%',near(x.bhSpeedK(0.2,0.1),1.3)&&near(x.bhSpeedK(1,1),1.6)&&near(x.bhSpeedK(0,0),1));
ok('charge gain: 1 + the stat, capped at +100%',near(x.bhChargeK(0.3,0),1.3)&&near(x.bhChargeK(5,5),2));
ok('a tap is a press (0), a hold grows to 1 with the class\'s charge time, attack speed shortens it',x.bhFrac(0.1,'warrior',1)===0&&x.bhFrac(0.3,'warrior',1)>0.2&&x.bhFrac(0.45,'warrior',1)<x.bhFrac(0.7,'warrior',1)&&x.bhFrac(5,'mage',1)===1&&x.bhFrac(0.55,'archer',1.6)>x.bhFrac(0.55,'archer',1));
{ const ab=x.SKILLS.slash; ok('the interval is the old cooldown over the attack speed; a held release recovers 40% longer; the swing time is divided too',near(x.bhInterval(ab,null,2,1,0),0.35)&&near(x.bhInterval(ab,null,1,1,1),0.98,1e-3)&&near(x.bhActDur(0.5,2,1),0.25)); }
// ---- the held release per class ----
{ const w=x.bhHoldAb(x.SKILLS.slash,'warrior',1), w0=x.bhHoldAb(x.SKILLS.slash,'warrior',0.3);
  ok('warrior: a held slash is a wider, heavier cone with knockback and a slower swing; a full one stuns',w.fx.cone.r>3.1*1.3&&w.mult>3&&w0.mult<w.mult&&w.fx.cone.kb>w0.fx.cone.kb&&w.act[1]>x.SKILLS.slash.act[1]&&w.fx.cone.stun>0&&!w0.fx.cone.stun); }
{ const a1=x.bhHoldAb(x.SKILLS.shoot,'archer',1), a0=x.bhHoldAb(x.SKILLS.shoot,'archer',0.3);
  ok('archer: a held shot is an aimed arrow (no homing, faster), stronger the longer it was held; a full one bursts where it lands',a1.fx.proj.turn===0&&a1.fx.proj.speed>=46&&a1.mult>2&&a0.mult<a1.mult&&a1.fx.proj.splash&&!a0.fx.proj.splash); }
{ const m1=x.bhHoldAb(x.SKILLS.firebolt,'mage',1), m0=x.bhHoldAb(x.SKILLS.firebolt,'mage',0.3);
  ok('mage: a held bolt is an explosion on the target, wider the longer it was held; a full one leaves the foes vulnerable',m1.holdAt&&m1.fx.ring.r>m0.fx.ring.r&&m1.fx.ring.r>6&&m1.fx.ring.status&&m1.fx.ring.status.kind==='vuln'&&!m0.fx.ring.status); }
{ const press=x.SKILLS.pell_1_archer, st=x.bhHoldAb(press,'archer',1), ev=x.bhHoldAb(Object.assign({},press,{style:undefined}),'archer',1);
  ok('a set\'s style tilts the modes: hold style hits harder held, and its hold.x joins the full charge',st.mult>ev.mult&&st.fx.proj.burn&&!x.bhHoldAb(press,'archer',0.5).fx.proj.burn); }
// ---- on the server: a real player ----
{ W.join('a',{name:'A'}); const p=x.S.players.get('a'); p.level=30; p.hp=p.maxHp; p.x=0; p.z=0;
  const cls=p.gear.cls||'warrior'; const spd0=x.bhSpeedP(p);
  ok('a fresh player has attack speed 1 and charge gain 1',near(spd0,1)&&near(x.bhChargeP(p),1));
  p.rl={aspd:0.3,chg:0.5}; ok('rolled gear adds to both',near(x.bhSpeedP(p),1.3)&&near(x.bhChargeP(p),1.5));
  p.rl={}; p.cd={basic:0,skill:0,burst:0}; p.act=null;
  W.receive('a',{t:'atk',k:'basic',face:0,aim:[0,0,-1]});
  ok('a press: the basic attack has no old-style cooldown, its pace is the interval and the swing is as long as the ability says',p.act&&p.cd.basic>0&&p.cd.basic<1.2&&near(p.act.dur,x.abilityOf(cls,'basic',p.gear.skills,30).act[1],1e-6),JSON.stringify(p.cd));
  p.act=null; p.cd.basic=0; p.rl={aspd:0.6}; W.receive('a',{t:'atk',k:'basic',face:0,aim:[0,0,-1]});
  const A=x.abilityOf(cls,'basic',p.gear.skills,30);
  ok('attack speed 1.6 shortens both the swing and the pause',near(p.act.dur,A.act[1]/1.6,1e-6)&&near(p.cd.basic,A.cd/1.6,0.02),p.act.dur+' '+p.cd.basic);
  // skill 2 : cast time /speed, cooldown unchanged
  p.act=null; p.cd={basic:0,skill:0,burst:0}; p.level=30; p.gear.skills.eq[cls]=p.gear.skills.eq[cls]||{}; if(!p.gear.skills.eq[cls].skill){ const id=Object.keys(x.SKILLS).find(k=>x.SKILLS[k].cls===cls&&x.SKILLS[k].slot==='skill'&&!x.SKILLS[k].set&&!x.SKILLS[k].drop); p.gear.skills.owned.push(id); p.gear.skills.eq[cls].skill=id; } const S2=x.abilityOf(cls,'skill',p.gear.skills,30);
  ok('the player has a skill in slot 2',!!S2); if(S2){ W.receive('a',{t:'atk',k:'skill',face:0,aim:[0,0,-1]}); ok('every slot casts faster with attack speed, but its cooldown stays',p.act&&near(p.act.dur,S2.act[1]/1.6,1e-6)&&near(p.cd.skill,S2.cd*(1-0),S2.cd*0.2),p.act&&p.act.dur+' / '+p.cd.skill+' vs '+S2.cd); }
  { const ab2=x.abilityOf(cls,'basic',p.gear.skills,30), g=x.caveChargeGain(ab2,null); p.level=30; p.cave=p.cave||{charge:0}; p.rl={chg:0.5};
    p.cave.charge=0; x.caveCastS(p,'basic',ab2); x.caveHitS(p); const withChg=p.cave.charge; p.rl={}; p.cave.charge=0; x.caveCastS(p,'basic',ab2); x.caveHitS(p);
    ok('charge gain scales the Deep Cave charge a cast earns',g>0&&near(p.cave.charge,g,1e-6)&&near(withChg,g*1.5,1e-6),withChg+' vs '+p.cave.charge); }
  // hold
  p.rl={}; p.act=null; p.cd={basic:0,skill:0,burst:0};
  W.receive('a',{t:'hold',on:1}); x.S.t+=1.2; W.receive('a',{t:'atk',k:'basic',face:0,aim:[0,0,-1]});
  ok('a hold released after 1.2 s is a charged attack (stronger than a press, a longer pause), and the server timed it',p.act&&p.act.mult>A.mult*1.5&&p.cd.basic>A.cd*1.3,p.act&&p.act.mult+' vs '+A.mult);
  p.act=null; p.cd={basic:0,skill:0,burst:0}; W.receive('a',{t:'hold',on:1}); x.S.t+=0.1; W.receive('a',{t:'atk',k:'basic',face:0,aim:[0,0,-1]});
  ok('a hold released after 0.1 s is only a press',p.act&&near(p.act.mult,A.mult,1e-6));
  p.act=null; p.cd={basic:0.5,skill:0,burst:0}; W.receive('a',{t:'hold',on:1}); x.S.t+=0.6; p.cd.basic=0; W.receive('a',{t:'atk',k:'basic',face:0,aim:[0,0,-1],hold:1});
  ok('the charge starts when the swing is ready again (0.1 s of holding after a 0.5 s wait is a press), and a number from the client changes nothing',p.act&&near(p.act.mult,A.mult,1e-6));
}
console.log(fails?'\n'+fails+' FAILED':'\nbasic-hold-smoke: all passed'); process.exit(fails?1:0);
