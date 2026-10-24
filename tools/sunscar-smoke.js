// Headless test of the Sunscar (the fifth land, levels 28-36) and Glasswell (VIL5), straight from src/ (no build): the ground (the Bowl, the pass, the river, the land tests), reachability
// with the two gates shut (a flood fill finds no Sunscar ground) and open (zones, arenas, the city, the reserved dungeon door), the city (80 homes, colliders, people in the source), the
// monsters (18 kinds, two per level 28-36, twelve each, accuracy and resistance), the two bosses (kits, adds, Redgate opened by the Sand Wyrm), the gate logic on the server and the save fields.
// Usage: node tools/sunscar-smoke.js
const fs=require('fs'), path=require('path');
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['rawHeight','bridgeDeck','landAt','inSun','inVale','inHoar','inGrey','WX0','WX1','WZ0','WZ1','HX0','HALF','VIL','VIL5','VILS','CIRCLES','vilAt','vDist','VR','SUN_CITY','SUN_PASS','sunPassX','SUN_RED','SUN_AMBER','SUN_DG_DOOR','sunKeepOut','sunWaterSurf','sunWallHold','sunCrestHold','gateHold','SUN_FLAT','SUN_BASE','WA_HUBS','WA_GATES','WA_POIS','waLandId',
   'borderZ','WATER','GREY_GATES','ZONES','ARENAS','MON_DEFS','MONS','MATS','BOSS_DEFS','BOSSES','BOSS_SKILLS','BOSS_QUESTS','MAX_ZONE_LV','genQuest','NODES','defZone','zoneAt','rewardKill','sanitizeGear','sanitizeQuest','respawnVil','ZTIER_LANDS','ZTIER_BOSS','sunZoneAt','ARENA_S32','ARENA_S36','GW_PLACE','SKILLS']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const H=x.rawHeight, C0=x.SUN_CITY, V=x.VIL5;

// ---- the ground ----
{ const hs=[]; for(let a=0;a<12;a++) hs.push(H(C0.x+Math.sin(a/12*6.283)*40,C0.z+Math.cos(a/12*6.283)*40));
  ok('the Bowl: the city stands on a flat floor about '+C0.h+' m up, carried by the heightmap (the terrain under the model is its floor)',Math.max(...hs)-Math.min(...hs)<2.5&&Math.abs(H(C0.x,C0.z)-C0.h)<4,'spread '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)+', centre '+H(C0.x,C0.z).toFixed(1)); }
ok('land tests (the atlas\'s): the city, its apron and the pass\'s south end are the Sunscar; the home forest, the Greyspine and the Gloamhorn are not; the closed link south is land 6 but still inSun',x.inSun(C0.x,C0.z)&&x.landAt(C0.x,C0.z)==='sun'&&x.landAt(0,0)==='home'&&x.landAt(-300,200)==='home'&&!x.inSun(-300,-400)&&x.landAt(x.sunPassX(-300),-300)==='grey'&&x.landAt(-700,-300)==='gloam'&&x.inSun(x.SUN_AMBER.x,x.SUN_AMBER.z+40)&&x.waLandId(x.SUN_AMBER.x,x.SUN_AMBER.z+40)===6);
ok('the Bowl is at the atlas\'s hub of the Sunscar, the gates at its gates: the River Pass (grey | sun), Redgate Canyon (home | sun) and the Amber link (closed, nothing behind it)',Math.hypot(C0.x-x.WA_HUBS.sun[0],C0.z-x.WA_HUBS.sun[1])<1&&x.GREY_GATES.length>=4&&[['river',x.WA_GATES.find(g=>g.a==='grey'&&g.b==='sun')],['redgate',x.WA_GATES.find(g=>g.a==='home'&&g.b==='sun')],['amber',x.WA_GATES.find(g=>g.b==='amber')]].every(([id,g])=>{ const G=x.GREY_GATES.find(q=>q.id===id); return G&&Math.hypot(G.x-g.x,G.z-g.z)<40; })&&x.SUN_DG_DOOR&&Math.hypot(x.SUN_DG_DOOR.x-x.WA_POIS.find(q=>q.land==='sun'&&q.kind==='door').x,x.SUN_DG_DOOR.z-x.WA_POIS.find(q=>q.land==='sun'&&q.kind==='door').z)<90);
ok('Glasswell is a village like the others: in VILS and CIRCLES (fifth), vilAt finds it from the middle and from the plaza, its teleport circle is the Glasswell one',x.VILS.length>=5&&x.VILS[4]===V&&x.CIRCLES.length>=5&&x.CIRCLES[4].V===V&&x.vilAt(C0.x,C0.z)===V&&x.vilAt(V.tele.x,V.tele.z)===V&&x.vDist(C0.x,C0.z)<x.VR);
{ const gw=H(C0.x,C0.z+45)-C0.h; ok('the city is walled by its Bowl: the rim is well above the floor',H(C0.x,C0.z-C0.r-40)>C0.h+8||H(C0.x+C0.r+40,C0.z)>C0.h+8||H(C0.x-C0.r-40,C0.z)>C0.h+8,'floor +'+gw.toFixed(1)); }
{ const lk=x.SUN_CITY; ok('the Sunscar has no water of its own: only the Bowl\'s lake stands (the model\'s), none on the plateau round it',x.sunWaterSurf(C0.x-52,C0.z+10)!==null&&x.sunWaterSurf(C0.x+200,C0.z+200)===null&&x.sunWaterSurf(C0.x-300,C0.z)===null); }

