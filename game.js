import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = id => document.getElementById(id);
const saved = Number(localStorage.hafjellCoins || 0);
let coins = Number.isFinite(saved) && saved >= 0 ? saved : 0, selected = 'albert', running = false, startTime, elapsed = 0, animation;
let skis = Math.max(0, Math.min(2, Number.parseInt(localStorage.hafjellSkis || 0, 10) || 0));
const upgrades = [{name:'Hafjell Rental', speed:1, cost:0}, {name:'Fjell Carbon', speed:1.12, cost:120}, {name:'Olympic Pro', speed:1.27, cost:300}];
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if(e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
addEventListener('blur', () => Object.keys(keys).forEach(k => keys[k] = false));

document.querySelectorAll('.rider').forEach(b => b.onclick = () => { selected = b.dataset.rider; document.querySelectorAll('.rider').forEach(x => x.classList.toggle('selected', x === b)); });
$('start').onclick = startGame; $('again').onclick = startGame;
$('shop-open').onclick = () => { $('shop').classList.remove('hidden'); renderShop(); };
$('finish-shop').onclick = () => { $('finish').classList.add('hidden'); $('shop').classList.remove('hidden'); renderShop(); };
document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => $('shop').classList.add('hidden'));
$('menu-coins').textContent = `${coins} kr`;
function renderShop(){ $('shop-items').innerHTML = upgrades.map((u,i)=>`<div class="shop-item ${i===skis?'owned':''}"><div><h3>${u.name}</h3><p>${i ? `+${Math.round((u.speed-1)*100)}% FART` : 'STANDARD SKI'}</p></div><button class="buy" data-buy="${i}" ${i<=skis||u.cost>coins?'disabled':''}>${i<=skis?'EJET':u.cost+' kr'}</button></div>`).join(''); document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const i=+b.dataset.buy; coins-=upgrades[i].cost; skis=i; save(); renderShop();}); }
function save(){localStorage.hafjellCoins=coins;localStorage.hafjellSkis=skis;$('menu-coins').textContent=`${coins} kr`;$('coins').textContent=`${coins} kr`}

