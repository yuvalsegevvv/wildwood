//@ Element helpers for the interface: the icon of each element (elSvg) and the coloured name chip (elChip) used by the skills panel, the presets and the item details
/* Agent map. Exports: ELEM_ICON, elSvg(el), elChip(el). Names and colours come from ELEMS (shared/elements.js). Used by: economy/skills.js, presets.js, ui/combat-hud.js, the skill-set panel.
   (This file held the Soul Hall panel too; the soul was removed.) Test: client-smoke. */
const ELEM_ICON={
  basic:'<circle cx="12" cy="12" r="7"/>',
  fire:'<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5"/>',
  water:'<path d="M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"/>',
  earth:'<path d="M3 20l6-11 4 6 3-4 5 9z"/>',
  air:'<path d="M3 8h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h7"/>',
  dark:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
  light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'
};
const elSvg=el=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ELEM_ICON[el]||ELEM_ICON.basic}</svg>`;
const elChip=el=>`<span class="el-chip" style="--el:${ELEMS[el].col}">${elSvg(el)}${ELEMS[el].name}</span>`;
