//@ Character sliders (range, default, label), the character models with their recommended slider setups and ranges, and the checks every model must pass. Pure.
/* ---------- character sliders and recommended setups ----------
   Every body / face / hair slider of the hiker is a row of BODY_SLIDERS: the one place that knows its key, label, absolute range and default.
   buildCharacter (game/character/model*.js), the editor (ui/character-editor.js), randomLook and the tests all read this table, so a new slider is one row
   here + its use in the model. 1 = the neutral body for the size sliders; the +/- sliders (tilt, brow, smile...) rest at 0. A new hiker starts on the model's
   reference setup (`def:true`), which moves a few of them; "Reset sliders" goes back to the neutral body.
   A CHARACTER MODEL is the body an outfit is drawn for: the base hiker ('base') and later each signature skill outfit. A model MUST declare
     sexes   the bodies it is designed for (default both; a signature outfit is designed for its character's own sex),
     setups  recommended slider setups (named presets that look right in that outfit; at least 3 for each designed sex and one `def` per designed sex; a signature outfit (`signature:true`) ships only the one reference setup of its character's sex), and
     ranges  the recommended range of each slider it was fitted for (the outfit clips or stretches outside it; unlisted = the whole range).
   `validateCharModel` (run by tools/character-smoke.js) fails a model without them. Docs: docs/CHARACTER.md. */
const BODY_SLIDERS=[
  // Body
  {k:'height',   g:'Body',     label:'Height',        min:0.9,  max:1.1,  def:1, ends:['Shorter','Taller']},
  {k:'build',    g:'Body',     label:'Build',         min:0.84, max:1.24, def:1, ends:['Slim','Sturdy']},
  {k:'chest',    g:'Body',     label:'Chest',         min:0.5,  max:1.6,  def:1, ends:['Smaller','Larger']},
  // Shape (the proportions between the body's parts)
  {k:'shoulders',g:'Shape',    label:'Shoulders',     min:0.8,  max:1.25, def:1, ends:['Narrow','Broad']},
  {k:'waist',    g:'Shape',    label:'Waist',         min:0.75, max:1.3,  def:1, ends:['Cinched','Full']},
  {k:'hips',     g:'Shape',    label:'Hips',          min:0.8,  max:1.3,  def:1, ends:['Narrow','Wide']},
  {k:'torso',    g:'Shape',    label:'Torso length',  min:0.88, max:1.15, def:1, ends:['Short','Long']},
  {k:'legs',     g:'Shape',    label:'Leg length',    min:0.85, max:1.2,  def:1, ends:['Short','Long']},
  {k:'thighs',   g:'Shape',    label:'Thighs',        min:0.8,  max:1.35, def:1, ends:['Slender','Full']},
  {k:'arms',     g:'Shape',    label:'Arms',          min:0.75, max:1.35, def:1, ends:['Slender','Strong']},
  {k:'neck',     g:'Shape',    label:'Neck',          min:0.75, max:1.35, def:1, ends:['Slim','Thick']},
  {k:'hands',    g:'Shape',    label:'Hands',         min:0.8,  max:1.3,  def:1, ends:['Small','Large']},
  {k:'feet',     g:'Shape',    label:'Feet',          min:0.8,  max:1.3,  def:1, ends:['Small','Large']},
  // Face
  {k:'head',     g:'Face',     label:'Head size',     min:0.85, max:1.2,  def:1, ends:['Smaller','Larger']},
  {k:'jaw',      g:'Face',     label:'Jaw width',     min:0.75, max:1.25, def:1, ends:['Narrow','Wide']},
  {k:'chin',     g:'Face',     label:'Chin',          min:0.7,  max:1.4,  def:1, ends:['Short','Long']},
  {k:'cheeks',   g:'Face',     label:'Cheeks',        min:0.7,  max:1.4,  def:1, ends:['Hollow','Full']},
  // Eyes
  {k:'eyeSize',  g:'Eyes',     label:'Eye size',      min:0.8,  max:1.4,  def:1, ends:['Small','Large']},
  {k:'eyeGap',   g:'Eyes',     label:'Eye spacing',   min:0.85, max:1.2,  def:1, ends:['Close','Apart']},
  {k:'eyeHeight',g:'Eyes',     label:'Eye height',    min:-1,   max:1,    def:0, ends:['Lower','Higher']},
  {k:'eyeTilt',  g:'Eyes',     label:'Eye tilt',      min:-1,   max:1,    def:0, ends:['Droopy','Upturned']},
  {k:'brow',     g:'Eyes',     label:'Brows',         min:-1,   max:1,    def:0, ends:['Gentle','Stern']},
  // Features
  {k:'noseSize', g:'Features', label:'Nose',          min:0.6,  max:1.4,  def:1, ends:['Tiny','Larger']},
  {k:'mouthSize',g:'Features', label:'Mouth width',   min:0.7,  max:1.4,  def:1, ends:['Small','Wide']},
  {k:'lips',     g:'Features', label:'Lips',          min:0.6,  max:1.6,  def:1, ends:['Thin','Full']},
  {k:'smile',    g:'Features', label:'Expression',    min:-1,   max:1,    def:0, ends:['Serious','Smiling']},
  {k:'earSize',  g:'Features', label:'Ear size',      min:0.7,  max:1.5,  def:1, ends:['Small','Large']},
  {k:'earPoint', g:'Features', label:'Pointed ears',  min:0,    max:1,    def:0, ends:['Round','Elf']},
  // Hair
  {k:'hairLength',g:'Hair',    label:'Hair length',   min:0.6,  max:1.5,  def:1, ends:['Shorter','Longer']},
  {k:'hairVolume',g:'Hair',    label:'Hair volume',   min:0.85, max:1.35, def:1, ends:['Sleek','Fluffy']},
  {k:'bangs',    g:'Hair',     label:'Fringe length', min:0,    max:1.5,  def:1, ends:['None','Long']}
];
const SLIDER_KEYS=BODY_SLIDERS.map(s=>s.k), SLIDER_BY_KEY={}, SLIDER_DEFS={};
BODY_SLIDERS.forEach(s=>{ SLIDER_BY_KEY[s.k]=s; SLIDER_DEFS[s.k]=s.def; });
// one slider's value from a look, clamped to its range (a remote look is not sanitized: strings, NaN and huge numbers all fall back or clamp)
function sliderVal(L,k){ const s=SLIDER_BY_KEY[k], v=L&&L[k], n=typeof v==='number'&&isFinite(v)?v:s.def; return n<s.min?s.min:n>s.max?s.max:n; }
function lookSliders(L){ const S={}; for(const s of BODY_SLIDERS) S[s.k]=sliderVal(L,s.k); return S; }
// the look as it travels over the network: sliders at their default are left out (a remote merges them back from LOOK_M / LOOK_F)
function lookForNet(L){ const o={}; for(const k in L){ const s=SLIDER_BY_KEY[k]; if(!s||L[k]!==s.def) o[k]=L[k]; } return o; }

