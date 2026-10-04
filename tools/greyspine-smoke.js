// Headless test of the Greyspine's terrain (shared/greyspine.js), straight from src/, no build: the rectangle's ground (above the sea, rising to peaks, troughs
// you can walk between the places that matter), its meeting with the home forest's rim and the Hoarfrost Reach's west wall, Highmark's shelf, the Gryphon
// Queen's crown, that nothing else changed (the home forest and the Reach keep their heights, no zones, monsters or resource nodes yet), and the testing
// teleport. One line per check; exits 1 on failure.
// Usage: node tools/greyspine-smoke.js
const {loadServer}=require('./load');
const inbox={};
const {api:W,x}=loadServer({dev:true,send(pid,m){ (inbox[pid]=inbox[pid]||[]).push(JSON.parse(JSON.stringify(m))); }},
  ['rawHeight','baseHeight','homeHeight','valeHeight','hoarHeight','GREY_VALLEYS','GREY_HM','GREY_QUEEN','greyTreeline','greyspineHeight','zoneAt','zoneRidge','NODES','MONS','inGrey','HALF','HZ0','WX0','WZ0','VIL','TUN','GLEN','inGlen','rewardKill','sanitizeGear','MQ_BY_ID','VIL3','VIL4','VILS','CIRCLES','vilAt','ROADS','respawnVil','nearLodge','defZone','arenaDist','MON_DEFS','ZONES','MATS','MAX_ZONE_LV','VR','ARENAS','landAt','zoneTierOn','ARENA29','ARENA32','BOSS_DEFS','BOSS_SKILLS','BOSS_QUESTS','SKILLS','BOSSES','GREY_TARNS','GREY_RIVER','GREY_RIVER_W','GREY_FJORD','waterSurf','greyWet','greyRiverAt','fjordDist','WATER','GREY_GATES','inGate']);
let fails=0; const ok=(name,cond,info)=>{ console.log((cond?'PASS ':'FAIL ')+name+(info?'  ('+info+')':'')); if(!cond) fails++; };
const tick=n=>{ for(let i=0;i<n;i++){ W.tick(0.05); for(const p of W.players.values()){ p.hp=p.maxHp; p.dead=false; } } };
const H=x.rawHeight, slope=(a,b)=>Math.hypot(H(a+2,b)-H(a-2,b),H(a,b+2)-H(a,b-2))/4;
const X0=x.WX0+14, X1=x.HALF-14, Z0=x.WZ0+14, Z1=x.HZ0-14;   // what a player can reach: 14 m short of the walls (player/movement.js)

// ---- the ground ----
{ let n=0, lo=1e9, hi=-1e9, bad=0;
  for(let zz=x.WZ0;zz<x.HZ0;zz+=8) for(let xx=x.WX0;xx<x.HALF;xx+=8){ const h=H(xx,zz); n++; if(!isFinite(h)) bad++; if(x.fjordDist(xx,zz)>70) lo=Math.min(lo,h); hi=Math.max(hi,h); }
  ok('every point of the Greyspine has a finite height, nowhere near the sea (>= 20 m) except in the fjord, peaks of 200-330 m',bad===0&&lo>=20&&hi>200&&hi<330,'lowest '+lo.toFixed(0)+' m, highest '+hi.toFixed(0)+' m, '+n+' samples'); }
{ let steep=0, n=0; for(let zz=-980;zz<-540;zz+=8) for(let xx=-370;xx<370;xx+=8){ n++; if(slope(xx,zz)>0.95) steep++; }
  ok('it is mountains but not a wall: under 30% of the inner country is steeper than 0.95 (the home forest is 9%, the Reach 13%)',steep/n<0.3,(100*steep/n).toFixed(0)+'%'); }
// the troughs: the Long Valley's floor is mostly gentle and runs the whole way from the east wall to the west one
{ const L=x.GREY_VALLEYS[0], pts=[]; for(let i=0;i<L.pts.length-1;i++) for(let t=0;t<1;t+=0.25) pts.push([L.pts[i][0]+(L.pts[i+1][0]-L.pts[i][0])*t,L.pts[i][1]+(L.pts[i+1][1]-L.pts[i][1])*t]);
  const gentle=pts.filter(p=>slope(p[0],p[1])<0.45).length/pts.length;
  ok('the Long Valley floor is gentle ground along its length',gentle>0.7&&L.pts[0][0]>380&&L.pts[L.pts.length-1][0]<-380,(100*gentle).toFixed(0)+'% under 0.45'); }
