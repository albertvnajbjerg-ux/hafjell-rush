import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = id => document.getElementById(id);
const saved = Number(localStorage.hafjellCoins || 120);
let coins = Number.isFinite(saved) && saved >= 0 ? Math.max(saved, 120) : 120, running = false, startTime, elapsed = 0, animation, shopReturnFinish = false;
const chosen = {p1: 'albert', p2: 'sidsel'};
const skierNames = {albert: 'ALBERT', sidsel: 'SIDSEL'};
const setText = (el, value) => { if (el.textContent !== value) el.textContent = value; };
let skis = Math.max(0, Math.min(2, Number.parseInt(localStorage.hafjellSkis || 0, 10) || 0));
const upgrades = [{name:'Hafjell lejeski', speed:1, cost:0}, {name:'Fjeld-carbon', speed:1.12, cost:120}, {name:'Olympisk pro', speed:1.27, cost:300}];
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if(e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
addEventListener('blur', () => Object.keys(keys).forEach(k => keys[k] = false));

document.querySelectorAll('[data-skier]').forEach(card => card.onclick = () => {
  const player = card.dataset.player, other = player === 'p1' ? 'p2' : 'p1', skier = card.dataset.skier;
  if (chosen[other] === skier) chosen[other] = chosen[player];
  chosen[player] = skier;
  for (const p of ['p1', 'p2']) {
    document.querySelectorAll(`[data-player="${p}"]`).forEach(c => c.classList.toggle('selected', chosen[p] === c.dataset.skier));
    applySkierLook(p === 'p1' ? p1 : p2, chosen[p]);
    setText($(p + '-name'), skierNames[chosen[p]]);
  }
});
$('start').onclick = startGame; $('again').onclick = startGame;
$('menu-back').onclick = exitToMenu; $('finish-menu').onclick = exitToMenu;
$('shop-open').onclick = () => { $('shop').classList.remove('hidden'); renderShop(); };
$('finish-shop').onclick = () => { shopReturnFinish = true; $('finish').classList.add('hidden'); $('shop').classList.remove('hidden'); renderShop(); };
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => {
  $('shop').classList.add('hidden');
  if (shopReturnFinish) { shopReturnFinish = false; $('finish').classList.remove('hidden'); }
  else if (!running) exitToMenu();
});
setText($('menu-coins'), `${coins} kr`);
function renderShop(){ $('shop-items').innerHTML = upgrades.map((u,i)=>{const owned=i<=skis, next=i===skis+1;return `<div class="shop-item ${i===skis?'owned':''}"><div><h3>${u.name}</h3><p>${i ? `+${Math.round((u.speed-1)*100)}% FART` : 'STANDARD SKI'}</p></div><button class="buy" data-buy="${i}" ${owned||!next||u.cost>coins?'disabled':''}>${owned?'EJET':!next?'LÅST':u.cost+' kr'}</button></div>`}).join(''); document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const i=+b.dataset.buy;if(i!==skis+1||coins<upgrades[i].cost)return;coins-=upgrades[i].cost;skis=i;save();renderShop();}); }
function save(){localStorage.hafjellCoins=coins;localStorage.hafjellSkis=skis;setText($('menu-coins'),`${coins} kr`);setText($('coins'),`${coins} kr`)}

