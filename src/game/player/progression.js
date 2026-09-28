//@ Your health, level and XP as told by the server, the save kept in this browser, hurt / level-up / knocked-out effects
/* The server owns the numbers (see src/server/players.js). The client mirrors them in PL, saves your level
   and XP in this browser whenever the server sends an update, and plays the effects. */
const PL={level:1,exp:0,hp:1,maxHp:1,dmg:1,def:0,red:0,dead:false};
let SAVE_PROGRESS={level:1,exp:0};
try{ const s=JSON.parse(localStorage.getItem('wildwood-progress-v1')||'null'); if(s&&s.level>=1) SAVE_PROGRESS={level:Math.min(50,s.level|0),exp:+s.exp||0}; }catch(_){}
PL.level=SAVE_PROGRESS.level; PL.exp=SAVE_PROGRESS.exp;
{ const f=fLv(PL.level); PL.maxHp=Math.round(20*f); PL.hp=PL.maxHp; PL.dmg=3*f; }
function saveProgress(){ if(NET&&NET.user) return; try{ localStorage.setItem('wildwood-progress-v1',JSON.stringify({level:PL.level,exp:PL.exp})); }catch(_){} }
function applyYou(msg){
  PL.level=msg.level; PL.exp=msg.exp; PL.maxHp=msg.maxHp; PL.dmg=msg.dmg; PL.def=msg.def; PL.red=msg.red; PL.hp=msg.hp;
  if(!msg.dead && PL.dead) playerUp();
  saveProgress(); applyGear(msg.gear);
  $('#tLevel').value=PL.level;
}
function levelUpFx(level){
  const el=$('#lvup'); el.textContent='Level '+level; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  spawnRing(4,0xffd34d,P.y+0.2); spawnRing(2.5,0xfff2b0,P.y+1.2);
  UI_SFX.success();
}
function hurtFx(v){
  popText(P.x,P.y+2.0*hiker.scale,P.z,'-'+v,'hurt');
  const h=$('#hurt'); h.classList.remove('flash'); void h.offsetWidth; h.classList.add('flash');
  camShake=0.25;
  if(SND.ready){ noiseHit({bus:'ui',filter:'lowpass',ff:500,dur:0.12,vol:0.22}); tone({bus:'ui',type:'triangle',freq:LOOK.sex==='female'?420:230,freq2:LOOK.sex==='female'?300:160,dur:0.14,vol:0.06}); }
}
let camShake=0;
function playerDown(){
  PL.dead=true; PL.hp=0; CB.act=null; CB.target=null;
  $('#down').hidden=false;
  if(SND.ready){ const n=SND.ctx.currentTime; [392,330,262].forEach((f,i)=>tone({bus:'ui',type:'triangle',freq:f,dur:0.5,vol:0.06,when:n+i*0.22})); }
}
function playerUp(){ PL.dead=false; $('#down').hidden=true; }
function updatePlayerStats(dt){ camShake=Math.max(0,camShake-dt); }
