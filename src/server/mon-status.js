//@ Shared statuses on monsters (server): vuln (takes more damage) and weak (deals less) that never stack, a skill's status key (vuln / weak / slow / stun), and the quiet flag for damage that is not a hit
/* Agent map. Test: tools/skillsets-first8-smoke.js (Corvin's vuln), skillsets-passives-smoke.js and skillsets-v3-smoke.js (weak), cave-sets-smoke.js (the cave's weak).
   Exports: mstStatusS (set a vuln or weak), mstDirectS (called by statusS: a skill entry's status key), mstVulnK / mstWeakK (the two numbers read by damageMonsterS and hurtP and by the
   skill sets' `exposed` condition), mstClearS (a monster died), mstQuietS / mstQuiet (run damage that is not a direct hit: a burn tick, a skill-set trigger's own damage, a cave shot),
   MST_CAP, MST_KINDS.
   State on a monster: m.st={vuln:{v,until,by},weak:{...}}; slow, stun and burn keep their own fields (m.slowT, m.stunT, m.burnT/burnMult/burnBy/burnEl).
   Statuses are shared and never stack: the stronger wins, an equal one refreshes the time, a smaller one is ignored; both are capped (MST_CAP), whoever the source (one party's debuffers add nothing).
   Event: st [monId, kind, v, dur, by] (game/combat/mon-status.js shows the note), sent only on a change, so a ticking zone does not flood the clients.
   (This file is what stayed of the elemental reactions, which were removed: no auras, no element pairs. Corvin's and Ottoline's sets, the cave's Lamp Window and Heat Haze use these two statuses.) */
const MST_CAP={vuln:0.30,weak:0.30};              // the most a monster can take more / deal less, however many sources
const MST_KINDS=['vuln','weak','slow','stun'];    // what a skill's status key may name
let mstQuiet=0;   // above 0 while damage that is not a hit is dealt (burn ticks, a trigger's own damage): it fires no on-hit / on-crit triggers, so nothing chains
function mstQuietS(fn){ mstQuiet++; try{ return fn(); } finally{ mstQuiet--; } }
function mstVulnK(m){ const s=m&&m.st&&m.st.vuln; return s&&s.until>S.t?s.v:0; }          // the share a monster takes more
function mstWeakK(m){ const s=m&&m.st&&m.st.weak; return s&&s.until>S.t?1-s.v:1; }        // what a monster still deals (1 = all of it)
function mstClearS(m){ m.st=null; }
// vuln / weak: no stacking. A smaller one never refreshes a larger one, an equal one refreshes the time, a larger one replaces it. Capped (MST_CAP).
function mstStatusS(m,kind,v,dur,p){
  const cap=MST_CAP[kind]; if(!cap||!(v>0)) return;
  v=Math.min(v,cap); if(p) dur*=1+psP(p,'debuffdur')+ssCondP(p,'debuffdur',m)+rlP(p,'debuffdur');   // skillsets: the giver's debuffdur (a passive, a set's bonus or a rolled line) makes a vuln or a weak last longer
  const st=m.st||(m.st={}), cur=st[kind], now=S.t, live=!!cur&&cur.until>now;
  if(live&&v<cur.v-1e-6) return;
  const equal=live&&Math.abs(v-cur.v)<=1e-6, left=live?cur.until-now:0;
  st[kind]={v:equal?cur.v:v,until:equal?Math.max(cur.until,now+dur):now+dur,by:p?p.id:null};
  if(!equal||left<dur*0.5) ev('st',m.id,kind,Math.round(v*100)/100,dur,p?p.id:0);
}
// direct application: a skill entry's status ({kind,v,dur}: a general status by name)
function mstDirectS(m,s,p){
  if(m.dead||m.remove) return;
  const t=s.status; if(!t||!MST_KINDS.includes(t.kind)) return;
  if(t.kind==='vuln'||t.kind==='weak') mstStatusS(m,t.kind,(+t.v||0)+(t.perMark?t.perMark.v*ssMarkN(p,m,t.perMark.id):0),+t.dur||5,p);   // skillsets: perMark, a share more for each stack of the giver's mark on the target
  else if(t.kind==='slow') m.slowT=Math.max(m.slowT||0,+t.dur||2);
  else if(!m.T.heavy&&!m.boss) m.stunT=Math.max(m.stunT||0,+t.dur||1);
}
