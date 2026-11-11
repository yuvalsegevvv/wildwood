// The bare-body reference sheet: the base model in underwear, three recommended slider setups per sex. node tools/body-ref.js out.png [model-preview args, e.g. --views three --at 1.5 --size 420 360]; PICK=0,3 limits the looks (0-2 male, 3-5 female)
const C=require(require('path').join(__dirname,'char-load'))(), {execFileSync}=require('child_process');
const m=C.CHAR_MODELS.base, looks=[];
for(const sex of ['male','female']) for(const s of C.setupsOf(m,sex).slice(0,3)) looks.push(Object.assign(C.applySetup(Object.assign({},sex==='female'?C.LOOK_F:C.LOOK_M),s),{top:'none',bottom:'none',shoes:'none',hat:'none',hair:'short',cape:'',pack:false}));
const pick=process.env.PICK?process.env.PICK.split(',').map(Number):null; const LK=pick?pick.map(i=>looks[i]):looks;
execFileSync('node',[require('path').join(__dirname,'model-preview.js'),process.argv[2],'--looks',JSON.stringify(LK),...process.argv.slice(3)],{stdio:'inherit'});
