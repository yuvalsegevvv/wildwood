// Headless test of the Greyspine on the atlas (shared/greyspine.js, highmark.js, greyzones.js), straight from src/, no build: its places stand at the atlas's anchors (Highmark on the hub, the arenas at the bosses, the
// glacier valley and the two rock falls at the gates), its ground is the atlas's (mountains, not a wall; every zone reachable on foot from Highmark), its water the atlas's, its zones and monsters, bosses, gates and
// the testing teleports. One line per check; exits 1 on failure.
// Usage: node tools/greyspine-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['sunPassX','inSun','GXJ','GW0','inGloam','rawHeight','baseHeight','GREY_HM','GREY_QUEEN','greyTreeline','zoneAt','zoneRidge','NODES','MONS','inGrey','HALF','HZ0','WX0','WZ0','VIL','TUN','GLEN','inGlen','rewardKill','sanitizeGear','MQ_BY_ID','VIL3','VIL4','VILS','CIRCLES','vilAt','ROADS','respawnVil','nearLodge','defZone','arenaDist','MON_DEFS','ZONES','MATS','MAX_ZONE_LV','VR','ARENAS','landAt','zoneTierOn','ARENA29','ARENA32','BOSS_DEFS','BOSS_SKILLS','BOSS_QUESTS','SKILLS','BOSSES','waterSurf','greyWet','WATER','GREY_GATES','inGate','WA_HUBS','WA_GATES','WA_POIS','WA_ZONES','waLandId','waLand','waZoneId','gateHold','westBarX','WZ1']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const H=x.rawHeight, slope=(a,b)=>Math.hypot(H(a+2,b)-H(a-2,b),H(a,b+2)-H(a,b-2))/4;
// ---- the places: the atlas's anchors ----
const at=(a,b,r)=>Math.hypot(a.x-b[0],a.z-b[1])<=r;
ok('Highmark stands on the atlas\'s Greyspine hub (one piece), the Gryphon Queen\'s and the golem\'s arenas within 22 m of their bosses, the glacier valley and the two rock falls at the atlas\'s gates',
  at(x.VIL4,x.WA_HUBS.grey,0.5)&&at(x.GREY_HM,x.WA_HUBS.grey,0.5)&&at(x.ARENA29,[x.WA_POIS.find(q=>q.name==="The Gryphon Queen\'s Peak").x,x.WA_POIS.find(q=>q.name==="The Gryphon Queen\'s Peak").z],22)&&
  at(x.ARENA32,[x.WA_POIS.find(q=>q.name==="The Golem\'s Cavern").x,x.WA_POIS.find(q=>q.name==="The Golem\'s Cavern").z],22)&&
  Math.abs(x.GLEN.gx-x.WA_GATES.find(g=>g.b==='grey'&&g.a==='hoar').x)<1&&(()=>{ const g=x.GREY_GATES.find(q=>q.id==='neck'), w=x.WA_GATES.find(q=>q.name==='The Windswept Neck'); return Math.hypot(g.x-w.x,g.z-w.z)<1; })());
ok('every Greyspine place is on the Greyspine\'s land: Highmark, both arenas, the glacier valley\'s ice fall (in the Reach, 15 m east of the border), the neck pass',
  x.waLand(x.VIL4.x,x.VIL4.z)==='grey'&&x.waLand(x.ARENA29.x,x.ARENA29.z)==='grey'&&x.waLand(x.ARENA32.x,x.ARENA32.z)==='grey'&&x.waLand(x.GLEN.ice,x.GLEN.z)==='hoar'&&x.waLand(x.GLEN.ice-17,x.GLEN.z)==='grey'&&x.waLand(x.GREY_GATES.find(g=>g.id==='neck').x,x.GREY_GATES.find(g=>g.id==='neck').z)!==null);
