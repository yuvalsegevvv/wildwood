// Checks that this checkout is ready to work in, and says what to run when it is not: node, the npm packages, python3 for the build, the optional tools (ESLint for `npm run lint`,
// numpy + pillow for the model previews, playwright + Chromium for the Glasswell test and the city preview), whether dist/ is older than src/ (a stale dist/ gives false failures in
// the page tests: tools/run-tests.js rebuilds it for you), and the two things that routinely dirty a clean tree (package-lock.json after `npm install`, files under dist/).
// Usage: node tools/doctor.js        (exit 1 only when something REQUIRED is missing)
const fs=require('fs'), path=require('path'), cp=require('child_process');
const ROOT=path.join(__dirname,'..');
const run=(c,o)=>{ try{ return cp.execSync(c,Object.assign({cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:20000},o||{})).trim(); }catch(e){ return null; } };
let bad=0; const line=(ok,req,what,fix)=>{ console.log((ok?'ok    ':req?'MISSING':'absent')+'  '+what+(ok||!fix?'':'   -> '+fix)); if(!ok&&req) bad++; };
const nodeMajor=+process.versions.node.split('.')[0];
line(nodeMajor>=18,true,'node '+process.versions.node+' (18 or newer)','install a current Node');
line(!!run('python3 --version'),true,'python3 (the build: python3 build.py)','install Python 3');
line(fs.existsSync(path.join(ROOT,'node_modules','three','build','three.js')),true,'three@0.128 in node_modules (the headless tools)','npm install   (then: git checkout package-lock.json if it shows as modified)');
line(fs.existsSync(path.join(ROOT,'node_modules','pg')),false,'pg (only for a Postgres store; saves go to files without it)','npm install');
line(run('python3 -c "import numpy, PIL"')!==null,false,'numpy + pillow (tools/model-preview.js, monster-preview.js)','pip install numpy pillow');
const has=m=>{ for(const b of [ROOT,'/opt/node-tools','/usr/lib','/usr/local/lib',run('npm root -g')||'']){ try{ require.resolve(m,{paths:[b,path.join(b,'node_modules')]}); return true; }catch(e){} } return false; };
line(has('eslint'),false,'eslint (npm run lint)','npm i --no-save eslint');
line(has('playwright'),false,'playwright (glasswell-smoke, city-preview.js, world-map-bake.js)','npm i --no-save playwright   (and a Chromium: PLAYWRIGHT_BROWSERS_PATH)');
// dist/ older than the sources?
const newest=dir=>{ let t=0; for(const f of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,f.name); t=Math.max(t,f.isDirectory()?newest(p):fs.statSync(p).mtimeMs); } return t; };
const page=path.join(ROOT,'dist','wildwood.html');
if(!fs.existsSync(page)) line(false,false,'dist/wildwood.html is not built (the page tests need it)','python3 build.py');
else line(fs.statSync(page).mtimeMs>=newest(path.join(ROOT,'src'))-1000,false,'dist/ is newer than src/','python3 build.py   (tools/run-tests.js does it for page tests)');
const branch=run('git rev-parse --abbrev-ref HEAD'), dirty=(run('git status --porcelain')||'').split('\n').filter(Boolean);
console.log('git   branch '+branch+', '+dirty.length+' changed file(s)');
if(dirty.some(l=>/package-lock\.json/.test(l))) console.log('note  package-lock.json is modified (npm install without the optional pg strips it): git checkout package-lock.json');
console.log(bad?'\n'+bad+' required thing(s) missing':'\nready: node tools/run-tests.js runs the tests that cover your changes');
process.exit(bad?1:0);
