//@ The objective marker: a gold pin with the name and distance of where the main quest (or, on a cave floor, the cave guide) sends you, over the spot when it is on screen and on the screen's edge with an arrow when it is not
/* Agent map. Doc: docs/WAYPOINT.md. Client only, nothing synced or saved.
   exports: updateWaypoint(dt) (main/loop.js, every frame), wpTarget() -> {x, z, name} or null, WP (the marker's state).
   reads: mqTarget (economy/main-quest.js: the main quest's next villager, monster zone or place; null while the step waits for a level), cvwTarget (cave/waypoint.js), camera, P.
   Hidden: before play, in the editor, while knocked out, while a panel or a scene is open (uiOpen), in a dungeon run, and within WP_NEAR metres of the spot (you are there).
   The marker is #wpMark in index.html (styles 02-hud.css); the text goes through textContent (the names come from shared data, but keep it that way).
   Test: tools/client-smoke.js (the marker follows the first step's target). */
const WP_NEAR=3, WP_EDGE=34, WP={el:null,txt:null,t:0,T:null,show:false,v:null};
function wpTarget(){
  if(typeof caveIn==='function'&&caveIn()) return cvwTarget();   // cave: the next method place (cave/waypoint.js)
  if(typeof dgIn==='function'&&dgIn()) return null;            // dungeons: a run has its own map and goal
  return mqTarget();
}
function updateWaypoint(dt){
  if(!WP.el){ WP.el=$('#wpMark'); WP.txt=$('#wpTxt'); WP.v=new THREE.Vector3(); if(!WP.el) return; }
  WP.t-=dt;
  if(WP.t<=0){ WP.t=0.25;   // who and where, four times a second (uiOpen asks the DOM)
    const T=started&&!customizing&&!PL.dead&&!uiOpen()?wpTarget():null, d=T?Math.hypot(T.x-P.x,T.z-P.z):0;
    WP.T=T&&d>=WP_NEAR?T:null; WP.show=!!WP.T;
    if(WP.T&&WP.txt) WP.txt.textContent=(T.name||'Objective')+' · '+(d<1000?Math.round(d)+' m':(d/1000).toFixed(1)+' km');
  }
  const el=WP.el; if(!WP.show){ if(!el.hidden) el.hidden=true; return; }
  const T=WP.T, v=WP.v, w=innerWidth, h=innerHeight;
  v.set(T.x,getH(T.x,T.z)+2.4,T.z).project(camera);
  const behind=v.z>1;
  let sx=(v.x*0.5+0.5)*w, sy=(0.5-v.y*0.5)*h;
  if(behind){ sx=w-sx; sy=h-sy; }   // (a point behind the camera projects mirrored)
  const on=!behind&&sx>WP_EDGE&&sx<w-WP_EDGE&&sy>WP_EDGE+40&&sy<h-WP_EDGE;
  let ang=0;
  if(!on){   // on the edge, along the line from the screen's middle; behind you it sits at the bottom
    const cx=w/2, cy=h/2; let dx=sx-cx, dy=sy-cy; if(behind) dy=Math.abs(dy)+h*0.25;
    const k=Math.min((cx-WP_EDGE)/Math.max(1e-3,Math.abs(dx)),(cy-WP_EDGE-20)/Math.max(1e-3,Math.abs(dy)));
    sx=cx+dx*k; sy=cy+dy*k; ang=Math.atan2(dy,dx);
  }
  el.hidden=false; el.classList.toggle('off',!on);
  el.style.transform=`translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px)`; el.style.setProperty('--wpa',ang.toFixed(3)+'rad');
}
