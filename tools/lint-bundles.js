// Lints the two bundles the way they run: every file of a group is concatenated into ONE scope (client: wildwoodMain(), server: createWorldServer(io)),
// so a misspelled or never-defined top-level name is not caught by anything until the line runs. This reports, with the file and line it came from:
//   undefined names (no-undef: the bug class of a no-module codebase), duplicate declarations, impossible code (unreachable, dupe keys, self-assign, NaN
//   compares, assignment to a const / function), and (with --unused) names declared but never read.
// Needs ESLint (`npm i --no-save eslint`, or any global install): without it the tool says so and exits 0, so `npm test` never depends on it.
// Usage: node tools/lint-bundles.js [--unused] [--client|--server] [--quiet]     exit 1 when something is found.
// Known-good globals live in BROWSER below: a name the browser really has but this list lacks is a finding to fix HERE, not in the game.
const fs=require('fs'), path=require('path'), {SRC,manifest,strip}=require('./load');
let ESLint; for(const p of ['eslint',(()=>{ try{ return path.join(require('child_process').execSync('npm root -g',{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(),'eslint'); }catch(e){ return null; } })()]){ try{ if(p) ESLint=require(p).ESLint; if(ESLint) break; }catch(e){} }
if(!ESLint){ console.log('SKIP lint-bundles: eslint is not installed (npm i --no-save eslint)'); process.exit(0); }
const has=f=>process.argv.includes(f), UNUSED=has('--unused');
const BROWSER='window document navigator location history localStorage sessionStorage performance requestAnimationFrame cancelAnimationFrame setTimeout clearTimeout setInterval clearInterval fetch console Audio AudioContext webkitAudioContext OfflineAudioContext AudioBuffer GainNode Image Blob URL FileReader WebSocket TextEncoder TextDecoder HTMLElement HTMLCanvasElement CustomEvent Event KeyboardEvent MouseEvent PointerEvent TouchEvent WheelEvent ResizeObserver MutationObserver IntersectionObserver devicePixelRatio innerWidth innerHeight screen getComputedStyle matchMedia speechSynthesis SpeechSynthesisUtterance caches atob btoa crypto queueMicrotask structuredClone AbortController OffscreenCanvas ImageData createImageBitmap DOMParser Path2D Worker alert confirm prompt CSS Node Option FormData Headers Request Response Intl process Buffer require module exports globalThis self scrollTo open close focus blur addEventListener removeEventListener dispatchEvent requestIdleCallback cancelIdleCallback MessageChannel BroadcastChannel setImmediate clearImmediate SVGElement DOMRect Element Document'.split(' ');
const EXTRA={client:['THREE','showFatal','createWorldServer'],server:['io']};   // THREE is the page's engine script; showFatal is boot/early.js; createWorldServer is the server bundle's own script block in the page; io is its argument
// the same assembly as build.py: [{file, text}] in order, with '@shared' expanded in the client
const m=manifest(), rd=(d,f)=>({file:d+'/'+f,text:strip(fs.readFileSync(path.join(SRC,d,f),'utf8'))});
const shared=m.shared.map(f=>rd('shared',f));
const BUNDLES={
  client:{wrap:'function wildwoodMain(){', parts:m.game.flatMap(f=>f==='@shared'?shared:[rd('game',f)])},
  server:{wrap:'function createWorldServer(io){', parts:[...shared,...m.server.map(f=>rd('server',f))]},
};
const rules={'no-undef':'error','no-redeclare':'error','no-dupe-keys':'error','no-dupe-args':'error','no-dupe-class-members':'error','no-unreachable':'error','no-self-assign':'error','no-const-assign':'error','no-func-assign':'error','no-class-assign':'error','use-isnan':'error','valid-typeof':'error','no-unsafe-negation':'error','no-unsafe-finally':'error','no-sparse-arrays':'error','no-empty-pattern':'error','no-compare-neg-zero':'error','no-dupe-else-if':'error','no-duplicate-case':'error','no-obj-calls':'error','no-setter-return':'error','getter-return':'error','no-unused-labels':'error','no-useless-backreference':'error','no-loss-of-precision':'error','no-self-compare':'error','no-unmodified-loop-condition':'error','no-ex-assign':'error','no-fallthrough':'off'};
if(UNUSED) rules['no-unused-vars']=['warn',{vars:'all',args:'none',caughtErrors:'none',ignoreRestSiblings:true}];
(async()=>{
  const out=[]; let bad=0;
  for(const [name,B] of Object.entries(BUNDLES)){
    if(has('--client')&&name!=='client'||has('--server')&&name!=='server') continue;
    // line map: bundle line -> [file, line in file]
    const lines=[], map=[]; lines.push(B.wrap); map.push(['(wrapper)',0]);
    for(const p of B.parts){ const ls=p.text.split('\n'); if(ls[ls.length-1]==='') ls.pop(); ls.forEach((l,i)=>{ lines.push(l); map.push([p.file,i+2]); }); }   // +2: the //@ header line was stripped
    lines.push('}'); map.push(['(wrapper)',0]);
    const eslint=new ESLint({overrideConfigFile:true,overrideConfig:[{files:['**/*.js'],languageOptions:{ecmaVersion:2022,sourceType:'script',globals:Object.fromEntries([...BROWSER,...EXTRA[name]].map(g=>[g,'readonly']))},linterOptions:{reportUnusedDisableDirectives:false},rules}]});
    const [res]=await eslint.lintText(lines.join('\n'),{filePath:path.join(__dirname,'bundle-'+name+'.js')});
    for(const r of res.messages){
      const [file,line]=map[r.line-1]||['?',0];
      out.push({bundle:name,file,line,rule:r.ruleId||'syntax',msg:r.message,sev:r.severity});
      if(r.severity===2) bad++;
    }
  }
  const seen=new Set();
  for(const o of out){ const k=o.file+':'+o.line+':'+o.rule+':'+o.msg; if(seen.has(k)) continue; seen.add(k); if(!has('--quiet')||o.sev===2) console.log(`${o.file}:${o.line}  [${o.bundle}] ${o.rule}  ${o.msg}`); }
  console.log(bad?`FAIL ${bad} problem(s) found`:'PASS no undefined names or impossible code in the '+Object.keys(BUNDLES).filter(n=>!(has('--client')&&n!=='client'||has('--server')&&n!=='server')).join(' and ')+' bundle'+(UNUSED?' (see warnings above for unused names)':''));
  process.exit(bad?1:0);
})();