// ---- reachability: the leak model (gates shut) and the open land ----
{ const C=4, LIM=1.2, Wd=Math.floor((x.WX1-x.WX0)/C)+1, Dd=Math.floor((x.WZ1-x.WZ0)/C)+1, HH=new Float32Array(Wd*Dd), px=i=>x.WX0+i*C, pz=j=>x.WZ0+j*C;
  for(let j=0;j<Dd;j++) for(let i=0;i<Wd;i++) HH[j*Wd+i]=Math.max(H(px(i),pz(j)),x.bridgeDeck(px(i),pz(j)));
    const shutG=x.GREY_GATES.filter(g=>g.id==='river'||g.id==='redgate'||g.id==='amber');
  const blockedStep=(ox,oz,X,Z)=>{ if(X>-250&&ox>-250) return false; const o={x:X,z:Z}; for(const g of shutG) x.gateHold(g,o,ox,oz); x.sunWallHold(o,ox); x.sunCrestHold(o,oz); return o.x!==X||o.z!==Z; };
  const nb=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  const flood=shut=>{ const seen=new Uint8Array(Wd*Dd), q=new Int32Array(Wd*Dd); let qh=0,qt=0; const s0=Math.round((x.VIL.z+8-x.WZ0)/C)*Wd+Math.round((x.VIL.x+8-x.WX0)/C); seen[s0]=1; q[qt++]=s0;
    while(qh<qt){ const k=q[qh++], i=k%Wd, j=(k-i)/Wd; for(const [di,dj,r] of nb){ const a=i+di,b=j+dj; if(a<2||b<2||a>=Wd-2||b>=Dd-2) continue; const n=b*Wd+a; if(seen[n]||HH[n]<=x.WATER-0.8||(HH[n]-HH[k])/(C*r)>LIM||(shut&&blockedStep(px(i),pz(j),px(a),pz(b)))) continue; seen[n]=1; q[qt++]=n; } } return seen; };
  const GR=x.GREY_GATES.find(g=>g.id==='river'), RR=x.GREY_GATES.find(g=>g.id==='redgate'), count=S=>{ let n=0; for(let j=0;j<Dd;j++) for(let i=0;i<Wd;i++) if(S[j*Wd+i]&&x.inSun(px(i),pz(j))&&HH[j*Wd+i]>1) n++; return n; };
  const shut=flood(true), open=flood(false);
  ok('with the River Pass and Redgate shut, no Sunscar ground can be walked to from the home village (the holds are the only doors)',count(shut)===0,count(shut)+' cells');
  const reach=(X,Z,r)=>{ for(let dz=-r;dz<=r;dz+=C) for(let dx=-r;dx<=r;dx+=C){ const i=Math.round((X+dx-x.WX0)/C), j=Math.round((Z+dz-x.WZ0)/C); if(i>=0&&j>=0&&i<Wd&&j<Dd&&open[j*Wd+i]) return true; } return false; };
  const sz=x.ZONES.filter(z=>z.sun&&isFinite(z.x)&&!z.boss), bad=[...sz.map(z=>[z.x,z.z,z.key]),...x.ARENAS.filter(a=>a.sun).map(a=>[a.x,a.z,a.key]),[V.x,V.z,'Glasswell'],[x.SUN_DG_DOOR.x,x.SUN_DG_DOOR.z,'door']].filter(p=>!reach(p[0],p[1],20)).map(p=>p[2]);
  ok('with them open, every Sunscar zone, both arenas, Glasswell and the reserved Sandglass door can be walked to',bad.length===0&&sz.length===9,sz.length+' zones'+(bad.length?'; not: '+bad.join(' '):'')); }