// walkable routes (slope under 1.0 per 8 m step: 45 degrees) join the places that matter: flood fill from Highmark's shelf
{ const st=8, nx=Math.floor((X1-X0)/st)+1, nz=Math.floor((Z1-Z0)/st)+1, seen=new Uint8Array(nx*nz), idx=(a,b)=>Math.round((b-Z0)/st)*nx+Math.round((a-X0)/st);
  const hs=new Float32Array(nx*nz); for(let j=0;j<nz;j++) for(let i=0;i<nx;i++) hs[j*nx+i]=H(X0+i*st,Z0+j*st);
  const q=[idx(x.GREY_HM.x,x.GREY_HM.z)]; seen[q[0]]=1;
  while(q.length){ const k=q.pop(), i=k%nx, j=Math.floor(k/nx); for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ii=i+a, jj=j+b; if(ii<0||jj<0||ii>=nx||jj>=nz||seen[jj*nx+ii]) continue; if(Math.abs(hs[jj*nx+ii]-hs[k])/st>1.0) continue; seen[jj*nx+ii]=1; q.push(jj*nx+ii); } }
  const reach=(a,b)=>!!seen[idx(a,b)];
  ok('on foot from Highmark\'s shelf you can reach the Long Valley\'s east and west ends',reach(380,-735)&&reach(-380,-570));
  ok('... the head of every side valley (North Fork, Queen\'s Fork, the Neck, Sink Valley)',x.GREY_VALLEYS.slice(1).every(v=>{ const p=v.pts[v.pts.length-1]; return reach(Math.min(Math.max(p[0],X0),X1),p[1]); }));
  const share=seen.reduce((a,b)=>a+b,0)/seen.length;
  ok('... and a good part of the whole country (at least a third of it)',share>0.33,(100*share).toFixed(0)+'%'); }
// ---- Highmark's shelf and the Queen's crown ----
{ const M=x.GREY_HM, hs=[]; for(let a=0;a<10;a++) hs.push(H(M.x+Math.sin(a*0.628)*M.r*0.8,M.z+Math.cos(a*0.628)*M.r*0.8)); hs.push(H(M.x,M.z));
  ok('Highmark\'s shelf is a flat bench above the trough',Math.max(...hs)-Math.min(...hs)<1.6&&hs[10]>x.GREY_HM.up+30,'spread '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)+', '+hs[10].toFixed(0)+' m up'); }
{ const Q=x.GREY_QUEEN, hs=[]; for(let a=0;a<10;a++) hs.push(H(Q.x+Math.sin(a*0.628)*Q.r*0.7,Q.z+Math.cos(a*0.628)*Q.r*0.7)); hs.push(H(Q.x,Q.z));
  ok('the Gryphon Queen\'s peak has a flat crown for her arena, and is among the highest ground',Math.max(...hs)-Math.min(...hs)<3&&Math.min(...hs)>Q.h-4&&H(Q.x,Q.z+Q.r+50)<Q.h-30,'crown '+Math.min(...hs).toFixed(0)+'-'+Math.max(...hs).toFixed(0)+' m'); }
// ---- the walls and the neighbours ----
{ let worst=0, n=0, sum=0; for(let zz=x.WZ0+40;zz<x.HZ0-90;zz+=6){ const d=Math.abs(x.greyspineHeight(x.HALF-6,zz)-x.hoarHeight(x.HALF-6,zz)); worst=Math.max(worst,d); sum+=d; n++; }
  ok('the east wall is the Hoarfrost Reach\'s west wall seen from the other side: at x = HALF - 6 the ground is the Reach\'s own (same crest, no step at the seam)',sum/n<1&&worst<3,'mean '+(sum/n).toFixed(2)+' m, worst '+worst.toFixed(2)+' m'); }
{ let ok1=true, crest=1e9; for(let xx=-400;xx<=400;xx+=20){ const c=H(xx,x.HZ0), home=H(xx,x.HZ0+14); crest=Math.min(crest,c); if(c<60) ok1=false; if(Math.abs(home-x.homeHeight(xx,x.HZ0+14))>1e-6) ok1=false; }
  ok('the home forest\'s north rim is a crest (60 m or more) and the forest side of it is the home forest\'s own ground',ok1,'lowest crest '+crest.toFixed(0)+' m'); }
{ let same=true; for(let zz=-436;zz<=436;zz+=37) for(let xx=-436;xx<=436;xx+=37) if(Math.abs(x.baseHeight(xx,zz)-x.homeHeight(xx,zz))>1e-6&&Math.hypot(xx-x.HALF,0)>5) same=false;
  ok('the home forest keeps its own ground (baseHeight is homeHeight there)',same); }
{ let same=true; for(let zz=-1030;zz<=440;zz+=41) for(let xx=452;xx<=980;xx+=41) if(Math.abs(x.baseHeight(xx,zz)-x.valeHeight(xx,zz))>1e-6) same=false;
  ok('the vale and the Hoarfrost Reach keep theirs (baseHeight is valeHeight there)',same); }
