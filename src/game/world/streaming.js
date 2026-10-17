//@ Streaming scheduler (Stream, streamPump): terrain first, nearest chunks next
/* the streaming scheduler: does a little work each frame, nearest areas first */
const Stream={ job:null, terrainDone:false, pending:[], done:0, needed:null, failed:false, lazy:0 };   // lazy: terrain tiles still waiting for their colours (generation-setup.js)
for(let i=0;i<NCH;i++) Stream.pending.push(i);
const NEAR_R=55, FAR_R=320;
function streamPump(budgetMs){
  if(Stream.failed) return;
  if(dgIn()) return;   // dungeons: no chunks grow while you are in a run (dungeon/run.js)
  const t0=performance.now();
  try{
    while(performance.now()-t0<budgetMs){
      if(!Stream.job){
        if(!Stream.terrainDone) Stream.job={gen:genTerrain(), rng:mulberry32(99), kind:'t'};
        else{
          let job=null;
          if(Stream.pending.length){   // the nearest area first, if it is within reach (the far side of the mountains waits until you come closer)
            let bi=0, bd=1e18; for(let i=0;i<Stream.pending.length;i++){ const d=distToChunk(Stream.pending[i],P.x,P.z); if(d<bd){ bd=d; bi=i; } }
            if(bd<=FAR_R){ const ci=Stream.pending.splice(bi,1)[0]; job={gen:genChunk(ci), rng:mulberry32(1000+ci*7919), kind:'c', ci}; }
          }
          if(!job&&Stream.lazy>0){ const B=nextLazyTile(); if(B){ B.busy=true; job={gen:terrainTileColors(B), rng:mulberry32(77), kind:'k'}; } }   // ground colours of a tile the player is nearing
          if(!job){ const cs=cvNeed(); if(cs) job={gen:cvBuildJob(cs), rng:mulberry32(31), kind:'v'}; }   // caves: a site's rock mesh when you are within 420 m (world/caves.js)
          if(!job&&NPC_DEFER.length) job={gen:spawnDeferredNPCs(), rng:mulberry32(5), kind:'n'};   // the far villages' people, when nothing nearer is waiting
          if(!job) return;
          Stream.job=job;
        }
      }
      rand=Stream.job.rng;
      const r=Stream.job.gen.next();
      if(r.done){
        if(Stream.job.kind==='t'){
          Stream.terrainDone=true;
          Stream.needed=new Set(); for(let i=0;i<NCH;i++) if(distToChunk(i,spawn.x,spawn.z)<NEAR_R) Stream.needed.add(i);
          initMotes(); initAnimals(); initNPCs(); renderQlog();
        } else if(Stream.job.kind==='c'){ Stream.done++; if(Stream.needed) Stream.needed.delete(Stream.job.ci); }
        Stream.job=null;
        onStreamProgress();
      }
    }
  }catch(err){
    Stream.failed=true; console.error(err);
    statusEl.textContent='The forest could not be generated: '+err.message+'. Reload the page to try again.';
  }
}

