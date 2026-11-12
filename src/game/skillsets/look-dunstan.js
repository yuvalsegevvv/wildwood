//@ Dunstan's skill look (The Rally): embers, flame tongues and swallow-tail pennants, drum-beat rings, flame notches laid on the ground, a banner planted in the field that beats once a second
/* Agent map. Outfit: game/outfits/dunstan.js, docs/skillkits/looks/dunstan.md (ember red 0xb8432a, gold 0xd4a83a, drum cream 0xeee2c0, copper 0xc47a45; a faint ember glow 0xff7a3a). Engine: game/skillsets/looks.js.
   A ring is a drum beat (three rings in step); Banner Down plants a pole with a pennant for the whole zone and beats a ring every second; an ally buff lifts a few pennants off the buffed player. */
ssDefineLook('dunstan',{
  cols:[0xb8432a,0xd4a83a,0xff7a3a,0xeee2c0,0x2e2a2a,0xc47a45], hot:0xff9a4a, hot2:0xffd36b, decal:'flames', arcCol:0xffd36b,
  vis:{   // the text: the cry carries a shock of flame; Last Stand Banner crashes a burning banner down and sets the ground alight
    '2':{cast:[{wave:{r:8,style:'fire',col:2,h:0.8,life:0.7}}]},
    '3':{zone:[{decal:{rk:1,life:8,keep:1,r0:1,spin:0.1,op:0.55}},{wave:{style:'fire',col:2,h:0.5,life:0.8}}]},   // synergy: the flame-notch ring lies for the 8 s: stand here (the hand-built pole stays: zoneStart)
    ult:{cast:[{prop:{kind:'banner',where:'target',anim:'plant',fall:13,size:1.7,tilt:0.25,life:3.4,cols:[0,1]}},{wave:{where:'target',r:8,style:'fire',col:2,h:1.2,at:0.3}},{shake:0.5},{rise:{where:'target',n:16,r:5,at:0.4}}]}
  },
  mote:[{sh:'ember',c:2,s:0.12,w:5,add:1,g:2.5,sway:0.6},{sh:'flame',c:1,s:0.3,w:2.5,add:1,g:1.5,sway:0.8},{sh:'pennant',c:0,s:0.4,w:1.5,g:-1,sway:1.6},{sh:'pennant',c:1,s:0.34,w:1.2,g:-1,sway:1.6},{sh:'spark',c:3,s:0.16,w:1,add:1}],
  proj:{sh:'ember',c:2,s:0.55,len:1.5,glow:1,trail:{sh:'flame',c:1,s:0.2,g:1.5,add:1}},
  zone:{mode:'rise',rate:26},
  ring:c=>{ const {L,x,z,f}=c, R=f.ring;   // the drum: a beat in three rings, red then gold then white-hot
    sslDecal(L,x,z,R.r,{life:0.5,spin:0.9}); spawnRingAt(x,c.gy,z,R.r*0.5,0xd4a83a); spawnRingAt(x,c.gy,z,R.r*0.8,0xb8432a); spawnRingAt(x,c.gy,z,R.r,L.hot);
    sslRingMotes(L,x,z,R.r,R.r*3); if(f.ally) for(let i=0;i<sslN(7);i++) ssPart('pennant',i%2?0xd4a83a:0xb8432a,x+sslR(-0.5,0.5),c.gy+0.2,z+sslR(-0.5,0.5),{v:[sslR(-1.4,1.4),sslR(3,5),sslR(-1.4,1.4)],g:-4,life:1.1,s:0.5,sway:2}); },
  ally:(L,o,kind,dur,src,v)=>{ const y=o.y||getH(o.x,o.z);
    if(kind==='haste'&&v>0.10+1e-6){ for(let i=0;i<sslN(2);i++) ssPart('pennant',0xd4a83a,o.x+sslR(-0.3,0.3),y+0.6,o.z+sslR(-0.3,0.3),{v:[0,sslR(3,4),0],g:-1.5,life:1,s:0.5,sway:2}); spawnRingAt(o.x,y+0.12,o.z,1.7,0xd4a83a); }   // synergy: a bolt quickening more for the Fervor near: two more pennants and a gold ring
    for(let i=0;i<sslN(5);i++) ssPart('pennant',i%2?0xd4a83a:0xb8432a,o.x+sslR(-0.4,0.4),y+0.4,o.z+sslR(-0.4,0.4),{v:[0,sslR(2,3.4),0],g:-1.5,life:0.9,s:0.38,sway:2}); spawnRingAt(o.x,y+0.1,o.z,1.3,L.hot2); },
  proc:(L,o,row,mon)=>{ if(row.name!=='Fanned Flame') return false; if(mon) slfColumn(mon,'flame',L.cols[1],6,{s:0.28}); return true; },   // synergy: the banner's flame on a monster that carries Fervor: a small flame column, no ring (it fires every second on a pack)
  zoneStart:(L,A)=>{ const gy=getH(A.x,A.z);   // the banner: a pole and a swallow-tail pennant that stir in the wind
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,3.6,6),sslOwn(0x4a3a2c,1,false)); pole.position.set(A.x,gy+1.8,A.z);
    const flag=new THREE.Mesh(ssGeo('pennant'),sslOwn(0xb8432a,0.95,false)); flag.scale.set(1.5,1.5,1.5); flag.position.set(A.x+0.8,gy+3.1,A.z); const gold=new THREE.Mesh(ssGeo('pennant'),sslOwn(0xd4a83a,0.95,false)); gold.scale.set(0.9,0.6,1); gold.position.set(A.x+0.55,gy+3.1,A.z+0.01);
    scene.add(pole,flag,gold); A.objs.push(pole,flag,gold); A.flag=[flag,gold]; A.beat=0; },
  zoneTick:(L,A,dt)=>{ if(A.flag) A.flag.forEach((f,i)=>{ f.rotation.y=Math.sin(t*3+i)*0.35; f.rotation.z=Math.sin(t*5)*0.08; });
    const b=Math.floor(A.t); if(b!==A.beat){ A.beat=b; const gy=getH(A.x,A.z); spawnRingAt(A.x,gy,A.z,A.r*0.9,L.hot2); spawnRingAt(A.x,gy,A.z,A.r*0.55,0xb8432a); sslBurst(L,A.x,gy+0.8,A.z,8,3); } }   // a beat of the drum every second
});
