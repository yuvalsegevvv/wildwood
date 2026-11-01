//@ Blood and death effects (version 3.3): the hiker bleeds below 20% hp and bursts when downed, and every monster dies in a way that fits what it is (blood, ichor, goo, sap and leaves, stone chips, spores); all of it off in child-safe mode
/* Agent map. goreMonDeath(m) runs from onMonKill (attacks.js); gorePlayerDown(x,y,z) from playerDown (progression.js) and remoteDown (net/remote.js);
   goreUpdate(dt) from the main loop (loop.js) drips blood while PL.hp < 20% of PL.maxHp. Everything is drawn with the particle pools of fx-pool.js
   (fxpSmoke = dark normal-blended blobs for liquids, fxpAdd for chips and leaves), so it costs no new draw call. Child-safe mode (modest.js, modestOn()) makes every
   function return at once. Client only: nothing is synced. Styles by monster model: GORE_STYLE (a model not listed bleeds nothing).
   owns: GORE_STYLE, GORE_LOW, goreMonDeath, gorePlayerDown, goreUpdate.   test: client-smoke (a kill and a downed hiker draw), modest-smoke */
const GORE_LOW=0.2;   // the hiker bleeds below this share of max hp
const GORE_STYLE={   // model → look of its death: blood, ichor (green), goo (the monster's own colour), sap (leaves and sap), stone (chips), spore
  goblin:'blood',fox:'blood',boar:'blood',hoofed:'blood',bird:'blood',feline:'blood',bat:'blood',gryphon:'blood',hollowed:'blood',wyrm:'blood',
  beetle:'ichor',scorpion:'ichor',sandworm:'ichor',swarm:'ichor',slime:'goo',treant:'sap',cactus:'sap',shroom:'spore',totem:'stone',sentinel:'stone'};
let goreT=0;
function goreSplat(x,y,z,n,col,speed,size,up){   // droplets thrown out and falling, plus a dark blob that lingers
  for(let i=0,k=fxpN(n);i<k;i++){ const a=AR(0,TAU), v=AR(0.4,1)*speed;
    fxpSmoke(x,y,z,Math.cos(a)*v,AR(0.2,1)*speed*0.8+up,Math.sin(a)*v,col,size*AR(0.6,1.2),AR(0.45,0.9),{g:9,drag:0.8,grow:0.5,a:0.85}); }
}
function goreChips(x,y,z,n,col,speed,size){   // hard fragments: fast, heavy, no fade-in
  for(let i=0,k=fxpN(n);i<k;i++){ const a=AR(0,TAU), v=AR(0.3,1)*speed;
    fxpAdd(x,y,z,Math.cos(a)*v,AR(0.4,1.2)*speed,Math.sin(a)*v,col,size*AR(0.6,1.3),AR(0.5,0.9),{g:14,drag:0.6,white:0.05,grow:0.6,a:0.95}); }
}
function goreLeaves(x,y,z,n,r,cols){   // leaves spinning down slowly
  for(let i=0,k=fxpN(n);i<k;i++) fxpAdd(x+AR(-r,r),y+AR(0,r*1.5),z+AR(-r,r),AR(-1.2,1.2),AR(0.5,2.2),AR(-1.2,1.2),cols[i%cols.length],0.2*AR(0.8,1.4),AR(1,1.8),{g:1.6,drag:1.4,grow:0.9,a:0.9});
}
function goreMonDeath(m){
  if(modestOn()||!m||!m.T) return;
  const st=Object.prototype.hasOwnProperty.call(GORE_STYLE,m.model)?GORE_STYLE[m.model]:null; if(!st) return;
  const s=m.T.scale*m.s*(m.boss?1.6:1), c=monCenter(m), x=c.x, y=c.y, z=c.z;
  if(st==='blood'){ goreSplat(x,y,z,16,0x8a0f18,3.2*s,0.34*s,2.2); goreSplat(x,m.y+0.15,z,6,0x5e0a10,1.4*s,0.5*s,0); }
  else if(st==='ichor'){ goreSplat(x,y,z,14,0x9bbf2e,3*s,0.32*s,2); goreSplat(x,m.y+0.15,z,5,0x5f7a1a,1.3*s,0.45*s,0); }
  else if(st==='goo'){ goreSplat(x,y,z,18,m.T.color,2.6*s,0.42*s,2.6); goreSplat(x,m.y+0.15,z,6,m.T.color,1.2*s,0.6*s,0); }
  else if(st==='sap'){ goreLeaves(x,y,z,18,0.7*s,[0x4f8a2e,0x7fae3a,0x8a6a32,0xb5812e]); goreSplat(x,y,z,8,0xd9b24a,2.4*s,0.26*s,1.6); fxxDust(x,m.y+0.2,z,5,0.9*s,0x6e5a38); }
  else if(st==='spore'){ for(let i=0,k=fxpN(16);i<k;i++) fxpSmoke(x+AR(-0.3,0.3),y,z+AR(-0.3,0.3),AR(-1.4,1.4),AR(0.6,2),AR(-1.4,1.4),0xc8b0e0,0.3*s,AR(0.9,1.5),{drag:1.2,grow:2,a:0.6}); }
  else if(st==='stone'){ goreChips(x,y,z,22,0x8f8a80,5*s,0.28*s); goreChips(x,y,z,8,0x5f5b54,3*s,0.4*s); fxxDust(x,m.y+0.2,z,8,1.2*s,0x8a8070); }
}
function gorePlayerDown(x,y,z){   // a hiker falls: a burst at the chest and a pool-like splash on the ground
  if(modestOn()) return;
  goreSplat(x,y+1.1,z,18,0x8a0f18,3,0.34,2.4); goreSplat(x,y+0.1,z,7,0x5e0a10,1.4,0.5,0);
}
function goreUpdate(dt){   // drips from a badly hurt hiker, more the lower the hp
  if(modestOn()||PL.dead||!(PL.maxHp>0)) return;
  const f=PL.hp/PL.maxHp; if(!(f<GORE_LOW)) { goreT=0; return; }
  goreT-=dt; if(goreT>0) return; goreT=AR(0.25,0.5)+f*2;
  fxpSmoke(P.x+AR(-0.2,0.2),P.y+AR(0.9,1.5),P.z+AR(-0.2,0.2),AR(-0.3,0.3),0.3,AR(-0.3,0.3),0x8a0f18,0.2,AR(0.5,0.8),{g:9,drag:0.5,grow:0.6,a:0.85});
}
