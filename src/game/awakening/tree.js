//@ Awakening tree drawing: one character's tree on a 2D canvas (limbs as lines, upgrade / stat / star nodes by state, faint joins, limb labels), the view (fit, zoom, clamp) and picking a node; pure: no DOM, no gear
/* Agent map (skills revamp step 15; PLAN section 4b; the data: shared/awakening-tree.js AWK_SHAPES; the panel that owns the canvas: game/awakening/panel.js; the rules (states, prices): costs.js).
   exports: AWC_LIMB_COL (limb -> colour), AWC_LOOK (shape id -> the shape's tint: bark, canopy, sky), AWC_STATES (the five node states), awcRadii(s), awcBounds(shape), awcFit(shape,W,H),
            awcFitBox(box,W,H,pad), awcZoomAt(V,px,py,k,lim), awcClamp(V,shape,W,H), awcDraw(g,W,H,M), awcPickHit(hits,px,py,minR), awcLimbBox(shape,limb).
   VIEW V = {s, ox, oy, kx}: a drawing unit is s pixels high and s*kx wide (kx 1..1.6: a tall tree on a wide canvas is spread sideways a little, never squashed), the root (0,0) is at (ox, oy),
        y is up on the data and down on the screen: screen = (ox + x*s*kx, oy - y*s).
   M (what awcDraw is given) = {shape, V, st: {node id: state}, sel: node id | null, name: the character's name (under the root), col: its colour, initial, img: a loaded Image of its emblem | null,
        labels: {limb: text}, avoid: [[x0,y0,x1,y1]...] (boxes no label may cover: the zoom buttons), pulse: {id, k: 0..1} | null, hits: an array awcDraw refills with {id, x, y, r} of every node it drew (screen pixels: the panel picks from it)}.
   STATES: 'own' (bought), 'buy' (open and you can pay), 'open' (open, you cannot pay yet), 'tier' (waits for a higher Awakening tier or hiker level), 'req' (waits for an earlier node).
   Nothing here reads a canvas size, a font width or an image the page has not loaded, so the headless client (tools/headless.js, a stub 2D context) draws it too. Test: client-smoke. */
