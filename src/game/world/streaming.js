//@ Streaming scheduler (Stream, streamPump): terrain first, nearest chunks next
/* the streaming scheduler: does a little work each frame, nearest areas first */
const Stream={ job:null, terrainDone:false, pending:[], done:0, needed:null, failed:false };
for(let i=0;i<NCH;i++) Stream.pending.push(i);
const NEAR_R=55;
function streamPump(budgetMs){
  if(Stream.failed) return;
  const t0=performance.now();
  try{
    while(performance.now()-t0<budgetMs){
      if(!Stream.job){
        if(!Stream.terrainDone) Stream.job={gen:genTerrain(), rng:mulberry32(99), kind:'t'};
        else if(Stream.pending.length){
          Stream.pending.sort((a,b)=>distToChunk(a,P.x,P.z)-distToChunk(b,P.x,P.z));
          const ci=Stream.pending.shift();
          Stream.job={gen:genChunk(ci), rng:mulberry32(1000+ci*7919), kind:'c', ci};
        } else return;
      }
      rand=Stream.job.rng;
      const r=Stream.job.gen.next();
      if(r.done){
        if(Stream.job.kind==='t'){
          Stream.terrainDone=true;
          Stream.needed=new Set(); for(let i=0;i<NCH;i++) if(distToChunk(i,spawn.x,spawn.z)<NEAR_R) Stream.needed.add(i);
          initMotes(); initAnimals(); initNPCs(); renderQlog();
        } else { Stream.done++; if(Stream.needed) Stream.needed.delete(Stream.job.ci); }
        Stream.job=null;
        onStreamProgress();
      }
    }
  }catch(err){
    Stream.failed=true; console.error(err);
    statusEl.textContent='The forest could not be generated: '+err.message+'. Reload the page to try again.';
  }
}

