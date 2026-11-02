//@ Player shops on the client: the Shops panel (a button in the inventory's header) with three tabs, Browse (open stalls, buy), My shop (list equipment from the bag with a price, open / close) 
/* agent map
   exports: pshState ({tab, mine:{open,items}, shops:[[name,level,count]], view:{name,items}|null}), pshOpen(tab), pshRender()
   events: EVH.pshm (my stall), EVH.pshl (open stalls), EVH.pshv (one stall's items), each only when e[1] is your pid
   messages out: pshop{a:'mine'|'add'|'unlist'|'open'|'close'|'browse'|'view'|'buy'} (server/pshop.js)
   markup: #pshop (a panel, in PANELS), #invShops in index.html   test: tools/pshop-smoke.js (server side), client-smoke */
const pshState={tab:'browse',mine:{open:0,items:[]},shops:[],view:null};
const pshKinds=['weapon','armor','ring','pendant','talisman'];
EVH.pshm=e=>{ if(e[1]!==NET.pid) return; pshState.mine={open:e[2]?1:0,items:Array.isArray(e[3])?e[3]:[]}; if(!$('#pshop').hidden) pshRender(); };
EVH.pshl=e=>{ if(e[1]!==NET.pid) return; pshState.shops=Array.isArray(e[2])?e[2]:[]; if(!$('#pshop').hidden) pshRender(); };
EVH.pshv=e=>{ if(e[1]!==NET.pid) return; pshState.view=e[3]?{name:String(e[2]),items:e[3]}:null; if(!e[3]) netSend({t:'pshop',a:'browse'}); if(!$('#pshop').hidden) pshRender(); };
const pshEl=(tag,cls,text)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(text!==undefined) e.textContent=text; return e; };
function pshItemRow(id,price,btnText,onClick){
  const it=ITEM[id], row=pshEl('div','fr-row'), ico=pshEl('span','ii-ico r'+it.rar); ico.innerHTML=itemIcon(it);
  const nm=pshEl('b','',it.name); nm.style.color=RAR_COL[it.rar];
  row.append(ico,nm,pshEl('span','fr-lv','Lv '+it.lv+(price?' · '+price+' coins':'')));
  const b=pshEl('button','chip buy',btnText); b.type='button'; b.addEventListener('click',()=>{ onClick(); UI_SFX.click(); }); row.append(b); return row;
}
function pshRender(){
  const body=$('#pshBody'), T=pshState.tab;
  for(const [k,id] of [['browse','pshTabB'],['mine','pshTabM']]) $('#'+id).className='chip'+(T===k?' buy':'');
  body.innerHTML='';
  if(T==='browse'){
    const v=pshState.view;
    if(v){
      const back=pshEl('button','chip','Back'); back.type='button'; back.addEventListener('click',()=>{ pshState.view=null; pshRender(); }); body.append(back,pshEl('p','fr-note',v.name+"'s shop"));
      for(let i=0;i<v.items.length;i++){ const [id,price]=v.items[i]; if(ITEM[id]) body.append(pshItemRow(id,price,'Buy',()=>netSend({t:'pshop',a:'buy',name:v.name,i,id,price}))); }
      return;
    }
    body.append(pshEl('p','fr-note','Open shops of other hikers. Only equipment is sold here; pay in coins. Shops are open while their owner is online.'));
    for(const r of pshState.shops){ const row=pshEl('div','fr-row'), b=pshEl('button','chip','Look'); b.type='button'; b.addEventListener('click',()=>{ netSend({t:'pshop',a:'view',name:String(r[0])}); UI_SFX.click(); });
      row.append(pshEl('b','',String(r[0])),pshEl('span','fr-lv','Lv '+r[1]+' · '+r[2]+' items'),b); body.append(row); }
    if(!pshState.shops.length) body.append(pshEl('p','fr-note','No shop is open right now.'));
    return;
  }
  const m=pshState.mine, tog=pshEl('button','chip buy',m.open?'Close my shop':'Open my shop'); tog.type='button';
  tog.addEventListener('click',()=>{ netSend({t:'pshop',a:m.open?'close':'open'}); UI_SFX.click(); });
  body.append(pshEl('p','fr-note','Your shop is '+(m.open?'open':'closed')+'. Listed items leave your bag until sold or taken back. Level 11 and a registered account are needed.'),tog,pshEl('p','fr-note','Listed ('+m.items.length+')'));
  m.items.forEach(([id,price],i)=>{ if(ITEM[id]) body.append(pshItemRow(id,price,'Take back',()=>netSend({t:'pshop',a:'unlist',i}))); });
  body.append(pshEl('p','fr-note','From your bag (spare copies only; take a worn piece off first)'));
  const seen=new Set(), worn=Object.values(GEAR.eq||{});
  for(const id of GEAR.inv){ const it=ITEM[id]; if(seen.has(id)||!it||!pshKinds.includes(it.kind)) continue; seen.add(id);
    if(GEAR.inv.filter(x=>x===id).length-worn.filter(x=>x===id).length<1) continue;
    const row=pshItemRow(id,0,'List',()=>{ const v=prompt('Price in coins for '+it.name+' (1 - 1000000000)'); const price=Math.floor(+v); if(price>=1) netSend({t:'pshop',a:'add',id,price}); }); body.append(row); }
}
function pshOpen(tab){ if(tab) pshState.tab=tab; openPanel('pshop'); pshRender(); netSend({t:'pshop',a:'mine'}); netSend({t:'pshop',a:'browse'}); }
$('#pshTabB').addEventListener('click',()=>{ pshState.tab='browse'; pshState.view=null; pshRender(); netSend({t:'pshop',a:'browse'}); UI_SFX.click(); });
$('#pshTabM').addEventListener('click',()=>{ pshState.tab='mine'; pshRender(); netSend({t:'pshop',a:'mine'}); UI_SFX.click(); });
$('#invShops').addEventListener('click',()=>{ pshOpen(); UI_SFX.click(); });