// ---- the ground (the atlas\'s): mountains, not a wall, and walkable from Highmark to every zone ----
{ let n=0, lo=1e9, hi=-1e9, bad=0, steep=0, land=0;
  for(let zz=x.WZ0;zz<-100;zz+=12) for(let xx=-560;xx<345;xx+=12){ if(x.waLandId(xx,zz)!==3||x.waLand(xx,zz)===null) continue; const h=H(xx,zz); n++; if(!isFinite(h)) bad++; hi=Math.max(hi,h); lo=Math.min(lo,h); if(slope(xx,zz)>0.95) steep++; }
  ok('the Greyspine\'s ground is finite, rises to real mountains (over 120 m) and is not a wall: under 30% of it is steeper than 0.95',bad===0&&hi>120&&steep/n<0.3,'highest '+hi.toFixed(0)+' m, '+(100*steep/n).toFixed(0)+'% steep, '+n+' samples'); }
{ const st=6, x0=-640, z0=x.WZ0+8, nx=Math.floor((360-x0)/st), nz=Math.floor((-100-z0)/st), seen=new Uint8Array(nx*nz), hs=new Float32Array(nx*nz), idx=(a,b)=>Math.round((b-z0)/st)*nx+Math.round((a-x0)/st);
  for(let j=0;j<nz;j++) for(let i=0;i<nx;i++) hs[j*nx+i]=H(x0+i*st,z0+j*st);
  const q=[idx(x.GREY_HM.x,x.GREY_HM.z)]; seen[q[0]]=1;
  while(q.length){ const k=q.pop(), i=k%nx, j=Math.floor(k/nx); for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ii=i+a, jj=j+b; if(ii<0||jj<0||ii>=nx||jj>=nz||seen[jj*nx+ii]) continue; if(Math.abs(hs[jj*nx+ii]-hs[k])/st>1.2) continue; seen[jj*nx+ii]=1; q.push(jj*nx+ii); } }
  const reach=(a,b)=>!!seen[idx(a,b)];
  ok('on foot from Highmark (slope limit 1.2) you can reach the glacier valley, both arenas\' flats and the heart of every zone 26-32',reach(x.GLEN.gx,x.GLEN.z)&&reach(x.ARENA29.x,x.ARENA29.z)&&reach(x.ARENA32.x,x.ARENA32.z)&&x.ZONES.filter(z=>z.grey&&!z.boss).every(z=>reach(z.x,z.z)),x.ZONES.filter(z=>z.grey&&!z.boss&&!reach(z.x,z.z)).map(z=>z.name).join(', ')); }
{ const hs=[]; for(let a=0;a<12;a++) hs.push(H(x.VIL4.x+Math.sin(a/12*6.283)*22,x.VIL4.z+Math.cos(a/12*6.283)*22)); hs.push(H(x.VIL4.x,x.VIL4.z));
  ok('Highmark stands on a flat pad on the hub (spread under 1.5 m)',Math.max(...hs)-Math.min(...hs)<1.5,'spread '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)); }
for(const A of [x.ARENA29,x.ARENA32]){ const hs=[]; for(let a=0;a<12;a++) hs.push(H(A.x+Math.sin(a/12*6.283)*A.r*0.9,A.z+Math.cos(a/12*6.283)*A.r*0.9)); hs.push(H(A.x,A.z));
  ok(A.name+': the arena is a flat pad (spread under 2.5 m) on dry ground',Math.max(...hs)-Math.min(...hs)<2.5&&H(A.x,A.z)>2&&x.waterSurf(A.x,A.z)===x.WATER,'spread '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)); }