const AWC_LIMB_COL={ba:'#d2dc9a', sk:'#5fd0c4', po:'#f08a40', pa:'#92dc6a', ch:'#a98cff', bu:'#ffd24a'};
// the four trees' own tints (a slight difference of bark and sky, so the shapes read as four trees): bark, bark highlight, sky top / bottom, canopy light, ground
const AWC_LOOK={
  oak:   {bark:'#6e4f2a', hi:'#a77f46', top:'#2a2314', bot:'#17120a', leaf:'#9bbf4e', ground:'#3d2f1a'},
  pine:  {bark:'#435046', hi:'#7d907f', top:'#142120', bot:'#0b1312', leaf:'#4fb59a', ground:'#233229'},
  willow:{bark:'#6f6644', hi:'#aaa06a', top:'#212614', bot:'#12150a', leaf:'#b6d672', ground:'#363a1e'},
  banyan:{bark:'#85472f', hi:'#c0794e', top:'#2c1b13', bot:'#190f09', leaf:'#e8a63e', ground:'#432818'}
};
const AWC_STATES=['own','buy','open','tier','req'];
const awcRgba=(hex,a)=>{ const n=parseInt(hex.slice(1),16); return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'; };
// node and root sizes in pixels at s pixels a unit (a node is at least a fingertip-readable dot, and never a blob when zoomed in)
function awcRadii(s){ return {up:Math.max(3.4,Math.min(17,0.36*s)), stat:Math.max(2,Math.min(9,0.17*s)), star:Math.max(7,Math.min(26,0.62*s)), root:Math.max(12,Math.min(34,0.85*s))}; }
const AWC_BOX=new Map();   // shape id -> {x0,x1,y0,y1} (drawing units: the nodes and the root, a little roomy at the sides and the crown for the limb labels)
function awcBounds(shape){
  let b=AWC_BOX.get(shape.id); if(b) return b;
  b={x0:0,x1:0,y0:0,y1:0}; for(const n of shape.nodes){ b.x0=Math.min(b.x0,n.x); b.x1=Math.max(b.x1,n.x); b.y1=Math.max(b.y1,n.y); }
  b.x0-=1.6; b.x1+=1.6; b.y1+=1.4;
  AWC_BOX.set(shape.id,b); return b;
}
const AWC_PAD={l:10,r:10,t:24,b:58};   // pixels kept free round a fitted tree: the root's portrait, name and tree under it, the crown's label above
// a view that shows a box of drawing units whole inside the canvas less a padding of pixels (the root portrait's room is the bottom's)
function awcFitBox(b,W,H,pad){
  pad=pad||AWC_PAD; const aw=Math.max(40,W-pad.l-pad.r), ah=Math.max(40,H-pad.t-pad.b), bw=b.x1-b.x0, bh=b.y1-b.y0;
  const sy=ah/bh, sx=aw/bw, s=Math.max(1,Math.min(sx,sy)), kx=Math.max(1,Math.min(1.6,sx/s));
  return {s,kx,ox:pad.l+aw/2-(b.x0+b.x1)/2*s*kx,oy:pad.t+ah/2+(b.y0+b.y1)/2*s};
}
const awcFit=(shape,W,H)=>awcFitBox(awcBounds(shape),W,H);
// the box of one limb (its nodes and the node it forks from), a little roomy: the panel zooms to it
function awcLimbBox(shape,limb){
  const b={x0:1e9,x1:-1e9,y0:1e9,y1:-1e9}, add=n=>{ b.x0=Math.min(b.x0,n.x); b.x1=Math.max(b.x1,n.x); b.y0=Math.min(b.y0,n.y); b.y1=Math.max(b.y1,n.y); };
  for(const n of shape.nodes) if(n.limb===limb){ add(n); const p=n.parent?shape.byId[n.parent]:{x:0,y:0}; add(p); }
  b.x0-=2.2; b.x1+=2.2; b.y0-=1.5; b.y1+=2; return b;
}
// zoom by a factor about a screen point (the wheel, a pinch, the buttons), between the fitted size / 1.15 and 90 pixels a unit
function awcZoomAt(V,px,py,k,lim){
  const s=Math.max(lim.min,Math.min(lim.max,V.s*k)), r=s/V.s; V.ox=px-(px-V.ox)*r; V.oy=py-(py-V.oy)*r; V.s=s;
}
// keep some of the tree on the screen: its box may not leave more than a quarter of the canvas
function awcClamp(V,shape,W,H){
  const b=awcBounds(shape), k=V.s*(V.kx||1), l=V.ox+b.x0*k, r=V.ox+b.x1*k, t=V.oy-b.y1*V.s, d=V.oy-b.y0*V.s;
  if(l>W*0.75) V.ox-=l-W*0.75; if(r<W*0.25) V.ox+=W*0.25-r; if(t>H*0.75) V.oy-=t-H*0.75; if(d<H*0.25) V.oy+=H*0.25-d;
}
function awcPickHit(hits,px,py,minR){
  let best=null, bs=1e9;
  for(const h of hits){ const d=Math.hypot(px-h.x,py-h.y), lim=Math.max(h.r+3,minR); if(d>lim) continue; const sc=d/lim-(h.r>5?0.12:0); if(sc<bs){ bs=sc; best=h; } }   // (the nearer wins; a big node beats a small one beside it)
  return best;
}
const AWC_DEPTH=new Map();
const awcMaxDepth=shape=>{ let m=AWC_DEPTH.get(shape.id); if(!m){ m=1; for(const n of shape.nodes) if(n.depth>m) m=n.depth; AWC_DEPTH.set(shape.id,m); } return m; };
function awcStar(g,x,y,R){ g.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, r=i%2?R*0.46:R; if(i) g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); else g.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } g.closePath(); }
function awcDraw(g,W,H,M){
  const sh=M.shape, V=M.V, Lk=AWC_LOOK[sh.id]||AWC_LOOK.oak, s=V.s, R=awcRadii(s), kx=V.kx||1, X=x=>V.ox+x*s*kx, Y=y=>V.oy-y*s, hits=M.hits||[], maxD=awcMaxDepth(sh), TAU=Math.PI*2;
  const stOf=n=>M.st[n.id]||'req', byId=sh.byId, parentOf=n=>n.parent?byId[n.parent]:{x:0,y:0};
  hits.length=0;
  // the sky, the ground under the root, and the canopy: a soft light around every upgrade node, brighter round what has grown
  { const bg=g.createLinearGradient(0,0,0,H); bg.addColorStop(0,Lk.top); bg.addColorStop(1,Lk.bot); g.fillStyle=bg; g.fillRect(0,0,W,H);
    const rx=X(0), ry=Y(0), gr=g.createRadialGradient(rx,ry+6,0,rx,ry+6,R.root*4); gr.addColorStop(0,awcRgba(Lk.ground,0.95)); gr.addColorStop(1,awcRgba(Lk.ground,0)); g.fillStyle=gr; g.fillRect(rx-R.root*4,ry-R.root*2,R.root*8,R.root*5);
    for(const n of sh.nodes){ if(n.kind==='stat') continue; const own=stOf(n)==='own', r=(own?3:2.2)*s, x=X(n.x), y=Y(n.y); if(x<-r||x>W+r||y<-r||y>H+r) continue;
      const c=g.createRadialGradient(x,y,0,x,y,r); c.addColorStop(0,awcRgba(Lk.leaf,own?0.2:0.045)); c.addColorStop(1,awcRgba(Lk.leaf,0)); g.fillStyle=c; g.fillRect(x-r,y-r,r*2,r*2); } }
  g.lineCap='round'; g.lineJoin='round';
  const barkW=n=>Math.max(2,s*(0.56-0.38*n.depth/maxD));
  // the bark: every limb as a line that thins toward the crown (the trunk is the thickest), with a dark edge; a lighter line over the part that has grown
  for(const pass of [0,1,2]) for(const n of sh.nodes){
    if(pass===2&&stOf(n)!=='own') continue; const P=parentOf(n), w=barkW(n);
    g.strokeStyle=pass===0?'#0c0804':pass===1?Lk.bark:Lk.hi; g.lineWidth=pass===0?w+2.6:pass===1?w:Math.max(1.2,w*0.5);
    g.beginPath(); g.moveTo(X(P.x),Y(P.y)); g.lineTo(X(n.x),Y(n.y)); g.stroke(); }
  // the joins: cross branches between two limbs near the crown, faint until both ends are grown
  g.setLineDash([2,4]); g.lineWidth=1.2;
  for(const j of sh.joins){ const a=byId[j.node], b=byId[j.needs]; if(!a||!b) continue; const both=stOf(a)==='own'&&stOf(b)==='own';
    const x0=X(a.x), y0=Y(a.y), x1=X(b.x), y1=Y(b.y), len=Math.hypot(x1-x0,y1-y0);
    g.strokeStyle=both?'rgba(243,220,160,.75)':'rgba(217,178,106,.3)'; g.beginPath(); g.moveTo(x0,y0); g.quadraticCurveTo((x0+x1)/2,(y0+y1)/2-len*0.22,x1,y1); g.stroke(); }
  g.setLineDash([]);
  // the nodes, small ones first so a big one is never hidden under a small one
  const colOf=n=>AWC_LIMB_COL[n.limb];
  for(const kind of ['stat','up','star']) for(const n of sh.nodes){
    if(n.kind!==kind) continue;
    const x=X(n.x), y=Y(n.y), st=stOf(n), col=colOf(n), r=kind==='star'?R.star:kind==='up'?R.up:R.stat;
    hits.push({id:n.id,x,y,r});
    if(x<-r-8||x>W+r+8||y<-r-8||y>H+r+8) continue;
    if(kind==='star'){
      awcStar(g,x,y,r); const own=st==='own', buy=st==='buy';
      g.fillStyle=own?'#ffd24a':buy?'#4a3a14':'#1b1610'; g.fill(); g.lineWidth=own||buy?2:1.4; g.strokeStyle=own?'#fff2c0':buy?'#ffd24a':st==='open'?'#d9b26a':st==='tier'?'#5b6670':'rgba(217,178,106,.3)';
      if(own||buy){ g.shadowColor='#ffd24a'; g.shadowBlur=own?10:7; } g.stroke(); g.shadowBlur=0; g.shadowColor='transparent';
      if(r>9){ g.fillStyle=own?'#3a2a08':'#d9b26a'; g.font='700 '+Math.round(r*0.8)+'px Alegreya Sans, system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(n.n),x,y+r*0.08); }
      continue; }
    if(st==='own'){
      if(kind==='up'){ g.shadowColor=col; g.shadowBlur=9; }
      g.beginPath(); g.arc(x,y,r,0,TAU); g.fillStyle=col; g.fill(); g.shadowBlur=0; g.shadowColor='transparent';
      g.lineWidth=kind==='up'?1.6:1; g.strokeStyle='#fff6dc'; g.stroke();
    } else if(st==='buy'){
      const h=g.createRadialGradient(x,y,r*0.5,x,y,r*2.7); h.addColorStop(0,'rgba(255,210,74,.5)'); h.addColorStop(1,'rgba(255,210,74,0)'); g.fillStyle=h; g.fillRect(x-r*2.7,y-r*2.7,r*5.4,r*5.4);
      g.beginPath(); g.arc(x,y,r,0,TAU); g.fillStyle=awcRgba(col,0.4); g.fill(); g.lineWidth=kind==='up'?2.6:1.8; g.strokeStyle='#ffd24a'; g.stroke();
    } else if(st==='open'){
      g.beginPath(); g.arc(x,y,r,0,TAU); g.fillStyle='#241b10'; g.fill(); g.lineWidth=kind==='up'?2:1.4; g.strokeStyle=awcRgba(col,0.95); g.stroke();
    } else if(st==='tier'){
      g.beginPath(); g.arc(x,y,r,0,TAU); g.fillStyle='#13171b'; g.fill(); g.lineWidth=1.2; g.strokeStyle='#62707c'; g.stroke();
    } else {
      g.beginPath(); g.arc(x,y,r,0,TAU); g.fillStyle='#17110b'; g.fill(); g.lineWidth=1; g.strokeStyle=awcRgba(col,0.28); g.stroke();
    }
  }
  // a purchase just made: a ring that grows and fades
  if(M.pulse&&byId[M.pulse.id]){ const n=byId[M.pulse.id], k=M.pulse.k, r0=n.kind==='star'?R.star:n.kind==='up'?R.up:R.stat; g.beginPath(); g.arc(X(n.x),Y(n.y),r0+k*s*1.6,0,TAU); g.strokeStyle='rgba(255,236,170,'+(1-k).toFixed(2)+')'; g.lineWidth=3*(1-k)+1; g.stroke(); }
  // the selected node
  if(M.sel&&byId[M.sel]){ const n=byId[M.sel], r=(n.kind==='star'?R.star:n.kind==='up'?R.up:R.stat)+4; g.beginPath(); g.arc(X(n.x),Y(n.y),r,0,TAU); g.strokeStyle='#fff6dc'; g.lineWidth=2; g.setLineDash([4,3]); g.stroke(); g.setLineDash([]); }
  // the root: the character's portrait (its emblem on its colour), its name and its tree under it
  { const x=X(0), y=Y(0), r=R.root; g.shadowColor=M.col||'#d9b26a'; g.shadowBlur=12; g.beginPath(); g.arc(x,y,r,0,TAU); g.fillStyle='#1b140c'; g.fill(); g.shadowBlur=0; g.shadowColor='transparent';
    g.beginPath(); g.arc(x,y,r-3,0,TAU); g.fillStyle=awcRgba(M.col||'#d9b26a',0.55); g.fill(); g.lineWidth=2.2; g.strokeStyle='#d9b26a'; g.stroke();
    if(M.img){ try{ g.drawImage(M.img,x-r*0.62,y-r*0.62,r*1.24,r*1.24); }catch(_){} }
    else { g.fillStyle='#fff4dc'; g.font='700 '+Math.round(r*1.05)+'px Alegreya, Georgia, serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(M.initial||'?',x,y+r*0.06); }
    g.font='700 13px Alegreya, Georgia, serif'; g.textAlign='center'; g.textBaseline='top'; g.lineWidth=3; g.strokeStyle='rgba(12,9,5,.9)'; g.strokeText(M.name||'',x,y+r+5); g.fillStyle='#f6e7c4'; g.fillText(M.name||'',x,y+r+5);
    g.font='600 11px Alegreya Sans, system-ui, sans-serif'; g.strokeText(sh.name+' tree',x,y+r+21); g.fillStyle='rgba(241,230,204,.7)'; g.fillText(sh.name+' tree',x,y+r+21); }
  // limb labels at the tips, pushed outward along the limb; one that would land on another is left out (zoom in to read it)
  if(M.labels){
    const fs=Math.max(10,Math.min(13,s*0.78)), placed=(M.avoid||[]).slice(); g.font='700 '+fs+'px Alegreya Sans, system-ui, sans-serif'; g.lineWidth=3;
    for(const limb of sh.limbs){ const text=M.labels[limb]; if(!text) continue;
      const own=sh.nodes.filter(n=>n.limb===limb&&n.kind!=='star'); if(own.length<4) continue;
      const tip=own[own.length-1], mid=own[own.length-5], dx=X(tip.x)-X(mid.x), dy=Y(tip.y)-Y(mid.y), len=Math.hypot(dx,dy)||1, ux=dx/len, uy=dy/len;
      const w=text.length*fs*0.54, tx=X(tip.x), ty=Y(tip.y), gap=R.up+5;
      // where it could go: outward along the limb first, then centred above the tip, then centred under it; a side that runs off the canvas is slid back in
      const tries=[[tx+ux*gap, ty+uy*gap, ux>0.4?'left':ux<-0.4?'right':'center', uy<-0.35?'bottom':uy>0.35?'top':'middle'], [tx, ty-gap, 'center', 'bottom'], [tx, ty+gap, 'center', 'top']];
      for(const [ax0,ay,al,bl] of tries){
        let x0=al==='left'?ax0:al==='right'?ax0-w:ax0-w/2; x0=Math.max(4,Math.min(W-4-w,x0)); const ax=al==='left'?x0:al==='right'?x0+w:x0+w/2;
        const y0=bl==='bottom'?ay-fs:bl==='top'?ay:ay-fs/2, box=[x0-2,y0-2,x0+w+2,y0+fs+2];
        if(box[1]<2||box[3]>H-2||w>W-8) continue;
        if(placed.some(p=>box[0]<p[2]&&p[0]<box[2]&&box[1]<p[3]&&p[1]<box[3])) continue;
        placed.push(box); g.textAlign=al; g.textBaseline=bl; g.strokeStyle='rgba(12,9,5,.9)'; g.strokeText(text,ax,ay); g.fillStyle=AWC_LIMB_COL[limb]; g.fillText(text,ax,ay); break; }
    }
  }
}
