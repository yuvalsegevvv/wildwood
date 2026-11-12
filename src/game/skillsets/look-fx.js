//@ Payoff helpers for the skill-set looks: your mark stacks near a point, a cord or streak between two points, motes circling a player, a glare at a monster's eyes, a flame column on a monster
/* Agent map. Used by the look-<id>.js files' proc / fxa / ally / spent / zoneTick hooks (docs/skillkits/VISUALS.md, "Combo and synergy payoffs"). Everything draws through ssPart (the look particle pool, SSL_MAX,
   halved counts in LOW through sslN), so a pack that procs every second stays inside the budget. Exports: slfNear, slfHead, slfCord, slfOrbit, slfGlare, slfColumn. Test: client-smoke (it calls every look hook). */
// the stacks of YOUR mark on the monsters within r of (x,z), up to 5: what the client knows of a perMark (your own marks only: another player's shows the base look)
function slfNear(markId,x,z,r){
  let n=0; for(const [id,e] of SSV.marks){ const c=e[markId], m=c&&MON_BY_ID.get(id); if(m&&!m.dead&&Math.hypot(m.x-x,m.z-z)<r) n+=c.n; } return Math.min(5,n);
}
const slfHead=m=>({x:m.x,y:m.y+m.T.height*m.s*0.75,z:m.z});
// a line of motes from a to b drawn in a blink (a cord pulled taut, a streak of light): sh the shape, n motes, life seconds, add glow
function slfCord(a,b,col,o){
  o=o||{}; const n=sslN(o.n||8);
  for(let i=0;i<n;i++){ const q=(i+0.5)/n;
    ssPart(o.sh||'streak',col,a.x+(b.x-a.x)*q,a.y+(b.y-a.y)*q+Math.sin(q*Math.PI)*(o.sag||0),a.z+(b.z-a.z)*q,{s:o.s||0.35,life:o.life||0.25,spin:0,add:o.add?1:0,op:o.op===undefined?0.9:o.op,fin:0.05,fout:0.5,v:o.v||[0,0,0],
      rot:[0,Math.atan2(b.x-a.x,b.z-a.z),0]}); }
}
// n motes circling a player at radius r and height y for life seconds (a shield of linen, a gold weave)
function slfOrbit(pid,sh,col,n,o){
  o=o||{}; const who=()=>sslWho(pid), w=who(); if(!w) return; const N=sslN(n);
  for(let i=0;i<N;i++) ssPart(sh,col,w.x,(w.y||getH(w.x,w.z))+(o.y||1),w.z,{s:o.s||0.3,life:o.life||1.2,spin:o.spin===undefined?1.5:o.spin,add:o.add?1:0,op:o.op===undefined?0.85:o.op,fin:0.15,fout:0.4,
    orb:{who,r:(o.r||0.7)*sslR(0.9,1.1),w:(o.w||3)*(i%2?1:0.85),a:i/N*TAU,y:(o.y||1)+(i%3)*0.18}});
}
// a glare at a monster's eyes: two glints flash and drift (Zahra's dazzle)
function slfGlare(m,col){ const h=slfHead(m); for(let i=0;i<2;i++) ssPart('glint',col,h.x+sslR(-0.25,0.25),h.y+sslR(-0.1,0.2),h.z+sslR(-0.25,0.25),{s:sslR(0.25,0.4),add:1,life:0.45,spin:4,v:[0,0.4,0]}); }
// a short column of flames or motes standing up out of a monster (a proc on the struck)
function slfColumn(m,sh,col,n,o){ o=o||{}; const h=slfHead(m), gy=m.y;
  for(let i=0;i<sslN(n);i++) ssPart(sh,col,m.x+sslR(-0.3,0.3),gy+sslR(0,0.6),m.z+sslR(-0.3,0.3),{v:[sslR(-0.3,0.3),sslR(2,3.6),sslR(-0.3,0.3)],s:o.s||0.3,add:o.add===undefined?1:o.add,life:sslR(0.4,0.7),g:o.g||0,spin:o.spin===undefined?1:o.spin});
  if(o.flare) fxpFlare(h.x,h.y,h.z,o.flare,0.9,0.25); }
