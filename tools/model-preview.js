// Renders characters from src/game/character/model*.js to a PNG (front + side of each), without building the game.
// Usage: node tools/model-preview.js [out.png] [--head] [--bent] [--q 1.1] [--looks '<JSON array of look overrides>']
//          [--setups [model]]   one front view for each recommended slider setup of a character model (default 'base'), male then female
//          [--size W H]         pixels of each view (default 180 x 320; 200 x 200 for --head)
//          [--at Y]             zoom in on height Y (metres) instead of the whole body: --head is --at 1.7
//          [--front]            one front view per character (a wide sheet of many)
//          [--sliders]          the base model with each slider at its minimum and maximum (front views)
//          [--outfit a,b]       the signature outfits a and b worn on their reference setup (front, side and back views each; --front for the front only)
//          [--weapon warrior|archer|mage]  put that class's weapon in the hands (an outfit's weapon dressing restyles it)
//   e.g. node tools/model-preview.js /tmp/p.png --head --looks '[{"sex":"female","hat":"beanie"},{"facial":"beard"}]'
// Each look override is merged onto the default male look, or the female one when it has "sex":"female".
// --bent poses the arms and legs (look at the joints); --q is the detail factor (hero 1.1, other players 0.8, villagers 0.6, phones less).
// Needs: npm install (three), python3 with numpy + pillow. Then open the PNG (in Claude: the view tool).
const fs=require('fs'), path=require('path'), os=require('os'), {execFileSync}=require('child_process');
const C=require('./char-load')();
const arg=(n)=>{ const i=process.argv.indexOf(n); return i>0?process.argv[i+1]:null; }, has=n=>process.argv.includes(n);
const out=process.argv[2]&&!process.argv[2].startsWith('--')?process.argv[2]:path.join(os.tmpdir(),'model-preview.png');
const head=has('--head'), q=arg('--q')?+arg('--q'):1.1;
let looks, views='both', size=head?['200','200','1.7']:['180','320'];
if(has('--setups')){
  const id=arg('--setups')&&!arg('--setups').startsWith('--')?arg('--setups'):'base', model=C.CHAR_MODELS[id]; if(!model){ console.error('no character model',id); process.exit(1); }
  looks=[]; for(const sex of ['male','female']) for(const s of C.setupsOf(model,sex)) looks.push(C.applySetup(Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M),s));
  views='front'; size=head?['150','150','1.7']:['150','290'];
} else if(has('--sliders')){
  looks=[{}]; for(const s of C.BODY_SLIDERS){ for(const v of [s.min,s.max]) looks.push({[s.k]:v}); } looks=looks.map(o=>Object.assign({},C.LOOK_M,o));
  views='front'; size=head?['130','130','1.7']:['110','250'];
} else if(arg('--outfit')){
  looks=[]; for(const id of arg('--outfit').split(',')){ const m=C.CHAR_MODELS[id]; if(!m){ console.error('no outfit',id); process.exit(1); } const sex=(m.sexes||['male'])[0], st=C.setupsOf(m,sex)[0];
    looks.push(Object.assign(C.applySetup(Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M),st),{model:id})); }
  views='three'; size=head?['200','200','1.7']:['190','400'];
} else looks=(arg('--looks')?JSON.parse(arg('--looks')):[{top:'tshirt',bottom:'shorts'},{sex:'female',top:'tshirt',bottom:'shorts'},{build:1.24,hat:'ranger'},{sex:'female',build:0.86,top:'flannel',bottom:'trousers',hat:'beanie'}]).map(o=>Object.assign({},o.sex==='female'?C.LOOK_F:C.LOOK_M,o));
if(has('--front')) views='front';
if(has('--views')) views=arg('--views');
const zoom=arg('--at')||(head?'1.7':null);
if(arg('--size')) size=[arg('--size'),process.argv[process.argv.indexOf('--size')+2]].concat(zoom?[zoom]:[]); else if(arg('--at')) size=['260','300',arg('--at')];
let tri=[];
const chars=looks.map(L=>{ const rig=C.buildCharacter(L,{q}); if(arg('--weapon')) C.weaponsOn(rig,arg('--weapon'),1); if(has('--bent')) C.bend(rig,{out:0.3}); rig.root.scale.setScalar(C.lookScale(L)); const t=C.tris(rig); tri.push(t.length/27); return t; });
const tmp=path.join(os.tmpdir(),'model-preview-'+process.pid+'.json'); fs.writeFileSync(tmp,JSON.stringify(chars));   // one file per run: several previews may run at once
execFileSync('python3',[path.join(__dirname,'rast.py'),tmp,out].concat(size),{stdio:'inherit',env:Object.assign({},process.env,{RAST_VIEWS:views})});
console.log('wrote',out,'('+chars.length+' characters, '+tri.join('/')+' triangles; geometry in '+tmp+')');