const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x9db6bc, 30, 180);
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 300); const renderer = new THREE.WebGLRenderer({canvas:$('world'),antialias:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.shadowMap.enabled=true;
scene.add(new THREE.HemisphereLight(0xeaf5ff,0x3d5148,2)); const sun=new THREE.DirectionalLight(0xfff2d8,3); sun.position.set(-30,70,30); sun.castShadow=true; scene.add(sun);
const mat=(c,rough=1)=>new THREE.MeshStandardMaterial({color:c,roughness:rough});
const snow=mat(0xe6f0ee), pine=mat(0x1c3d3b), darkPine=mat(0x122c2c), orange=mat(0xef633e), cabin=mat(0x7c4430);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(140,300),snow); ground.rotation.x=-Math.PI/2; ground.position.y=-.8; ground.position.z=-80; ground.receiveShadow=true; scene.add(ground);
// Track runs down negative Z. Trees and piste markers give mountain scale.
for(let z=15;z>-210;z-=9){ for(const side of [-1,1]){let x=side*(10+Math.random()*17); const h=4+Math.random()*7; const t=new THREE.Mesh(new THREE.ConeGeometry(2.2,h,7),Math.random()>.5?pine:darkPine);t.position.set(x,h/2-0.7,z+Math.random()*5);t.castShadow=true;scene.add(t);} }
function box(w,h,d,m,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o}
// Hafjell Burger Bar at finish and piste signs.
box(11,3,5,cabin,0,1,-205); box(11.5,.3,5.5,orange,0,2.7,-205); box(7,.5,.2,mat(0xf5e4bd),0,2.2,-207.6);
for(let z of [5,-70,-140]){box(.12,2,.12,orange,-7,1,z);box(.12,2,.12,orange,7,1,z);}
const course = box(14,.03,225,mat(0xdbe9e8),0,-.75,-95); course.receiveShadow=true;
function skier(color, skiColor, helmet, x){const g=new THREE.Group(); const body=new THREE.Mesh(new THREE.CapsuleGeometry(.42,1.15,5,8),mat(color));body.position.y=1.1;body.castShadow=true;g.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.32,12,8),mat(helmet));head.position.y=2;g.add(head);for(const dx of [-.22,.22]){const s=new THREE.Mesh(new THREE.BoxGeometry(.08,.06,2.1),mat(skiColor));s.position.set(dx,.05,.1);s.rotation.y=.05;g.add(s)}const pole=mat(0x444b4e);for(const dx of [-.55,.55]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,1.4),pole);p.position.set(dx,.7,.1);p.rotation.z=dx>0?.35:-.35;g.add(p)}g.position.set(x,0,5);scene.add(g);return g}
const p1=skier(0x151719,0x3976df,0xe13535,-2.8), p2=skier(0x172d5a,0xd9363c,0xd9363c,2.8);
let state={p1:{z:5,x:-2.8,score:0,fell:0,trick:0},p2:{z:5,x:2.8,score:0,fell:0,trick:0}};
function reset(){state={p1:{z:5,x:-2.8,score:0,fell:0,trick:0},p2:{z:5,x:2.8,score:0,fell:0,trick:0}};p1.position.set(-2.8,0,5);p2.position.set(2.8,0,5);p1.rotation.set(0,0,0);p2.rotation.set(0,0,0);Object.keys(keys).forEach(k=>keys[k]=false);save();}
function startGame(){ $('menu').classList.add('hidden');$('shop').classList.add('hidden');$('game').classList.remove('hidden');$('finish').classList.add('hidden');reset();running=true;startTime=performance.now();cancelAnimationFrame(animation);loop();}
function control(p, mesh, isOne, dt){const left=isOne?'a':'arrowleft',right=isOne?'d':'arrowright',go=isOne?'w':'arrowup',brake=isOne?'s':'arrowdown';const speed=2.2*upgrades[skis].speed*(keys[go]?1.25:1)*(keys[brake]?.35:1);if(keys[left])p.x-=dt*7;if(keys[right])p.x+=dt*7;p.x=Math.max(-6.2,Math.min(6.2,p.x));p.z-=dt*speed;const trick=keys[' '];if(trick&&!p.trick){p.trick=1;p.score+=Math.round(100*upgrades[skis].speed);mesh.rotation.z+=Math.PI*2}p.trick=trick?1:0;return speed;}
function loop(now=performance.now()){if(!running)return;const dt=Math.min(.04,(now-(loop.last||now))/1000);loop.last=now;elapsed=(now-startTime)/1000;control(state.p1,p1,true,dt);control(state.p2,p2,false,dt);for(const [obj,p] of [[p1,state.p1],[p2,state.p2]]){obj.position.x+=(p.x-obj.position.x)*.2;obj.position.z=p.z;obj.position.y=Math.sin(now/90+p.z)*.03}camera.position.lerp(new THREE.Vector3(0,8,Math.min(state.p1.z,state.p2.z)+13),.08);camera.lookAt(0,0,Math.min(state.p1.z,state.p2.z)-18);$('timer').textContent=new Date(elapsed*1000).toISOString().slice(14,22);$('coins').textContent=`${coins} kr`;$('p1-score').textContent=`TRICKS ${state.p1.score}`;$('p2-score').textContent=`TRICKS ${state.p2.score}`;$('p1-bar').style.width=`${Math.min(100,state.p1.score/8)}%`;$('p2-bar').style.width=`${Math.min(100,state.p2.score/8)}%`;$('hud-piste').textContent=Math.min(23,Math.max(3,Math.round(3+(5-state.p1.z)*.1)))<15?'PISTE 3':'PISTE 23';renderer.render(scene,camera);if(Math.min(state.p1.z,state.p2.z)<-198)finish();else animation=requestAnimationFrame(loop)}
function finish(){running=false;const trick=state.p1.score+state.p2.score, time=Math.max(0,Math.round(700-elapsed*18)), prize=Math.max(50,Math.round(100+trick/3+time/4));coins+=prize;save();$('result-tricks').textContent=trick;$('result-time').textContent=`${time} pts`;$('result-money').textContent=`${prize} kr`;$('finish').classList.remove('hidden');}

// Piste 3 is green, piste 23 is blue: simple resort-style marker panels.
function sign(number, color, z){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=color;c.fillRect(0,0,256,128);c.fillStyle='white';c.font='bold 78px sans-serif';c.textAlign='center';c.fillText(number,128,88);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas)}));s.scale.set(2.5,1.25,1);s.position.set(0,2.5,z);scene.add(s)}
sign('3','#229447',-25);sign('23','#2b78bc',-125);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});renderer.setSize(innerWidth,innerHeight);renderShop();
