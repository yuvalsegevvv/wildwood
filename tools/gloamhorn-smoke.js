// Headless test of the Gloamhorn (the sixth land, levels 30-40, west of the Greyspine behind the neck rock fall), straight from src/, no build: its ground and the walk to every place that
// matters, Wraithwick (VIL6) with its people and colliders, the eleven zones and 22 monster kinds with accuracy / resistance, the two bosses (Captain Dredge, the Gloam Warden) with kits,
// skills and arenas, the gate logic (the land opens only after the Mountain Golem), the saved fields, the reserved Gloamvault door, and a scan of src/ and docs/ for the festival's name.
// One line per check; exits 1 on failure. Usage: node tools/gloamhorn-smoke.js
const fs=require('fs'), path=require('path');
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['WX0','WX1','WZ0','WZ1','GW0','GXJ','HX0','WATER','VR','inGloam','inGrey','inSun','gloamIn','gloamGround','gloamCoast','gloamSpine','gloamKeepOut','GLOAM_PTS','GLOAM_STACKS','GLOAM_WRECKS','GLOAM_CAVES','GLOAM_LIGHT','GLOAM_HOLD','GLOAM_DG_DOOR','GLOAM_ZONE_NAMES',
   'VIL4','VIL6','VILS','CIRCLES','ZONES','ARENAS','ARENA_M35','ARENA_M40','MON_DEFS','DEF_BY_ID','BOSS_DEFS','BOSSES','BOSS_SKILLS','BOSS_QUESTS','MATS','SKILLS','GREY_GATES','NODES','MONS','rawHeight','getH','zoneAt','defZone','landAt','borderZ',
   'ZTIER_LANDS','ZTIER_BOSS','MAX_ZONE_LV','genQuest','sanitizeGear','newGearFor','vDist','vilAt','vNear','rewardKill','bridgeDeck']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const H=x.rawHeight, V=x.VIL6, G=x.GREY_GATES.find(g=>g.id==='neck');

// ---- the ground ----
{ let n=0, bad=0, dry=0, hi=-1e9;
  for(let zz=-1260;zz<-700;zz+=8) for(let xx=x.WX0;xx<x.GW0-70;xx+=8){ if(!x.inGloam(xx,zz)) continue; const h=H(xx,zz); n++; if(!isFinite(h)) bad++; else { hi=Math.max(hi,h); if(h>2) dry++; } }
  ok('every point of the Gloamhorn has a finite height; a narrow horn of dry plateau (about 38 m) above a sea at -5, hundreds of cells of land',bad===0&&n>3000&&dry>400&&dry<n*0.5&&hi>30&&hi<60,n+' cells, '+dry+' dry, top '+hi.toFixed(1));
  ok('the sea is -5 m outside the horn, and inGloam is west of GW0 and north of the border only (the Greyspine, Sunscar and forest are not it)',H(x.WX0+30,-700)<=-4&&x.inGloam(-1100,-790)&&!x.inGloam(x.GW0+10,-790)&&!x.inGloam(-1100,-300)&&!x.inGloam(x.HX0-50,-100)&&x.landAt(-1100,-790)==='gloam'&&x.landAt(x.GW0+40,-790)==='grey'); }
{ const sl=(a,b)=>Math.hypot(H(a+2,b)-H(a-2,b),H(a,b+2)-H(a,b-2))/4;   // the village, the arenas, the door stand on near-flat ground
  const spots=[[V.x,V.z,'village'],[x.ARENA_M35.x,x.ARENA_M35.z,'captain'],[x.ARENA_M40.x,x.ARENA_M40.z,'warden'],[x.GLOAM_DG_DOOR.x,x.GLOAM_DG_DOOR.z,'door']];
  ok('Wraithwick, both arenas and the reserved door stand on dry, level ground',spots.every(([a,b])=>H(a,b)>25&&sl(a,b)<0.35),spots.map(([a,b,n])=>n+' h'+H(a,b).toFixed(0)+' s'+sl(a,b).toFixed(2)).join(', ')); }

