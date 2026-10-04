//@ What the dungeon HUD says: text and bars for each mission's HUD numbers (the snapshot's dg tuple after phase, seconds and waiting) and the look of each objective kind (dgo events). Pure, shared by the client and the tests.
/* agent map
   exports: DG_PHASE_TEXT, DG_OBJ_KINDS, DG_HUD, DG_HUD_BOSS, dgHudText(mission, dg[, th]), dgObjName(kind[, th]), dgObjThe(kind, th, generic), dgHudClock(s)
   used by: game/dungeon/hud.js (the client draws what this says), the mission kits (each documents its numbers in its own file; the row of DG_HUD turns them into words)
   test: tools/dungeon-missions-smoke.js (every mission's HUD row exists and reads its own numbers)
   dg = the whole snapshot tuple [phase 0 objectives | 1 boss | 2 won | 3 lost, seconds since setup, members still to answer, ...the kit's numbers].
   dgHudText(mission, dg, th?) -> {title, lines: [text...], bar: {v, max, col, label?} | null, warn: bool}   (always something to show: a mission without a row shows its name;
     th, the dungeon's id, is optional: with it the objectives take the dungeon's own names, "the Heartwood Knot" for the ward stone)
   In the boss phase the title is DG_PHASE_TEXT[1] and DG_HUD_BOSS[mission] (if any) adds what still matters: Defense's stone, Escort's captive.
   DG_OBJ_KINDS[kind] = {name, col, r?, th?}: the kinds of dgo events [id, kind, x, z, st 0 removed | 1 active | 2 done, v] (an objective in the world: its marker colour and
     label; r: the circle to draw round it in metres, when it has one; th: the name each dungeon gives it, docs/DUNGEON-THEMES.md section 3); dgObjName(kind, th) picks.
   THE KIT NUMBERS (dg[3]...), one row each below; the kit's own file says how they are made:
     purge     [killed, needed]
     defense   [rotation 1-2, wave 1-3, stone health %, monsters left in the wave, seconds to the next wave (0 while one is on)]
     survival  [light seconds, marks reached 0-2]   (the marks are at 5:00 and 10:00 of dg[1])
     sabotage  [heartroots broken, how many (3), unshielded and still standing]
     siege     [altar 1-3, its fill %, 1 while someone stands in its circle]
     hunt      [sightings, bolts 0-3 (3 = winded), seconds left of the 10 minutes]
     escort    [state 0 caged | 1 following | 2 at the hall, captive health %, metres to the hall's circle]
   WHAT EACH OBJECTIVE'S v IS: stone, captive: health %; chest: its number (st 2 = opened); lantern: light seconds (every 5 s; st 2 = it holds, the 10:00 mark); flask: the seconds
   it gives; heartroot: wardens still standing (0 = unshielded; st 2 = broken); altar: fill % (every 5%; st 2 = full); ping: how many sightings (it moves: a dgo with new x, z);
   captive also moves (st 2 = in the hall). */
