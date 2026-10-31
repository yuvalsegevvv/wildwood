//@ Page helpers ($), device flags (isTouch, LOW, LITE, Q), TAU/DEG
'use strict';
const $ = s => document.querySelector(s);
const numC = n => Math.floor(Number(n)||0).toLocaleString('en-US');   // 107996475162 -> 107,996,475,162 (XP and big counts)
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
// graphics setting (Settings > Graphics, applied on reload): 'light' | 'medium' | 'high'; none = the default (a phone: medium, a computer: standard)
var GFX = ''; try{ GFX = localStorage.getItem('wildwood-gfx')||''; if(GFX!=='light'&&GFX!=='medium'&&GFX!=='high') GFX=''; }catch(_){}
const LOW = isTouch || GFX==='medium';
let LITE = GFX==='light';
try{ if(localStorage.getItem('wildwood-lite')==='1') LITE = true; }catch(_){}   // set by the renderer when a phone ran out of graphics memory
const HIGH = GFX==='high' && !LITE && !LOW;   // more vegetation, a sharper picture (a phone cannot ask for it)
const Q = LITE ? 0.4 : (LOW ? 0.62 : (HIGH ? 1.3 : 1)); // amount of vegetation
const VIEW_K = LITE ? 1 : (LOW ? 1.3 : (HIGH ? 2 : 1.7));   // view distance: the fog's far end (time-of-day.js applyEnv, 150-240 m at 1), the chunks grown ahead (streaming.js FAR_R) and the ground coloured ahead (generation-setup.js) all scale with it; a phone in light mode keeps 1
if (isTouch) document.body.classList.add('touch');