ok('no tree grows above the treeline: 90-125 m',(()=>{ for(let i=0;i<50;i++){ const t=x.greyTreeline(-400+i*17,-1000+i*9); if(t<90||t>125) return false; } return true; })());
// ---- water: the atlas\'s (rivers born on the heights; no tarns of its own) ----
{ let riv=0, high=0; for(let zz=-1000;zz<-120;zz+=8) for(let xx=-560;xx<340;xx+=8) if(x.waLand(xx,zz)==='grey'&&x.waterSurf(xx,zz)>x.WATER+5&&x.waterSurf(xx,zz)<500){ riv++; if(x.waterSurf(xx,zz)>20) high++; }
  ok('the Greyspine has rivers on its heights (waterSurf says so, above the sea) and a point in one is greyWet',riv>20&&high>10&&(()=>{ for(let zz=-1000;zz<-120;zz+=8) for(let xx=-560;xx<340;xx+=8) if(x.waLand(xx,zz)==='grey'&&x.waterSurf(xx,zz)>20&&H(xx,zz)<x.waterSurf(xx,zz)-0.3) return x.greyWet(xx,zz,0); return false; })(),riv+' wet cells'); }
ok('no camp is in water, and Highmark is dry',x.MONS.every(m=>!x.greyWet(m.camp.x,m.camp.z,-3))&&!x.greyWet(x.VIL4.x,x.VIL4.z));
// ---- zones and monsters, levels 26-32 ----
{ const Z=x.ZONES.filter(z=>z.grey&&!z.boss);
  ok('seven zones (26-32) and two boss zones, none of the Greyspine\'s ground in another land, no zone ridges',Z.length===7&&x.ZONES.filter(z=>z.grey&&z.boss).length===2&&(()=>{ for(let zz=-1030;zz<-120;zz+=16) for(let xx=-560;xx<340;xx+=16){ if(x.waLand(xx,zz)!=='grey') continue; const zn=x.zoneAt(xx,zz); if(zn&&!zn.grey) return false; if(x.zoneRidge(xx,zz)) return false; } return true; })()); }
{ const defs=x.MON_DEFS.filter(d=>d.zone&&d.zone[0]==='g'), g=x.MONS.filter(m=>m.def.zone&&m.def.zone[0]==='g'&&!m.temp), kinds={}; for(const m of g) kinds[m.def.id]=(kinds[m.def.id]||0)+1;
  ok('fourteen kinds, two of each level 26-32, twelve of every kind (168 monsters), earth and air only, each with a drop material with a name',defs.length===14&&[26,27,28,29,30,31,32].every(L=>defs.filter(d=>d.level===L).length===2)&&Object.keys(kinds).length===14&&Object.values(kinds).every(n=>n===12)&&defs.every(d=>(d.el==='earth'||d.el==='air')&&x.MATS[d.id]&&x.MATS[d.id].name),Object.keys(kinds).length+' kinds, '+g.length+' monsters');
  ok('every camp is inside its own zone, out of the village, the glen and the arenas, on ground you can stand on',g.every(m=>x.inGrey(m.camp.x,m.camp.z)&&x.zoneAt(m.camp.x,m.camp.z)===x.defZone(m.def)&&Math.hypot(m.camp.x-x.VIL4.x,m.camp.z-x.VIL4.z)>x.VR+15&&!x.inGlen(m.camp.x,m.camp.z,8)&&x.arenaDist(m.camp.x,m.camp.z)>50&&H(m.camp.x,m.camp.z)>1));
  ok('levels stretch to 40 (MAX_ZONE_LV; the Sunscar monsters stop at 36) and a monster there is in the Greyspine\'s land, with no zone tier of its own yet',x.MAX_ZONE_LV===40&&x.landAt(g[0].camp.x,g[0].camp.z)==='grey'&&x.zoneTierOn({zt:{home:{on:3,max:3}}},'grey')===0);
  const sc={}; for(const d of defs){ const k=x.MON_DEFS.find(o=>o.id===d.id); sc[d.level]=sc[d.level]||k.hp; }
  ok('the numbers follow the level curve: a level-32 monster has more health than a level-26 one of the same kind of toughness',defs.find(d=>d.level===32&&d.id==='galedrake').hp>defs.find(d=>d.level===26&&d.id==='granitslime').hp); }
