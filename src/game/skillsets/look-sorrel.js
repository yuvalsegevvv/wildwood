//@ Sorrel's skill look (The Lookout): barred feathers on the wind, sky-blue wind streaks, a lens reticle on what she marks, a spiral of gale round a charged shot
/* Agent map. Outfit: game/outfits/sorrel.js, docs/skillkits/looks/sorrel.md (sky 0x8fb8d8, cream 0xf1ead8, slate 0x4a5560, snow 0xf4f6f8; one pale sky glint 0xbfe3ff). Engine: game/skillsets/looks.js.
   Her shots are long streaks with a feather tail; Mark the Gap lays a lens and a dashed ring of spreading wind where it lands; Long Gale (the charged one) winds a spiral of streaks round the shooter. */
ssDefineLook('sorrel',{
  cols:[0x8fb8d8,0xf1ead8,0x4a5560,0xf4f6f8,0xbfe3ff], hot:0xbfe3ff, hot2:0xffffff, decal:'lens', arcCol:0xbfe3ff,
  mote:[{sh:'feather',c:3,s:0.3,w:4,g:-1.2,sway:2.2},{sh:'feather',c:1,s:0.26,w:2,g:-1,sway:2},{sh:'streak',c:0,s:0.8,w:3,add:1,face:true,spin:0,op:0.7},{sh:'glint',c:4,s:0.2,w:1.5,add:1}],
  proj:{sh:'streak',c:3,s:0.9,len:1.6,glow:4,trail:{sh:'feather',c:3,s:0.2,g:-1,sway:1.5}},
  zone:{mode:'fall',rate:12},
  muzzle:c=>{ const {L,f,x,z,hx,hy,hz,face}=c;
    if(f.pop){ const dx=-Math.sin(face), dz=-Math.cos(face);   // the charged shot: a spiral of wind streaks round the line of fire, and a flare at the hand
      for(let i=0;i<sslN(22);i++){ const a=i/22*TAU*2, r=0.7+i*0.03, px=hx+dz*Math.cos(a)*r, pz=hz-dx*Math.cos(a)*r, py=hy+Math.sin(a)*r;
        ssPart('streak',i%2?L.cols[0]:L.cols[3],px,py,pz,{v:[dx*26,0,dz*26],s:1.1,add:1,face:true,spin:0,life:0.35,op:0.75}); }
      ssPart('glint',L.hot2,hx,hy,hz,{s:1.4,s1:0.2,add:1,life:0.4,spin:3}); spawnRingAt(hx,hy,hz,1.6,L.hot); }
    else { sslBurst(L,hx,hy,hz,4,1.8); spawnRingAt(hx,hy,hz,0.9,L.hot); } },
  impact:(L,pos,p,hit)=>{
    if(p.src==='sorrel_2_any'){   // Mark the Gap: the lens closes on the target, wind spreads 6 m round it
      sslDecal(L,pos.x,pos.z,2.6,{life:1.1,r0:1.4,inward:true,op:0.9,spin:0.8}); sslDecal(L,pos.x,pos.z,6,{life:0.8,r0:0.2,op:0.5}); spawnRingAt(pos.x,pos.y,pos.z,6,L.hot); sslRingMotes(L,pos.x,pos.z,6,16); }
    else { sslBurst(L,pos.x,pos.y,pos.z,10,3); ssPart('glint',L.hot2,pos.x,pos.y,pos.z,{s:0.9,s1:0.2,add:1,life:0.3}); spawnRingAt(pos.x,pos.y,pos.z,1.4,L.hot); } }
});
