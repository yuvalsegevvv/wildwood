//@ Builds the puzzle lab: one self-contained HTML page (publish it as a claude.ai artifact) where any puzzle kind at any difficulty is played from a fresh seed, timed, and rated too easy / just right / too hard / dull
/* Agent map. Usage: node tools/puzzle-lab.js out/puzzle-lab.html. Embeds shared/puzzles.js, shared/puzzles/*.js and the client views game/puzzles/rootlines.js and ice.js (with a tiny shim for $ and the panel), so the lab plays the very
   boards and rules the game does. Ratings are kept in the browser (localStorage) and shown as a report to copy into the chat; the agent moves the difficulty thresholds from them (puzzles-plan/PLAN.md section 7). */
const fs=require('fs'), path=require('path');
const {SRC,manifest,strip}=require('./load');
const m=manifest(), pick=f=>strip(fs.readFileSync(path.join(SRC,f),'utf8'));
const noise=pick('shared/noise.js').match(/function mulberry32[^\n]*/)[0];
const shared=['puzzles.js',...m.shared.filter(f=>/^puzzles\//.test(f))].map(f=>pick('shared/'+f)).join('\n')+'\n'+strip(fs.readFileSync(path.join(__dirname,'puzzle-lab-diffs.js'),'utf8'));   // + the lab-only difficulties 6-10
const views=['common.js','rootlines.js','ice.js','sudoku.js','akari.js','slither.js','bridges.js','mirrors.js','nonogram.js','sokoban.js'].map(f=>pick('game/puzzles/'+f)).join('\n');
const html=`<title>Puzzle Lab</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* layout: one narrow column, controls on top, the board centred, a rating row after a solve, the log below */
:root{ --bg:#f3f5f7; --fg:#1b232b; --dim:#5d6a77; --card:#ffffff; --line:#cdd5dc; --accent:#1f7a8c; --on-accent:#ffffff; --good:#2f8f5b; --warn:#b7791f; --bad:#c0453a; --board:#10161c; }
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --bg:#12181e; --fg:#e4eaf0; --dim:#98a6b3; --card:#1a232b; --line:#2f3c47; --accent:#5cc3d6; --on-accent:#0b1a1f; --good:#5fc08b; --warn:#e0b252; --bad:#ec7b70; color-scheme:dark; } }
:root[data-theme="dark"]{ --bg:#12181e; --fg:#e4eaf0; --dim:#98a6b3; --card:#1a232b; --line:#2f3c47; --accent:#5cc3d6; --on-accent:#0b1a1f; --good:#5fc08b; --warn:#e0b252; --bad:#ec7b70; color-scheme:dark; }
body{ background:var(--bg); color:var(--fg); font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif; padding-block:20px; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); }
main{ max-width:520px; margin:0 auto; display:grid; gap:14px; }
h1{ font-size:22px; margin:0; } p{ margin:0; } .dim{ color:var(--dim); font-size:13px; }
.row{ display:flex; flex-wrap:wrap; gap:8px; align-items:end; } .row label{ display:grid; gap:3px; font-size:12px; color:var(--dim); min-width:0; }
select,input,button{ font:inherit; color:var(--fg); background:var(--card); border:1px solid var(--line); border-radius:8px; padding:8px 10px; min-height:40px; }
button{ cursor:pointer; } button.main{ background:var(--accent); color:var(--on-accent); border-color:var(--accent); font-weight:600; }
button:focus-visible,select:focus-visible,input:focus-visible{ outline:2px solid var(--accent); outline-offset:2px; }
#stage{ background:var(--card); border:1px solid var(--line); border-radius:12px; padding:12px; display:grid; gap:10px; justify-items:center; min-height:200px; }
#bar{ display:flex; gap:12px; justify-content:space-between; width:100%; font-variant-numeric:tabular-nums; } #bar b{ font-weight:600; }
#host{ display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; }
.pz-su{ display:grid; width:min(100%,380px); aspect-ratio:1; border:2px solid var(--line); border-radius:8px; overflow:hidden; background:var(--line); gap:1px; }
.pz-su-c{ border:0; border-radius:0; background:#18212a; color:#e8eef4; font-size:clamp(12px,3.4vw,17px); padding:0; min-width:0; cursor:pointer; line-height:1.05; }
.pz-su-c.rb{ margin-right:2px; } .pz-su-c.bb{ margin-bottom:2px; } .pz-su-c.given{ background:#222d37; color:#9fb0bf; font-weight:700; }
.pz-su-c.peer{ background:#1d2c38; } .pz-su-c.sel{ background:#1f5a68; } .pz-su-c.bad{ color:#ff6b5e; }
.pz-su-pad{ display:flex; flex-wrap:wrap; gap:6px; justify-content:center; }
.pz-canvas{ display:block; max-width:100%; border-radius:8px; background:var(--board); touch-action:none; }
.pz-pad{ display:grid; grid-template-columns:repeat(3,52px); gap:6px; } .pz-pad button{ padding:0; height:46px; }
.pz-pad [data-d=U]{ grid-column:2; grid-row:1; } .pz-pad [data-d=L]{ grid-column:1; grid-row:2; } .pz-pad [data-d=D]{ grid-column:2; grid-row:2; } .pz-pad [data-d=R]{ grid-column:3; grid-row:2; }
#rate{ display:grid; gap:8px; width:100%; } #rate .row{ align-items:stretch; } #rate button{ flex:1 1 40%; }
table{ width:100%; border-collapse:collapse; font-size:13px; font-variant-numeric:tabular-nums; } th,td{ text-align:left; padding:5px 6px; border-bottom:1px solid var(--line); } .wrap{ overflow-x:auto; }
.v-easy{ color:var(--warn); } .v-ok{ color:var(--good); } .v-hard{ color:var(--bad); } .v-dull{ color:var(--dim); }
</style>
<main><span id="puzzle"></span>
<h1>Puzzle Lab</h1>
<p class="dim">Pick a kind and a difficulty, solve the board, then say how it felt. Each board comes from a fresh seed. Your ratings tell me where to move the difficulty bands.</p>
<div class="row">
  <label>Kind<select id="kind"></select></label>
  <label>Difficulty<select id="diff"></select></label>
  <label>Seed (empty = fresh)<input id="seed" inputmode="numeric" size="11" autocomplete="off"></label>
  <button class="main" id="go">New board</button>
</div>
<section id="stage" aria-live="polite">
  <div id="bar"><span id="what">-</span><span>Time <b id="clock">0:00</b></span></div>
  <div id="host"></div>
  <div class="row" id="tools" hidden><button id="undo">Undo</button><button id="reset">Start over</button></div>
  <div id="rate" hidden></div>
</section>
<section><div class="row" style="justify-content:space-between"><b>Log</b><span class="row"><button id="copy">Copy report</button><button id="clear">Clear</button></span></div>
<div class="wrap"><table><thead><tr><th>Kind</th><th>Diff</th><th>Seed</th><th>Time</th><th>Made in</th><th>Verdict</th></tr></thead><tbody id="log"></tbody></table></div>
<p class="dim" id="note"></p></section>
</main>
<script>
${noise}
${shared}
const PZV=Object.create(null);
const $=s=>document.querySelector(s);
${views}
(function(){
  const LS='wwpzlab'; let log=[]; try{ log=JSON.parse(localStorage.getItem(LS)||'[]'); }catch(_){}
  const kindEl=$('#kind'), diffEl=$('#diff'), fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  kindEl.innerHTML=PZ_KIND_IDS.map(id=>'<option value="'+id+'">'+PZ_KINDS[id].name+' ('+PZ_KINDS[id].land+')</option>').join('');
  diffEl.innerHTML=PZ_DIFF.slice(1).map((d,i)=>'<option value="'+(i+1)+'">'+(i+1)+' '+d.name+'</option>').join('');
  let cur=null, timer=0;
  const save=()=>{ try{ localStorage.setItem(LS,JSON.stringify(log.slice(-300))); }catch(_){} };
  const verdictName={easy:'too easy',ok:'just right',hard:'too hard',dull:'dull'};
  function renderLog(){
    $('#log').innerHTML=log.slice(-30).reverse().map(r=>'<tr><td>'+r.kind+'</td><td>'+r.diff+'</td><td>'+r.seed+'</td><td>'+fmt(r.secs)+'</td><td>'+r.gen+' ms</td><td class="v-'+r.v+'">'+verdictName[r.v]+'</td></tr>').join('')||'<tr><td colspan="6" class="dim">No boards rated yet.</td></tr>';
  }
  function start(){
    clearInterval(timer); $('#rate').hidden=true; const kind=kindEl.value, diff=+diffEl.value, typed=$('#seed').value.trim();
    const seed=typed?(parseInt(typed,10)>>>0):Math.floor(Math.random()*4294967296); $('#seed').value='';
    $('#host').innerHTML='<p class="dim">Weaving the board…</p>'; $('#what').textContent=PZ_KINDS[kind].name+' · '+PZ_DIFF[diff].name+' · seed '+seed; $('#clock').textContent='0:00'; $('#tools').hidden=true;
    setTimeout(()=>{
      const t0=performance.now(), B=pzBoard(kind,diff,seed), gen=Math.round(performance.now()-t0);
      if(!B){ $('#host').innerHTML='<p class="v-hard">This kind could not make a board at this difficulty (seed '+seed+'). Please report it.</p>'; return; }
      $('#host').innerHTML=''; cur={kind,diff,seed,gen,t0:Date.now(),done:false};
      const api={ solved(ans){ if(cur.done) return; cur.done=true; clearInterval(timer); const secs=Math.round((Date.now()-cur.t0)/1000); askRate(secs); }, save(){} };
      cur.view=PZV[kind].mount($('#host'),B,api,null); $('#tools').hidden=false; $('#undo').hidden=!cur.view.undo;
      timer=setInterval(()=>{ $('#clock').textContent=fmt((Date.now()-cur.t0)/1000); },500);
    },30);
  }
  function askRate(secs){
    const c=cur; $('#tools').hidden=true;
    $('#rate').hidden=false; $('#rate').innerHTML='<p><b>Solved in '+fmt(secs)+'</b> . How was it?</p><div class="row"><button data-v="easy">Too easy</button><button data-v="ok">Just right</button><button data-v="hard">Too hard</button><button data-v="dull">Dull or alike</button></div>';
    $('#rate').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{ log.push({kind:c.kind,diff:c.diff,seed:c.seed,secs,gen:c.gen,v:b.dataset.v}); save(); renderLog(); start(); });
  }
  $('#go').onclick=start; $('#undo').onclick=()=>cur&&cur.view.undo&&cur.view.undo(); $('#reset').onclick=()=>cur&&cur.view.reset&&cur.view.reset();
  $('#clear').onclick=()=>{ log=[]; save(); renderLog(); };
  $('#copy').onclick=async()=>{
    const t='Puzzle lab report\\nkind diff seed secs gen_ms verdict\\n'+log.map(r=>[r.kind,r.diff,r.seed,r.secs,r.gen,verdictName[r.v]].join(' ')).join('\\n');
    try{ await navigator.clipboard.writeText(t); $('#note').textContent='Report copied. Paste it into the chat.'; }catch(_){ $('#note').textContent=t; }
  };
  renderLog(); start();
})();
</script>`;
const out=process.argv[2]||path.join(require('os').tmpdir(),'puzzle-lab.html'); fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true}); fs.writeFileSync(out,html); console.log('wrote '+out+' ('+Math.round(html.length/1024)+' KB)');
