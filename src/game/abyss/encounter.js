//@ The Abyss's Event and Shrine cards (B8): the pick screen shows an encounter (its text and 2-3 choices) or a shrine (heal, lift a curse, copy an artifact); a choice is abyss{a:'pick',i}, the server answers with a toast and the next tiles
/* agent map (docs/ABYSS.md section 3g; the server side: server/abyss/events.js)
   exports: abEncShow(kind,data,extra) ('event': data = the event id, extra = [ok per choice]; 'shrine': data = [[t,id],...]), abEncAgain() (the bar's Next brings the screen back after Later), abKindChip(kind,mode,boss) (colour, name and a line for a tile card), AB_ENC
   markup: the #abPick screen of choice.js (cards in #abPickCards, the button below is "Later"); styles 42-abyss.css (.ab-enc-text, .ab-k-*). Test: tools/client-smoke.js (the Abyss artifacts case: event and shrine cards render and send pick)
   A choice the server cannot take (a curse past the cap, a loss of what you do not hold, a full bar) is greyed out here from the flags the server sent; the server checks again on the pick. */
const AB_ENC={last:null};
function abKindChip(kind,mode,boss){
  const K=AB_KIND_INFO[kind]||AB_KIND_INFO.fight, BR=kind==='boss'&&abBossRowOf(boss), M=kind==='trial'&&mode&&RIFT_MODES[mode]?RIFT_MODES[mode]:null, pk=AB_KIND_PICKS[kind]|0;
  const line=BR?BR.short+' waits on a disc of the land, level of the round.':kind==='elite'?'Fewer monsters, tougher: elites and champions.':M?M.name+': '+M.how:kind==='event'?'No fight: an encounter with choices.':kind==='shrine'?'No fight: heal, lift a curse or copy an artifact.':'Three waves of the tile\'s monsters.';
  return {col:K.col,icon:K.icon,name:K.name+(M?' · '+M.name:'')+(BR?' · '+BR.short:''),line,pays:pk?'Pays '+pk+(pk>1?' artifact picks':' artifact pick'):'Pays what the card offers'};
}
function abEncCard(box,title,text,note,on,btn){
  const c=abMk('div','ab-card'); c.append(abMk('b','ab-nm',title),abMk('p','ab-tx',text)); if(note) c.append(abMk('p','ab-minus',note));
  const b=abMk('button','chip buy ab-pick',btn||'Choose'); b.type='button'; b.disabled=!on; if(on) b.onclick=()=>{ UI_SFX.click(); on(); }; c.append(b); box.append(c);
}
function abEncShow(kind,data,extra){
  const el=$('#abPick'), box=$('#abPickCards'); if(!el||!box) return;
  AB_ENC.last=[kind,data,extra]; AB_PK.offer=null; AB_PK.tiles=null; AB_PK.enc=true; box.innerHTML=''; $('#abPickN').textContent=''; $('#abSkip').textContent='Later';
  if(kind==='event'){
    const E=abIsEvent(data)?AB_EVENTS[data]:null; if(!E){ abPickHide(); return; }
    $('#abPickT').textContent=E.icon+' '+E.name; box.append(abMk('p','ab-tx ab-enc-text',E.text));
    E.choices.forEach((ch,i)=>{ const ok=!Array.isArray(extra)||extra[i]!==false; abEncCard(box,ch.label,ch.text,ok?'':'You cannot take this now.',ok?()=>netSend({t:'abyss',a:'pick',i}):null); });
  } else if(kind==='shrine'){
    $('#abPickT').textContent='✚ A Shrine'; box.append(abMk('p','ab-tx ab-enc-text','A quiet shrine in the void. It will do one thing for you.'));
    (data||[]).forEach((c,i)=>{ const t=c&&c[0], id=c&&c[1];
      if(t==='heal') abEncCard(box,'Heal to full','Your health is restored.','',()=>netSend({t:'abyss',a:'pick',i}));
      else if(t==='curse'&&abIsCurse(id)) abEncCard(box,'Lift '+AB_CURSES[id].name,AB_CURSES[id].text,'',()=>netSend({t:'abyss',a:'pick',i}));
      else if(t==='copy'&&abIsArt(id)){ const full=abBarArts().length>=AB_ART_MAX; abEncCard(box,'Copy '+AB_ARTS[id].name,AB_ARTS[id].text,full?'Your bar is full: throw one away first.':'',full?null:()=>netSend({t:'abyss',a:'pick',i})); } });
  } else { abPickHide(); return; }
  el.hidden=false;
}
function abEncAgain(){ const l=AB_ENC.last; if(l) abEncShow(l[0],l[1],l[2]); }
