//@ The prologue's dark moments: a cold grey wash over the screen when the grey reaches the village (ripple, ash, grey)
/* Agent map. mqDarkFx(kind) runs on the server event mqfx [pid, kind] (net/client.js; sent when a quest part with fx finishes, server/main-quest.js). One fixed full-screen div, created on first use, animated with the
   Web Animations API (no CSS file). kinds: ripple = a quick cold pulse (the first slimes), ash = a longer ash-coloured sky (the shrooms), grey = the deep grey of the village (Wren), green = the cure undoing the grey. Client only. Test: client-smoke. */
const MQ_FX={ripple:{col:'rgba(120,130,140,0.55)',ms:1800,peak:0.55},ash:{col:'rgba(150,150,150,0.65)',ms:3200,peak:0.7},grey:{col:'rgba(90,95,105,0.8)',ms:4200,peak:0.85},green:{col:'rgba(90,170,90,0.5)',ms:2600,peak:0.5},amber:{col:'rgba(230,170,70,0.6)',ms:4000,peak:0.6}};
let mqFxEl=null;
function mqDarkFx(kind){
  const F=MQ_FX[kind]; if(!F||typeof document==='undefined') return;
  if(!mqFxEl){ mqFxEl=document.createElement('div'); mqFxEl.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0'; document.body.appendChild(mqFxEl); }
  mqFxEl.style.background='radial-gradient(ellipse at center, transparent 20%, '+F.col+' 100%), '+F.col.replace(/[\d.]+\)$/,'0.25)');
  if(mqFxEl.animate) mqFxEl.animate([{opacity:0},{opacity:F.peak,offset:0.25},{opacity:F.peak*0.8,offset:0.6},{opacity:0}],{duration:F.ms,easing:'ease-in-out'});
}
