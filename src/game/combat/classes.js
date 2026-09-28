//@ Classes and their abilities (CLASSES), combat state (CB), effect materials
/* ===================== COMBAT =====================
   Three classes, each with a basic attack and a special skill. */
const CB={target:null,act:null,cd:{basic:0,skill:0,burst:0},buff:null,projs:[],fx:[]};
const clsOf=()=>{ const w=GEAR&&ITEM[GEAR.eq.weapon]; return w?CLASS_OF[w.slot]:(CLASSES[LOOK.cls]?LOOK.cls:'warrior'); };
const fxMat=(color,op)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity:op===undefined?0.8:op,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
const emberMat=fxMat(0xff8a2a,0.9), boltMat=fxMat(0xff7a2a,0.95), boltCore=new THREE.MeshBasicMaterial({color:0xfff2c0});
const emberGeo=new THREE.SphereGeometry(0.09,6,5), boltGeo=new THREE.SphereGeometry(0.2,10,8), coreGeo=new THREE.SphereGeometry(0.1,8,6);
const arrowGeo=merge([pc(cyl(0.012,0.012,0.75,5).rotateX(Math.PI/2),c=>c.set(0x8a6a44)),pc(new THREE.ConeGeometry(0.03,0.09,6).rotateX(Math.PI/2).translate(0,0,0.41),c=>c.set(0x9aa0a6)),pc(vbox(0.004,0.05,0.12,0,0,-0.32),c=>c.set(0xe8e4dc)),pc(vbox(0.05,0.004,0.12,0,0,-0.32),c=>c.set(0xb4552f))]);
const ringGeo=new THREE.RingGeometry(0.62,0.78,40).rotateX(-Math.PI/2);
const targetRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xff5a4a,transparent:true,opacity:0.75,depthWrite:false,side:THREE.DoubleSide}));
targetRing.visible=false; scene.add(targetRing);

