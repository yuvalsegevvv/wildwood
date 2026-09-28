// Headless client test: runs dist/wildwood.html in Node with a stub DOM/WebGL (tools/headless.js) and plays solo through the real
// client code. Build first (python3 build.py). Needs the three package (npm install). Prints PASS/FAIL lines.
// Usage: node tools/client-smoke.js
const {bootClient}=require('./headless');
const c=bootClient({expose:['NET','startSolo','beginPlay','MONS','P','PL','CB','GEAR','MAP','CHAT','WX','doAttack','equip','updateMonsters','updateCombat','updateWeather','openSkills','openSoul','PASSIVE_IDS','attackVisuals','applyEvent','SKILLS','ANIM_OF','BOSS_SKILLS','AREA_FX','BOLTS','ACT_SKILL','renderInv','sendChat','openChat','chatText','getH','canStart:()=>canStart']});
const wait=ms=>new Promise(r=>setTimeout(r,ms)); let fails=0; const ok=(n,c,i)=>{ console.log((c?'PASS ':'FAIL ')+n+(i?'  ('+i+')':'')); if(!c) fails++; };
const el=s=>document.querySelector(s);
(async()=>{
  let G=c.G(); for(let i=0;i<300;i++){ await wait(100); G=c.G(); if(G.canStart()) break; }
  ok('world streams in',G.canStart());
  G.NET.onReady=()=>G.beginPlay(); G.startSolo(); await wait(1500); G=c.G();
  ok('solo server: welcome and monster views',G.NET.ready&&G.MONS.length>400,G.MONS.length+' views');
  const s=G.MONS.find(m=>m.def.id==='slime'); G.P.x=s.x+1.5; G.P.z=s.z; G.P.y=G.getH(G.P.x,G.P.z);
  for(let i=0;i<120&&!s.dead;i++){ G.CB.target=s; G.P.yaw=Math.atan2(-(s.x-G.P.x),-(s.z-G.P.z)); G.doAttack('basic'); G.updateMonsters(0.033); G.updateCombat(0.033); await wait(33); }
  G=c.G(); ok('attack through the server kills a slime',s.dead,'xp '+G.PL.exp.toFixed(1));
  G.equip('bow1'); await wait(300); ok('equip round-trip',c.G().GEAR.eq.weapon==='bow1');
  el('#inv').hidden=false; G.renderInv(); ok('inventory renders body slots',(el('#invBody').innerHTML.match(/class="eqslot"/g)||[]).length===5);
  G.openSkills(); ok('skills panel renders 3 slots',(el('#skBody').innerHTML.match(/class="sk-slot/g)||[]).length===3);
  { const h=()=>el('#skBody').innerHTML; ok('skills panel: a tab for 1, 2, 3 and Passive, and three passive slots',(h().match(/data-skkind=/g)||[]).length===4&&(h().match(/class="sk-pslot/g)||[]).length===3);
    ok('an unowned boss skill shows as Boss in the grid and cannot be bought',/data-id="spore"[^>]*>(?:(?!<\/button>)[\s\S])*<span class="lv">Boss<\/span>/.test(h())&&!/data-buyskill="spore"/.test(h()),G.GEAR.eq.weapon);
    G.NET.send({t:'dev',cmd:'level',v:20}); G.NET.send({t:'dev',cmd:'skills'}); G.NET.send({t:'dev',cmd:'mats'}); await wait(600); G=c.G();
    G.openSkills(null,'pass'); ok('passives tab lists every passive, Vitality is in a slot',(h().match(/data-from="grid"/g)||[]).length===G.PASSIVE_IDS.length&&(h().match(/class="sk-pslot on/g)||[]).length===1,G.GEAR.skills.pass.join());
    G.openSkills(null,'skill'); ok('a skill tile shows its level and element',/class="sk-tile[^"]*has-el[^"]*"[^>]*data-id="volley"[^>]*data-from="grid"/.test(h()),G.GEAR.eq.weapon);
    G.openSoul(); ok('soul shrine lists the seven elements',(el('#soBody').innerHTML.match(/data-soul=/g)||[]).length===7&&!/disabled/.test(el('#soBody').innerHTML));
    el('#inv').hidden=false; G.renderInv(); ok('inventory lists monster drops',(el('#invBody').innerHTML.match(/class="mat"/g)||[]).length>=30&&G.GEAR.mats.slime>=20);
    // every boss skill drawn through the real client code (swing, projectile, zone, beam, chain, buff)
    { const ids=Object.values(G.BOSS_SKILLS).flat(), me=G.NET.pid, base=()=>G.CB.fx.length+G.CB.projs.length+G.AREA_FX.size+G.BOLTS.length; let bad=[]; G.P.x=G.MONS[0].x; G.P.z=G.MONS[0].z;
      for(let i=0;i<ids.length;i++){
        const id=ids[i], s=G.SKILLS[id], f=s.fx, k=s.act[0], b0=base(), x0=G.P.x+2, y0=G.P.y+1.4, z0=G.P.z, evs=[];
        G.attackVisuals({kind:G.ANIM_OF[k]||k,sk:k},null);
        if(f.proj) evs.push(['proj',900+i,f.proj.kind,x0,y0,z0,-20,0,0,null],['pend',900+i,x0-6,y0,z0,null]);
        if(f.zone||(f.proj&&f.proj.zone)) evs.push(['area',500+i,'zone',x0,z0,5,3,me,s.el,(f.zone&&f.zone.once?1:0)|(f.zone&&f.zone.follow?2:0)]);
        if(f.beam) evs.push(['beam',x0,y0,z0,x0-20,y0,z0,s.el,1.4]);
        if(f.chain) evs.push(['chain',[[x0,y0,z0],[x0-3,y0,z0],[x0-6,y0,z0+2]],s.el]);
        if(f.buff) evs.push(['buff',me,id,s.buff.dur]);
        for(const e of evs) G.applyEvent(e);
        let peak=base(); for(let j=0;j<8;j++){ G.updateCombat(0.033); peak=Math.max(peak,base()); }   // (a swing's arc only lives 0.18 s)
        const made=peak>b0||!!(f.buff&&G.CB.buff&&G.CB.buff.id===id);
        for(const e of evs.filter(e=>e[0]==='area')) G.applyEvent(['aend',e[1]]);
        for(let j=0;j<40;j++) G.updateCombat(0.033);
        if(!made) bad.push(id);
      }
      ok('all 18 boss skills draw without errors (rings, arcs, projectiles, zones, beams, chains, auras)',!bad.length&&G.AREA_FX.size===0,bad.length?'nothing drawn for '+bad.join(', '):ids.length+' skills'); }
  }
  G.openChat(); G.chatText.value='hi'; G.sendChat(); await wait(300); ok('chat line arrives',c.G().CHAT.lines.length>0);
  for(let i=0;i<150&&!c.G().MAP.done;i++) await wait(100); ok('world map painted',c.G().MAP.done);
  G.NET.send({t:'dev',cmd:'weather',v:'rain'}); await wait(300); for(let i=0;i<60;i++){ G.WX.t+=0.5; G.updateWeather(0.5); } ok('rain fades in',G.WX.inten>0.9);
  c.stop(); console.log(fails?fails+' check(s) failed':'all checks passed'); process.exit(fails?1:0);
})();
