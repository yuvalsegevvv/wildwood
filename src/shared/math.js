//@ Shared math: TAU, DEG, AR (random range), APick, angDiff, angLerp. Pure: runs in the browser and on the server.
const TAU = Math.PI*2, DEG = Math.PI/180;
const AR=(a,b)=>a+(b-a)*Math.random();
const APick=a=>a[Math.floor(Math.random()*a.length)];
const angDiff=(a,b)=>((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;
function angLerp(a,b,t){ let d=((b-a+Math.PI)%TAU+TAU)%TAU-Math.PI; return a+d*t; }
