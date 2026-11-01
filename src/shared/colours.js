//@ Premium colours (version 3.3): 48 extra colours for everything but the skin, 500 gems each, bought once for the whole account; the favourites list; what a look may wear. Pure.
/* A premium colour is an index 0..47 into PREM_COLOURS ([hex, name]); gear.pc lists the owned ones (indices), gear.fav the player's PREM_FAV_MAX (64) favourite slots (plain hex numbers, free or premium, or -1 for an empty slot,
   shown in the favourites grid of the colour picker; an empty list = the 16 free colours of TINTC). The editor lets anyone try every premium colour on: a look that wears one you do not own (premLocked) is not saved or sent and the
   editor will not close on it (the same try-on rule as a crafted piece, ui/character-editor.js), and the server (premCleanLook, called where cosCleanLook is) puts such a field back to a free value.
   The public test world owns them all (server/testworld.js). Every hex here is unique and not one of the free palettes' (hair, eyes, cloth...), so a hex tells you the colour is premium.
   owns: PREM_COLOURS, PREM_PRICE, PREM_FAV_MAX, premIndexOf, premLocked, premCleanLook, premSanitize.   used by: server/colours.js, server/players.js, server/api.js, server/testworld.js, ui/colour-picker.js, ui/character-editor.js.   test: tools/colours-smoke.js */
const PREM_PRICE=500, PREM_FAV_MAX=64;
const PREM_COLOURS=[
  [0xd4af37,'Gold'],[0xb76e79,'Rose Gold'],[0xc0c0c8,'Silver'],[0xb87333,'Copper'],[0xcd7f32,'Bronze'],[0xe5e4e2,'Platinum'],[0x15151e,'Obsidian'],[0xfffff0,'Ivory'],
  [0xe0115f,'Ruby'],[0x7b1e2b,'Garnet'],[0xff2e63,'Cherry'],[0xff6f61,'Coral'],[0xfa8072,'Salmon'],[0xf4b6c2,'Blush'],[0xff66a1,'Rose'],[0xd6249f,'Magenta'],
  [0xff00aa,'Fuchsia'],[0xda70d6,'Orchid'],[0x9b59b6,'Amethyst'],[0x7f3fbf,'Violet'],[0x3f2b96,'Indigo'],[0xb8a2e0,'Lavender'],[0x0f52ba,'Sapphire'],[0x0047ab,'Cobalt'],
  [0x2a52e0,'Royal Blue'],[0x87ceeb,'Sky'],[0x1e90ff,'Azure'],[0x7fffd4,'Aquamarine'],[0x30d5c8,'Turquoise'],[0x008080,'Teal'],[0x00e5ee,'Cyan'],[0x98ff98,'Mint'],
  [0x71eeb8,'Seafoam'],[0x00a86b,'Jade'],[0x50c878,'Emerald'],[0xb4d330,'Peridot'],[0x8fe000,'Lime'],[0x6b7f2a,'Moss'],[0x808000,'Olive'],[0x9caf88,'Sage'],
  [0xfff44f,'Lemon'],[0xffc512,'Sunflower'],[0xffbf00,'Amber'],[0xff8c00,'Tangerine'],[0xfbb982,'Apricot'],[0xffcba4,'Peach'],[0x4a2a1a,'Chocolate'],[0x191970,'Midnight']
];
const PREM_BY_HEX=new Map(PREM_COLOURS.map((c,i)=>[c[0],i]));
const premIndexOf=v=>typeof v==='number'&&PREM_BY_HEX.has(v)?PREM_BY_HEX.get(v):-1;   // the premium index of a hex, or -1 (a free colour, a slider, -1 = as designed)
// what a field falls back to when its premium colour is not owned: the base colours of the look need a real colour, every other colour field (the second colours, tints, the cape, aura, shield and the silly items') goes back to -1 = as designed
const PREM_BASE_FALLBACK={hairColor:0x3b2619,eyes:0x4a2e1c,topColor:0x2f4a6b,bottomColor:0x2b2b2e,shoeColor:0x4a3526,hatColor:0x7a6142,gloveColor:0x7a6142,lipColor:0xb04a52,skin:0xe6b894};
const premHas=(owned,i)=>Array.isArray(owned)&&owned.includes(i);
// the premium colours a look wears that are not owned: [{i, name, hex, field}] (one entry per colour, the first field that holds it)
function premLocked(look,owned){
  const out=[]; if(!look||typeof look!=='object') return out;
  for(const f of Object.keys(look)){ const i=premIndexOf(look[f]); if(i<0||premHas(owned,i)||out.some(o=>o.i===i)) continue; out.push({i,name:PREM_COLOURS[i][1],hex:PREM_COLOURS[i][0],field:f}); }
  return out;
}
// a copy of the look with every unowned premium colour put back (the look is already flat primitives: cleanLookS)
function premCleanLook(look,owned){
  if(!look||typeof look!=='object') return look;
  const o=Object.assign({},look);
  for(const f of Object.keys(o)){ const i=premIndexOf(o[f]); if(i<0||premHas(owned,i)) continue; o[f]=Object.prototype.hasOwnProperty.call(PREM_BASE_FALLBACK,f)?PREM_BASE_FALLBACK[f]:-1; }
  return o;
}
// a save's gear.pc (owned indices, no repeats) and gear.fav (up to PREM_FAV_MAX colours as plain numbers)
function premSanitize(g,out){
  out.pc=Array.isArray(g&&g.pc)?g.pc.filter((v,i,a)=>Number.isInteger(v)&&v>=0&&v<PREM_COLOURS.length&&a.indexOf(v)===i):[];
  const seen=new Set(), f=Array.isArray(g&&g.fav)?g.fav.slice(0,PREM_FAV_MAX).map(v=>{ if(Number.isInteger(v)&&v>=0&&v<=0xffffff&&!seen.has(v)){ seen.add(v); return v; } return -1; }):[];   // a slot is a colour or -1 (empty); positions are kept, repeats and junk become empty slots
  while(f.length&&f[f.length-1]===-1) f.pop(); out.fav=f;
}
