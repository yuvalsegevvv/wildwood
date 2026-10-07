//@ Skill sets on the client: the toast when a piece is earned (the pieces themselves live in the skills panel's grids, economy/skills.js)
/* Agent map. Plan: docs/SKILL-SETS.md; the registry is shared/skillsets.js. Server event ssget [pid, setId, pos] (server/skillsets.js ssGrantP) calls ssOnGet from applyEvent (net/client.js).
   The Sets cards (a card for each set with its six tiles, locked ones with their source, the count and both bonuses) are not built: the pieces show in the normal grids once owned. Test: client-smoke. */
const SS_POS_WORD=['first','second','third'];
function ssOnGet(pid,setId,pos){
  if(pid!==NET.pid||!SS_SETS[setId]) return;
  const S=SS_SETS[setId];
  toast(S.char.name+'\'s '+SS_POS_WORD[pos-1]+' signature skill and passive are yours: '+SKILLS[S.pos[pos].ids[0]].name,'good');
  if(!$('#skills').hidden) renderSkills();
}
