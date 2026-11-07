//@ Fills the client's height grid HS on web workers while the page boots (hwStart, hwTake): the same rawHeight, spread over the spare cores; the main thread falls back to doing it alone
/* Agent map. Owns: HW (state), hwStart() (called once at load, below), hwTake(iz) (genTerrain's row loop asks whether a row arrived). Used by: world/generation-setup.js (genTerrain),
   world/streaming.js (`Stream.idle`: a generator that only waits yields and the pump stops spinning). Build: build.py wraps the shared files in a begin and an end marker comment (the two strings searched in hwSource) so a worker
   can be given the pure shared rules (rawHeight and what it uses) as text: wildwoodMain.toString() sliced between the markers; nothing is downloaded twice. Test: tools/client-smoke.js (no Worker in
   the headless build: the fallback), tools/height-workers-smoke.js (a real Chromium: the workers' grid equals the main thread's).
   Why: filling HS is about 2 million rawHeight calls, 3 s of the main thread of a phone's start; the workers start before the rest of the page's start-up and are done by the time genTerrain asks.
   Safe by construction: any failure (no Worker, a blocked blob, a throw, a row that never arrives, a spot check that disagrees with the main thread's rawHeight) leaves rows to be worked out on
   the main thread exactly as before. */
const HW={on:false, failed:false, left:0, rows:null, workers:[], order:[], checked:false, t0:0, tDone:0};   // order: the first rows of the tasks still to hand out, nearest the spawn first (the first tiles are made from those while the rest arrive)
const HW_BEGIN='/*@@'+'shared*/', HW_END='/*@@/'+'shared*/';   // (built from pieces: this file sits in the same function, its own text must not contain the markers)
const HW_STEP=16;   // rows per task: small enough to share evenly, big enough that the messages are few
function hwSource(){
  const s=wildwoodMain.toString(), a=s.indexOf(HW_BEGIN), b=s.indexOf(HW_END);
  if(a<0||b<a) return null;
  return s.slice(a+HW_BEGIN.length,b)+'\n;self.onmessage=function(e){var d=e.data,n=d.r1-d.r0,o=new Float32Array(n*d.nvx);'+
    'for(var r=0;r<n;r++){var z=d.z0+(d.r0+r)*d.cell,k=r*d.nvx;for(var i=0;i<d.nvx;i++)o[k+i]=rawHeight(d.x0+i*d.cell,z);}'+
    'self.postMessage({r0:d.r0,r1:d.r1,o:o},[o.buffer]);};';
}
function hwFail(why){ if(HW.failed) return; HW.failed=true; for(const w of HW.workers){ try{ w.terminate(); }catch(e){} } HW.workers=[]; if(window.console) console.warn('height workers off: '+why); }
function hwFeed(w){
  if(!HW.order.length||HW.failed) return;
  const r0=HW.order.shift(), r1=Math.min(NVZ,r0+HW_STEP);
  w.postMessage({x0:WX0,z0:WZ0,cell:CELL,nvx:NVX,r0,r1});
}
function hwStart(){
  try{
    if(typeof Worker!=='function'||typeof Blob!=='function'||!window.URL||!URL.createObjectURL) return;
    const src=hwSource(); if(!src) return;
    const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
    const n=Math.max(1,Math.min(6,(navigator.hardwareConcurrency||2)-1));
    HW.rows=new Uint8Array(NVZ); HW.left=NVZ; HW.on=true; HW.t0=performance.now();
    { const sr=(VIL.spawn.z-WZ0)/CELL; for(let r=0;r<NVZ;r+=HW_STEP) HW.order.push(r); HW.order.sort((a,b)=>Math.abs(a+HW_STEP/2-sr)-Math.abs(b+HW_STEP/2-sr)); }
    for(let i=0;i<n;i++){
      const w=new Worker(url); HW.workers.push(w);
      w.onmessage=e=>{
        const d=e.data; if(HW.failed||!d||!d.o) return;
        HS.set(d.o,d.r0*NVX); for(let r=d.r0;r<d.r1;r++) HW.rows[r]=1; HW.left-=d.r1-d.r0;
        if(HW.left<=0){ HW.tDone=performance.now(); if(window.__hwlog) console.log('hw done in '+(HW.tDone-HW.t0).toFixed(0)+' ms, '+performance.now().toFixed(0)+' since load'); for(const x of HW.workers) x.terminate(); HW.workers=[]; } else hwFeed(w);
      };
      w.onerror=e=>hwFail(e&&e.message||'error');
      hwFeed(w);
    }
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){ hwFail(String(e&&e.message||e)); }
}
/* The main thread helps while it would only wait: a worker needs ~1.6 s to start (it evaluates the whole shared slice, and cannot start until the main thread yields), during which this
   thread was idle. hwMainRow() works out ONE row of the next task still in HW.order (nearest the spawn first, the same queue the workers draw from, so no row is done twice) with the same
   rawHeight; genTerrain's wait loop (hsEnsure) calls it instead of idling. Returns false when there is nothing left to take. */
let HW_CUR=-1, HW_CUR_END=0;
function hwMainRow(){
  if(!HW.on||HW.failed) return false;
  if(HW_CUR<0){ if(!HW.order.length) return false; HW_CUR=HW.order.shift(); HW_CUR_END=Math.min(NVZ,HW_CUR+HW_STEP); }
  const iz=HW_CUR, z=WZ0+iz*CELL, o=iz*NVX;
  for(let ix=0;ix<NVX;ix++) HS[o+ix]=rawHeight(WX0+ix*CELL,z);
  HW.rows[iz]=1; HW.left--; HW_CUR++; if(HW_CUR>=HW_CUR_END) HW_CUR=-1;
  if(HW.left<=0&&HW.workers.length){ HW.tDone=performance.now(); for(const x of HW.workers) x.terminate(); HW.workers=[]; }
  return true;
}
// have the workers delivered rows a..b (inclusive)?
function hwHave(a,b){ if(!HW.on||HW.failed) return false; for(let r=a;r<=b;r++) if(HW.rows[r]!==1) return false; return true; }
// did the worker deliver this row? (rows are only trusted after hwCheck passed)
function hwTake(iz){ return HW.on&&!HW.failed&&HW.rows[iz]===1; }
// before the workers' rows are used: 200 spread-out points worked out on this thread must agree with them (a difference would mean the workers' world is not this world)
function hwCheck(){
  if(!HW.on||HW.failed) return false;
  for(let k=0;k<200;k++){
    const i=Math.floor(HS.length*((k*0.6180339887)%1)), ix=i%NVX, iz=(i-ix)/NVX; if(!HW.rows[iz]) continue;
    if(Math.abs(HS[i]-rawHeight(WX0+ix*CELL,WZ0+iz*CELL))>1e-4){   // (HS is single precision: the main thread's own value is rounded the same way when stored)
     hwFail('a spot check disagreed at '+(WX0+ix*CELL).toFixed(0)+','+(WZ0+iz*CELL).toFixed(0)+': '+HS[i]+' vs '+rawHeight(WX0+ix*CELL,WZ0+iz*CELL)); return false; }
  }
  return true;
}
hwStart();