// ---- the city and its people ----
{ const src=fs.readFileSync(path.join(__dirname,'../src/game/village/villagers.js'),'utf8'), people=(src.match(/vil:5,/g)||[]).length, roles=['quests','weaponsmith','armorer','forge','trainer','lodge','brew'].filter(r=>new RegExp("vil:5[^\\n]*\\n?[^\\n]*\\n?[^\\n]*role:'"+r+"'").test(src.replace(/\n\s+look/g,' look')));
  ok('Glasswell: '+V.houses.length+' homes, colliders from the footprints (boxes and circles), a board, a fire, a cart, anchors for its people; and its people in villagers.js (a trade each: quests, weaponsmith, armourer, forge, trainer, Lodge, healer)',
    V.houses.length===80&&V.boxes.length>=80&&V.circles.length>5&&V.board&&V.cart&&V.anchors.questboard&&V.anchors.garden&&V.anchors.cart&&V.anchors['place:weapons']&&people>=9&&roles.length===7,V.boxes.length+' boxes; '+people+' people, roles '+roles.join(',')); }

// ---- the monsters ----
{ const defs=x.MON_DEFS.filter(d=>d.zone&&/^s\d+$/.test(d.zone)), kinds={}; for(const m of x.MONS) if(m.def.zone&&/^s\d+$/.test(m.def.zone)&&!m.temp&&!m.rd) kinds[m.def.id]=(kinds[m.def.id]||0)+1;
  ok('eighteen kinds, two of each level 28-36, eighteen of every kind (x1.5 spawns), each with a named drop material and an element',defs.length===18&&[28,29,30,31,32,33,34,35,36].every(L=>defs.filter(d=>d.level===L&&d.zone==='s'+L).length===2)&&Object.keys(kinds).length===18&&Object.values(kinds).every(n=>n===18)&&defs.every(d=>x.MATS[d.id]&&x.MATS[d.id].name&&d.el),Object.keys(kinds).length+' kinds');
  const mons=x.MONS.filter(m=>m.def.zone&&/^s\d+$/.test(m.def.zone)&&!m.temp&&!m.rd);
  ok('every camp is in the Sunscar, in its own zone, out of the city, the river, the pans\' water and the arenas, on ground you can stand on',mons.every(m=>x.inSun(m.camp.x,m.camp.z)&&x.zoneAt(m.camp.x,m.camp.z)===x.defZone(m.def)&&x.vDist(m.camp.x,m.camp.z)>x.VR+15&&!x.sunKeepOut(m.camp.x,m.camp.z,0)&&H(m.camp.x,m.camp.z)>1),mons.length+' monsters');
  const f=x.MON_DEFS.filter(d=>d.level>=28&&d.zone&&/^s/.test(d.zone));
  ok('accuracy and resistance are gone: no kind and no boss carries res or acc (docs/BASIC-HOLD.md)',f.every(d=>d.res===undefined&&d.acc===undefined),''); }
ok('quests and levels: MAX_ZONE_LV is 45 (Amber Reach\'s top), a quest board never asks for a level with no monsters (the highest monster is in the Gloamhorn, 40, until the Reach\'s monsters exist), both bosses have a notice',x.MAX_ZONE_LV===45&&(()=>{ const top=Math.max(...x.MON_DEFS.map(d=>d.level)); for(let i=0;i<400;i++){ const q=x.genQuest(40,'t'+i); if(q.level>top||(q.kind==='hunt'&&!x.MON_DEFS.some(d=>d.id===q.target))) return false; } return true; })()&&['glassguardian','sandwyrm'].every(id=>x.BOSS_QUESTS.some(q=>q.target===id)));
ok('the nodes: the Sunscar has its own (rime ore, frostpines, snowmoss) after the Greyspine\'s, none on the river, the pans or the glass',x.NODES.filter(n=>/^s\d+$/.test(String(n.zone))).length>=40&&x.NODES.filter(n=>/^s\d+$/.test(String(n.zone))).every(n=>x.inSun(n.x,n.z)&&!x.sunKeepOut(n.x,n.z,0)));
ok('zone tiers: the Sunscar is a tier land, opened by the Sand Wyrm',x.ZTIER_LANDS.includes('sun')&&x.ZTIER_BOSS.sun==='sandwyrm');