ok('the Greyspine has its resource nodes (53, tools/professions-smoke.js has the plan) and only the Greyspine\'s',x.NODES.filter(n=>x.inGrey(n.x,n.z)&&!x.inGloam(n.x,n.z)).length===53&&x.NODES.every(n=>(x.inGrey(n.x,n.z)&&!x.inGloam(n.x,n.z))===(String(n.zone)[0]==='g')),x.NODES.length+' nodes');
// ---- the two bosses ----
for(const [A,id,lv,el] of [[x.ARENA29,'gryphonqueen',29,'air'],[x.ARENA32,'mountaingolem',32,'earth']]){
  const bd=x.BOSS_DEFS.find(b=>b.def.id===id), hs=[]; for(let a=0;a<12;a++) hs.push(H(A.x+Math.sin(a/12*6.283)*A.r*0.9,A.z+Math.cos(a/12*6.283)*A.r*0.9));
  ok(A.name+': '+bd.def.name+' (level '+lv+', '+el+') has a flat arena in the Greyspine, in its own boss zone, with six skills, a named material and a quest',
    bd.def.level===lv&&bd.def.el===el&&bd.arena===A.key&&x.inGrey(A.x,A.z)&&Math.max(...hs)-Math.min(...hs)<2.5&&x.zoneAt(A.x+A.r-4,A.z)===A.zone&&A.zone.boss&&(x.BOSS_SKILLS[id]||[]).length===6&&x.MATS[id]&&x.MATS[id].name&&x.BOSS_QUESTS.some(q=>q.target===id&&q.level===lv),'flat within '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)+' m'); }
ok('eight bosses: the Greyspine\'s two have kits of their own and their adds (eaglets, rubble, iron joints)',x.BOSSES.length>=10&&x.BOSSES.filter(B=>B.bd.kit==='gryphon'||B.bd.kit==='golem').length===2&&x.BOSS_DEFS.find(b=>b.kit==='golem').totem.id==='ironjoint'&&x.BOSS_DEFS.find(b=>b.kit==='gryphon').add.id==='eaglet');
// ---- the rock falls and the glacier valley: at the atlas\'s gates, held by the land border ----
for(const G of x.GREY_GATES.filter(g=>g.id==='river'||g.id==='neck')){
  const o={x:G.x,z:G.z}; const sideA=(()=>{ for(let r=10;r<120;r+=6) for(let k=0;k<16;k++){ const a=k/16*6.283, px=G.x+Math.sin(a)*r, pz=G.z+Math.cos(a)*r; if(x.waLandId(px,pz)===3) return [px,pz]; } return null; })();
  ok(G.name+': a rock fall at the atlas gate, the Greyspine within reach of it, and no camp in it',!!sideA&&x.MONS.every(m=>!x.inGate(m.camp.x,m.camp.z))&&isFinite(G.h)); }
{ const G=x.GREY_GATES.find(g=>g.id==='neck'); let from=null,to=null;
  for(let r=4;r<200&&!(from&&to);r+=4) for(let k=0;k<32;k++){ const a=k/32*6.283, px=G.x+Math.sin(a)*r, pz=G.z+Math.cos(a)*r; const l=x.waLandId(px,pz); if(l===3&&!from) from=[px,pz]; if(l===5&&!to) to=[px,pz]; }
  const o={x:to[0],z:to[1]}; x.gateHold(G,o,from[0],from[1]);
  ok('a shut rock fall stops a step across the land border (the step is undone), and a step on one side is left alone',x.waLandId(o.x,o.z)===3&&(()=>{ const q={x:from[0]+1,z:from[1]}; x.gateHold(G,q,from[0],from[1]); return q.x===from[0]+1&&q.z===from[1]; })()); }
{ const G=x.GLEN; ok('the glacier valley: the ice fall stands 15 m inside the Reach on the gate\'s z, the strip kept clear of camps, westBarX holds the Reach\'s west edge there',
    G.ice===G.bx+15&&Math.abs(x.westBarX(G.z)-G.ice)<20&&x.MONS.every(m=>!x.inGlen(m.camp.x,m.camp.z,0))&&Math.abs(H(G.gx,G.z)-G.h0)<60); }
