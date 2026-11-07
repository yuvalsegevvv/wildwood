// Finds spots in the home forest's wilds for the rift's tear (RIFT_DOOR in shared/rift.js): flat ground, off the roads and the coast, clear of the village, the test room,
// zone camps, boss arenas, dungeon doors, cave mouths, the Dark Infection Pipe and every atlas anchor; prints the best few with their zone. Usage: node tools/rift-site.js [n]
const {loadServer}=require('./load');
const {x}=loadServer({},['VIL','getH','grad','nearPath','arenaDist','waAnchorDist','dgEntranceNear','zoneAt','landAt','waCoast','waWaterDist','DIP_SITES','TROOM','vDist','CAMPS','WX0','WX1','WZ0','WZ1','ZONES']);
const N=+process.argv[2]||8, out=[];
for(let gx=x.WX0;gx<=x.WX1;gx+=12) for(let gz=x.WZ0;gz<=x.WZ1;gz+=12){
  if(x.landAt(gx,gz)!=='home') continue;
  const dv=Math.hypot(gx-x.VIL.x,gz-x.VIL.z); if(dv<150||dv>420) continue;
  if(x.waCoast(gx,gz)<60||x.waWaterDist(gx,gz)<20||x.getH(gx,gz)<2||x.nearPath(gx,gz,14)||x.arenaDist(gx,gz)<80||x.waAnchorDist(gx,gz)<40||x.dgEntranceNear(gx,gz,60)) continue;
  let flat=0; for(let a=0;a<8;a++){ const ax=gx+Math.sin(a*0.785)*10, az=gz+Math.cos(a*0.785)*10; flat=Math.max(flat,Math.abs(x.getH(ax,az)-x.getH(gx,gz)),x.grad(ax,az)); }
  if(flat>1.6) continue;
  if(x.DIP_SITES.some(s=>Math.hypot(s.x-gx,s.z-gz)<60)||Math.hypot(x.TROOM.x-gx,x.TROOM.z-gz)<80) continue;
  const camp=x.CAMPS.reduce((b,c)=>Math.min(b,Math.hypot(c.x-gx,c.z-gz)),1e9); if(camp<30) continue;
  const zn=x.zoneAt(gx,gz), lv=zn&&zn.lv!==undefined?zn.lv:zn&&zn.level;
  out.push({x:gx,z:gz,dv:Math.round(dv),camp:Math.round(camp),flat:+flat.toFixed(2),zone:zn?(zn.id||zn.name):'-',lv,score:camp*0.4-flat*20-Math.abs(dv-260)*0.15});
}
out.sort((a,b)=>b.score-a.score);
console.log(out.length+' candidates; best '+N+':'); for(const c of out.slice(0,N)) console.log(JSON.stringify(c));
