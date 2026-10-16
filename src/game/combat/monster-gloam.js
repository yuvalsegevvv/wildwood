//@ The Gloamhorn's monster models: the gloom bat (model 'bat'); the rest of the land reuses the families with new look flags (djinn siren, wisp ghosts by id, goblin undead, treant dead, wyrm stone, sandworm sea)
/* Agent map: fills MODELS.bat (same contract as monster-parts.js: geo, build, anim; models face -z, metres at scale 1). pal.body / belly (fur), wing (the membrane), horn (claws and fangs), eye. The wings are the
   wyrm's membrane (moWyrmWing, monster-wyrm.js) shrunk to a bat's. Its stats are the FAM row 'bat' (shared/monster-defs.js), its kind the MON_DEFS row 'gloombat' (zone m33). Tested by client-smoke (the roster
   builds) and tools/monster-preview.js. */
MODELS.bat={
  geo(d,p){
    const G={}, W=[-1,1], fur=(x,y,z,c)=>{ c.set(p.body).multiplyScalar(0.7+0.5*moNoise(x,y,z,8)); moTint(c,p.belly,clamp(-(y-1.0)*4)*0.6); };
    const body=[moEll(0.17,0.2,0.27,0,1.0,0.02,fur,null,10),moEll(0.14,0.13,0.14,0,1.1,-0.3,fur,null,10),moEll(0.045,0.035,0.06,0,1.06,-0.42,p.belly,null,6),moCone([0,0.95,0.26],[0,-0.5,1],0.22,0.07,fur,4)];   // body, head, snout, a stub of tail
    for(const sd of W){ body.push(moCone([sd*0.07,1.2,-0.3],[sd*0.35,1,-0.1],0.26,0.06,fur,4),moEll(0.028,0.03,0.02,sd*0.07,1.12,-0.4,p.eye,null,5),moCone([sd*0.025,1.0,-0.46],[0,-1,-0.1],0.07,0.012,p.horn,3),moBone([sd*0.1,0.85,-0.05],[sd*0.12,0.7,-0.1],0.03,0.015,p.horn,4)); }
    G.body=moMerge(body);
    G.wR=moWyrmWing(1,p).scale(0.4,0.4,0.4); G.wL=moWyrmWing(-1,p).scale(0.4,0.4,0.4);
    return G;
  },
  build(d,G,M,g,P0){
    P0.body=M(G.body); g.add(P0.body);
    const nd=(x,y,z,mesh)=>{ const o=new THREE.Group(); o.position.set(x,y,z); o.add(mesh); g.add(o); return o; };
    P0.wR=nd(0.12,1.08,0.0,M(G.wR)); P0.wL=nd(-0.12,1.08,0.0,M(G.wL));
  },
  anim(m,dt,sp,lunge){
    const P0=m.parts; m.ph+=dt*(9+sp*3);
    const fl=Math.sin(m.ph)*0.85, hov=0.55+Math.sin(m.ph*0.5+m.s*3)*0.08;   // it hovers a hand above the ground and beats its wings
    P0.wR.rotation.z=fl; P0.wL.rotation.z=-fl; P0.body.position.y=hov+Math.abs(fl)*0.05; P0.wR.position.y=P0.wL.position.y=1.08+hov;
    P0.body.rotation.x=Math.min(0.3,sp*0.07)-lunge*0.7;
  }
};
