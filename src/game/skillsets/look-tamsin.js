//@ Tamsin's skill look (The Rockbreaker): pebbles and grit tumble, dust motes and rope scraps drift, a ring of rivets is laid on the ground
/* Agent map. Outfit: game/outfits/tamsin.js, docs/skillkits/looks/tamsin.md (granite 0x8a8f96, dust 0xd2b48a, rope 0x9a7a4a, ochre 0xc2823a, glow 0xe8d9b8). Engine: game/skillsets/looks.js (data only). */
ssDefineLook('tamsin',{
  cols:[0x8a8f96,0xd2b48a,0xe8d9b8,0xc2823a,0x9a7a4a], hot:0xd2b48a, hot2:0xe8d9b8, decal:'rivets', arcCol:0xc2823a,
  vis:{   // the text: Pull the Slope drags to the middle; The Mountain Moves is the widest ring and a slide of rubble; Fault Line: a 20 m crack runs ahead, then the line heaves up
    '2':{zone:[{wave:{style:'dust',col:1,h:0.6,inward:true,life:0.9}},{wave:{style:'dust',col:1,h:0.4,inward:true,life:0.9,at:1.0}},{wave:{style:'dust',col:1,h:0.4,inward:true,life:0.9,at:2.0}},{decal:{rk:1,life:4.5,keep:1,r0:1,spin:0.1,op:0.55}},{shake:{v:0.15}}],end:[{dust:{}}]},   // a pull a second, the rivets lie for the rattled window
    tamsin_2_any_h:{cast:[{slabs:{r:2,n:6,col:0}},{prop:{kind:'fissure',n:3,arr:'ring',r:3,anim:'rise',len:4,life:3,cols:[3]}}],zone:[{wave:{style:'dust',col:1,h:0.5,inward:true,life:0.8}}]},   // Dig In
    '3':{cast:[{wave:{r:11,style:'dust',col:1,h:1.2,life:0.9}},{slabs:{r:5,n:10,col:0}},{slabs:{r:8,n:14,col:0,at:0.3}},{slabs:{r:5,n:8,col:4,at:1.1}},{dust:{at:0.3}},{shake:{v:0.45}}]},   // the slide stays visible for its 2.5 s
    ult:{cast:[{prop:{kind:'fissure',n:1,anim:'rise',len:20,life:3,cols:[3]}},{slabs:{where:'front',d:5,r:2.5,n:6,at:0.5,col:0}},{slabs:{where:'front',d:10,r:2.5,n:6,at:0.62,col:0}},{slabs:{where:'front',d:15,r:2.5,n:6,at:0.74,col:0}},{slabs:{where:'front',d:19,r:2.5,n:6,at:0.86,col:0}},{shake:{v:0.5,at:0.5}}]}
  },
  mote:[{sh:'pebble',c:0,s:0.14,w:5,g:2.2,sway:0.3},{sh:'slab',c:4,s:0.1,w:2,g:2.0},{sh:'chaff',c:1,s:0.16,w:4,g:-1.2,sway:2},{sh:'glint',c:2,s:0.14,w:1,add:1}],
  proj:{sh:'pebble',c:0,s:0.5,len:1.1,glow:0,trail:{sh:'chaff',c:1,s:0.14,g:-1}},
  zone:{mode:'in',rate:26},
  proc:(L,o,row,mon)=>{   // Rockslide: pebbles thrown up out of the monster and a rust flare; Loose Footing (every sweep in the window): the badge only
    if(row.name==='Loose Footing') return true; if(row.name!=='Rockslide'||!mon) return false;
    slfColumn(mon,'pebble',L.cols[0],10,{add:0,g:-12,s:0.22,flare:L.cols[3]}); return true; }
});