const scene = new THREE.Scene(); scene.background = new THREE.Color(0xb7d0d8); scene.fog = new THREE.Fog(0xb7d0d8, 42, 190);
const camera = new THREE.PerspectiveCamera(58, innerWidth/innerHeight, .1, 300); const renderer = new THREE.WebGLRenderer({canvas:$('world'),antialias:true,powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.08; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
scene.add(new THREE.HemisphereLight(0xeaf6ff,0x52655f,2.1)); const sun=new THREE.DirectionalLight(0xfff4dc,3.2); sun.position.set(-35,80,25); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-30; sun.shadow.camera.right=30; sun.shadow.camera.top=30; sun.shadow.camera.bottom=-230; scene.add(sun);
const mat=(c,rough=1)=>new THREE.MeshStandardMaterial({color:c,roughness:rough});
const snow=mat(0xe9f2f1,.92), snowShadow=mat(0xc8d9dc,1), pine=mat(0x244744,1), darkPine=mat(0x153331,1), trunk=mat(0x4c3b2c), orange=mat(0xef633e,.8), cabin=mat(0x7c4430,.9), mountain=mat(0x728b91,1), mountainSnow=mat(0xdce8e8,.95);
const terrainY = z => -.8 + (z - 5) * .008;
function slope(mesh){ const pos=mesh.geometry.attributes.position; for(let i=0;i<pos.count;i++) pos.setZ(i, (-pos.getY(i)-80-5)*.008); pos.needsUpdate=true; mesh.geometry.computeVertexNormals(); }
const ground=new THREE.Mesh(new THREE.PlaneGeometry(140,300,1,24),snow); ground.rotation.x=-Math.PI/2; ground.position.y=-.8; ground.position.z=-80; slope(ground); ground.receiveShadow=true; scene.add(ground);
for(const side of [-1,1]){const bank=new THREE.Mesh(new THREE.SphereGeometry(1,16,8),snowShadow);bank.scale.set(8,2.5,125);bank.position.set(side*12,terrainY(-90)+1,-90);bank.receiveShadow=true;scene.add(bank);}
// Custom strip keeps distant mountains reading as a ridgeline, not blobs.
function ridge(points, z){const g=new THREE.BufferGeometry(), vertices=[];for(const [x,bottom,top] of points)vertices.push(x,bottom,z,x,top,z);const indices=[];for(let i=0;i<points.length-1;i++)indices.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g}
const ridgePoints=[[-70,-2.6,15],[-55,-2.6,23],[-40,-2.6,18],[-25,-2.6,29],[-10,-2.6,21],[5,-2.6,27],[20,-2.6,17],[35,-2.6,25],[50,-2.6,19],[70,-2.6,14]];
const mountainRidge=new THREE.Mesh(ridge(ridgePoints,-230),mountain);mountainRidge.castShadow=true;scene.add(mountainRidge);
const snowPoints=ridgePoints.map(([x,bottom,top])=>[x,top-2.2,top]);const snowRidge=new THREE.Mesh(ridge(snowPoints,-229.5),mountainSnow);snowRidge.castShadow=true;scene.add(snowRidge);
// Track runs down negative Z. Instancing keeps tree draw calls low.
const treeTrunkGeo=new THREE.CylinderGeometry(.12,.22,1,6), treeGeo=new THREE.ConeGeometry(2.2,1,8), treeData=[];
for(let z=15;z>-210;z-=9) for(const side of [-1,1]) treeData.push({x:side*(10+Math.random()*17),z:z+Math.random()*5,h:4+Math.random()*7});
const trunks=new THREE.InstancedMesh(treeTrunkGeo,trunk,treeData.length), trees=new THREE.InstancedMesh(treeGeo,pine,treeData.length), treeMatrix=new THREE.Matrix4();
treeData.forEach((t,i)=>{treeMatrix.makeScale(1,t.h*.38,1);treeMatrix.setPosition(t.x,t.h*.19-.7,t.z);trunks.setMatrixAt(i,treeMatrix);treeMatrix.makeScale(1,t.h,1);treeMatrix.setPosition(t.x,t.h/2-.45,t.z);trees.setMatrixAt(i,treeMatrix);});trunks.instanceMatrix.needsUpdate=true;trees.instanceMatrix.needsUpdate=true;trunks.castShadow=trees.castShadow=true;scene.add(trunks,trees);

function box(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o}
// Hafjell Burger Bar: compact timber finish hut with snow roof, windows and door.
box(11,3,5,cabin,0,1,-205); box(11.5,.3,5.5,snow,0,2.7,-205); box(7,.18,.2,mat(0xf5e4bd),0,2.35,-207.6);
box(2.2,1.25,.12,mat(0x8ac5d0,.35),-3,1.35,-207.58); box(2.2,1.25,.12,mat(0x8ac5d0,.35),3,1.35,-207.58); box(1.25,2,.14,mat(0x3b2825),0,1,-207.62);
function textSprite(text, color, width=5){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#17262a';c.fillRect(0,0,512,128);c.fillStyle=color;c.font='bold 48px sans-serif';c.textAlign='center';c.fillText(text,256,82);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas)}));s.scale.set(width,1.25,1);return s;}
const burgerSign=textSprite('BURGER BAR','#f6e4b8',6); burgerSign.position.set(0,3.55,-207.7); scene.add(burgerSign);
for(let z of [5,-70,-140]){box(.12,2,.12,orange,-7,1,z);box(.12,2,.12,orange,7,1,z);}
const course = box(14,.03,225,mat(0xdbe9e8),0,-.75,-95); course.receiveShadow=true; course.rotation.x=-.008;
// Piste 3 is green and broad; Piste 23 turns blue after the lower mountain junction.
function pisteAt(z){return z>-105?3:23;}
function marker(z, color){for(const x of [-6.7,6.7]){box(.09,1.8,.09,mat(color,.75),x,.15,z);box(.22,.08,.55,mat(color,.75),x,.98,z);}}
marker(-35,0x229447); marker(-115,0x2b78bc);
function limb(a,b,r,material){const d=new THREE.Vector3().subVectors(b,a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),8),material);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());o.castShadow=true;return o}
function skier(color, skiColor, helmet, x, gopro=false){const g=new THREE.Group(),skin=mat(0xc98268),cloth=mat(color,.82),red=mat(helmet,.72),black=mat(0x11171a,.35);g.userData.goproVisible=gopro;const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.48,4,8),cloth);torso.position.y=1.15;torso.rotation.x=-.28;torso.castShadow=true;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),skin);head.position.set(0,1.9,.02);head.castShadow=true;g.add(head);const helmetMesh=new THREE.Mesh(new THREE.SphereGeometry(.35,16,10,0,Math.PI*2,0,Math.PI*.65),red);helmetMesh.position.set(0,2.05,.02);helmetMesh.castShadow=true;g.add(helmetMesh);const strap=new THREE.Mesh(new THREE.TorusGeometry(.27,.018,6,16,Math.PI),black);strap.position.set(0,1.98,.08);strap.rotation.x=Math.PI/2;g.add(strap);const goggles=new THREE.Mesh(new THREE.BoxGeometry(.44,.1,.09),mat(0x142d3a,.12));goggles.position.set(0,1.94,.27);goggles.castShadow=true;g.add(goggles);const cameraGear=new THREE.Group();cameraGear.userData.gopro=true;if(gopro){const mount=new THREE.Mesh(new THREE.BoxGeometry(.1,.06,.08),black);mount.position.set(.18,2.35,.08);mount.rotation.z=-.35;cameraGear.add(mount);const cam=new THREE.Mesh(new THREE.BoxGeometry(.16,.13,.14),black);cam.position.set(.18,2.44,.16);cam.castShadow=true;cameraGear.add(cam);const lens=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.012,12),mat(0x79b7c5,.1));lens.rotation.x=Math.PI/2;lens.position.set(.18,2.44,.235);cameraGear.add(lens);}cameraGear.visible=gopro;g.add(cameraGear);const hip=new THREE.Vector3(0,.78,0), kneeL=new THREE.Vector3(-.2,.43,.02), kneeR=new THREE.Vector3(.2,.43,.02);g.add(limb(hip,kneeL,.13,cloth),limb(hip,kneeR,.13,cloth),limb(kneeL,new THREE.Vector3(-.2,.12,.12),.09,black),limb(kneeR,new THREE.Vector3(.2,.12,.12),.09,black));g.add(limb(new THREE.Vector3(-.32,1.4,0),new THREE.Vector3(-.58,.82,.08),.07,cloth),limb(new THREE.Vector3(.32,1.4,0),new THREE.Vector3(.58,.82,.08),.07,cloth));for(const dx of [-.22,.22]){const s=new THREE.Mesh(new THREE.BoxGeometry(.075,.055,2.2),mat(skiColor,.35));s.position.set(dx,.04,.05);s.castShadow=true;g.add(s);const bind=new THREE.Mesh(new THREE.BoxGeometry(.1,.05,.22),black);bind.position.set(dx,.11,.05);g.add(bind)}const pole=mat(0x444b4e,.3);for(const dx of [-.58,.58]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.45),pole);p.position.set(dx,.5,.15);p.rotation.z=dx>0?.35:-.35;g.add(p)}g.rotation.x=-.12;g.position.set(x,0,5);scene.add(g);return g}
const p1=skier(0x151719,0x3976df,0xe13535,-2.8,true), p2=skier(0x172d5a,0xd9363c,0xd9363c,2.8,true);
function addSnowSpray(mesh){const spray=new THREE.Group();for(let i=0;i<6;i++){const flake=new THREE.Mesh(new THREE.SphereGeometry(.06+Math.random()*.08,6,4),snow);flake.position.set((Math.random()-.5)*1.2,.2+Math.random()*.7,.35+Math.random()*.7);spray.add(flake);}spray.visible=false;mesh.add(spray);mesh.userData.spray=spray;}
addSnowSpray(p1);addSnowSpray(p2);
function applySkierLook(mesh, choice){const cloth=choice==='albert'?0x151719:0x172d5a, helmet=choice==='albert'?0xe13535:0xd9363c;mesh.children[0].material.color.setHex(cloth);mesh.children[2].material.color.setHex(helmet);mesh.children.forEach(c=>{if(c.position.y<.1&&c.material?.color)c.material.color.setHex(choice==='albert'?0x3976df:0xd9363c);});mesh.userData.goproVisible=choice==='albert';const cameraGear=mesh.children.find(c=>c.userData.gopro);if(cameraGear)cameraGear.visible=mesh.userData.goproVisible;}
const framePlayers=[[p1,'p1'],[p2,'p2']];
let state={p1:{z:5,x:-2.8,score:0,fell:0,trick:0,trickTime:0,fallTime:0,penalty:0,finished:false,finishTime:0},p2:{z:5,x:2.8,score:0,fell:0,trick:0,trickTime:0,fallTime:0,penalty:0,finished:false,finishTime:0}};
const cameraTarget=new THREE.Vector3();
function reset(){state={p1:{z:5,x:-2.8,score:0,fell:0,trick:0,trickTime:0,fallTime:0,penalty:0,finished:false,finishTime:0},p2:{z:5,x:2.8,score:0,fell:0,trick:0,trickTime:0,fallTime:0,penalty:0,finished:false,finishTime:0}};p1.position.set(-2.8,terrainY(5),5);p2.position.set(2.8,terrainY(5),5);p1.rotation.set(0,0,0);p2.rotation.set(0,0,0);applySkierLook(p1,chosen.p1);applySkierLook(p2,chosen.p2);Object.keys(keys).forEach(k=>keys[k]=false);loop.last=0;save();}
function exitToMenu(){running=false;shopReturnFinish=false;cancelAnimationFrame(animation);$('finish').classList.add('hidden');$('shop').classList.add('hidden');$('game').classList.add('hidden');$('menu').classList.remove('hidden');}
function startGame(){ shopReturnFinish=false;$('menu').classList.add('hidden');$('shop').classList.add('hidden');$('game').classList.remove('hidden');$('finish').classList.add('hidden');reset();running=true;startTime=performance.now();elapsed=0;loop();}
function control(p, mesh, isOne, dt){if(p.finished)return 0;const left=isOne?'a':'arrowleft',right=isOne?'d':'arrowright',go=isOne?'w':'arrowup',brake=isOne?'s':'arrowdown';if(p.fallTime){p.fallTime=Math.max(0,p.fallTime-dt);mesh.rotation.z+=dt*8;return 0;}if(p.trickTime){p.trickTime=Math.max(0,p.trickTime-dt);if(!keys[' '])p.trick=0;if(!p.trickTime){p.score+=Math.round(100*upgrades[skis].speed);mesh.rotation.z=0;}return 2.2*upgrades[skis].speed;}const piste=pisteAt(p.z),speed=2.2*upgrades[skis].speed*(piste===23?1.08:1)*(keys[go]?1.25:1)*(keys[brake]?.35:1);if(keys[left])p.x-=dt*7;if(keys[right])p.x+=dt*7;p.x=Math.max(-6.2,Math.min(6.2,p.x));p.z-=dt*speed;mesh.rotation.z+=(Math.max(-.35,Math.min(.35,(keys[left]?-1:0)+(keys[right]?1:0)))-mesh.rotation.z)*.18;mesh.rotation.x+=((keys[brake]?.35:-.12)-mesh.rotation.x)*.18;if(keys[' ']&&!p.trick){p.trick=1;p.trickTime=.55;mesh.rotation.z=Math.PI*2;const risky=Math.abs(p.x)>4.8||Math.random()<.16;if(risky){p.fell++;p.fallTime=1.1;p.penalty+=2;p.trickTime=0;mesh.rotation.z=.7;}}if(!keys[' '])p.trick=0;if(p.z<=-198){p.finished=true;p.finishTime=(performance.now()-startTime)/1000+p.penalty;}return speed;}
function loop(now=performance.now()){if(!running)return;const dt=Math.min(.04,(now-(loop.last||now))/1000);loop.last=now;control(state.p1,p1,true,dt);control(state.p2,p2,false,dt);elapsed=(now-startTime)/1000;for(let i=0;i<framePlayers.length;i++){const obj=framePlayers[i][0],p=state[framePlayers[i][1]];obj.position.x+=(p.x-obj.position.x)*.2;obj.position.z=p.z;obj.position.y=terrainY(p.z)+(p.fallTime?0:Math.sin(now/90+p.z)*.03);const left=i?'arrowleft':'a',right=i?'arrowright':'d',brake=i?'arrowdown':'s';obj.userData.spray.visible=!!p.fallTime||!!keys[left]||!!keys[right]||!!keys[brake];obj.userData.spray.rotation.y+=dt*4}const lead=Math.min(state.p1.z,state.p2.z);cameraTarget.set(0,5.7,lead+12);camera.position.lerp(cameraTarget,.08);camera.lookAt(0,.75,lead-16);const whole=Math.floor(elapsed),minutes=Math.floor(whole/60),seconds=whole%60,centis=Math.floor((elapsed-whole)*100);setText($('timer'),`${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(centis).padStart(2,'0')}`);setText($('p1-score'),`TRICKS ${state.p1.score} · FALD ${state.p1.fell}`);setText($('p2-score'),`TRICKS ${state.p2.score} · FALD ${state.p2.fell}`);$('p1-bar').style.width=`${Math.min(100,state.p1.score/8)}%`;$('p2-bar').style.width=`${Math.min(100,state.p2.score/8)}%`;setText($('hud-piste'),`PISTE ${pisteAt(state.p1.z)} · ${pisteAt(state.p1.z)===3?'GRØN':'BLÅ'}`);setText($('status'),state.p1.fallTime||state.p2.fallTime?'FALD · +2 SEKUND':state.p1.trickTime||state.p2.trickTime?'TRICK! · HOLD LINJEN':pisteAt(state.p1.z)===3?'HOLD DIN LINJE · GRØN PISTE':'BLÅ PISTE · SIDSTE SVING MOD BURGER BAR');renderer.render(scene,camera);if(state.p1.finished&&state.p2.finished)finish();else animation=requestAnimationFrame(loop)}
function formatTime(time){const whole=Math.floor(time),minutes=Math.floor(whole/60),seconds=whole%60,centis=Math.floor((time-whole)*100);return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(centis).padStart(2,'0')}`;}
function finish(){running=false;const winner=state.p1.finishTime<=state.p2.finishTime?'p1':'p2',prize=winner==='p1'?200:100,timeScore=Math.max(0,Math.round(1000-state[winner].finishTime*10));coins+=prize;save();setText($('result-p1'),formatTime(state.p1.finishTime));setText($('result-p2'),formatTime(state.p2.finishTime));setText($('result-winner'),`${skierNames[chosen[winner]]} (P${winner==='p1'?'1':'2'})`);setText($('result-timer'),formatTime(elapsed));setText($('result-trick-score'),`${state.p1.score+state.p2.score}`);setText($('result-time-score'),`${timeScore}`);setText($('result-money'),`${prize} kr`);$('finish').classList.remove('hidden');}

// Resort-style trail boards mark the real route: green piste 3 into blue piste 23.
function sign(number, color, z){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,256,128);c.fillStyle='white';c.font='bold 78px sans-serif';c.textAlign='center';c.fillText(number,128,88);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas)}));s.scale.set(2.5,1.25,1);s.position.set(0,2.5,z);scene.add(s)}
sign('3','#229447',-25);sign('23','#2b78bc',-125);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});renderer.setSize(innerWidth,innerHeight);renderShop();
// Keep first frame grounded before game starts.
camera.position.set(0,5.7,18);camera.lookAt(0,.75,-16);
