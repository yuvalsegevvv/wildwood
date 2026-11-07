//@ Monster status notes on the client: the "Vulnerable +14%" / "Weakened -10%" text that pops over a monster when a shared vuln or weak lands on it
/* Agent map. Server: server/mon-status.js (event st [monId, kind, v, dur, by], applyEvent in net/client.js calls mstOnStatus). Test: client-smoke.
   (What stayed of the elemental reactions, which were removed: there is no aura marker and no reaction text any more.) */
const MST_NOTE={vuln:'Vulnerable',weak:'Weakened'};
function mstOnStatus(id,kind,v,dur,by){
  const m=MON_BY_ID.get(id); if(!m||!MST_NOTE[kind]) return;
  const c=monCenter(m);
  popText(c.x,c.y+m.T.height*0.5*m.s+0.1,c.z,MST_NOTE[kind]+' '+(kind==='vuln'?'+':'-')+Math.round(v*100)+'%','mstat');
}