// ---- reachability on foot (slope limit 1.2 per metre, 4 m cells), from the neck's east side ----
{ const C=4, LIM=1.2, X0=x.WX0, X1=x.GW0+110, Z0=-1280, Z1=-690, Wd=Math.floor((X1-X0)/C)+1, Dd=Math.floor((Z1-Z0)/C)+1, HH=new Float32Array(Wd*Dd);
  for(let j=0;j<Dd;j++) for(let i=0;i<Wd;i++) HH[j*Wd+i]=H(X0+i*C,Z0+j*C);
  const seen=new Uint8Array(Wd*Dd), q=[Math.round((G.z-Z0)/C)*Wd+Math.round((G.x+14-X0)/C)]; seen[q[0]]=1;
  const nb=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while(q.length){ const k=q.pop(), i=k%Wd, j=(k-i)/Wd; for(const [di,dj,r] of nb){ const a=i+di,b=j+dj; if(a<1||b<1||a>=Wd-1||b>=Dd-1) continue; const n=b*Wd+a; if(seen[n]||HH[n]<=x.WATER-0.8||Math.abs(HH[n]-HH[k])/(C*r)>LIM) continue; seen[n]=1; q.push(n); } }
  const reach=(X,Z,r)=>{ for(let dz=-r;dz<=r;dz+=C) for(let dx=-r;dx<=r;dx+=C){ const i=Math.round((X+dx-X0)/C), j=Math.round((Z+dz-Z0)/C); if(i>=0&&j>=0&&i<Wd&&j<Dd&&seen[j*Wd+i]) return true; } return false; };
  const zs=x.ZONES.filter(z=>z.gloam&&!z.boss), pts=[...zs.map(z=>[z.x,z.z,z.key]),[x.ARENA_M35.x,x.ARENA_M35.z,'m35 arena'],[x.ARENA_M40.x,x.ARENA_M40.z,'m40 arena'],[V.x,V.z,'Wraithwick'],[x.GLOAM_DG_DOOR.x,x.GLOAM_DG_DOOR.z,'door'],[x.GLOAM_LIGHT.x-x.GLOAM_LIGHT.dx*14,x.GLOAM_LIGHT.z-x.GLOAM_LIGHT.dz*14,'lighthouse']];
  const miss=pts.filter(p=>!reach(p[0],p[1],20)).map(p=>p[2]);
  ok('from the neck pass every zone, both arenas, Wraithwick, the lighthouse and the reserved door can be walked to',miss.length===0&&zs.length===11,zs.length+' zones'+(miss.length?'; not: '+miss.join(' '):''));
  const nodes=x.NODES.filter(n=>/^m\d+$/.test(String(n.zone))), nm=nodes.filter(n=>!reach(n.x,n.z,8));
  ok('55 resource nodes (rime ore, frostpine, snowmoss) in the zones m30..m40, all on reachable ground and off the keep-outs',nodes.length===55&&nm.length===0&&nodes.every(n=>x.inGloam(n.x,n.z)&&!x.gloamKeepOut(n.x,n.z,0)),nodes.length+' nodes, '+nm.length+' unreachable'); }

