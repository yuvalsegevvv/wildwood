//@ 20-minute day/night cycle, sky keyframes, clock, zone label
/* ---------- time of day ---------- */
/* A full day lasts 20 real minutes: 10 minutes of daylight (06:00-18:00) and 10 of night (18:00-06:00).
   dayClock runs 0..1, where 0 is 06:00, 0.25 is noon, 0.5 is 18:00 and 0.75 is midnight. */
const DAY_SECONDS=1200;
const TOD_KEYS=[
  {at:0.000,name:'Dawn',        sun:0xff9a60,sunI:0.55,sky:0x3a4f80,hor:0xf2a07a,fog:0xa89aa0,hs:0x8a90b0,hg:0x2a2a26,hi:0.42,cloud:0xf0b8a0,night:0.35,far:185},
  {at:0.035,name:'Morning',     sun:0xffd9a8,sunI:1.1, sky:0x6c9bd0,hor:0xf4cfa0,fog:0xcfd3c9,hs:0xc4d6e6,hg:0x4d4a33,hi:0.62,cloud:0xfff0e2,night:0,far:230},
  {at:0.250,name:'Midday',      sun:0xfff5e3,sunI:1.3, sky:0x3e7ccb,hor:0xd9e6ee,fog:0xb5cde0,hs:0xd2e3f2,hg:0x55532f,hi:0.72,cloud:0xffffff,night:0,far:240},
  {at:0.400,name:'Afternoon',   sun:0xffecc8,sunI:1.25,sky:0x4a80c4,hor:0xe8dcc8,fog:0xc4cdd4,hs:0xd6dcea,hg:0x55502f,hi:0.66,cloud:0xfff4e6,night:0,far:235},
  {at:0.470,name:'Golden hour', sun:0xffa257,sunI:1.2, sky:0x4f6aa6,hor:0xffae70,fog:0xd6ab8c,hs:0xe9bc98,hg:0x4b3a28,hi:0.55,cloud:0xffc8a2,night:0.12,far:220},
  {at:0.520,name:'Dusk',        sun:0xd07050,sunI:0.4, sky:0x2a3565,hor:0xc07060,fog:0x5a4a5a,hs:0x6a6a90,hg:0x1c1a18,hi:0.36,cloud:0x7a5a6a,night:0.62,far:180},
  {at:0.580,name:'Night',       sun:0xa4b8ff,sunI:0.32,sky:0x060c20,hor:0x33416b,fog:0x121a30,hs:0x31406c,hg:0x0e120e,hi:0.3, cloud:0x1e2745,night:1,far:150},
  {at:0.920,name:'Night',       sun:0xa4b8ff,sunI:0.3, sky:0x070d22,hor:0x2e3a62,fog:0x131b31,hs:0x31406c,hg:0x0e120e,hi:0.3, cloud:0x1e2745,night:1,far:150},
  {at:0.970,name:'Before dawn', sun:0x9fb0ff,sunI:0.28,sky:0x1a2448,hor:0x5a5a80,fog:0x2a3048,hs:0x3a4a78,hg:0x141612,hi:0.32,cloud:0x3a4060,night:0.8,far:160}
];
const CK=['sun','sky','hor','fog','hs','hg','cloud'], NK=['sunI','hi','night','far'];
function mkState(p){ const s={elev:20,azim:75}; CK.forEach(k=>s[k]=new THREE.Color(p[k])); NK.forEach(k=>s[k]=p[k]); return s; }
const TOD_STATES=TOD_KEYS.map(mkState);
let dayClock=0.045; // start every visit in the morning, around 07:05
const envCur=mkState(TOD_KEYS[1]);
const dayMote=new THREE.Color(0xfff7d6), fly=new THREE.Color(0xd8ff6a), wDay=new THREE.Color(0x2c5560), wNight=new THREE.Color(0x0d1826), iceMote=new THREE.Color(0xcfe8ff);
function applyEnv(s){
  const el=s.elev*DEG, az=s.azim*DEG;
  sunDir.set(Math.cos(el)*Math.sin(az), Math.sin(el), Math.cos(el)*Math.cos(az)).normalize();
  sun.color.copy(s.sun); sun.intensity=s.sunI;
  hemi.color.copy(s.hs); hemi.groundColor.copy(s.hg); hemi.intensity=s.hi;
  scene.fog.color.copy(s.fog); scene.fog.far=s.far; renderer.setClearColor(s.fog);
  skyU.uTop.value.copy(s.sky); skyU.uFog.value.copy(s.fog); skyU.uHor.value.copy(s.hor);
  skyU.uBot.value.copy(s.hg); skyU.uSunCol.value.copy(s.sun); skyU.uCloud.value.copy(s.cloud); skyU.uNight.value=s.night;
  if(waterMat) waterMat.color.copy(wDay).lerp(wNight,s.night);
  pMat.color.copy(dayMote).lerp(fly,s.night); pMat.size=lerp(0.13,0.34,s.night); pMat.opacity=lerp(0.45,1,s.night);
  { const cold=P.x>borderX(P.z)?smoothstep(borderZ(P.x)+40,borderZ(P.x)-30,P.z):0; if(cold>0){ pMat.color.lerp(iceMote,cold); pMat.size=lerp(pMat.size,lerp(0.09,0.15,s.night),cold); pMat.opacity*=1-0.35*cold; } }   // over the snow: glints of diamond dust, not fireflies
}
function envAt(c,out){
  const n=TOD_KEYS.length;
  let i=n-1; for(let k=0;k<n;k++){ if(TOD_KEYS[k].at<=c) i=k; }
  const j=(i+1)%n, a=TOD_KEYS[i].at, b=j===0?1:TOD_KEYS[j].at;
  let f=(c-a)/(b-a); f=f*f*(3-2*f);
  const A=TOD_STATES[i], B=TOD_STATES[j];
  CK.forEach(k=>out[k].copy(A[k]).lerp(B[k],f));
  NK.forEach(k=>out[k]=lerp(A[k],B[k],f));
  // the sun crosses the sky by day, the moon by night; the light follows whichever is higher
  const th=c*TAU, sE=62*Math.sin(th), sA=75+c*420, mE=-45*Math.sin(th), mA=75+((c+0.5)%1)*420;
  const w=smoothstep(-6,6,mE-sE);
  out.elev=lerp(Math.max(sE,4),Math.max(mE,4),w); out.azim=lerp(sA,mA,w);
  out.name=TOD_KEYS[i].name;
}
let todLabelT=0;
let curZone='';
function updateZoneLabel(){
  const V=vilAt(P.x,P.z), inV=vDist(P.x,P.z)<VR+22, zn=inV?null:zoneAt(P.x,P.z), vale=inVale(P.x,P.z), hoar=inHoar(P.x,P.z), grey=inGrey(P.x,P.z), pass=!zn&&!inV&&inPass(P.x,P.z);
  const key=zn?String(zn.key):inV?(V===VIL4?'highmark':V===VIL3?'rimehold':V===VIL2?'hanami':'village'):P.inTun?'bridge':pass?'pass':hoar?'hoar':grey?'grey':vale?'vale':'wild';
  const txt=zn?zn.name+(zn.boss?' (boss)':' (Lv '+zoneLvText(zn)+')'):inV?(V===VIL4?'Highmark':V===VIL3?'Rimehold':V===VIL2?'Hanami':'The village'):P.inTun?'The Greyfall bridge':pass?'Frostgate Pass':hoar?'The Hoarfrost Reach':grey?'The Greyspine':vale?'The Sakura Vale':'Deep forest';
  $('#zone').textContent=txt;
  if(started && key!==curZone && curZone!==''){
    if(zn) toast('Entering '+txt,zn.boss||zoneLvNum(zn)>PL.level+2?'bad':'');
    else if(key==='village') toast('Back in the village','good');
    else if(key==='hanami') toast('Hanami, village of the Sakura Vale','good');
    else if(key==='rimehold') toast('Rimehold, village of the Hoarfrost Reach','good');
    else if(key==='highmark') toast('Highmark, village of the Greyspine','good');
    else if(key==='vale'&&curZone==='bridge') toast('The Sakura Vale','good');
    else if(key==='hoar'&&curZone==='pass') toast('The Hoarfrost Reach','good');
    else if(key==='grey') toast('The Greyspine, a young alpine range','good');
  }
  curZone=key;
}
function clockText(c){ const mins=Math.floor((6*60+c*1440))%1440; return String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0'); }
function updateEnv(dt){
  // the world server owns the clock: run it locally and ease toward the server's time
  dayClock=(dayClock+dt/DAY_SECONDS)%1;
  if(serverDay!==null){ const d=((serverDay-dayClock+1.5)%1)-0.5; dayClock=Math.abs(d)>0.05?serverDay:(dayClock+d*Math.min(1,dt*2)+1)%1; }
  envAt(dayClock,envCur);
  weatherTint(envCur);
  dgLookEnv(envCur);   // dungeons: a run's own fog and light, whatever the hour or weather (dungeon/look.js)
  dgGloomTint(envCur,dt);   // dungeons: the Barrow Lord's blackout darkens his hall (combat/boss-dungeon.js)
  applyEnv(envCur);
  todLabelT-=dt;
  if(todLabelT<=0){ todLabelT=0.5; $('#tod').textContent=envCur.name+' '+clockText(dayClock)+(WX.kind&&WX.inten>0.2?(WX.snow>0.5?(WX.kind===2?' · Blizzard':' · Snow'):WX.kind===2?' · Thunderstorm':' · Rain'):''); updateZoneLabel(); }
}
// the sun button / T key skips ahead to the next part of the day
let serverDay=null;
function cycleTime(){ netSend({t:'dev',cmd:'skip'}); }
envAt(dayClock,envCur);
applyEnv(envCur);

