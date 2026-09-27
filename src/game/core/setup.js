//@ Page helpers ($), device flags (isTouch, LOW, LITE, Q), TAU/DEG
'use strict';
const $ = s => document.querySelector(s);
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const LOW = isTouch;
let LITE = false;
try{ LITE = localStorage.getItem('wildwood-lite')==='1'; }catch(_){}
const Q = LITE ? 0.4 : (LOW ? 0.62 : 1); // amount of vegetation
if (isTouch) document.body.classList.add('touch');