// ---- the village ----
{ const src=fs.readFileSync(path.join(__dirname,'../src/game/village/villagers.js'),'utf8'), people=(src.match(/vil:6,/g)||[]).length;
  const ats=[...src.matchAll(/vil:6[^\n]*\n[^\n]*\n[^\n]*at:'([^']+)'/g)].map(m=>m[1]), roles=['quests','weaponsmith','armorer','forge','trainer','lodge','brew'].filter(r=>src.split('\n').some((l,i,a)=>/vil:6/.test(a[i-1]||'')===false&&new RegExp("vil:6,.*role:'"+r+"'").test(l)));
  ok('Wraithwick (VIL6): the home village\'s plan (houses, stalls, board, fire, circles), a name, a teleport circle, in VILS and CIRCLES as the sixth village',V.name==='Wraithwick'&&V.houses.length===x.VIL4.houses.length&&V.boxes.length>=x.VIL4.boxes.length&&V.board&&V.tele&&x.VILS[5]===V&&x.CIRCLES.length===6&&x.CIRCLES[5].V===V&&x.CIRCLES[5].open({gloam:2})&&!x.CIRCLES[5].open({gloam:1}),V.boxes.length+' boxes'); 
  ok('Wraithwick\'s people in villagers.js: a trade each (quests, weaponsmith, armourer, forge, trainer, Lodge, healer), a gate warden, and every anchor they stand at exists',people>=9&&roles.length===7&&ats.length>=6&&ats.filter(a=>!a.startsWith('place:')).every(a=>V.anchors[a]),people+' people, roles '+roles.join(',')+', anchors '+ats.join(',')); }
{ const mid=x.vilAt(V.x,V.z), far=x.vilAt(-1500,-900);
  ok('vilAt / vNear / vDist know Wraithwick; the Highmark side of the neck is still Highmark\'s; a knocked-out hero in the Gloamhorn wakes at Wraithwick once attuned, else at Highmark / home',mid===V&&x.vNear(V.x+5,V.z,10)&&x.vDist(V.x,V.z)<2&&x.vilAt(x.GW0+200,-790)===x.VIL4&&far===x.VIL4||far===V); }

// ---- zones and monsters ----
{ const zs=x.ZONES.filter(z=>z.gloam&&!z.boss), byL=L=>x.MON_DEFS.filter(d=>d.level===L&&d.zone==='m'+L);
  ok('eleven zones m30..m40 (levels 30 at the neck to 40 at the tip), each named, each arena boss zone flagged',zs.length===11&&zs.every((z,i)=>z.key==='m'+(30+i)&&z.level===30+i&&z.name===x.GLOAM_ZONE_NAMES['m'+(30+i)]||z.key==='m'+z.level)&&x.ZONES.filter(z=>z.gloam&&z.boss).length===2);
  const defs=x.MON_DEFS.filter(d=>/^m\d+$/.test(d.zone||'')), kinds={}; for(const m of x.MONS) if(m.def.zone&&/^m\d+$/.test(m.def.zone)&&!m.temp) kinds[m.def.id]=(kinds[m.def.id]||0)+1;
  ok('22 kinds, two of each level 30-40, every kind spawned (8 or more), each with an element, a named material and a roster of its own',defs.length===22&&[30,31,32,33,34,35,36,37,38,39,40].every(L=>byL(L).length===2)&&Object.keys(kinds).length===22&&Object.values(kinds).every(n=>n>=8)&&defs.every(d=>d.el&&x.MATS[d.id]&&x.MATS[d.id].name),Object.keys(kinds).length+' kinds, '+Object.values(kinds).reduce((a,b)=>a+b,0)+' monsters');
  const mons=x.MONS.filter(m=>m.def.zone&&/^m\d+$/.test(m.def.zone)&&!m.temp);
  ok('every camp is in the Gloamhorn, in its own zone, out of the village, the keep-outs and the arenas, on ground you can stand on',mons.every(m=>x.inGloam(m.camp.x,m.camp.z)&&x.zoneAt(m.camp.x,m.camp.z)===x.defZone(m.def)&&x.vDist(m.camp.x,m.camp.z)>x.VR+15&&!x.gloamKeepOut(m.camp.x,m.camp.z,0)&&H(m.camp.x,m.camp.z)>1),mons.filter(m=>!(x.inGloam(m.camp.x,m.camp.z)&&x.zoneAt(m.camp.x,m.camp.z)===x.defZone(m.def))).slice(0,3).map(m=>m.def.id).join(','));
  ok('accuracy and resistance (docs/ROLLS.md): every kind has one or both, about 10% at level 30 rising to 30% at 40 (+2% a level), the bosses 35%',defs.every(d=>(d.res>0||d.acc>0)&&Math.abs(Math.max(d.res||0,d.acc||0)-(0.10+0.02*(d.level-30)))<0.011)&&[x.DEF_BY_ID.drownedcaptain,x.DEF_BY_ID.gloamwarden].every(d=>d.res===0.35&&d.acc===0.35),'');
  ok('quests: MAX_ZONE_LV is 40, the board asks for monsters that exist at levels up to 40, both bosses have a notice',x.MAX_ZONE_LV===40&&(()=>{ let top=0; for(let i=0;i<400;i++){ const q=x.genQuest(40,'g'+i); top=Math.max(top,q.level); if(q.kind==='hunt'&&!x.MON_DEFS.some(d=>d.id===q.target)) return false; } return top>=38; })()&&['drownedcaptain','gloamwarden'].every(id=>x.BOSS_QUESTS.some(q=>q.target===id))); }

