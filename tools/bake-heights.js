//@ Prints the server's height grid (HS, server/world.js) packed as base64, for build.py to bake into dist/wildwood-server.js and dist/wildwood.html
// Usage: node tools/bake-heights.js > heights.b64       (build.py runs it, keyed by a hash of the server sources, and replaces `var HB_BAKE=null;` in both)
// It runs the world server from src/ (no bake there, so the grid is worked out by hbCompute) and reads HS, so the bake can never use a different formula from the server.
// Format (hbLoad in server/world.js unpacks it): each vertex in whole cm, as its difference from the plane through the left, upper and upper-left vertex, zigzag + varint, then base64.
// Exports hbPack(HS, nvx) for tools/heightbake-smoke.js. Test: tools/heightbake-smoke.js.
function hbPack(HS,nvx){
  const q=new Int32Array(HS.length), out=[];
  for(let i=0;i<q.length;i++){
    q[i]=Math.round(HS[i]*100);
    const ix=i%nvx, l=ix?q[i-1]:(i>=nvx?q[i-nvx]:0), u=i>=nvx?q[i-nvx]:l, ul=(ix&&i>=nvx)?q[i-nvx-1]:u, d=q[i]-(l+u-ul);
    let z=(d<<1)^(d>>31); while(z>=128){ out.push((z&127)|128); z>>>=7; } out.push(z);
  }
  return Buffer.from(out).toString('base64');
}
module.exports={hbPack};
if(require.main===module){
  const {loadServer}=require('./load');
  const {x}=loadServer({send(){}},['HS','NVX']);
  process.stdout.write(hbPack(x.HS,x.NVX));
}
