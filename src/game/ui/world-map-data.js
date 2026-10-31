//@ The world map's frame on the atlas: art pixels (half a metre each), the lands' banners, towns and fog banks, and the painted atlas (the art itself, drawn once when the map first opens)
/* Agent map. The world map (ui/world-map.js) reads the atlas directly: no baked picture. wmapArt(x,z) / wmapWorld(ax,ay) convert between game metres and art pixels (1 art pixel = 2 m, a margin of WMAP_M round the
   atlas's frame); WMAP_BANNER (name, levels and place of each land's scroll, at its hub), WMAP_TOWNS (the villages), WMAP_BANKS (fog on the open sea);
   wmapPaint() paints the atlas into a canvas (a land's colour, the shallows, lakes, borders) and returns it with its scale. Used by world-map.js. Test: client-smoke. */
const WMAP_M=40, WMAP_W=Math.ceil((WX1-WX0)/2)+2*WMAP_M, WMAP_H=Math.ceil((WZ1-WZ0)/2)+2*WMAP_M;
const wmapArt=(x,z)=>[(x-WX0)/2+WMAP_M,(z-WZ0)/2+WMAP_M], wmapWorld=(ax,ay)=>[(ax-WMAP_M)*2+WX0,(ay-WMAP_M)*2+WZ0];
const WMAP_LAND_COL={home:[104,150,72],vale:[206,142,160],hoar:[196,214,226],grey:[132,134,128],sun:[214,182,112],gloam:[92,78,120],amber:[196,120,64],isles:[78,150,126]};
const WMAP_LEVELS={home:'1–15',vale:'16–25',hoar:'22–30',grey:'26–32',sun:'28–36',gloam:'30–40',amber:'37–45',isles:'42–50'}, WMAP_NAMES={home:'Wildwood',vale:'Sakura Vale',hoar:'Hoarfrost Reach',grey:'The Greyspine',sun:'The Sunscar',gloam:'The Gloamhorn',amber:'Amber Reach',isles:'Emberwake Isles'};
const WMAP_BANNER=(()=>{ const out={}; for(const l in WMAP_NAMES){ const h=WA_HUBS[l], a=wmapArt(h[0],h[1]); out[l]={name:WMAP_NAMES[l],x:a[0],y:a[1]-34,levels:WMAP_LEVELS[l]}; } return out; })();
const WMAP_TOWNS={home:VIL,vale:VIL2,hoar:VIL3,grey:VIL4,sun:VIL5,gloam:VIL6,amber:VIL7,isles:VIL8};
const WMAP_BANKS=[[1480,-980,330,190],[-30,1215,760,120],[-1720,1000,250,260]].map(b=>{ const a=wmapArt(b[0],b[1]); return [a[0],a[1],b[2]/2,b[3]/2]; });   // fog on the open sea: [x, y, rx, ry] in art pixels (the corners of the known world, and the sea south of the known lands)
// the atlas as a picture: one canvas pixel is `res` metres (6 m, 12 m on a weak phone); returns {cv, res}
function wmapPaint(res){
  const w=Math.ceil((WX1-WX0)/res), h=Math.ceil((WZ1-WZ0)/res), cv=document.createElement('canvas'); cv.width=w; cv.height=h;
  const cx=cv.getContext('2d'), im=cx.createImageData(w,h), d=im.data, id=(x,z)=>waLandId(x,z);
  for(let j=0;j<h;j++) for(let i=0;i<w;i++){
    const x=WX0+(i+0.5)*res, z=WZ0+(j+0.5)*res, k=(j*w+i)*4, sea=waIsSea(x,z);
    let r,g,b;
    if(sea){ const c=waCoast(x,z), t=clamp(1+c/70,0,1); r=22+t*54; g=76+t*70; b=114+t*60; }   // (the shallows are lighter)
    else if(waWaterDist(x,z)<=0){ r=70; g=128; b=170; }   // a lake or a river
    else { const C=WMAP_LAND_COL[WA_LAND_NAMES[id(x,z)]]||[120,120,120], c=waCoast(x,z), sh=clamp(0.82+Math.min(c,60)/60*0.18+(waLandBorderDist(x,z)<res*1.2?-0.22:0),0.5,1.05); r=C[0]*sh; g=C[1]*sh; b=C[2]*sh; if(c<7){ r=r*0.5+215*0.5; g=g*0.5+205*0.5; b=b*0.5+160*0.5; } }   // (a pale beach at the shore, a dark line on a border)
    d[k]=r; d[k+1]=g; d[k+2]=b; d[k+3]=255;
  }
  cx.putImageData(im,0,0); return {cv,res};
}
