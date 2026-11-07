//@ Minifies one JavaScript file for the release page: whitespace and comments go, names stay (build.py --min); the /*@@shared*/ markers are kept
// Usage: node tools/minify.js in.js out.js   Why names stay: the height workers get the shared rules as text and call rawHeight by name (world/height-workers.js), the tests reach internals by name,
// and a stack trace stays readable; whitespace and comments alone were measured at -21% of the page. Needs the `terser` package (a dependency, so Render's `npm install --omit=dev` has it).
const fs=require('fs'), {minify}=require('terser');
(async()=>{
  const [,, inp, out]=process.argv, code=fs.readFileSync(inp,'utf8');
  const r=await minify(code,{compress:false,mangle:false,format:{comments:/@@/,max_line_len:false},sourceMap:false});
  if(r.error||typeof r.code!=='string'){ console.error('minify failed: '+(r.error&&r.error.message)); process.exit(1); }
  fs.writeFileSync(out,r.code);
})().catch(e=>{ console.error('minify failed: '+(e&&e.message||e)); process.exit(1); });
