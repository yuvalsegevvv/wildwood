//@ Cave method F on the server, Collapse run: a floor-wide tremor every few minutes (announced) opens the sealed vault for 90 seconds; whoever reaches it in time is paid, and the tunnel closes behind them
/* Agent map. Numbers: shared/cave/method-f-collapse.js (first tremor `first` s after someone arrives, then every `every` [min,max] s, warned `warn` s ahead, open `open` s). Floor state caveMFl(n) = {live, next, warned, openUntil}.
   Opening sets the vault's seal cells (B.sealed) walkable in the server's own bake (walls are B.cells: dgSlide / caveFree read it); closing puts the rock back and moves anybody still inside to the nearest open cave
   (a cell whose walking distance B.dist is 65535 is the vault and the seal: no hiker is ever there but during the opening). The client does the same from the `fv.o` field of its cm message. */
function caveMFTickS(n,G){
  const D=caveMethodDef('F').p, B=caveBake(n);
  if(G.openUntil>0){ if(S.t>=G.openUntil) caveMCloseS(n,G); return; }
  if(!G.warned&&S.t>=G.next-D.warn){ G.warned=true; caveMToFloorS(n,'The floor trembles... a vault will open in '+D.warn+' seconds!','good'); }
  if(S.t>=G.next){
    G.openUntil=S.t+D.open; G.warned=false; for(const k of B.sealed) B.cells[k]=1;
    caveMToFloorS(n,'The tunnel to the vault is open! You have '+D.open+' seconds.','good');
  }
}
function caveMCloseS(n,G){
  const D=caveMethodDef('F').p, B=caveBake(n), o=caveFloorOrigin(n), W=caveAW(n);
  for(const k of B.sealed) B.cells[k]=0;   // (the rock before the people: they are moved out below)
  G.openUntil=0; G.next=S.t+D.every[0]+Math.random()*(D.every[1]-D.every[0]); G.warned=false;
  let out=null; const sx=Math.floor((W.F.seal.x-o.x)/CAVE_CELL), sz=Math.floor((W.F.seal.z-o.z)/CAVE_CELL);
  for(let r=0;r<20&&!out;r++) for(let dz=-r;dz<=r&&!out;dz++) for(let dx=-r;dx<=r;dx++){ if(Math.max(Math.abs(dx),Math.abs(dz))!==r) continue; const x=sx+dx, z=sz+dz; if(x<0||z<0||x>=B.w||z>=B.h) continue;
    const i=z*B.w+x; if(B.cells[i]&&B.dist[i]!==65535){ out={x:o.x+(x+0.5)*CAVE_CELL,z:o.z+(z+0.5)*CAVE_CELL}; break; } }
  for(const q of S.players.values()){ if(caveFloorAt(q.x,q.z)!==n) continue;
    const gx=Math.floor((q.x-o.x)/CAVE_CELL), gz=Math.floor((q.z-o.z)/CAVE_CELL), i=gz*B.w+gx;
    if(gx>=0&&gz>=0&&gx<B.w&&gz<B.h&&(B.dist[i]===65535||!B.cells[i])&&out){ caveMMovePTo(q,out.x,out.z); toastTo(q.id,'The tunnel caves in behind you.','bad'); } }
  caveMToFloorS(n,'The vault has caved in.','');
}
function caveMToFloorS(n,text,kind){ for(const q of S.players.values()) if(caveFloorAt(q.x,q.z)===n&&!q.pv&&q.level>=CAVE_SLOT_LV) toastTo(q.id,text,kind); }
function caveMFTickP(p,M){
  const G=caveMFl(M.n), D=caveMethodDef('F').p, W=caveAW(M.n);
  if(G.openUntil>S.t&&caveCdLeft(p,M.n,'F')<=0&&caveMd(p,W.F.vault)<D.reach) caveMDoneP(p,M,'F');
}
