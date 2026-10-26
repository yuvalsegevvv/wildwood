//@ Compresses the page the Node host serves (stdin) into <prefix>.gz and <prefix>.br, so that dist/wildwood-server.js starts without doing it
// Usage: node tools/compress-page.js dist/page-<tag>   < page.html      (build.py runs it once per new page: the name carries a hash of the page, so a file that exists is the right one)
// gzip at level 9; brotli at quality 9, or 11 (about 90 KB smaller, 7 s) when $RENDER is set (the deploy's build, where nobody waits). The host reads the pair at start (src/node/main.js, `pageGz` / `pageBr`)
// and works the compression out itself, in the background, only when a file is missing. Test: tools/host-smoke.js (the first request is already brotli).
const fs=require('fs'), zlib=require('zlib');
const prefix=process.argv[2]; if(!prefix){ console.error('usage: node tools/compress-page.js <prefix> < page.html'); process.exit(2); }
const page=fs.readFileSync(0);
const put=(ext,buf)=>{ fs.writeFileSync(prefix+ext+'.tmp',buf); fs.renameSync(prefix+ext+'.tmp',prefix+ext); };   // (a file that exists is whole: build.py takes it as done)
put('.gz',zlib.gzipSync(page,{level:9}));
put('.br',zlib.brotliCompressSync(page,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:process.env.RENDER?11:9,[zlib.constants.BROTLI_PARAM_SIZE_HINT]:page.length,[zlib.constants.BROTLI_PARAM_LGWIN]:24}}));