ok('no tree grows above the treeline: 90-125 m',(()=>{ for(let i=0;i<50;i++){ const t=x.greyTreeline(-400+i*17,-1000+i*9); if(t<90||t>125) return false; } return true; })());
// ---- water: three tarns, a river, a fjord ----
{ const T=x.GREY_TARNS, ok1=T.every(t=>{ const c=H(t.x,t.z), e=t.r*1.18, rim=[H(t.x+e,t.z),H(t.x-e,t.z),H(t.x,t.z+e),H(t.x,t.z-e)].filter(v=>v>=t.l-0.1).length; return c<t.l-0.5&&rim>=3&&x.waterSurf(t.x,t.z)===t.l&&x.waterSurf(t.x+t.r*3,t.z)===x.WATER; });
  ok('three tarns: each is a bowl under its own water level, ringed at its edge by ground above it (waterSurf says so; the sea\'s level a little way off)',T.length===3&&ok1,T.map(t=>t.name+' '+t.l.toFixed(0)+' m').join(', ')); }
{ const R=x.GREY_RIVER; let mono=true, deep=true, west=R[R.length-1][0]<-300&&R[0][0]>40; for(let i=1;i<R.length;i++) if(R[i][2]>R[i-1][2]+1e-9) mono=false;
  for(let i=6;i<R.length;i+=3){ const [px,pz,b]=R[i]; if(!(H(px,pz)<=b+0.2&&x.waterSurf(px,pz)>b+0.5&&x.waterSurf(px+9,pz+9)===x.WATER)) deep=false; }
  const t0=x.GREY_TARNS[0], head=R[0], dst=Math.hypot(t0.x-head[0],t0.z-head[1]);
  ok('a river leaves the Mirrortarn and runs west down the Long Valley, only ever downhill, in a channel a hand deep',mono&&deep&&west&&dst<t0.r,R.length+' points, '+R[0][2].toFixed(0)+' m to '+R[R.length-1][2].toFixed(0)+' m'); }
{ const F=x.GREY_FJORD, c=F.pts[1]; ok('a fjord: a gorge below the sea in the south-west, steep walls both sides, nobody\'s camp or tree in it',H(c[0],c[1])<=-8&&H(c[0],c[1]+F.w+14)>20&&x.waterSurf(c[0],c[1])===x.WATER&&x.MONS.filter(m=>x.inGrey(m.camp.x,m.camp.z)).every(m=>H(m.camp.x,m.camp.z)>1),'floor '+H(c[0],c[1]).toFixed(0)+' m, bank '+H(c[0],c[1]+F.w+14).toFixed(0)+' m'); }
ok('wet ground: a point in a tarn or in the river is greyWet, a dry one is not; no camp is in water',x.greyWet(x.GREY_TARNS[1].x,x.GREY_TARNS[1].z)&&x.greyWet(x.GREY_RIVER[10][0],x.GREY_RIVER[10][1])&&!x.greyWet(0,-1000)&&!x.greyWet(x.VIL4.x,x.VIL4.z)&&x.MONS.every(m=>!x.greyWet(m.camp.x,m.camp.z,-3)));
// ---- zones and monsters, levels 26-32 ----
{ const Z=x.ZONES.filter(z=>z.grey&&!z.boss);
  ok('seven zones (26-32) and two boss zones, none of the Greyspine\'s ground in another land, no zone ridges',Z.length===7&&x.ZONES.filter(z=>z.grey&&z.boss).length===2&&(()=>{ for(let zz=-1030;zz<-446;zz+=16) for(let xx=-430;xx<430;xx+=16){ const zn=x.zoneAt(xx,zz); if(zn&&!zn.grey) return false; if(x.zoneRidge(xx,zz)) return false; } return true; })()); }
{ const defs=x.MON_DEFS.filter(d=>d.zone&&d.zone[0]==='g'), g=x.MONS.filter(m=>m.def.zone&&m.def.zone[0]==='g'&&!m.temp), kinds={}; for(const m of g) kinds[m.def.id]=(kinds[m.def.id]||0)+1;
  ok('fourteen kinds, two of each level 26-32, twelve of every kind (168 monsters), earth and air only, each with a drop material with a name',defs.length===14&&[26,27,28,29,30,31,32].every(L=>defs.filter(d=>d.level===L).length===2)&&Object.keys(kinds).length===14&&Object.values(kinds).every(n=>n===12)&&defs.every(d=>(d.el==='earth'||d.el==='air')&&x.MATS[d.id]&&x.MATS[d.id].name),Object.keys(kinds).length+' kinds, '+g.length+' monsters');
  ok('every camp is inside its own zone, out of the village, the glen and the arenas, on ground you can stand on',g.every(m=>x.inGrey(m.camp.x,m.camp.z)&&x.zoneAt(m.camp.x,m.camp.z)===x.defZone(m.def)&&Math.hypot(m.camp.x-x.VIL4.x,m.camp.z-x.VIL4.z)>x.VR+15&&!x.inGlen(m.camp.x,m.camp.z,8)&&x.arenaDist(m.camp.x,m.camp.z)>50&&H(m.camp.x,m.camp.z)>1));
  ok('levels stretch to 32 (MAX_ZONE_LV) and a monster there is in the Greyspine\'s land, with no zone tier of its own yet',x.MAX_ZONE_LV===32&&x.landAt(g[0].camp.x,g[0].camp.z)==='grey'&&x.zoneTierOn({zt:{home:{on:3,max:3}}},'grey')===0);
  const sc={}; for(const d of defs){ const k=x.MON_DEFS.find(o=>o.id===d.id); sc[d.level]=sc[d.level]||k.hp; }
  ok('the numbers follow the level curve: a level-32 monster has more health than a level-26 one of the same kind of toughness',defs.find(d=>d.level===32&&d.id==='galedrake').hp>defs.find(d=>d.level===26&&d.id==='granitslime').hp); }
