//@ Headless test of the dungeon rewards in the client UI: the ring slot, ring and +n tiles, the item details (the ring's additive attack), the stone count, the forge's Temper tab, the events
// Usage: python3 build.py && node tools/rewards-client-smoke.js   (runs dist/wildwood.html in Node with a stub DOM, solo mode, ~20 s)
// What it covers: game/economy/dungeon-gear.js and the marked hooks in inventory.js, forge.js, shops.js, ui/item-icons.js, combat/weapons.js, index.html. Server side: tools/rewards-smoke.js.
const {bootClient}=require('./headless');
const c=bootClient({expose:['NET','startSolo','beginPlay','canStart:()=>canStart','GEAR','PL','ITEM','INV','BODY_SLOTS','SLOT_LABEL','renderInv','renderInvInfo','openForge','renderForge','itemIcon','slotIcon','tile','equip','soulNow','EVH','applyEvent','dgTemperHtml','dgTemperBind','dgInfoHtml','dgStoneChipHtml','bagCounts','setForgeTab:t=>{ forgeTab=t; }','setShopTab:t=>{ shopTab=t; }','openShop','renderShop','attachWeapons','weaponsOn','hiker','effectiveLook','popTexts:()=>typeof POPS==="undefined"?null:POPS']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const el=s=>document.querySelector(s);
(async()=>{
  let G=c.G(); for(let i=0;i<300;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  ok('the page boots into a solo world',G.NET.ready);
  G.NET.send({t:'dev',cmd:'level',v:30}); G.NET.send({t:'rwdev',cmd:'dgall'}); G.NET.send({t:'rwdev',cmd:'stones'}); await wait(800); G=c.G();
  ok('the server\'s level-30 pieces and stones reach the client (gear.temper, 14 new pieces)',G.GEAR.temper===20&&G.GEAR.inv.includes('ring-fire')&&G.GEAR.inv.includes('sword7')&&G.GEAR.eq.ring===null,'stones '+G.GEAR.temper);
  // ---- the paper doll ----
  el('#inv').hidden=false; G.renderInv(); let h=el('#invBody').innerHTML;
  ok('the paper doll has a ring slot beside the body slots (10 in all: the pendant has its own) with an empty-slot ring icon',(h.match(/class="eqslot"/g)||[]).length===10&&/data-slot="ring"/.test(h)&&G.BODY_SLOTS.some(s=>s[0]==='ring')&&G.SLOT_LABEL.ring==='Ring'&&/class="ico ghost"/.test(h.split('data-slot="ring"')[1].slice(0,400)));
  ok('every one of the 665 level-30 ids draws an icon (weapons and armour reuse the top tier\'s art with a sparkle, rings a gem in their element\'s colour, pendants a chain and a gem)',Object.keys(G.ITEM).filter(id=>G.ITEM[id].dg).length===665&&Object.keys(G.ITEM).filter(id=>G.ITEM[id].dg).every(id=>/<svg/.test(G.itemIcon(G.ITEM[id])))
    &&G.itemIcon(G.ITEM['ring-fire'])!==G.itemIcon(G.ITEM['ring-water'])&&G.itemIcon(G.ITEM['ring-fire']).includes('#ff7a45')&&G.itemIcon(G.ITEM.sword7).includes('#9ff0c8')&&!G.itemIcon(G.ITEM.sword6).includes('#9ff0c8'));
  G.equip('wand7'); await wait(400); G=c.G();
  ok('a level-30 weapon is held in the hand (the model of the top tier is borrowed: nothing throws, the class follows)',G.GEAR.eq.weapon==='wand7'&&(()=>{ G.attachWeapons(); return G.hiker.wpn.length>0; })());
  { const bad=[]; for(const id of ['sword7','bow7','wand7','sword7-l+10']){ const res=G.weaponsOn(G.hiker.rig,id,1); let n=0;
      for(const o of res.objs) o.traverse(q=>{ if(q.isMesh){ n++; const a=q.geometry.attributes.position.array; for(let i=0;i<a.length;i++) if(!isFinite(a[i])){ bad.push(id); break; } } });
      if(!n) bad.push(id+' empty'); res.objs.forEach(o=>{ if(o.parent) o.parent.remove(o); }); }
    ok('the sword, bow and wand of level 30 are built from the top tier\'s models: real geometry, no NaN from a missing tier',!bad.length,bad.join()); }
  // ---- the ring ----
  G.equip('ring-fire'); await wait(500); G=c.G(); G.renderInv(); h=el('#invBody').innerHTML;
  ok('a worn ring is a tile in the ring slot, with its level and the rarity colour',G.GEAR.eq.ring==='ring-fire'&&/class="eqslot" data-slot="ring"[^>]*>(?:(?!<\/div>)[\s\S])*class="tile r0 dg[^"]*" data-id="ring-fire" data-from="ring"/.test(h),G.GEAR.eq.ring);
  G.INV.sel={id:'ring-fire',from:'ring'}; G.renderInvInfo(); h=el('#invInfo').innerHTML;
  { const w=G.ITEM[G.GEAR.eq.weapon], want=Math.round(w.atk*0.05);   // (125 x 5% = 6)
    ok('the ring\'s details: its share of the weapon\'s attack and how much attack it adds now, for any soul (additive: no soul match)',/Ring/.test(h)&&/\+5% of your weapon's attack/.test(h)&&/any soul/.test(h)&&!/no effect|Matches/.test(h)&&new RegExp('Adds \\+'+want+' attack with your weapon').test(h)&&/Tempered \+0 of 2/.test(h),h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,260));
    const soul=G.GEAR.soul; G.GEAR.soul='water'; G.renderInvInfo(); const t=el('#invInfo').innerHTML.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
    ok('and the same with another soul (a Water soul does not change a fire ring: "+N attack")',new RegExp('Adds \\+'+want+' attack with your weapon').test(t)&&!/no effect|Matches/.test(t),t.slice(0,200));
    G.GEAR.soul=soul; }
  G.INV.sel={id:'ring-water',from:'bag'}; G.renderInvInfo(); h=el('#invInfo').innerHTML.replace(/<[^>]*>/g,' ');
  ok('a ring in the bag shows what swapping would change (a fire ring is worn, a water one of the same rarity adds the same: no difference)',/Same as what you wear/.test(h)&&!/no effect/.test(h),h.replace(/\s+/g,' ').slice(0,200));
  // ---- tiles: +n badge, jade accent ----
  G.NET.send({t:'temper',id:'sword7'}); G.NET.send({t:'temper',id:'helmet7'}); await wait(500); G=c.G(); G.renderInv(); h=el('#invBody').innerHTML;
  ok('tempering shows: the pieces are +1 now, their tiles have a "+1" badge and the dungeon accent, the stones are spent (20 -> 18)',G.GEAR.inv.includes('sword7+1')&&G.GEAR.inv.includes('helmet7+1')&&G.GEAR.temper===18&&/class="tile r0 dg[^"]*" data-id="sword7\+1" data-from="bag"[^>]*>(?:(?!<\/button>)[\s\S])*<span class="enh">\+1<\/span>/.test(h)&&/class="tile r0 dg[^"]*" data-id="bow7"/.test(h)&&!/enh/.test(h.split('data-id="bow7"')[1].split('</button>')[0]));
  G.INV.sel={id:'sword7+1',from:'bag'}; G.renderInvInfo(); h=el('#invInfo').innerHTML.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  ok('a tempered weapon\'s details name it "+1", say how far it can go and what the next step costs and gives',/Elderwood Blade \+1/.test(h)&&/Tempered \+1 of 2/.test(h)&&/next: \+150 attack \(\+12\) for 2 Tempering Stones \(you have 18\)/.test(h),h.slice(0,300));
  ok('the stone count is among the materials',/<span class="mat"[^>]*><i[^>]*><\/i>Tempering Stone <b>18<\/b>/.test(el('#invBody').innerHTML));
  // ---- the forge ----
  G.openForge({def:{name:'Greta'}}); h=el('#forgeBody').innerHTML;
  ok('the forge opens on the Merge tab, and a tempered piece is not offered there',!/data-temper=/.test(h)&&!/data-merge="sword7\+1"/.test(h));
  G.setForgeTab('temper'); G.renderForge(); h=el('#forgeBody').innerHTML; const t=h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
  ok('the Temper tab lists your level-30 pieces (14 + the enhanced ones) with +n -> +n+1, the stat change and the stone cost, and your stones',/Tempering Stones\s*18/.test(t)&&(h.match(/class="fg-row/g)||[]).length>=14&&/Elderwood Blade[^]*?\+2/.test(t)&&/data-temper="sword7\+1"/.test(h)&&/Temper: 2 stones/.test(t)&&/Temper: 1 stone/.test(t),(h.match(/class="fg-row/g)||[]).length+' rows');
  { const have=G.GEAR.temper; G.GEAR.temper=1; G.renderForge(); const h1=el('#forgeBody').innerHTML, t1=h1.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
    ok('with too few stones the +1 -> +2 step is disabled and says how many it needs (2); the +0 -> +1 steps are still open',/<button class="chip forge" data-temper="sword7\+1" data-worn="0" disabled>Need 2 stones/.test(h1)&&/<button class="chip forge" data-temper="bow7" data-worn="0" >Temper: 1 stone/.test(h1),t1.slice(0,120));
    G.GEAR.temper=have; G.renderForge(); }
  { const btn={dataset:{temper:'sword7+1',worn:'0'},disabled:false,textContent:'x'}; G.dgTemperBind({querySelectorAll:()=>[btn]}); btn.onclick(); await wait(500); G=c.G();
    ok('the Temper button sends temper{id}: the server raises the piece (+1 -> +2), spends 2 stones, and the panel redraws from the new gear',G.GEAR.inv.includes('sword7+2')&&!G.GEAR.inv.includes('sword7+1')&&G.GEAR.temper===16&&btn.disabled&&/Tempering/.test(btn.textContent));
    G.renderForge(); h=el('#forgeBody').innerHTML; const t2=h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
    ok('a piece at its limit shows "Fully tempered" instead of a button, and the stone count is 16',/data-temper="sword7\+2"/.test(h)===false&&/Fully tempered/.test(t2)&&/Tempering Stones\s*16/.test(t2)); }
  { G.NET.send({t:'rwdev',cmd:'dgthree'}); await wait(500); G=c.G(); G.setForgeTab('merge'); G.renderForge(); h=el('#forgeBody').innerHTML;
    const three=G.GEAR.inv.slice(-3)[0], q=three.replace(/[+]/g,'\\+');
    ok('"3 of a level-30 piece" shows in the Merge tab with a ready Merge 3 button',new RegExp('data-merge="'+q+'"').test(h)&&/Merge 3/.test(h),three);
    const had1=G.GEAR.inv.filter(i=>i===three+'+1').length;   // (the sword and the helmet were tempered above: the random piece may be one of them)
    G.NET.send({t:'temper',id:three}); G.NET.send({t:'temper',id:three}); await wait(500); G=c.G(); G.renderForge(); h=el('#forgeBody').innerHTML;
    ok('once two of them are tempered (+1 x2, one +0 left) the Merge tab does not list the tempered pair and says why',G.GEAR.inv.filter(i=>i===three+'+1').length===had1+2&&!new RegExp('data-merge="'+q+'\\+1"').test(h)&&/Tempered pieces \(\+1 and up\) cannot be merged/.test(h),three); }
  // ---- events ----
  { let threw=null; try{ G.applyEvent(['stone',G.NET.pid,1,null]); G.applyEvent(['stone','someone else',1,null]); G.applyEvent(['temper',G.NET.pid,'sword7+1','sword7']); G.applyEvent(['temper','someone else','sword7+1','sword7']); }catch(e){ threw=e; }
    ok('the stone and temper events are handled (yours and other players\') without errors',!threw,threw&&threw.message); }
  // ---- the armourer buys rings ----
  { G.openShop({def:{role:'armorsmith',name:'Ilse'}}); G.setShopTab('sell'); G.renderShop(); const sh=el('#shopBody').innerHTML;
    ok('the armourer\'s Sell tab takes rings as well as armour, and not weapons',/data-sell="ring-water"/.test(sh)&&/data-sell="helmet7\+1"/.test(sh)&&!/data-sell="bow7"/.test(sh)); }
  // ---- looks and the character ----
  { G.NET.send({t:'equip',id:'top7'}); await wait(400); G=c.G(); const L=G.effectiveLook();
    ok('a level-30 piece changes the character\'s look like the top tier\'s armour (no undefined look, nothing thrown)',G.GEAR.eq.top==='top7'&&L.top==='plate'&&L.topColor===0x2a2830); }
  c.stop(); console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})().catch(e=>{ console.log('FAIL exception',e&&e.stack||e); process.exit(1); });