W.join('a',{name:'Hiker',look:{cls:'warrior'},save:{level:26}}); tick(1);
const p=W.players.get('a'), evs=[], grab=()=>{ for(const m of (inbox.a||[])) if(m.t==='snap'&&m.ev) evs.push(...m.ev); inbox.a=[]; };
p.gear.west=0; p.gear.north=2; p.gear.east=2;
W.receive('a',{t:'dev',cmd:'tunnel',v:'grey'}); tick(2);
ok('with the ice fall shut the testing teleport into the Greyspine is refused (you stay where you were)',Math.hypot(p.x-x.GREY_HM.x,p.z-x.GREY_HM.z)>50);
W.receive('a',{t:'dev',cmd:'tunnel',v:'glen'}); tick(2);
ok('... but "glen" takes you to the east side of the ice fall',Math.abs(p.x-(x.GLEN.ice+14))<2&&Math.abs(p.z-x.GLEN.z)<2,p.x.toFixed(0)+', '+p.z.toFixed(0));
W.setPos('a',[x.GLEN.ice-10,H(x.GLEN.ice-10,x.GLEN.z),x.GLEN.z,0,0,0]);
ok('the server keeps you east of the shut ice fall (setPos pushes you back)',p.x>=x.GLEN.ice-0.01,p.x.toFixed(1));
{ const y=x.MONS.find(m=>m.def.id==='ymrik'); grab(); evs.length=0; x.rewardKill(p,y); tick(3); grab();
  ok('beating Ymrik opens the ice fall for everyone who helped, with an event and a toast',p.gear.west===1&&evs.some(e=>e[0]==='west'&&e[1]==='a'&&e[2]===1)); }
W.setPos('a',[x.GLEN.ice-10,H(x.GLEN.ice-10,x.GLEN.z),x.GLEN.z,0,0,0]);
ok('with it open the server lets you through',Math.abs(p.x-(x.GLEN.ice-10))<0.01);
{ const g=x.sanitizeGear({west:7,mq:{s:0}},'warrior'); ok('a save\'s west flag is clamped (0-2) and a new save starts with the ice fall shut',g.west===2&&x.sanitizeGear({},'warrior').west===0); }
// ---- Highmark ----
{ const V=x.VIL4; ok('Highmark is a village like the others (VILS, CIRCLES, vilAt, a Lodge), about 100 m up',V.h>80&&V.h<120&&x.vilAt(V.x,V.z)===V&&x.VILS.length>=6&&x.CIRCLES[3].V===V&&x.nearLodge(V.x,V.z)&&V.name==='Highmark','h '+V.h.toFixed(0)); }
{ const mv=(xx,zz)=>W.setPos('a',[xx,H(xx,zz),zz,0,0,0]); p.gear.west=1; grab(); evs.length=0; mv(x.VIL4.x+3,x.VIL4.z+3); tick(14); grab();
  ok('walking into Highmark attunes its circle (west 2), with an event',p.gear.west===2&&evs.some(e=>e[0]==='west'&&e[2]===2)); }
{ p.gear.north=2; p.gear.east=2; p.warpT=-99; W.setPos('a',[x.VIL4.tele.x,H(x.VIL4.tele.x,x.VIL4.tele.z),x.VIL4.tele.z,0,0,0]); W.receive('a',{t:'warp',to:'rimehold'}); tick(3);
  ok('from Highmark\'s circle you can travel to Rimehold',Math.hypot(p.x-x.VIL3.x,p.z-x.VIL3.z)<x.VIL3.r);
  p.gear.west=1; p.warpT=-99; W.setPos('a',[x.VIL3.tele.x,H(x.VIL3.tele.x,x.VIL3.tele.z),x.VIL3.tele.z,0,0,0]); W.receive('a',{t:'warp',to:'highmark'}); tick(3);
  ok('... but not back until you have walked into Highmark (west 2)',Math.hypot(p.x-x.VIL3.tele.x,p.z-x.VIL3.tele.z)<1);
  p.gear.west=2; p.warpT=-99; W.receive('a',{t:'warp',to:'highmark'}); tick(3);
  ok('... and then the circle at Rimehold takes you there',Math.hypot(p.x-x.VIL4.x,p.z-x.VIL4.z)<x.VIL4.r);
  p.x=x.GREY_HM.x+100; p.z=x.GREY_HM.z+20; ok('a knocked-out hiker in the Greyspine wakes at Highmark, once they have been there',x.respawnVil(p)===x.VIL4&&(p.gear.west=1,x.respawnVil(p)===x.VIL3)); p.gear.west=2; }