ok('the Greyspine has its resource nodes (53, tools/professions-smoke.js has the plan) and only the Greyspine\'s',x.NODES.filter(n=>x.inGrey(n.x,n.z)).length===53&&x.NODES.every(n=>x.inGrey(n.x,n.z)===(String(n.zone)[0]==='g')),x.NODES.length+' nodes');
// ---- the two bosses ----
for(const [A,id,lv,el] of [[x.ARENA29,'gryphonqueen',29,'air'],[x.ARENA32,'mountaingolem',32,'earth']]){
  const bd=x.BOSS_DEFS.find(b=>b.def.id===id), hs=[]; for(let a=0;a<12;a++) hs.push(H(A.x+Math.sin(a/12*6.283)*A.r*0.9,A.z+Math.cos(a/12*6.283)*A.r*0.9));
  ok(A.name+': '+bd.def.name+' (level '+lv+', '+el+') has a flat arena in the Greyspine, in its own boss zone, with six skills, a named material and a quest',
    bd.def.level===lv&&bd.def.el===el&&bd.arena===A.key&&x.inGrey(A.x,A.z)&&Math.max(...hs)-Math.min(...hs)<2.5&&x.zoneAt(A.x+A.r+10,A.z)===A.zone&&A.zone.boss&&(x.BOSS_SKILLS[id]||[]).length===6&&x.MATS[id]&&x.MATS[id].name&&x.BOSS_QUESTS.some(q=>q.target===id&&q.level===lv),'flat within '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)+' m'); }
ok('eight bosses: the Greyspine\'s two have kits of their own and their adds (eaglets, rubble, iron joints)',x.BOSSES.length===8&&x.BOSSES.filter(B=>B.bd.kit==='gryphon'||B.bd.kit==='golem').length===2&&x.BOSS_DEFS.find(b=>b.kit==='golem').totem.id==='ironjoint'&&x.BOSS_DEFS.find(b=>b.kit==='gryphon').add.id==='eaglet');
// ---- the two gates in the west wall ----
for(const G of x.GREY_GATES){ const floor=H(-426,G.z), wall=Math.min(H(-426,G.z-30),H(-426,G.z+30)), flat=[-384,-410,-426].every(xx=>Math.abs(H(xx,G.z)-G.h)<0.5); let ms=0; for(let xx=-320;xx>-426;xx-=6) ms=Math.max(ms,Math.abs(H(xx-6,G.z)-H(xx,G.z))/6);
  ok(G.name+': a canyon cut through the west wall to the edge, a level floor reached by a walkable ramp (under 0.5), walls 20 m or more above it, and no camp in it',flat&&ms<0.5&&wall-floor>20&&x.MONS.every(m=>!x.inGate(m.camp.x,m.camp.z)),'floor '+floor.toFixed(0)+' m, walls '+wall.toFixed(0)+' m, steepest '+ms.toFixed(2)); }
