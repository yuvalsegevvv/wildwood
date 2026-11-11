// Clothes at the slider extremes, torso close-ups (front + side), four garments a sheet: node tools/clip-sheet.js <chest|belly|bellyM|muscle|hips|thin|def|defM> <t|b> [outDir]   (t = one top per code family, b = bottoms)
const {execFileSync}=require('child_process'), S=(process.argv[4]||require('os').tmpdir())+'/';
const TOPS=['tshirt','flannel','jacket','hoodie','vest','tunic','plate','mail','robe','poncho','halter','harness','sundress','ballgown','crop','jerkin'];
const BOTS=['trousers','shorts','skirt','kilt','greaves','hakama','wrapskirt','loincloth','shortshorts'];
const EX={def:{sex:'female'},defM:{},chest:{sex:'female',chest:4.5},belly:{sex:'female',belly:1.5,build:1.24},bellyM:{belly:1.5,build:1.24},muscle:{muscle:1.5,shoulders:1.25,arms:1.35,build:1.24},hips:{sex:'female',hips:1.3,hipCurve:2.6,hipTall:1.8,thighs:1.35,calves:1.35},thin:{sex:'female',build:0.84,waist:0.75,hips:0.8,shoulders:0.8,arms:0.75,thighs:0.8,chest:0.5,muscle:-1,belly:-1}};
const job=process.argv[2], kind=process.argv[3], list=kind==='b'?BOTS:TOPS;
for(let i=0;i<list.length;i+=4){ const looks=list.slice(i,i+4).map(g=>Object.assign({hat:'none',shoes:'boots',top:'tshirt',bottom:'trousers'},EX[job],kind==='b'?{bottom:g}:{top:g}));
  const out=S+job+'-'+kind+(i/4)+'.png'; execFileSync('node',[require('path').join(__dirname,'model-preview.js'),out,'--size','300','330','--at',kind==='b'?'0.95':'1.3','--looks',JSON.stringify(looks)]); console.log(out,list.slice(i,i+4).join(',')); }
