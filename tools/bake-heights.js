//@ Prints the server's height grid (HS, server/world.js) as base64, for build.py to bake into dist/wildwood-server.js
// Usage: node tools/bake-heights.js > heights.b64       (build.py runs it, keyed by a hash of the server sources, and replaces `var HB_BAKE=null;` in dist/wildwood-server.js)
// It runs the world server from src/ (no bake there, so the grid is worked out by hbCompute) and reads HS, so the bake can never use a different formula from the server. Test: tools/heightbake-smoke.js.
const {loadServer}=require('./load');
const {x}=loadServer({send(){}},['HS']);
process.stdout.write(Buffer.from(x.HS.buffer,x.HS.byteOffset,x.HS.byteLength).toString('base64'));
