//@ vDist, nearPath, pathAmt, plazaAmt, inBox, pushOutBoxes: each works on the village on that side of the mountains (vilAt). Pure.
function vDist(x,z){ const V=vilAt(x,z); return Math.hypot(x-V.x,z-V.z); }
function nearPath(x,z,m){ if(vDist(x,z)>VR+30) return false; for(const s of vilAt(x,z).paths) if(segDist(x,z,s)<m) return true; return false; }
function pathAmt(x,z){ if(vDist(x,z)>VR+30) return 0; let m=0; for(const s of vilAt(x,z).paths){ const a=smoothstep(s[4],s[4]*0.4,segDist(x,z,s)); if(a>m) m=a; } return m; }
function plazaAmt(x,z){ const V=vilAt(x,z); return smoothstep(V.plaza+0.8,V.plaza-0.8,vDist(x,z)); }
function inBox(x,z,pad){
  for(const b of vilAt(x,z).boxes){ const dx=x-b.x, dz=z-b.z, c=Math.cos(b.rot), s=Math.sin(b.rot); const lx=dx*c-dz*s, lz=dx*s+dz*c; if(Math.abs(lx)<b.hw+pad && Math.abs(lz)<b.hd+pad) return true; }
  return false;
}
function pushOutBoxes(o,rad){
  if(vDist(o.x,o.z)>VR+12) return;
  for(const b of vilAt(o.x,o.z).boxes){
    const dx=o.x-b.x, dz=o.z-b.z, c=Math.cos(b.rot), s=Math.sin(b.rot);
    let lx=dx*c-dz*s, lz=dx*s+dz*c;
    const ex=b.hw+rad, ez=b.hd+rad;
    if(Math.abs(lx)<ex && Math.abs(lz)<ez){
      if(ex-Math.abs(lx)<ez-Math.abs(lz)) lx=Math.sign(lx||1)*ex; else lz=Math.sign(lz||1)*ez;
      o.x=b.x+lx*c+lz*s; o.z=b.z-lx*s+lz*c;
    }
  }
}
