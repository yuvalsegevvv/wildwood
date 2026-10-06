//@ Reactions on the server: elemental auras and reactions, the flavours as shared statuses on monsters (vuln, weak, burn, slow, stun) and direct application
/* Agent map. Plan, rules and the table of hooks: docs/REACTIONS.md (read it first); the data: shared/reactions.js; test: tools/reactions-smoke.js.
   Exports: rxHitS (called by damageMonsterS: leave an aura or react), rxDirectS (called by statusS: a skill's flavor and status keys), rxVulnK / rxWeakK (the two
   numbers read by damageMonsterS and hurtP), rxClearS (a monster died), rxQuietS (run damage that leaves no aura and reacts to nothing), rxQuiet.
   State on a monster: m.aura={el,until,by}, m.st={vuln:{v,until,by},weak:{...}}, m.rxIcd={pairKey:until}; slow, stun and burn keep their old fields
   (m.slowT, m.stunT, m.burnT/burnMult/burnBy/burnEl). Statuses are shared and never stack: the stronger wins, an equal one refreshes the time, a smaller one is ignored.
   Events: aura [monId, el|0, dur], react [monId, pairKey], st [monId, kind, v, dur, by]; only on a change, so a ticking zone does not flood the clients. */
let rxQuiet=0;   // above 0 while damage that must not leave an aura or react is dealt (burn ticks, a reaction's burst): nothing chains
function rxQuietS(fn){ rxQuiet++; try{ return fn(); } finally{ rxQuiet--; } }
function rxVulnK(m){ const s=m&&m.st&&m.st.vuln; return s&&s.until>S.t?s.v:0; }          // the share a monster takes more
function rxWeakK(m){ const s=m&&m.st&&m.st.weak; return s&&s.until>S.t?1-s.v:1; }        // what a monster still deals (1 = all of it)
function rxClearS(m){ m.aura=null; m.st=null; m.rxIcd=null; }
// vuln / weak: no stacking. A smaller one never refreshes a larger one, an equal one refreshes the time, a larger one replaces it. Capped (RX_ST_CAP).
function rxStatusS(m,kind,v,dur,p){
  const cap=RX_ST_CAP[kind]; if(!cap||!(v>0)) return;
  v=Math.min(v,cap);
  const st=m.st||(m.st={}), cur=st[kind], now=S.t, live=!!cur&&cur.until>now;
  if(live&&v<cur.v-1e-6) return;
  const equal=live&&Math.abs(v-cur.v)<=1e-6, left=live?cur.until-now:0;
  st[kind]={v:equal?cur.v:v,until:equal?Math.max(cur.until,now+dur):now+dur,by:p?p.id:null};
  if(!equal||left<dur*0.5) ev('st',m.id,kind,Math.round(v*100)/100,dur,p?p.id:0);
}
// an aura (one per monster, shared); the event goes out when it is new, changed, or has under half of its time left
function rxSetAuraS(m,el,by){
  const a=m.aura, now=S.t, live=!!a&&a.until>now, left=live?a.until-now:0;
  m.aura={el,until:now+RX_AURA_DUR,by};
  if(!live||a.el!==el||left<RX_AURA_DUR*0.5) ev('aura',m.id,el,RX_AURA_DUR);
}
// spread: copy an aura onto the monsters around m (same run), unless they carry another element's aura. It only sets auras, so it never starts a reaction and cannot chain.
function rxSpreadS(m,el,p){
  const now=S.t;
  for(const n of MONS){
    if(n===m||n.dead||n.remove||(n.inst|0)!==(m.inst|0)) continue;
    if(Math.hypot(n.x-m.x,n.z-m.z)>=RX_SPREAD_R+n.T.rad*0.5) continue;
    const a=n.aura; if(a&&a.until>now&&a.el!==el) continue;
    rxSetAuraS(n,el,p.id);
  }
}
// one element's flavour on a monster at strength k (mult: the damage multiplier of the hit that causes it, which sets a burn's damage). Spread is the caller's, it needs an aura.
function rxFlavorS(m,el,p,k,mult){
  const E=rxEffect(el,k); if(!E||m.dead||m.remove) return;
  if(E.burn){ const bm=mult*E.burn.k; if(!(m.burnT>0)||bm>=(m.burnMult||0)){ m.burnT=E.burn.dur; m.burnMult=bm; m.burnBy=p.id; m.burnEl=el; m.burnTick=1; } else m.burnT=Math.max(m.burnT,E.burn.dur); }
  if(E.slow) m.slowT=Math.max(m.slowT||0,E.slow);
  if(E.stun&&!m.T.heavy&&!m.boss) m.stunT=Math.max(m.stunT||0,E.stun);
  if(E.weak) rxStatusS(m,'weak',E.weak.v,E.weak.dur,p);
  if(E.vuln) rxStatusS(m,'vuln',E.vuln.v,E.vuln.dur,p);
}
// a direct hit of element el (after the damage): leave an aura, or react with the one that is there
function rxHitS(m,p,el,mult){
  if(!RX_ON||rxQuiet||!el||el==='basic'||m.dead||m.remove) return;
  const au=m.aura;
  if(!au||au.until<=S.t||au.el===el){ rxSetAuraS(m,el,p.id); return; }
  const r=rxChartOf(au.el,el); if(!r) return;
  const icd=m.rxIcd||(m.rxIcd={}); if(icd[r.key]>S.t) return;
  icd[r.key]=S.t+RX_ICD*Math.max(0.3,1-psP(p,'rxicd'));          // a passive's stat rxicd: reactions you trigger come back sooner
  const k=Math.min(1.5,r.k*(1+psP(p,'rxk'))), gone=au.el;        // a passive's stat rxk: they are stronger
  m.aura=null; ev('aura',m.id,0,0); ev('react',m.id,r.key);
  rxFlavorS(m,gone,p,k,mult); rxFlavorS(m,el,p,k,mult);
  if(RX_FLAVORS[gone].spread||RX_FLAVORS[el].spread) rxSpreadS(m,gone,p);
  if(r.burst&&!m.dead) rxQuietS(()=>damageMonsterS(m,mult*r.burst,p,m.x,m.z,0,el));
}
// direct application: a skill entry's flavor ('<element>': that element's flavour at full strength) and status ({kind,v,dur}: a general status by name)
function rxDirectS(m,s,p,mult){
  if(!RX_ON||m.dead||m.remove) return;
  if(s.flavor&&RX_FLAVORS[s.flavor]){ rxFlavorS(m,s.flavor,p,RX_DIRECT_K,mult); if(RX_FLAVORS[s.flavor].spread) rxSpreadS(m,s.flavor,p); }
  const t=s.status; if(!t||!RX_ST_KINDS.includes(t.kind)) return;
  if(t.kind==='vuln'||t.kind==='weak') rxStatusS(m,t.kind,+t.v||0,+t.dur||5,p);
  else if(t.kind==='slow') m.slowT=Math.max(m.slowT||0,+t.dur||2);
  else if(!m.T.heavy&&!m.boss) m.stunT=Math.max(m.stunT||0,+t.dur||1);
}