/* ---------- character models and their recommended setups ---------- */
// a setup: {id, name, sex:'male'|'female'|'any', def:true for the model's reference fit of that sex, note, v:{slider: value}}; v lists only the sliders that move
const SETUP_BASE=[
  {id:'hero',    name:'Hero',     sex:'male',   def:true, note:'The reference fit: long legs, a clean V of shoulders and waist.', v:{legs:1.06,shoulders:1.04,waist:0.94,neck:0.95,eyeSize:1.05,chin:0.95,smile:0.15}},
  {id:'lithe',   name:'Lithe',    sex:'male',   note:'Quick and slight: slim limbs, long legs, upturned eyes.', v:{height:1.02,build:0.9,shoulders:0.93,waist:0.9,legs:1.1,arms:0.88,thighs:0.9,neck:0.92,hands:0.95,eyeSize:1.12,eyeTilt:0.25,jaw:0.92}},
  {id:'bruiser', name:'Bruiser',  sex:'male',   note:'Broad and heavy: wide shoulders, strong arms, a squarer jaw.', v:{height:1.04,build:1.16,chest:1.25,shoulders:1.16,waist:1.05,arms:1.2,thighs:1.15,neck:1.15,hands:1.1,feet:1.1,head:0.95,jaw:1.1,chin:1.1,brow:0.35,eyeSize:0.95}},
  {id:'scholar', name:'Scholar',  sex:'male',   note:'Tall and gentle: a long torso, soft brows, large eyes.', v:{build:0.92,shoulders:0.92,waist:0.96,torso:1.03,legs:1.04,arms:0.88,neck:1.02,head:1.04,eyeSize:1.15,eyeGap:1.03,brow:-0.2,smile:0.2,jaw:0.95}},
  {id:'rogue',   name:'Rogue',    sex:'male',   note:'Short, light on the feet, with a sly upturned eye.', v:{height:0.95,build:0.95,shoulders:0.97,legs:1.1,arms:0.95,eyeTilt:0.4,brow:0.3,jaw:0.92,chin:1.05,smile:0.3}},
  {id:'youth',   name:'Youth',    sex:'male',   note:'A younger look: big head and eyes, short chin, small hands.', v:{height:0.93,build:0.9,head:1.1,eyeSize:1.25,eyeGap:1.05,eyeHeight:-0.2,chin:0.85,jaw:0.9,cheeks:1.15,noseSize:0.8,mouthSize:0.9,smile:0.45,arms:0.9,shoulders:0.92,hands:0.9,feet:0.9}},
  {id:'heroine', name:'Heroine',  sex:'female', def:true, note:'The reference fit: a cinched waist, long legs and big bright eyes.', v:{legs:1.07,waist:0.92,hips:1.05,shoulders:0.98,neck:0.95,eyeSize:1.1,lips:1.1,chin:0.92,smile:0.25}},
  {id:'sprite',  name:'Sprite',   sex:'female', note:'Petite with a big head and bigger eyes.', v:{height:0.93,build:0.9,head:1.1,chest:0.8,eyeSize:1.25,eyeHeight:-0.2,chin:0.85,jaw:0.9,cheeks:1.15,noseSize:0.8,mouthSize:0.9,legs:1.04,arms:0.85,hands:0.9,feet:0.9,smile:0.5}},
  {id:'valkyrie',name:'Valkyrie', sex:'female', note:'Tall and strong: broad shoulders, strong legs, a sharp eye.', v:{height:1.06,build:1.1,shoulders:1.1,waist:0.95,legs:1.12,thighs:1.1,arms:1.15,chest:1.1,neck:1.05,eyeTilt:0.35,brow:0.3,chin:1.05,smile:0.1}},
  {id:'dancer',  name:'Dancer',   sex:'female', note:'Slim and long-limbed with the narrowest waist.', v:{height:1.03,build:0.9,shoulders:0.92,waist:0.86,hips:1.1,legs:1.14,thighs:0.95,arms:0.9,chest:0.9,neck:1.05,eyeSize:1.1,eyeTilt:0.2,smile:0.3}},
  {id:'sage',    name:'Sage',     sex:'female', note:'Elegant and tall, with a long neck and soft eyes.', v:{height:1.02,build:0.95,torso:1.03,legs:1.06,waist:0.9,neck:1.08,head:1.02,eyeSize:1.18,eyeGap:1.05,brow:-0.15,earSize:1.1,earPoint:0.35,chin:0.9,lips:0.95,smile:0.2}},
  {id:'guardian',name:'Guardian', sex:'female', note:'Sturdy and broad in the hip and thigh, a steady brow.', v:{height:1.02,build:1.12,chest:1.15,shoulders:1.08,hips:1.08,legs:1.05,thighs:1.12,arms:1.12,neck:1.05,jaw:1.05,brow:0.2}},
  {id:'elf',     name:'Elf',      sex:'any',    note:'Slender with long pointed ears and slanted eyes.', v:{height:1.04,build:0.9,shoulders:0.94,legs:1.12,arms:0.9,earSize:1.3,earPoint:1,eyeTilt:0.5,eyeSize:1.2,chin:0.88,jaw:0.88,neck:1.05}}
];
const CHAR_MODELS={
  base:{id:'base', name:'Wayfarer', note:'The hiker every player starts as: anime proportions, about 6.3 heads tall.',
    ranges:{height:[0.92,1.08],build:[0.88,1.18],chest:[0.6,1.4],shoulders:[0.88,1.18],waist:[0.82,1.15],hips:[0.85,1.2],torso:[0.94,1.08],legs:[0.92,1.14],thighs:[0.85,1.25],arms:[0.82,1.25],neck:[0.85,1.2],hands:[0.85,1.2],feet:[0.85,1.2],
      head:[0.9,1.12],jaw:[0.85,1.15],chin:[0.8,1.25],cheeks:[0.8,1.25],eyeSize:[0.9,1.3],eyeGap:[0.92,1.12],eyeHeight:[-0.6,0.6],eyeTilt:[-0.7,0.7],brow:[-0.7,0.7],
      noseSize:[0.7,1.25],mouthSize:[0.8,1.25],lips:[0.7,1.4],smile:[-0.6,0.9],earSize:[0.8,1.3],earPoint:[0,1],hairLength:[0.7,1.35],hairVolume:[0.9,1.25],bangs:[0.3,1.4]},
    setups:SETUP_BASE}
};
const charModelOf=L=>{ const m=L&&L.model; return (typeof m==='string'&&Object.prototype.hasOwnProperty.call(CHAR_MODELS,m)?CHAR_MODELS[m]:null)||CHAR_MODELS.base; };   // (own properties only: a look is another player's data)
// the model's recommended range of a slider (the whole range when it lists none)
function sliderRange(model,k){ const s=SLIDER_BY_KEY[k], r=model.ranges&&model.ranges[k]; return r?[Math.max(s.min,r[0]),Math.min(s.max,r[1])]:[s.min,s.max]; }
// the recommended setups for one sex (a setup for 'any' fits both), the reference fit first. A new hiker starts on the reference setup of their sex (LOOK_M / LOOK_F in model.js).
function setupsOf(model,sex){ const l=(model.setups||[]).filter(s=>s.sex===sex||s.sex==='any'); return l.sort((a,b)=>(b.def?1:0)-(a.def?1:0)); }
// a look with every slider reset to its default and then the setup's values on top (other fields stay)
function applySetup(look,setup){ return Object.assign({},look,SLIDER_DEFS,setup.v); }
// the sliders of a look that sit outside the model's recommended range (the editor flags them: an outfit may clip there)
function lookOutOfRange(L,model){ const out=[]; model=model||charModelOf(L); for(const s of BODY_SLIDERS){ const v=sliderVal(L,s.k), r=sliderRange(model,s.k); if(v<r[0]-1e-6||v>r[1]+1e-6) out.push(s.k); } return out; }
// the problems of a character model (empty = fine); the rules are the ones in the header comment
function validateCharModel(m){
  const bad=[]; if(!m||typeof m!=='object') return ['not an object'];
  const sexes=m.sexes===undefined?['male','female']:m.sexes;
  if(!Array.isArray(sexes)||!sexes.length||sexes.some(x=>x!=='male'&&x!=='female')) bad.push('sexes must list male and / or female');
  if(!m.id||typeof m.id!=='string') bad.push('no id'); if(!m.name||typeof m.name!=='string') bad.push('no name');
  if(m.signature) for(const sl of ['hat','hair','face','top','bottom','shoes','weapon']) if(!m.items||typeof m.items[sl]!=='string'||!m.items[sl]) bad.push('no item name for the '+sl+' slot (items: {hat, hair, face, top, bottom, shoes, weapon}, the labels of the editor\'s rows)');
  for(const k in (m.ranges||{})){ const s=SLIDER_BY_KEY[k], r=m.ranges[k]; if(!s){ bad.push('range of unknown slider '+k); continue; }
    if(!Array.isArray(r)||r.length!==2||!(r[0]<r[1])||r[0]<s.min-1e-9||r[1]>s.max+1e-9) bad.push('range of '+k+' is not inside '+s.min+'..'+s.max); }
  const ids=new Set();
  for(const st of (m.setups||[])){
    if(!st.id||ids.has(st.id)) bad.push('setup id missing or repeated: '+st.id); ids.add(st.id);
    if(!st.name) bad.push('setup '+st.id+' has no name'); if(!['male','female','any'].includes(st.sex)) bad.push('setup '+st.id+' has no sex'); else if(st.sex!=='any'&&Array.isArray(sexes)&&!sexes.includes(st.sex)) bad.push('setup '+st.id+' is for '+st.sex+', which the model is not designed for');
    for(const k in (st.v||{})){ const s=SLIDER_BY_KEY[k]; if(!s){ bad.push('setup '+st.id+': unknown slider '+k); continue; }
      const v=st.v[k], r=sliderRange(m,k); if(typeof v!=='number'||!isFinite(v)||v<r[0]-1e-6||v>r[1]+1e-6) bad.push('setup '+st.id+': '+k+'='+v+' is outside the recommended '+r[0]+'..'+r[1]); }
  }
  for(const sex of (Array.isArray(sexes)?sexes:[])){ const l=setupsOf(m,sex); const need=m.signature?1:3; if(l.length<need) bad.push('needs at least '+need+' recommended setup'+(need>1?'s':'')+' for '+sex+' (has '+l.length+')'); if(l.filter(s=>s.def).length!==1) bad.push('needs exactly one reference setup (def:true) for '+sex); }
  return bad;
}
