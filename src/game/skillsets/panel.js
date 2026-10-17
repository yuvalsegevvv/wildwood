//@ Skill sets in the skills panel and the action bar: each set's own symbol and colour on its pieces (never the generic star), and the set effect (the 3-piece and 5-piece bonuses, lit by how many pieces are worn)
/* Agent map. Data: the set's `emblem` {col, glyph} and `bonus` {3, 5} (shared/skillsets.js, one file per set in shared/skillsets/), the worn count `ssCount`. Used by: economy/skills.js (a tile's symbol, the details of a piece, the
   "Set effects" cards under the loadout), ui/combat-hud.js (the action bar's symbol). Styles: 27-skillsets.css. Test: tools/skillsets-first8-smoke.js (the emblems), tools/client-smoke.js (the panel).
   Only function declarations here: combat-hud.js asks for a glyph while the page loads. */
const SS_ICON_ATTR='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
function ssSetOf(s){ return s&&s.set&&SS_SETS[s.set]?SS_SETS[s.set]:null; }
function ssGlyph(s){ const S=ssSetOf(s); return S&&S.emblem?S.emblem.glyph:null; }   // the inner markup of a set piece's own symbol; null for any other skill
function ssTint(s){ const S=ssSetOf(s); return S&&S.emblem?'#'+S.emblem.col.toString(16).padStart(6,'0'):''; }   // the colour the symbol is drawn in
function ssBonusText(row){ return row.text.replace('{}',pctText(row.v[0])); }   // (a row with a stat writes its number into the text)
// how many pairs of the set (a skill and its passive come together) the loadout owns, 0 to 3
function ssOwnedPairs(S,setId){ const T=SS_SETS[setId]; let n=0; for(let p=1;p<=3;p++) if(S.owned.includes(T.pos[p].passive)) n++; return n; }
// one set: its symbol and name, how many of its six pieces are worn, and its two effects (lit when that many are worn)
function ssCardHtml(setId,worn,pairs){
  const T=SS_SETS[setId], tint=T.emblem?'#'+T.emblem.col.toString(16).padStart(6,'0'):'#9fe08a';
  const row=n=>`<div class="sk-set-b${worn>=n?' on':''}"><i>${n} pieces</i><span><b>${T.bonus[n].name}</b> ${ssBonusText(T.bonus[n])}${worn>=n?'':' <em>(needs '+(n-worn)+' more)</em>'}</span></div>`;
  return `<div class="sk-set${worn>=3?' on':''}" style="--set:${tint}"><div class="sk-set-h"><span class="sk-set-ico"><svg ${SS_ICON_ATTR}>${T.emblem?T.emblem.glyph:''}</svg></span>`
    +`<div class="sk-set-t"><b>${T.name}</b><small>${T.char.name}'s set &middot; ${worn} of 6 pieces worn${pairs===undefined?'':' &middot; '+pairs+' of 3 pairs owned'}</small></div></div>${row(3)}${row(5)}</div>`;
}
// the cards under the loadout: only the sets you wear at least one piece of (all 18 at once was overcrowded), or a line that says what to do
function ssSummaryHtml(C,cls){
  const worn=ssCount(C.S,cls,C.lv);
  const have=SS_ORDER.filter(id=>(worn[id]||0)>0);
  const h=`<div class="sk-load-h">Set effects <span>wear 3 pieces of one set for its first effect, 5 for its second</span></div>`;
  if(!have.length) return h+`<p class="muted sk-note">You wear no signature set pieces. A world boss or a dungeon clear (at +1 or higher) can drop a set's skill and passive; a set shows here once a piece is worn: a skill in its slot, a passive in a passive slot.</p>`;
  return h+`<div class="sk-sets">${have.map(id=>ssCardHtml(id,worn[id],ssOwnedPairs(C.S,id))).join('')}</div>`;
}
