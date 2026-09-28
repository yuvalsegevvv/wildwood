//@ Weather on the server: rain for 5-7 minutes every 40-60 minutes, 30% of the time a thunderstorm
/* One weather for the whole world. W.kind: 0 clear, 1 rain, 2 storm. Each rain starts 40-60 minutes after the
   previous one started (the first 40-60 minutes after the server starts). During a storm the server sends
   lightning strikes ('thunder' events) somewhere near a random player every 6-20 seconds.
   Snapshots carry [kind, seconds since it started, how long it lasts] and clients fade it in and out. */
const W={kind:0,t:0,dur:0,next:AR(40,60)*60,bolt:8};
function startWeatherS(kind,dur){ W.kind=kind; W.t=0; W.dur=dur||AR(5,7)*60; W.bolt=AR(4,10); W.next=AR(40,60)*60; ev('weather',kind); }
function updateWeatherS(dt){
  W.next-=dt;
  if(W.kind){
    W.t+=dt;
    if(W.t>=W.dur){ W.kind=0; W.t=0; W.dur=0; ev('weather',0); }
    else if(W.kind===2 && W.t>20 && W.t<W.dur-20 && (W.bolt-=dt)<=0){
      W.bolt=AR(6,20);
      const ps=[...S.players.values()]; if(ps.length){ const p=ps[Math.floor(Math.random()*ps.length)], a=AR(0,TAU), r=AR(40,220); ev('thunder',r1(clamp(p.x+Math.sin(a)*r,WX0,WX1)),r1(clamp(p.z+Math.cos(a)*r,WZ0,WZ1))); }
    }
  } else if(W.next<=0) startWeatherS(Math.random()<0.3?2:1);
}
const weatherState=()=>[W.kind,Math.round(W.t),Math.round(W.dur)];