// ---- the bosses ----
{ const cb=x.BOSS_DEFS.find(b=>b.def.id==='drownedcaptain'), gw=x.BOSS_DEFS.find(b=>b.def.id==='gloamwarden');
  ok('two world bosses: Captain Dredge (level 35, the sea caves) and the Gloam Warden (level 40, the lighthouse), each on its own arena in the Gloamhorn, with a kit, six skills (two per class), a material and the arena\'s zone',
    cb&&gw&&cb.def.level===35&&gw.def.level===40&&cb.kit==='captain'&&gw.kit==='gloamwarden'&&gw.totem.id==='soullantern'&&cb.add.id==='drownedhand'&&gw.add.id==='gloamspecter'&&[x.ARENA_M35,x.ARENA_M40].every(A=>x.inGloam(A.x,A.z)&&A.zone.boss&&A.gloam)
    &&[cb,gw].every(b=>{ const s=x.BOSS_SKILLS[b.def.id]||[]; return s.length===6&&['warrior','archer','mage'].every(c=>s.filter(id=>x.SKILLS[id].cls===c).length===2)&&x.MATS[b.def.id].name; })&&x.BOSSES.every(B=>typeof B.kit.tick==='function')&&new Set(x.BOSS_DEFS.map(b=>b.kit)).size===x.BOSS_DEFS.length);
  ok('zone tiers: the Gloamhorn is a tier land opened by its second boss',x.ZTIER_LANDS.includes('gloam')&&x.ZTIER_BOSS.gloam==='gloamwarden'&&x.newGearFor('warrior').zt.gloam&&x.landAt(x.ARENA_M40.x,x.ARENA_M40.z)==='gloam'); }