const DG_PHASE_TEXT=['Clear the dungeon','The boss has appeared!','Cleared!','Failed'];
const DG_OBJ_KINDS={
  stone:{name:'Ward stone',col:'#7fd0ff',r:2.5,th:{hollowroots:'the Heartwood Knot',jadesprings:'the jade basin',bonefrostbarrow:'the warding rune stone',blackseam:'the winch house'}},
  chest:{name:'Reward chest',col:'#ffcf4a',r:1.5},
  lantern:{name:'Lantern',col:'#ffd36b',r:2,th:{hollowroots:'the sap-lamp',jadesprings:'the stone lantern',bonefrostbarrow:'the grave lamp',blackseam:'a miner\'s lamp'}},
  flask:{name:'Oil flask',col:'#ffa94d',r:1.2,th:{hollowroots:'a flask of sap',jadesprings:'a flask of lamp oil',bonefrostbarrow:'a flask of tallow',blackseam:'a flask of lamp oil'}},
  heartroot:{name:'Heartroot',col:'#9be06a',r:2,th:{hollowroots:'a heartroot',jadesprings:'a spring gate',bonefrostbarrow:'a burial cairn',blackseam:'a timber prop'}},
  altar:{name:'Altar',col:'#d59cff',r:5,th:{hollowroots:'a seed shrine',jadesprings:'an offering stone',bonefrostbarrow:'a rune pillar',blackseam:'the winding gear'}},
  ping:{name:'Quarry sighted',col:'#ff6b6b',r:24,th:{hollowroots:'the runaway Shroomling',jadesprings:'the Karasu Tengu',bonefrostbarrow:'the Barrow Wight',blackseam:'the Mountain Goblin'}},
  captive:{name:'Captive',col:'#8ef0a8',r:1.5,th:{hollowroots:'the hunter in the root cocoon',jadesprings:'the bath-house keeper',bonefrostbarrow:'the snared grave-warden',blackseam:'the trapped surveyor'}}
};
const dgObjName=(kind,th)=>{ const K=DG_OBJ_KINDS[kind]; return K?(th&&K.th&&K.th[th])||K.name:String(kind); };
const dgObjThe=(kind,th,generic)=>{ const K=DG_OBJ_KINDS[kind]; return (th&&K&&K.th&&K.th[th])||generic; };   // in a sentence: the dungeon's own name, or the generic words
const dgHudClock=s=>{ s=Math.max(0,Math.round(s)|0); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const DG_HUD={
  purge:dg=>({title:'Purge',lines:['Monsters slain: '+(dg[3]|0)+' / '+(dg[4]|0)],bar:{v:dg[3]|0,max:Math.max(1,dg[4]|0),col:'#e5684d'},warn:false}),
  defense:(dg,th)=>({title:'Hold '+dgObjThe('stone',th,'the ward stone'),
    lines:['Rotation '+(dg[3]|0)+' of 2, wave '+(dg[4]|0)+' of 3',(dg[7]|0)>0?'Next wave in '+(dg[7]|0)+' s':'Monsters left: '+(dg[6]|0)],
    bar:{v:dg[5]|0,max:100,col:'#7fd0ff',label:'Stone '+(dg[5]|0)+'%'},warn:(dg[5]|0)<30}),
  survival:(dg,th)=>{ const light=dg[3]|0, marks=dg[4]|0, next=(marks+1)*300-(dg[1]|0);
    return {title:'The Long Night',lines:[light>0?'Light: '+dgHudClock(light):'The dark bites! Kill to relight '+dgObjThe('lantern',th,'the lantern')+'.',marks<2?'Mark '+(marks+1)+' ('+dgHudClock((marks+1)*300)+') in '+dgHudClock(next):'Dawn: the lantern holds'],
      bar:{v:Math.min(light,120),max:120,col:light>0?'#ffd36b':'#7a5a9a',label:'Light'},warn:light<=20}; },
  sabotage:(dg,th)=>{ const done=dg[3]|0, n=Math.max(1,dg[4]|0), open=dg[5]|0;
    return {title:'Sabotage',lines:['Broken: '+done+' of '+n,open?open+' unshielded: use it for 2 s to break it':'Kill a pack of wardens to drop a shield'],
      bar:{v:done,max:n,col:'#9be06a',label:'Broken'},warn:false}; },
  siege:(dg,th)=>{ const fill=dg[4]|0, inside=(dg[5]|0)===1;
    return {title:'Siege',lines:['Altar '+(dg[3]|0)+' of 3',inside?'Channelling: hold the circle':'Stand in the circle to fill it'],
      bar:{v:fill,max:100,col:'#d59cff',label:fill+'%'},warn:!inside&&fill>0}; },
  hunt:(dg,th)=>{ const bolts=dg[4]|0, left=dg[5]|0;
    return {title:'Hunt',lines:['Time left: '+dgHudClock(left),bolts>=3?'Winded: finish '+dgObjThe('ping',th,'the quarry')+'!':'Bolts: '+bolts+' of 3','Sightings: '+(dg[3]|0)],
      bar:{v:left,max:600,col:'#ff6b6b',label:'Time'},warn:left<=60}; },
  escort:(dg,th)=>{ const st=dg[3]|0, hp=dg[4]|0, name=dgObjThe('captive',th,'the captive');
    return {title:'Escort',lines:[st===0?'Free '+name+' (use, 5 s)':st===1?'Lead them to the round hall: '+(dg[5]|0)+' m':'In the round hall: keep them alive'],
      bar:{v:hp,max:100,col:'#8ef0a8',label:'Captive '+hp+'%'},warn:st>0&&hp<30}; }
};
// what still matters once the boss is up (the title is DG_PHASE_TEXT[1])
const DG_HUD_BOSS={
  defense:dg=>({lines:['The stone still stands: '+(dg[5]|0)+'%'],bar:{v:dg[5]|0,max:100,col:'#7fd0ff',label:'Stone '+(dg[5]|0)+'%'},warn:(dg[5]|0)<30}),
  escort:dg=>({lines:['Keep the captive alive: '+(dg[4]|0)+'%'],bar:{v:dg[4]|0,max:100,col:'#8ef0a8',label:'Captive '+(dg[4]|0)+'%'},warn:(dg[4]|0)<30})
};
function dgHudText(mission,dg,th){
  const d=Array.isArray(dg)?dg:[], ph=d[0]|0, row=DG_HUD[mission];
  if(ph===1){ const k=DG_HUD_BOSS[mission], b=k?k(d):null; return {title:DG_PHASE_TEXT[1],lines:b?b.lines:[],bar:b?b.bar:null,warn:!!(b&&b.warn)}; }
  if(ph>=2) return {title:DG_PHASE_TEXT[Math.min(3,ph)],lines:[],bar:null,warn:ph===3};
  if(d[2]>0) return {title:'Getting ready',lines:['Waiting for '+d[2]+' to answer'],bar:null,warn:false};
  return row?row(d,th):{title:String(mission),lines:[],bar:null,warn:false};
}
