// Headless test of the Emberwake Isles' ground (W0): the strip on the atlas, the land id, the symbol, the islands' shape and walkability.
// Straight from src/, no build. One line per check; exits 1 on failure. Usage: node tools/emberwake-smoke.js
const {loadShared}=require('./load');
const X=loadShared(['rawHeight','landAt','inIsles','inAmber','inSun','waLandId','waLand','waZone','waCoast','waIsSea','WA_ZONES','WA_HUBS','WA_ANCHORS','WA_ENTRANCES','WZ1','WZ0','WX0','EW_ISLANDS','EW_HUB','EW_VOLC','EW_ZONE_KEYS',
  'ZTIER_LANDS','ZTIER_SYMBOL_LANDS','ZTIER_BOSS','symbolPoints','vilAt','VIL','WATER']);
let fails=0; const ok=(n,c,d)=>{ if(!c) fails++; console.log((c?'PASS ':'FAIL ')+n+(d?'  ('+d+')':'')); };
const H=X.rawHeight, STEP=8;
ok('the world grew south to z 2100 and the Isles are land 7 ("isles")',X.WZ1===2100&&X.WA_ANCHORS.lands[7]==='isles'&&X.landAt(-1100,1590)==='isles'&&X.inIsles(-1100,1590)&&!X.inIsles(0,0)&&!X.inIsles(-1500,1000));
ok('the symbol and the tiers know the Isles from the start (the badge is the eighth, opened by Tuila)',X.ZTIER_LANDS.includes('isles')&&X.ZTIER_SYMBOL_LANDS.includes('isles')&&X.ZTIER_BOSS.isles==='tuila');
ok('seven zones e42..e48 belong to the Isles, in order, with an entrance each',(()=>{ const z=X.WA_ZONES.filter(q=>q.land==='isles'); return z.length===7&&z.map(q=>q.key).join()===X.EW_ZONE_KEYS.join()&&z.every(q=>X.WA_ENTRANCES.some(e=>e.land==='isles'&&e.zone===q.key)); })());
ok('every island has dry land at its centre (the volcano isle too), and the sea between them is sea',X.EW_ISLANDS.every(i=>X.waCoast(i.x,i.z)>40&&H(i.x,i.z)>0.5)&&X.waIsSea(-840,1790)===true&&X.waIsSea(-290,1800)===true,X.EW_ISLANDS.map(i=>Math.round(H(i.x,i.z))).join());
ok('Coralhaven\'s place (the hub) is dry, flat enough, and on the first island',(()=>{ const h=X.EW_HUB; return X.waCoast(h.x,h.z)>30&&H(h.x,h.z)>0.5&&Math.hypot(h.x-X.EW_ISLANDS[0].x,h.z-X.EW_ISLANDS[0].z)<X.EW_ISLANDS[0].rx; })());
// walk the three islands: from Coralhaven over the reef causeway and the isthmus to the Highland, climbing no more than the slope limit; the volcano isle stays apart (the boats come later)
{ const x0=X.WX0, z0=1200, NX=Math.ceil((X.EW_VOLC.x+500-x0)/STEP), NZ=Math.ceil((X.WZ1-z0)/STEP), HG=new Float32Array(NX*NZ);
  for(let j=0;j<NZ;j++) for(let i=0;i<NX;i++) HG[j*NX+i]=H(x0+i*STEP,z0+j*STEP);
  const flood=(sx,sz)=>{ const seen=new Uint8Array(NX*NZ), q=[]; const s=Math.round((sz-z0)/STEP)*NX+Math.round((sx-x0)/STEP); seen[s]=1; q.push(s);
    for(let h=0;h<q.length;h++){ const k=q[h], i=k%NX, j=(k-i)/NX; for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ const ii=i+di, jj=j+dj; if(ii<0||jj<0||ii>=NX||jj>=NZ) continue; const n=jj*NX+ii;
      if(seen[n]||HG[n]<=X.WATER-1.0) continue; const d=(di&&dj)?STEP*1.414:STEP; if(Math.abs(HG[n]-HG[k])/d>1.2) continue; seen[n]=1; q.push(n); } }
    return seen; };
  const at=(x,z)=>Math.round((z-z0)/STEP)*NX+Math.round((x-x0)/STEP), seen=flood(X.EW_HUB.x,X.EW_HUB.z);
  const reach=X.WA_ZONES.filter(q=>q.land==='isles').map(q=>seen[at(q.x,q.z)]);
  ok('on foot from Coralhaven every zone e42..e48 is reachable across the causeway and the isthmus (slope limit 1.2)',reach.every(Boolean),reach.join(''));
  ok('the volcano isle is not reachable on foot yet (it is the volcano pass\'s, by boat)',!seen[at(X.EW_VOLC.x,X.EW_VOLC.z)]);
  let steep=0,n=0; for(let j=1;j<NZ-1;j++) for(let i=1;i<NX-1;i++){ const k=j*NX+i; if(!seen[k]) continue; n++; const s=Math.max(Math.abs(HG[k+1]-HG[k-1]),Math.abs(HG[k+NX]-HG[k-NX]))/(2*STEP); if(s>1.2) steep++; }
  ok('the walkable Isles ground is mostly gentle (under 4% of it steeper than the slope limit)',steep<n*0.04,(100*steep/n).toFixed(1)+'% of '+n); }
ok('the old frame is untouched: the hubs of the seven lands and the mainland\'s land tests keep their answers',['home','vale','hoar','grey','sun','gloam','amber'].every(l=>X.waLand(X.WA_HUBS[l][0],X.WA_HUBS[l][1])===l)&&X.inAmber(-1000,830)&&X.inSun(-1000,830));
console.log(fails?fails+' FAILED':'all passed'); process.exit(fails?1:0);