// ---- the gate: the neck's rock fall keeps you out until the Mountain Golem has fallen; walking into Wraithwick then attunes the circle ----
W.join('a',{name:'Gm',look:{cls:'warrior'},save:{level:34}}); tick(3);
const p=W.players.get('a'), evs=[], grab=()=>{ for(const m of (inbox.a||[])) if(m.t==='snap'&&m.ev) evs.push(...m.ev); inbox.a=[]; };
{ p.gear.west=2; p.gear.neck=0; p.gear.gloam=0; W.setPos('a',[G.x+30,H(G.x+30,G.z),G.z,0,0,0]); W.setPos('a',[V.x,H(V.x,V.z),V.z,0,0,0]); tick(14);
  ok('with the neck shut the server keeps you east of the rock fall: you cannot step into the Gloamhorn, and Wraithwick stays cold (gear.gloam 0)',p.x>=G.x-0.01&&p.gear.gloam===0,'x '+p.x.toFixed(1)+', gloam '+p.gear.gloam);
  p.gear.neck=1; grab(); evs.length=0; W.setPos('a',[G.x-10,H(G.x-10,G.z),G.z,0,0,0]); ok('with the neck open you pass the rock fall',Math.abs(p.x-(G.x-10))<0.01,'x '+p.x.toFixed(1));
  W.setPos('a',[V.x+3,H(V.x+3,V.z),V.z+3,0,0,0]); tick(14); grab();
  ok('walking into Wraithwick sets gear.gloam 2, with an event and a toast, once',p.gear.gloam===2&&evs.some(e=>e[0]==='gloam'&&e[1]==='a'&&e[2]===2),'gloam '+p.gear.gloam);
  p.dead=false; p.x=-1500; p.z=-900; ok('the Gloamhorn is the Mountain Golem\'s reward only: beating the golem opens the neck for everyone who helped',(()=>{ p.gear.neck=0; x.rewardKill(p,x.MONS.find(m=>m.def.id==='mountaingolem')); tick(3); return p.gear.neck===1; })());
  const g=x.sanitizeGear({gloam:9},'warrior'), g2=x.sanitizeGear({gloam:-2},'warrior'), g3=x.sanitizeGear({},'warrior');
  ok('gear.gloam is saved and clamped (0..2); an old save starts at 0 with a Gloamhorn tier slot',g.gloam===2&&g2.gloam===0&&g3.gloam===0&&g3.zt.gloam&&g3.zt.gloam.max===0); }

// ---- the testing tools ----
{ W.receive('a',{t:'dev',cmd:'gloam',v:0}); p.gear.neck=1; for(const [to,A] of [['wraithwick',V],['captain',x.ARENA_M35],['warden',x.ARENA_M40],['gloamvault',x.GLOAM_DG_DOOR]]){ W.receive('a',{t:'dev',cmd:'tunnel',v:to}); tick(2); if(!(Math.hypot(p.x-A.x,p.z-A.z)<A.r+24)) { ok('dev teleport "'+to+'" lands at its place',false,p.x.toFixed(0)+','+p.z.toFixed(0)); } }
  ok('dev: "gloam" 2 attunes the circle (and opens the neck); the teleports "wraithwick", "captain", "warden", "gloamvault" land in their places',(W.receive('a',{t:'dev',cmd:'gloam',v:2}),p.gear.gloam===2)&&Math.hypot(p.x-x.GLOAM_DG_DOOR.x,p.z-x.GLOAM_DG_DOOR.z)<x.GLOAM_DG_DOOR.r+24); }

// ---- the reserved door ----
{ const D=x.GLOAM_DG_DOOR; ok('the reserved Gloamvault door: id gloamvault, a name, radius 12, in zone m38, off every camp and node, not near the village',D.id==='gloamvault'&&D.name==='The Gloamvault'&&D.r===12&&x.zoneAt(D.x,D.z)&&x.zoneAt(D.x,D.z).key==='m38'&&x.gloamKeepOut(D.x+D.r,D.z,0)&&x.vDist(D.x,D.z)>x.VR+30,D.x+','+D.z+' rot '+D.rot); }

// ---- the festival's name appears nowhere in src/ or docs/ (the owner asked for a dark land, not that holiday) ----
{ const bad=new RegExp(['hallo','ween'].join('')+'|'+['sam','hain'].join('')+'|'+['pump','kin'].join(''),'i'), hits=[];
  const walk=d=>{ for(const f of fs.readdirSync(d,{withFileTypes:true})){ const q=path.join(d,f.name); if(f.isDirectory()){ if(f.name!=='node_modules'&&f.name!=='.git') walk(q); } else if(/\.(js|json|html|css|md|py|txt)$/.test(f.name)&&bad.test(fs.readFileSync(q,'utf8'))) hits.push(path.relative(path.join(__dirname,'..'),q)); } };
  walk(path.join(__dirname,'../src')); walk(path.join(__dirname,'../docs'));
  ok('no file in src/ or docs/ uses the festival\'s name',hits.length===0,hits.join(', ')); }
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
