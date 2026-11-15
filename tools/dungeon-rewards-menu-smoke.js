// Dungeon revamp D8b / D8c: the Delves rewards menu (src/game/dungeon/rewards-menu.js, #dgRewards in index.html, styles/41-delves.css). Headless client, no GL.
// What it checks: the panel builds for every dungeon at every tier from DG_TIERS / DG_REWARDS (never hard-coded numbers), the lock and tier-strip states from gear.dg.top and the gates,
// the piece count / eq split / rarity line / pool tiles / details card / Compare table, and that it opens from the inventory button, the Delve board's Rewards chip and the travel window's Dungeons tab.
const errs=[]; const realErr=console.error; console.error=(...a)=>{ errs.push(a.map(String).join(' ')); };
const {bootClient}=require('./headless');
const c=bootClient({expose:['NET','startSolo','beginPlay','canStart:()=>canStart','Stream','P','PL','GEAR','DG_THEMES','DG_TIERS','DG_TIER_MAX','DG_REWARDS','DG_REWARD_W','DGRM','dgrmOpen','dgrmRender','dgrmThemes','PANELS','uiOpen','closePanels','dgBoardOpen','dgBoardRender','DG_BOARD','netHandle','dgGateOpen','dgtTop','openTravel','renderTravel','VIL','trDungeons','dgBoardStart','DG_BOARD','TR_TABSET:v=>{ TR_TAB=v; }']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,cnd,i)=>{ console.log((cnd?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!cnd) fails++; };
const tx=e=>[e.textContent||'',...(e._kids||[]).map(tx)].join(' ').replace(/\s+/g,' ').trim();
const walk=(e,f)=>{ f(e); (e._kids||[]).forEach(k=>walk(k,f)); };
const find=(e,cls)=>{ const out=[]; walk(e,k=>{ if(typeof k.className==='string'&&k.className.split(' ').includes(cls)) out.push(k); }); return out; };
(async()=>{
  let G=c.G(); for(let i=0;i<400;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  const panel=()=>c.el('#dgRewards'), body=()=>c.el('#dgrBody'), top=n=>{ G.GEAR.dg=G.GEAR.dg||{}; G.GEAR.dg.top=n; };
  ok('the page boots with the panel wired (PANELS entry, markup, the inventory button)',G.PANELS.includes('dgRewards')&&!!panel()&&!!c.el('#invDelves')&&typeof G.dgrmOpen==='function');
  const themes=G.dgrmThemes(); ok('eight dungeons listed',themes.length===8,themes.join(','));
  // ---- every dungeon at every tier builds, from the data ----
  let built=0, bad=[];
  for(const th of themes) for(let t=0;t<=G.DG_TIER_MAX;t++){
    try{ G.dgrmOpen(th,t); const b=body(), n=G.DG_TIERS[t].n, txt=tx(b);
      const pieces=(n[0]===n[1]?n[0]:n[0]+'-'+n[1])+(n[1]===1?' piece':' pieces');
      const segs=find(b,'dgr-seg').length, want=G.DG_TIERS[t].eq.filter(Boolean).length, tiles=find(b,'dgr-tile').length;
      const rows=find(b,'dgr-cmp')[0]?(find(b,'dgr-cmp')[0]._kids||[]).length:0;
      const good=txt.includes(pieces)&&segs===want&&tiles===G.DG_REWARDS[th].pool.length&&find(b,'dgr-card').length===8&&find(b,'dgr-tier').length===11&&find(b,'dgr-rc').length===G.DG_REWARD_W.length&&rows===12&&G.DGRM.th===th&&G.DGRM.tier===t;
      if(good) built++; else bad.push(th+':'+t+' segs'+segs+'/'+want+' tiles'+tiles+' rows'+rows+' '+pieces);
    }catch(e){ bad.push(th+':'+t+' threw '+e.message); } }
  ok('the panel builds for all 8 dungeons x 11 tiers (pieces text, eq split segments, pool tiles, rarity chips, compare table)',built===88,bad.slice(0,3).join(' | '));
  // ---- tier strip states from gear.dg.top ----
  top(3); G.dgrmOpen('hollowroots'); { const st=find(body(),'dgr-tier'), cls=st.map(e=>e.className);
    ok('with 3 tiers cleared: I-III cleared, IV open (and picked), V-XI locked',cls.slice(0,3).every(x=>/\bdone\b/.test(x))&&/\bopen\b/.test(cls[3])&&cls.slice(4).every(x=>/\block\b/.test(x))&&G.DGRM.tier===3,cls.join('|')); }
  top(0); G.dgrmOpen('hollowroots'); ok('with none cleared tier I is the open one',/\bopen\b/.test(find(body(),'dgr-tier')[0].className)&&G.DGRM.tier===0);
  top(11); G.dgrmOpen('hollowroots'); ok('with all 11 cleared every tier is done and the picked one is XI',find(body(),'dgr-tier').every(e=>/\bdone\b/.test(e.className))&&G.DGRM.tier===10);
  // ---- a tier tap, the lock state of the doors, the pool details ----
  top(2); G.dgrmOpen('hollowroots'); find(body(),'dgr-tier')[7].click(); ok('a tap on a locked tier previews it with its "clear tier VII first" line',G.DGRM.tier===7&&/clear tier VII of any dungeon first/.test(tx(body())),tx(body()).slice(0,80));
  find(body(),'dgr-tile')[1].click(); { const info=find(body(),'dgr-info')[0]; ok('a tap on a pool tile shows the details card with the bonus at every equipment level the tier can roll',!!info&&find(info,'dgr-il').length===G.DG_TIERS[7].eq.filter(Boolean).length&&G.DGRM.pick!==null); }
  G.GEAR.east=0; G.GEAR.sun=0; { const cards=find(body(),'dgr-card'); const lockedOnes=themes.filter(th=>!G.dgGateOpen(G.GEAR,G.DG_THEMES[th])); const lockedCards=cards.filter(e=>/\blocked\b/.test(e.className)).length;
    G.dgrmRender(); const n2=find(body(),'dgr-card').filter(e=>/\blocked\b/.test(e.className)).length; ok('a dungeon whose land gate is shut shows locked (and says why when picked)',lockedOnes.length>=5&&n2===lockedOnes.length,n2+' vs '+lockedOnes.length);
    G.dgrmOpen('sandglass'); ok('the locked dungeon\'s card carries its land hint',/^Locked: /.test(tx(find(body(),'dgb-state')[0]))); void lockedCards; }
  // ---- three ways in ----
  G.closePanels(); c.el('#invDelves').click(); ok('the inventory header button opens it',!panel().hidden&&G.uiOpen());
  G.closePanels(); G.DG_BOARD.th='hollowroots'; G.DG_BOARD.want=Date.now(); G.dgBoardOpen('hollowroots'); G.netHandle({t:'dgboard',th:'hollowroots',name:'The Hollow Roots',door:'The Hollowed Elder',offer:['purge','defense'],pool:['purge','defense'],left:100,L:30,tier:2,top:2,gate:1,ok:1,why:'',lead:1}); await wait(50);
  { const r=find(c.el('#dgBody'),'dgb-rew')[0]; ok('the Delve board has a Rewards chip',!!r); if(r){ r.click(); ok('it opens the menu on that dungeon at the picked tier, the board closes',!panel().hidden&&c.el('#dgBoard').hidden&&G.DGRM.th==='hollowroots'&&G.DGRM.tier===2); } }
  // ---- D8c: the travel window's Dungeons tab ----
  const sent=[]; const send0=G.NET.send; G.NET.send=m=>{ sent.push(JSON.parse(JSON.stringify(m))); send0(m); };
  G.closePanels(); G.P.x=G.VIL.tele.x; G.P.z=G.VIL.tele.z; G.GEAR.east=2; G.GEAR.sun=0; G.TR_TABSET('d'); G.openTravel(); await wait(50);
  { const rows=find(c.el('#trBody'),'tr-dgrow'); ok('the Dungeons tab lists the eight dungeons with their lock state (a shut land gate: Locked, disabled)',rows.length===8&&find(c.el('#trBody'),'tr-dgopen').filter(b=>b.disabled).length===themes.filter(th=>!G.dgGateOpen(G.GEAR,G.DG_THEMES[th])).length&&/highest open tier/.test(tx(rows[0])),rows.length+' rows');
    sent.length=0; find(rows[0],'tr-dgopen')[0].click(); await wait(50);
    const o=sent.find(m=>m.t==='dg'&&m.a==='open'); ok('a tap on a dungeon opens its Delve board from the circle: dg{a:"open",dungeon,via:"circle"}, the board panel shows',!!o&&o.dungeon==='hollowroots'&&o.via==='circle'&&!c.el('#dgBoard').hidden&&G.DG_BOARD.via==='circle',JSON.stringify(o));
    G.netHandle({t:'dgboard',via:1,th:'hollowroots',name:'The Hollow Roots',door:'The Hollowed Elder',offer:['purge','defense'],pool:['purge','defense'],left:100,L:30,tier:0,top:0,gate:1,ok:1,why:'',lead:1}); await wait(50);
    ok('the board has Go to the door, and no door is needed to keep it open',find(c.el('#dgBody'),'dgb-goto').length===1&&!c.el('#dgBoard').hidden);
    sent.length=0; find(c.el('#dgBody'),'dgb-start')[0].click(); await wait(50); const st=sent.find(m=>m.t==='dg'&&m.a==='start');
    ok('Start from the circle carries via:"circle" with the dungeon, type and tier',!!st&&st.via==='circle'&&st.dungeon==='hollowroots'&&st.type==='purge'&&st.tier===0,JSON.stringify(st));
    G.closePanels(); G.TR_TABSET('d'); G.openTravel(); await wait(50); find(c.el('#trBody'),'tr-dgrew')[3].click(); ok('Rewards on a row opens the rewards menu on that dungeon (the third way in)',!panel().hidden&&G.DGRM.th===themes[3]);
    G.closePanels(); G.TR_TABSET('d'); G.openTravel(); await wait(50); G.netHandle({t:'dgboard',via:1,th:'hollowroots',name:'x',door:'y',offer:[],pool:[],left:100,L:30,tier:0,top:0,gate:1,ok:1,why:'',lead:1}); await wait(20);
    G.dgBoardOpen('hollowroots','circle'); G.netHandle({t:'dgboard',via:1,th:'hollowroots',name:'x',door:'y',offer:['purge'],pool:['purge'],left:100,L:30,tier:0,top:0,gate:1,ok:1,why:'',lead:1}); await wait(20);
    sent.length=0; find(c.el('#dgBody'),'dgb-goto')[0].click(); await wait(50); const d=sent.find(m=>m.t==='dg'&&m.a==='door'); ok('Go to the door sends dg{a:"door",dungeon,via:"circle"} and closes the panel',!!d&&d.dungeon==='hollowroots'&&c.el('#dgBoard').hidden,JSON.stringify(d)); }
  G.TR_TABSET('v');
  ok('the run threw nothing',!c.G().Stream.failed&&errs.length===0,errs.slice(0,2).join(' | '));
  c.stop(); console.error=realErr; console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