// ---- the two bosses ----
{ const gg=x.BOSS_DEFS.find(b=>b.def.id==='glassguardian'), sw=x.BOSS_DEFS.find(b=>b.def.id==='sandwyrm');
  ok('two world bosses: the Glass Guardian (level 32, black mirrors) and the Sand Wyrm (level 36), each on a flat arena of its own in the Sunscar, with a kit, six skills, a named material and a notice',
    gg&&sw&&gg.def.level===32&&sw.def.level===36&&gg.kit==='glass'&&sw.kit==='sandwyrm'&&gg.totem.id==='blackmirror'&&sw.add.id==='sandwhelp'&&[x.ARENA_S32,x.ARENA_S36].every(A=>x.inSun(A.x,A.z)&&A.zone.boss&&Math.abs(H(A.x,A.z)-H(A.x+A.r*0.9,A.z))<2.5)&&
    [gg,sw].every(b=>(x.BOSS_SKILLS[b.def.id]||[]).length===6&&x.MATS[b.def.id].name&&x.BOSS_QUESTS.some(q=>q.target===b.def.id))&&x.BOSSES.length>=10&&x.BOSSES.every(B=>typeof B.kit.tick==='function')); }

// ---- the gates on the server ----
W.join('a',{name:'Walker',look:{cls:'warrior'},save:{level:30}}); tick(2);
const p=W.players.get('a'), Gr=x.GREY_GATES.find(g=>g.id==='river'), Gs=x.SUN_RED;
{ p.gear.river=0; p.gear.redgate=0; p.gear.sun=0;
  const walkZ=(z0,z1)=>{ p.x=x.sunPassX(z0); p.z=z0; for(let z=z0;z1>z0?z<=z1:z>=z1;z+=(z1>z0?2:-2)){ const X=x.sunPassX(z); W.setPos('a',[X,H(X,z),z,0,0,0]); } };
  walkZ(Gr.z-40,Gr.z+30); const shut=p.z;
  p.gear.river=1; walkZ(Gr.z-40,Gr.z+30);
  ok('the River Pass: shut, the server keeps you north of its rock fall (walking south from the Greyspine); open, you walk through',shut<=Gr.z+2&&p.z>Gr.z+20,'shut z '+shut.toFixed(1)+', open z '+p.z.toFixed(1)+', fall at '+Gr.z); }
{ const walkX=(x0,x1)=>{ p.x=x0; p.z=Gs.z; for(let X=x0;X>=x1;X-=2) W.setPos('a',[X,H(X,Gs.z),Gs.z,0,0,0]); };
  p.gear.redgate=0; p.gear.river=1; walkX(Gs.x+30,Gs.x-30); const shut=p.x;
  p.gear.redgate=1; walkX(Gs.x+30,Gs.x-30);
  ok('Redgate Canyon: shut, you cannot walk from the forest side to the Sunscar side; open you can',shut>=Gs.x-3&&p.x<Gs.x-20,'shut x '+shut.toFixed(1)+', open x '+p.x.toFixed(1)+', fall at '+Gs.x.toFixed(0)); }
{ p.gear.redgate=0; p.gear.sun=0; inbox.a.length=0; x.rewardKill(p,x.MONS.find(m=>m.def.id==='sandwyrm')); tick(3);
  ok('the Sand Wyrm opens Redgate for everyone who helped, with a gate event',p.gear.redgate===1&&inbox.a.some(m=>m.t==='snap'&&(m.ev||[]).some(e=>e[0]==='gate'&&e[2]==='redgate'))); }
{ p.gear.river=1; p.gear.sun=0; W.setPos('a',[V.x,H(V.x,V.z),V.z,0,0,0]); tick(14);
  ok('walking into Glasswell attunes its circle (gear.sun 2); you wake there when knocked out in the Sunscar',p.gear.sun===2&&x.respawnVil(Object.assign({},p,{x:C0.x-200,z:C0.z+200}))===V); }
{ const g=x.sanitizeGear({sun:9,redgate:5,river:1,mq:{s:0}},'warrior'), n=x.sanitizeGear({},'warrior');
  ok('the save: sun is clamped 0-2 and redgate 0-1; a new save has both shut',g.sun===2&&g.redgate===1&&n.sun===0&&n.redgate===0&&x.sanitizeGear({sun:-4,redgate:-1},'warrior').sun===0); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
