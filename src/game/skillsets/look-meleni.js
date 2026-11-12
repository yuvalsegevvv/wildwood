//@ Meleni's skill look (The Tide Chant): turquoise spray and foam wisps drift and drop, shell glints rise, rippling rings are laid on the ground
/* Agent map. Palette: lagoon turquoise 0x2fb4b0, pale cyan 0x7fe8ff, shell cream 0xf2e6c8, deep sea 0x16607a. Engine: game/skillsets/looks.js (data only). */
ssDefineLook('meleni',{
  cols:[0x2fb4b0,0x7fe8ff,0xf2e6c8,0x16607a], hot:0x7fe8ff, hot2:0xf2e6c8, decal:'waves', arcCol:0x7fe8ff,
  vis:{   // the text: the chant brings a surge of water; Call the Tide calls the tide up round your feet; The Great Swell: a wall of green water rises over the target and breaks
    '2':{cast:[{wave:{r:8,style:'water',col:1,h:1.3,life:0.8}},{prop:{kind:'geyser',n:5,arr:'ring',r:4,anim:'rise',stagger:0.05,life:1.2,cols:[1,0,2]}},{rise:{}}]},   // Landfall: bright, outward, tall
    meleni_2_any_h:{cast:[{dust:{}},{ring:{r:8,col:3}}]},   // Ebb: dark teal, inward, low (the engine's own crest of a pull is the inward wave: not drawn twice)
    '3':{zone:[{wave:{style:'water',col:0,h:0.9,life:1}},{decal:{rk:1,life:6,keep:1,r0:1,spin:0.1,op:0.5}},{wave:{style:'water',col:0,h:0.35,inward:true,life:1,at:2}},{wave:{style:'water',col:0,h:0.35,inward:true,life:1,at:4}}],end:[{wave:{style:'water',col:3,h:0.5,inward:true,life:0.7}}]},
    ult:{cast:[{wave:{where:'target',r:8,h:3.2,style:'water',col:0,life:1.2}},{wave:{where:'target',r:8,h:2,style:'water',col:1,inward:true,at:0.55,life:0.9}},{shake:{v:0.4,at:0.6}}]}
  },
  mote:[{sh:'wisp',c:1,s:0.5,w:3,g:-0.2,sway:2},{sh:'drop',c:0,s:0.3,w:3,g:0.8},{sh:'glint',c:2,s:0.16,w:2,add:1},{sh:'bubble',c:2,s:0.2,w:1,g:0.5,sway:1.5}],
  proj:{sh:'wisp',c:1,s:0.5,len:1.2,glow:1,trail:{sh:'drop',c:3,s:0.25}},
  zone:{mode:'rise',rate:16},   // (bubbles lifting: standing water)
  ally:(L,o,kind)=>{ const y=o.y||getH(o.x,o.z);   // might: shell-cream glints rising; guard (the held Ebb): a low ring of drops round the feet
    if(kind==='might'){ for(let i=0;i<sslN(6);i++) ssPart('glint',L.cols[2],o.x+sslR(-0.4,0.4),y+sslR(0.3,0.8),o.z+sslR(-0.4,0.4),{v:[0,sslR(1.5,2.6),0],add:1,life:0.9,s:0.2}); return; }
    if(kind==='guard'){ for(let i=0;i<sslN(10);i++){ const a=i/10*TAU; ssPart('drop',L.cols[0],o.x+Math.sin(a)*0.8,y+0.3,o.z+Math.cos(a)*0.8,{v:[0,sslR(1,1.8),0],g:-6,life:0.6,s:0.18}); } } }
});