// ---- the glacier valley: the one cut through the walls, and the ice fall that shuts it ----
{ const G=x.GLEN; let mono=true, prev=1e9, steep=0, n=0; for(let xx=G.x0;xx<=G.x1;xx+=6){ const h=H(xx,G.z); if(h>prev+0.8) mono=false; prev=h; n++; if(slope(xx,G.z)>0.45) steep++; }
  const wall=Math.min(H(x.HALF,G.z-30),H(x.HALF,G.z+30)), floor=H(x.HALF,G.z);
  ok('the glacier valley is a cut through the Vale Wall: its floor falls steadily eastward onto the Reach\'s plateau, gently, with walls 25 m or more above it at the crest',mono&&steep/n<0.1&&wall-floor>25&&Math.abs(H(G.x1,G.z)-G.h1)<3&&Math.abs(H(G.x0,G.z)-G.h0)<3,'floor '+floor.toFixed(0)+' m at the crest, walls '+wall.toFixed(0)+' m'); }
ok('the walls beside the cut are not cut: the crest 40 m north of it is still a wall',H(x.HALF,x.GLEN.z-40)-H(x.HALF,x.GLEN.z)>20&&H(x.HALF,x.GLEN.z+40)-H(x.HALF,x.GLEN.z)>20);
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
{ const V=x.VIL4, hs=[]; for(let a=0;a<8;a++) hs.push(H(V.x+Math.sin(a)*22,V.z+Math.cos(a)*22));
  ok('Highmark stands on its shelf: flat, about 100 m up, a village like the others (VILS, CIRCLES, vilAt, a Lodge)',Math.max(...hs)-Math.min(...hs)<1.2&&V.h>90&&V.h<110&&x.vilAt(V.x,V.z)===V&&x.VILS.length===4&&x.CIRCLES.length===4&&x.CIRCLES[3].V===V&&x.nearLodge(V.x,V.z)&&V.name==='Highmark','spread '+(Math.max(...hs)-Math.min(...hs)).toFixed(2)+', h '+V.h.toFixed(0));
  const R=x.ROADS.find(r=>r.name==='The Glacier Road'), a=R.pts[0], b=R.pts[R.pts.length-1];
  let ms=0; for(let i=1;i<R.pts.length;i++){ const q=R.pts[i-1], r=R.pts[i]; ms=Math.max(ms,Math.abs(H(r[0],r[1])-H(q[0],q[1]))/Math.hypot(r[0]-q[0],r[1]-q[1])); }
  ok('the Glacier Road runs from Rimehold\'s entrance through the glen to Highmark\'s, nowhere steep',Math.hypot(a[0]-x.VIL3.x,a[1]-x.VIL3.z)<x.VIL3.r+30&&Math.hypot(b[0]-V.x,b[1]-V.z)<V.r+30&&ms<0.5,'steepest '+ms.toFixed(2)); }
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
  const G=x.GREY_GATES[0]; W.setPos('a',[G.x-10,H(G.x-10,G.z),G.z,0,0,0]);
  ok('the server keeps you east of a shut rock fall (and lets you through an open one)',p.x>=G.x-0.01&&(p.gear.river=1,W.setPos('a',[G.x-10,H(G.x-10,G.z),G.z,0,0,0]),Math.abs(p.x-(G.x-10))<0.01),'x '+p.x.toFixed(1));
  p.gear.river=0; p.gear.neck=0; grab(); evs.length=0;
  x.rewardKill(p,x.MONS.find(m=>m.def.id==='gryphonqueen')); tick(3); grab(); const r1=p.gear.river===1&&p.gear.neck===0&&evs.some(e=>e[0]==='gate'&&e[1]==='a'&&e[2]==='river');
  evs.length=0; x.rewardKill(p,x.MONS.find(m=>m.def.id==='mountaingolem')); tick(3); grab();
  ok('beating the Gryphon Queen opens the river road, the golem the neck pass: each for everyone who helped, with an event and a toast',r1&&p.gear.neck===1&&evs.some(e=>e[0]==='gate'&&e[2]==='neck'));
  const g=x.sanitizeGear({river:9,neck:-3,mq:{s:0}},'warrior'); ok('the gate flags are saved and clamped (0 or 1); a new save has both rock falls in place',g.river===1&&g.neck===0&&x.sanitizeGear({},'warrior').river===0);
  p.gear.river=0; W.receive('a',{t:'dev',cmd:'tunnel',v:'riverfall'}); tick(2);
  ok('the testing teleport "riverfall" takes you to the east side of the river road\'s rock fall',Math.abs(p.x-(G.x+14))<2&&Math.abs(p.z-G.z)<2,p.x.toFixed(0)+', '+p.z.toFixed(0)); }
console.log(fails?'\n'+fails+' FAILED':'\nall passed'); process.exit(fails?1:0);
