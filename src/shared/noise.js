//@ Seeded RNG (rand, R, pick), simplex noise2, fbm, clamp, lerp, smoothstep, h3 hash. Pure.
/* ---------- RNG + noise ---------- */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
let rand = mulberry32(20260927);
const R = (a,b) => a+(b-a)*rand();
const pick = a => a[Math.floor(rand()*a.length)];
const perm = new Uint8Array(512);
{ const p=[]; for(let i=0;i<256;i++) p.push(i); for(let i=255;i>0;i--){ const j=Math.floor(rand()*(i+1)); const t=p[i]; p[i]=p[j]; p[j]=t; } for(let i=0;i<512;i++) perm[i]=p[i&255]; }
const GR=[[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
const F2=0.5*(Math.sqrt(3)-1), G2=(3-Math.sqrt(3))/6;
function noise2(xin,yin){
  const s=(xin+yin)*F2, i=Math.floor(xin+s), j=Math.floor(yin+s);
  const t=(i+j)*G2, x0=xin-(i-t), y0=yin-(j-t);
  const i1=x0>y0?1:0, j1=x0>y0?0:1;
  const x1=x0-i1+G2, y1=y0-j1+G2, x2=x0-1+2*G2, y2=y0-1+2*G2;
  const ii=i&255, jj=j&255; let n=0, tt, g;
  tt=0.5-x0*x0-y0*y0; if(tt>0){ g=GR[perm[ii+perm[jj]]&7]; tt*=tt; n+=tt*tt*(g[0]*x0+g[1]*y0); }
  tt=0.5-x1*x1-y1*y1; if(tt>0){ g=GR[perm[ii+i1+perm[jj+j1]]&7]; tt*=tt; n+=tt*tt*(g[0]*x1+g[1]*y1); }
  tt=0.5-x2*x2-y2*y2; if(tt>0){ g=GR[perm[ii+1+perm[jj+1]]&7]; tt*=tt; n+=tt*tt*(g[0]*x2+g[1]*y2); }
  return 70*n;
}
function fbm(x,y,o){ let v=0,a=1,f=1,s=0; for(let k=0;k<o;k++){ v+=a*noise2(x*f,y*f); s+=a; a*=0.5; f*=2.02; } return v/s; }
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function smoothstep(e0,e1,x){ const t=clamp((x-e0)/(e1-e0)); return t*t*(3-2*t); }
function h3(x,y,z){ x=Math.round(x*1000); y=Math.round(y*1000); z=Math.round(z*1000); const s=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453; return s-Math.floor(s); }

