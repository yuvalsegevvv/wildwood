// Writes the main quest's dialogue as a readable script (Markdown), straight from the game data in src/shared/main-quest*.js: every step in story order, each with what is said, in the order it plays.
// Usage: node tools/story-script.js out.md [--all]     (default: the prologue and Act I, steps P* and W*; --all: every main quest step)
const {loadServer}=require('./load');
const {x}=loadServer({send(){}},['MQ','MQ_BY_ID']);
const out=process.argv[2]||'story-script.md', ALL=process.argv.includes('--all');
const SPEAKER=/^(Tansy|Wren|Dunstan|Torgeir|Pip|Morrow|Linnea|Pell|Aldric|Maren|Greta|Bram|Oskar|Hollen|Ambrose|Odran|Tomas|Daisuke|Kaede|The Rootwarden|You): ([\s\S]*)$/;
const fmt=l=>{ l=String(l); if(l.startsWith('@pick ')) return '> **CHOICE** (the player picks one; their pick is spoken as YOU)\n'+l.slice(6).split(' | ').map((o,i)=>{ const j=o.indexOf(' >> '); return '> '+(i+1)+'. '+(j<0?o:o.slice(0,j))+(j<0?'':'  \u2192  '+o.slice(j+4)); }).join('\n'); const m=SPEAKER.exec(l); if(m) return '**'+m[1].toUpperCase()+'**  '+m[2]; return l[0]==='('?'*'+l+'*':l; };
const lines=[]; let n=0;
const sect=(h,a)=>{ if(!a||!a.length) return; lines.push('\n### '+h+'\n'); for(const l of a){ if(String(l).startsWith('@cine ')) lines.push('\n> **KEY SCENE: '+String(l).slice(6)+'**  (letterbox bars, title card, controls frozen)\n'); else lines.push(fmt(l)+'\n'); } };
for(const s of x.MQ){ if(!ALL&&!/^(P|W)/.test(s.id)) continue; n++;
  lines.push('\n---\n\n## '+s.id+'  '+s.title+'\n');
  if(s.tip) lines.push('*Objective hint shown to the player:* '+s.tip+'\n');
  sect('Said first (after the previous step)',s.intro); sect('Offer / start',s.offer);
  s.parts.forEach((p,i)=>{ const how=p.talk?'talk to '+p.talk:p.visit?'go to '+p.visit:'objective';
    if(p.say&&p.say.length) sect('Objective '+(i+1)+': '+p.text+'  ['+how+']',p.say); else lines.push('\n*Objective '+(i+1)+': '+p.text+'  (no dialogue)*\n'); });
  sect('Hand-in',s.done); if(s.bossLine) lines.push('\n*Boss fight shout:* '+s.bossLine+'\n'); }
const head='# Wildwood: the whole dialogue, '+(ALL?'every main quest step':'prologue and Act I')+'\n\nGenerated from the game data ('+n+' steps, in story order; `node tools/story-script.js`). Each step lists what is said in the order it plays: the lines said first, the offer, each objective\'s scene, the hand-in. YOU is the hiker (Wren\'s sibling), read in the voice of their voice setting; the playable characters (Tansy, Torgeir, Dunstan, Pell, Morrow, Pip...) are read in their own voice setting. Lines in *italics* are stage directions or narration (read quietly by a narrator). A KEY SCENE marker means the screen is held with letterbox bars and a title card.\n';
require('fs').writeFileSync(out,head+lines.join('\n')); console.log(n+' steps -> '+out);
