//@ Cave method D on the server, Carry the lantern: take the glow crystal from the deepest chamber to the altar by the lift; every hit dims it, water puts it out
/* Agent map. Numbers: shared/cave/method-d-lantern.js. State p.cm.D = {s 0 / 1 carrying, hits, dry (stood on dry ground since the pickup: the crystal can sit in a pool on the flooded floor), lh (the last p.lastHit seen), out (no pickup before)}. A hit is any change of p.lastHit while carrying (a shield-soaked hit counts).
   It goes out after `hits` hits, under water (a water or lava cell), or when you are knocked out or leave the floor; the crystal is always back at its place for everybody (it is a prop, the carry is yours). */
function caveMDTickP(p,M){
  const D=caveMethodDef('D').p, d=M.D, W=caveAW(M.n);
  if(caveCdLeft(p,M.n,'D')>0){ d.s=0; return; }
  if(!d.s){
    if(S.t>=d.out&&caveMd(p,W.D.crystal)<D.reach){ d.s=1; d.hits=0; d.dry=false; d.lh=p.lastHit; toastTo(p.id,'You lift the glow crystal. Carry it to the altar by the lift','good'); }
    return;
  }
  if(p.lastHit>d.lh){ d.lh=p.lastHit; d.hits++; if(d.hits>=D.hits) return caveMDOut(p,M,'The crystal went dark: too many hits'); caveMTell(p,M,'dim','The crystal dims ('+(D.hits-d.hits)+' hits left)','bad'); }
  const wet=caveMDWet(M.n,p.x,p.z);
  if(!wet) d.dry=true; else if(d.dry) return caveMDOut(p,M,'The crystal went out in the water');   // (a crystal lifted from a pool is lit until you have stood on dry ground once)
  if(caveMd(p,W.D.altar)<D.altar){ d.s=0; caveMDoneP(p,M,'D'); }
}
function caveMDOut(p,M,text){ M.D.s=0; M.D.out=S.t+3; toastTo(p.id,text+'. Fetch it again from the deepest chamber.','bad'); }
function caveMDWet(n,x,z){   // standing in water or lava
  const B=caveBake(n), o=caveFloorOrigin(n), gx=Math.floor((x-o.x)/CAVE_CELL), gz=Math.floor((z-o.z)/CAVE_CELL); if(gx<0||gz<0||gx>=B.w||gz>=B.h) return false;
  const i=gz*B.w+gx; return B.water[i]>0||B.lava[i]>0;
}
