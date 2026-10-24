//@ Cave method A on the server, Mural fragments: touch the five pieces at the dead ends (any order), then the wall; your light is always on, so only the walking matters
/* Agent map. Numbers: shared/cave/method-a-murals.js. State p.cm.A = {got: bit mask of the pieces you hold}. The view hides a piece unless you are within `light` metres (game/cave/method-props.js); the server only asks for `reach`. */
function caveMATickP(p,M){
  const D=caveMethodDef('A').p, A=M.A, W=caveAW(M.n);
  if(caveCdLeft(p,M.n,'A')>0) return;
  for(let i=0;i<5;i++){ if(A.got>>i&1) continue;
    if(caveMd(p,W.A.pieces[i])<D.reach){ A.got|=1<<i; toastTo(p.id,'A piece of the mural: '+caveBits(A.got)+' of 5'+(A.got===31?'. Now touch the wall.':''),'good'); } }
  if(A.got===31&&caveMd(p,W.A.wall)<D.wallReach){ A.got=0; caveMDoneP(p,M,'A'); }
}