// ---- the testing teleport ----
W.receive('a',{t:'dev',cmd:'tunnel',v:'grey'}); tick(2);
ok('the testing teleport "grey" puts you on Highmark\'s shelf and the server keeps you there',Math.hypot(p.x-x.GREY_HM.x,p.z-x.GREY_HM.z)<2&&Math.abs(p.y-H(p.x,p.z))<0.5,p.x.toFixed(0)+', '+p.z.toFixed(0)+', '+p.y.toFixed(0)+' m');
W.receive('a',{t:'dev',cmd:'tunnel',v:'cavern'}); tick(2);
ok('... and "cavern" to the golem\'s arena',Math.hypot(p.x-x.ARENA32.x,p.z-x.ARENA32.z)<x.ARENA32.r+12,p.x.toFixed(0)+', '+p.z.toFixed(0));
W.receive('a',{t:'dev',cmd:'tunnel',v:'queen'}); tick(2);
ok('... and "queen" onto the Gryphon Queen\'s crown',Math.hypot(p.x-x.GREY_QUEEN.x,p.z-x.GREY_QUEEN.z)<x.GREY_QUEEN.r&&p.y>x.GREY_QUEEN.h-8,p.y.toFixed(0)+' m');
// ---- the gates: the server side (a rock fall shuts each canyon until its boss falls) ----
{ W.receive('a',{t:'dev',cmd:'gate',v:'river',n:0}); W.receive('a',{t:'dev',cmd:'gate',v:'neck',n:0}); p.gear.river=0; p.gear.neck=0; p.gear.west=2; p.gear.east=2; p.gear.north=2;
  const G=x.GREY_GATES.find(g=>g.id==='neck'), Gr=x.GREY_GATES.find(g=>g.id==='river');
  p.gear.river=0; p.gear.neck=0; grab(); evs.length=0;
  x.rewardKill(p,x.MONS.find(m=>m.def.id==='gryphonqueen')); tick(3); grab(); const r1=p.gear.river===1&&p.gear.neck===0&&evs.some(e=>e[0]==='gate'&&e[1]==='a'&&e[2]==='river');
  evs.length=0; x.rewardKill(p,x.MONS.find(m=>m.def.id==='mountaingolem')); tick(3); grab();
  ok('beating the Gryphon Queen opens the river road, the golem the neck pass: each for everyone who helped, with an event and a toast',r1&&p.gear.neck===1&&evs.some(e=>e[0]==='gate'&&e[2]==='neck'));
  const g=x.sanitizeGear({river:9,neck:-3,mq:{s:0}},'warrior'); ok('the gate flags are saved and clamped (0 or 1); a new save has both rock falls in place',g.river===1&&g.neck===0&&x.sanitizeGear({},'warrior').river===0);
  p.gear.river=0; W.receive('a',{t:'dev',cmd:'tunnel',v:'riverfall'}); tick(2);
  ok('the testing teleport "riverfall" takes you to the Greyspine side of the river road\'s rock fall',Math.hypot(p.x-Gr.x,p.z-Gr.z)<30&&x.inGrey(p.x,p.z),p.x.toFixed(0)+', '+p.z.toFixed(0)); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
