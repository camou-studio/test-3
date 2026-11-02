
import * as THREE from "three";

/* CAMOU — GLOBE & MOTION COMPASS */

const CONFIG = {
  radius: 3.2,
  desktopZoom: 8.2,
  mobileZoom: 8.4,
  minZoom: 6,
  maxZoom: 17,
  dragSpeed: 0.0052,
  friction: 0.94,
  gradientStrength: 0.75,
  gradientSoftness: 0.85
};

const ASSETS = {
  home: new URL("./assets/hero.jpg", import.meta.url).href,
  homeVideo: new URL("./assets/test.webm", import.meta.url).href,
  music: new URL("./assets/release.jpg", import.meta.url).href,
  visuals: new URL("./assets/visuals.jpg", import.meta.url).href,
  archive: new URL("./assets/archive.jpg", import.meta.url).href,
  contact: new URL("./assets/contact.jpg", import.meta.url).href
};

const sections = [
  {
    name: "HOME", poleLetter: "c",
    eyebrow: "NEW PROJECT / 001",
    title: ["c a m o u"],
    body: ["Gleiche Fragen.", "Neue Perspektiven."],
    image: ASSETS.home
  },
  {
    name: "MUSIC", poleLetter: "a",
    eyebrow: "LATEST RELEASE",
    title: ["f r a g m e n t e"],
    body: [
      "Ein Song zwischen Licht und Schatten.",
      "Zwischen dem, was man sieht –",
      "und dem, was bleibt."
    ],
    image: ASSETS.music
  },
  {
    name: "VISUALS", poleLetter: "m",
    eyebrow: "02 — VISUAL WORK",
    title: ["Visuals"],
    body: [
      "Bilder, die bleiben.",
      "Momente, die verschwinden."
    ],
    image: ASSETS.visuals
  },
  {
    name: "ECHOES", poleLetter: "o",
    eyebrow: "03 — SELECTED WORKS",
    title: ["Echoes"],
    body: [
      "Songs und Spuren, die an",
      "verschiedenen Orten widerhallen."
    ],
    image: ASSETS.archive
  },
  {
    name: "CONTACT", poleLetter: "u",
    eyebrow: "04 — GET IN TOUCH",
    title: ["Contact"],
    body: [
      "Für Anfragen und Zusammenarbeit.",
      "Oder einfach für ein Gespräch."
    ],
    image: ASSETS.contact,
    extra: ["camou.kontakt@gmail.com"]
  }
];

const $ = id => document.getElementById(id);
const container = $("globe");
const stage = document.querySelector(".globe-stage");
const navButtons = [...document.querySelectorAll(".nav-link")];

const mobile = matchMedia("(max-width:700px)").matches;
const defaultZoom = mobile ? CONFIG.mobileZoom : CONFIG.desktopZoom;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#101411");

const camera = new THREE.PerspectiveCamera(
  38,
  Math.max(1, container.clientWidth) /
    Math.max(1, container.clientHeight),
  0.1, 100
);

let currentZoom = defaultZoom;
camera.position.z = currentZoom;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xddebd8, 1.15));

const light = new THREE.DirectionalLight(0xe3f0dc, 2.1);
light.position.set(-3, 4, 5);
scene.add(light);

const rim = new THREE.PointLight(0x9bb99a, 24, 15);
rim.position.set(4, -1, -3);
scene.add(rim);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(CONFIG.radius, 160, 112),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02
  })
);
globeGroup.add(globe);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(CONFIG.radius * 1.012, 96, 64),
  new THREE.MeshBasicMaterial({
    color: 0xa9bd9f,
    transparent: true,
    opacity: 0.055,
    side: THREE.BackSide
  })
);
globeGroup.add(atmosphere);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const sectionStep = Math.PI * 2 / 5;
const pointers = new Map();

let rotationX = 0, rotationY = 0;
let velocityX = 0, velocityY = 0;
let previousX = 0, previousY = 0, lastTime = 0;
let isDragging = false, menuAnimating = false;
let targetRotationY = 0, pointerStart = null;
let pinchDistance = 0, pinchZoom = currentZoom;

let globeCanvas, globeContext, globeTexture;
let baseTextureCanvas;
let echoesImage;

const homeVideo = document.createElement("video");
homeVideo.src = ASSETS.homeVideo;
homeVideo.loop = true;
homeVideo.playsInline = true;
homeVideo.preload = "auto";
homeVideo.volume = 1;

let homeVideoStarted = false;
let homeVideoPlaying = false;
let homeVideoStarting = false;

/* BILDER */

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      const g = c.getContext("2d");
      const grad = g.createLinearGradient(0, 0, 1024, 1024);
      grad.addColorStop(0, "#354a39");
      grad.addColorStop(1, "#0a1510");
      g.fillStyle = grad;
      g.fillRect(0, 0, 1024, 1024);
      resolve(c);
    };
    img.src = src;
  });
}

function cover(ctx, image, x, y, w, h) {
  const iw = image.videoWidth || image.naturalWidth || image.width;
  const ih = image.videoHeight || image.naturalHeight || image.height;
  if (!iw || !ih) return;
  const s = Math.max(w / iw, h / ih);
  const sw = w / s, sh = h / s;
  ctx.drawImage(
    image, (iw - sw) / 2, (ih - sh) / 2,
    sw, sh, x, y, w, h
  );
}

function playButton(ctx, x, y) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8,13,10,.72)";
  ctx.fill();
  ctx.strokeStyle = "#f0f2eb";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 10);
  ctx.lineTo(x + 11, y);
  ctx.lineTo(x - 6, y + 10);
  ctx.closePath();
  ctx.fillStyle = "#f0f2eb";
  ctx.fill();
  ctx.restore();
}

/* NAHTLOSE FARBVERLÄUFE */

const COLORS = [
  [[24,36,28],[32,47,36],[15,25,19]],
  [[20,33,28],[29,43,37],[13,23,20]],
  [[27,39,29],[36,49,36],[17,26,19]],
  [[17,29,23],[26,40,31],[12,22,17]],
  [[29,39,29],[38,49,36],[19,27,20]]
];

const lerp = (a,b,t) => a+(b-a)*t;
const smooth = t => {
  t = Math.max(0, Math.min(1,t));
  return t*t*(3-2*t);
};
const mix = (a,b,t) => a.map((v,i)=>lerp(v,b[i],t));

function sectionColor(p,v) {
  p = ((p%5)+5)%5;
  const i = Math.floor(p), f = p-i;
  const blend = lerp(
    f,(1-Math.cos(f*Math.PI))/2,CONFIG.gradientSoftness
  );
  const vertical = c => v < .5
    ? mix(c[0],c[1],smooth(v*2))
    : mix(c[1],c[2],smooth((v-.5)*2));
  return mix(
    [26,39,30],
    mix(vertical(COLORS[i]),vertical(COLORS[(i+1)%5]),blend),
    CONFIG.gradientStrength
  );
}

function drawBackground(ctx,w,h) {
  const small = document.createElement("canvas");
  small.width=1024; small.height=512;
  const g=small.getContext("2d");
  const image=g.createImageData(1024,512);

  for(let y=0;y<512;y++) {
    const v=y/511;
    for(let x=0;x<1024;x++) {
      const u=x/1024;
      const pole=smooth(Math.min(1,Math.min(v,1-v)/.24));
      const c=mix(
        [22,34,26],
        sectionColor((u-.25)*5,v),
        pole
      );
      const light=(
        1+.035*Math.cos(2*Math.PI*(u-.25))*Math.sin(Math.PI*v)
      )*(1-.07*Math.pow(Math.abs(v-.5)*2,2));
      const j=(y*1024+x)*4;
      for(let k=0;k<3;k++) image.data[j+k]=c[k]*light;
      image.data[j+3]=255;
    }
  }
  g.putImageData(image,0,0);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality="high";
  ctx.drawImage(small,0,0,w,h);
}

/* ECHOES — ANALOGER SOCIAL-KOMPASS */

const SOCIAL = [
  {
    name:"SPOTIFY", angle:-Math.PI/2,
    url:"https://open.spotify.com/intl-de/artist/7pajHvUWNCnOPhDPyH4M6x"
  },
  {
    name:"APPLE", angle:0,
    url:"https://music.apple.com/ch/artist/b3nn3t/1786857463"
  },
  {
    name:"YOUTUBE", angle:Math.PI/2,
    url:"https://www.youtube.com/@b333nn3t"
  },
  {
    name:"INSTAGRAM", angle:Math.PI,
    url:"https://www.instagram.com/b3nn3t"
  }
];

const compassRadius=132;
const compassCenterY=2048*(.475+.19/2);

let needleAngle=0;
let targetNeedleAngle=0;
let fallbackAngle=0;
let lastGlobeX=0, lastGlobeY=0;
let lastCompassDraw=0;

/* BEWEGUNGSSENSOREN

   Alle verfügbaren Standard-Ereignisse werden
   ohne automatische Berechtigungsabfrage abonniert.

   Es werden relative Bewegungen verwendet,
   keine geografischen Kompassrichtungen.
*/

let motionAngle=0;
let motionLastAt=0;
let orientationPrevious=null;
let motionPreviousTime=0;
let motionEnabled=true;
let motionStatus="Warte auf Bewegungsdaten …";

const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function registerMotion(delta) {
  if(!motionEnabled || !Number.isFinite(delta)) return;
  motionAngle=wrapAngle(motionAngle+clamp(delta,-.18,.18));
  motionLastAt=performance.now();
  motionStatus="Bewegungssensor aktiv";
}

function onOrientation(event) {
  if(!motionEnabled) return;
  const alpha=event.alpha, beta=event.beta, gamma=event.gamma;
  if(![alpha,beta,gamma].some(Number.isFinite)) return;

  const current={alpha,beta,gamma};

  if(orientationPrevious) {
    const difference=(a,b)=>
      Number.isFinite(a)&&Number.isFinite(b)
        ? wrapAngle((a-b)*Math.PI/180)
        : 0;

    const da=difference(alpha,orientationPrevious.alpha);
    const db=difference(beta,orientationPrevious.beta);
    const dg=difference(gamma,orientationPrevious.gamma);

    registerMotion(-da*.85+db*.35+dg*.55);
  } else {
    motionLastAt=performance.now();
    motionStatus="Bewegungssensor aktiv";
  }

  orientationPrevious=current;
}

window.addEventListener(
  "deviceorientation",onOrientation,{passive:true}
);
window.addEventListener(
  "deviceorientationabsolute",onOrientation,{passive:true}
);

// Zusätzliche Bewegungsimpulse bei Geräten,
// die keine brauchbaren Orientierungsdaten liefern.

window.addEventListener("devicemotion",event=>{
  if(!motionEnabled) return;

  // Orientierung hat Vorrang, wenn sie bereits läuft.
  if(performance.now()-motionLastAt<450) return;

  const r=event.rotationRate;
  const a=event.accelerationIncludingGravity;

  const now=performance.now();
  const dt=motionPreviousTime
    ? Math.min(.1,(now-motionPreviousTime)/1000)
    : .016;
  motionPreviousTime=now;

  if(r && [r.alpha,r.beta,r.gamma].some(Number.isFinite)) {
    const impulse=(
      (Number(r.alpha)||0)*-.85+
      (Number(r.beta)||0)*.35+
      (Number(r.gamma)||0)*.55
    )*Math.PI/180*dt;
    registerMotion(impulse);
  } else if(a && Number.isFinite(a.x) && Number.isFinite(a.y)) {
    // Kleine Reaktion auf Neigungs-/Beschleunigungsänderung.
    registerMotion(clamp((a.x-a.y)*.0005,-.012,.012));
  }
},{passive:true});

/* OPTIONALER SENSOR-SCHALTER */

const sensorBox=document.createElement("div");
sensorBox.id="camou-motion-control";
sensorBox.hidden=true;
sensorBox.innerHTML=`
  <label style="display:flex;align-items:center;gap:9px;
                justify-content:center;cursor:pointer">
    <input type="checkbox" id="camou-motion-check"
           style="width:17px;height:17px;accent-color:#b6c5aa">
    <span>Bewegungssteuerung aktivieren</span>
  </label>
  <div id="camou-motion-status" role="status"
       style="font-size:10px;color:#b6c5aa;margin-top:8px">
    Warte auf Bewegungsdaten …
  </div>
`;

Object.assign(sensorBox.style,{
  position:"absolute",
  left:"50%",
  bottom:"9%",
  transform:"translateX(-50%)",
  zIndex:"30",
  background:"rgba(13,22,16,.90)",
  border:"1px solid rgba(220,235,215,.3)",
  borderRadius:"9px",
  padding:"10px 14px",
  color:"#edf1e9",
  fontFamily:"DM Mono, monospace",
  fontSize:"11px",
  textAlign:"center",
  maxWidth:"90%",
  width:"max-content",
  touchAction:"manipulation"
});

stage.appendChild(sensorBox);

const sensorCheck=$("camou-motion-check");
const sensorStatus=$("camou-motion-status");

sensorBox.addEventListener("pointerdown",e=>e.stopPropagation());
sensorBox.addEventListener("pointerup",e=>e.stopPropagation());
sensorBox.addEventListener("pointermove",e=>e.stopPropagation());

sensorCheck.addEventListener("change",async()=>{
  if(!sensorCheck.checked) {
    motionEnabled=false;
    orientationPrevious=null;
    sensorStatus.textContent="Bewegungssteuerung pausiert";
    return;
  }

  motionEnabled=true;

  if(!isSecureContext) {
    sensorCheck.checked=false;
    motionEnabled=false;
    sensorStatus.textContent="HTTPS erforderlich";
    return;
  }

  // Die Freigabe wird NUR durch das Häkchen
  // ausgelöst, niemals automatisch.
  try {
    const requests=[];

    if(typeof DeviceOrientationEvent!=="undefined" &&
       typeof DeviceOrientationEvent.requestPermission==="function") {
      requests.push(DeviceOrientationEvent.requestPermission());
    }

    if(typeof DeviceMotionEvent!=="undefined" &&
       typeof DeviceMotionEvent.requestPermission==="function") {
      requests.push(DeviceMotionEvent.requestPermission());
    }

    if(requests.length) {
      const results=await Promise.all(requests);
      if(results.every(r=>r!=="granted")) {
        sensorCheck.checked=false;
        motionEnabled=false;
        sensorStatus.textContent="Sensorfreigabe abgelehnt";
        return;
      }
    }

    orientationPrevious=null;
    sensorStatus.textContent="Warte auf Bewegungsdaten …";
  } catch(error) {
    console.warn("CAMOU Sensorfreigabe:",error);
    sensorCheck.checked=false;
    motionEnabled=false;
    sensorStatus.textContent="Freigabe nicht verfügbar";
  }
});

/* SOCIAL-SYMBOLE */

function socialIcon(ctx,name,x,y) {
  ctx.save();
  ctx.translate(x,y);
  ctx.strokeStyle="#eef5eb";
  ctx.fillStyle="#eef5eb";
  ctx.lineWidth=2.7;
  ctx.lineCap="round";
  ctx.lineJoin="round";

  if(name==="SPOTIFY") {
    for(let i=0;i<3;i++) {
      ctx.beginPath();
      ctx.arc(0,8+i*3,17-i*4,Math.PI*1.18,Math.PI*1.83);
      ctx.stroke();
    }
  } else if(name==="APPLE") {
    ctx.font="bold 28px Arial";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText("♫",0,1);
  } else if(name==="YOUTUBE") {
    ctx.beginPath();
    ctx.roundRect(-17,-12,34,24,7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4,-7);
    ctx.lineTo(8,0);
    ctx.lineTo(-4,7);
    ctx.closePath();
    ctx.fill();
  } else if(name==="INSTAGRAM") {
    ctx.beginPath();
    ctx.roundRect(-15,-15,30,30,8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0,0,7,0,Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9,-9,2,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCompass(ctx,cx,cy) {
  ctx.save();

  const gradient=ctx.createRadialGradient(
    cx-32,cy-44,10,cx,cy,185
  );
  gradient.addColorStop(0,"#24372b");
  gradient.addColorStop(.7,"#0e1912");
  gradient.addColorStop(1,"#050b07");

  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.arc(cx,cy,174,0,Math.PI*2);
  ctx.fill();

  ctx.strokeStyle="rgba(230,242,224,.7)";
  ctx.lineWidth=2;
  ctx.stroke();

  ctx.strokeStyle="rgba(230,242,224,.25)";
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.arc(cx,cy,163,0,Math.PI*2);
  ctx.stroke();

  // Gradmarkierungen
  for(let i=0;i<120;i++) {
    const a=i*Math.PI/60-Math.PI/2;
    const major=i%10===0;
    const inner=major?148:i%5===0?154:159;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*inner,cy+Math.sin(a)*inner);
    ctx.lineTo(cx+Math.cos(a)*163,cy+Math.sin(a)*163);
    ctx.strokeStyle=major
      ?"rgba(240,248,237,.9)"
      :"rgba(240,248,237,.5)";
    ctx.lineWidth=major?1.8:.8;
    ctx.stroke();
  }

  // Richtungslinien
  ctx.strokeStyle="rgba(220,237,216,.18)";
  ctx.lineWidth=1;
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*58,cy+Math.sin(a)*58);
    ctx.lineTo(cx+Math.cos(a)*115,cy+Math.sin(a)*115);
    ctx.stroke();
  }

  // Rote/weisse Nadel
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(needleAngle);

  ctx.fillStyle="#ed4438";
  ctx.beginPath();
  ctx.moveTo(0,-112);
  ctx.lineTo(-12,8);
  ctx.lineTo(0,-3);
  ctx.lineTo(12,8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle="#e9eee5";
  ctx.beginPath();
  ctx.moveTo(0,112);
  ctx.lineTo(-12,-8);
  ctx.lineTo(0,3);
  ctx.lineTo(12,-8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Feste Social-Icons
  for(const item of SOCIAL) {
    const x=cx+Math.cos(item.angle)*compassRadius;
    const y=cy+Math.sin(item.angle)*compassRadius;
    ctx.fillStyle="#142019";
    ctx.beginPath();
    ctx.arc(x,y,27,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle="rgba(234,245,230,.75)";
    ctx.lineWidth=1.5;
    ctx.stroke();
    socialIcon(ctx,item.name,x,y);
  }

  ctx.fillStyle="#15231a";
  ctx.strokeStyle="#e1ebe0";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(cx,cy,9,0,Math.PI*2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle="#dbe7d6";
  ctx.beginPath();
  ctx.arc(cx,cy,3,0,Math.PI*2);
  ctx.fill();

  ctx.restore();
}

/* BEREICHE ZEICHNEN */

function drawPanel(ctx,section,image,cx,pw,h) {
  const x=cx-pw/2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x,0,pw,h);
  ctx.clip();

  const contentW=pw*.76;

  ctx.textAlign="center";
  ctx.textBaseline="middle";
  ctx.fillStyle="rgba(235,242,229,.82)";
  ctx.font="300 30px Manrope, Arial";
  ctx.fillText(section.poleLetter,cx,h*.020);

  ctx.textBaseline="alphabetic";
  ctx.fillStyle="rgba(232,239,226,.65)";
  ctx.font="500 21px 'DM Mono', monospace";
  ctx.fillText(section.eyebrow,cx,h*.24,contentW);

  ctx.fillStyle="#f0f2eb";
  ctx.font=section.name==="MUSIC"
    ?"300 45px Manrope, Arial"
    :"300 58px Manrope, Arial";

  const titleY=h*.31;
  section.title.forEach((line,i)=>{
    ctx.fillText(line,cx,titleY+i*76,contentW);
  });

  const bodyStart=titleY+(section.title.length-1)*76+100;
  ctx.fillStyle="rgba(235,239,230,.86)";
  ctx.font="300 22px Manrope, Arial";
  section.body.forEach((line,i)=>{
    ctx.fillText(line,cx,bodyStart+i*43,contentW);
  });

  if(section.extra) {
    ctx.fillStyle="#c1d0b7";
    ctx.font="500 18px 'DM Mono', monospace";
    section.extra.forEach((line,i)=>{
      ctx.fillText(
        line,cx,
        bodyStart+section.body.length*43+35+i*39,
        contentW
      );
    });
  }

  const iw=pw*.56, ih=h*.19;
  const ix=cx-iw/2, iy=h*.475;

  if(section.name==="ECHOES") {
    drawCompass(ctx,cx,iy+ih/2);
  } else {
    ctx.fillStyle="rgba(8,13,10,.9)";
    ctx.fillRect(ix-8,iy-8,iw+16,ih+16);

    ctx.save();
    ctx.beginPath();
    ctx.rect(ix,iy,iw,ih);
    ctx.clip();

    if(section.name==="HOME" &&
       homeVideoStarted &&
       homeVideo.readyState>=2) {
      cover(ctx,homeVideo,ix,iy,iw,ih);
    } else {
      cover(ctx,image,ix,iy,iw,ih);
      if(section.name==="HOME") {
        playButton(ctx,cx,iy+ih/2);
      }
    }
    ctx.restore();

    if(section.name==="MUSIC" ||
       section.name==="CONTACT") {
      ctx.fillStyle="#e2ebdc";
      ctx.font="300 45px Manrope, Arial";
      ctx.fillText("ÖFFNEN  ↗",cx,iy-23);
    }

    ctx.strokeStyle="rgba(226,235,220,.48)";
    ctx.lineWidth=2;
    ctx.strokeRect(ix,iy,iw,ih);
  }

  ctx.strokeStyle="rgba(226,235,220,.35)";
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(cx-contentW/2,h*.88);
  ctx.lineTo(cx+contentW/2,h*.88);
  ctx.stroke();

  ctx.fillStyle="rgba(232,239,226,.62)";
  ctx.font="19px 'DM Mono', monospace";
  ctx.fillText(
    `${String(sections.indexOf(section)+1).padStart(2,"0")} / 05`,
    cx,h*.92
  );

  ctx.restore();
}

function drawWrappedPanel(ctx,index,image) {
  const w=4096,h=2048,pw=w/5;
  const cx=w*(.25+index/5);
  drawPanel(ctx,sections[index],image,cx,pw,h);
  if(cx-pw/2<0) {
    drawPanel(ctx,sections[index],image,cx+w,pw,h);
  }
  if(cx+pw/2>w) {
    drawPanel(ctx,sections[index],image,cx-w,pw,h);
  }
}

async function createGlobeTexture() {
  const images=await Promise.all(
    [
      ASSETS.home,ASSETS.music,ASSETS.visuals,
      ASSETS.archive,ASSETS.contact
    ].map(loadImage)
  );

  echoesImage=images[3];

  globeCanvas=document.createElement("canvas");
  globeCanvas.width=4096;
  globeCanvas.height=2048;
  globeContext=globeCanvas.getContext("2d");

  drawBackground(globeContext,4096,2048);
  images.forEach((img,i)=>drawWrappedPanel(globeContext,i,img));

  baseTextureCanvas=document.createElement("canvas");
  baseTextureCanvas.width=4096;
  baseTextureCanvas.height=2048;
  baseTextureCanvas.getContext("2d")
    .drawImage(globeCanvas,0,0);

  globeTexture=new THREE.CanvasTexture(globeCanvas);
  globeTexture.colorSpace=THREE.SRGBColorSpace;
  globeTexture.wrapS=THREE.RepeatWrapping;
  globeTexture.anisotropy=
    renderer.capabilities.getMaxAnisotropy();

  return globeTexture;
}

createGlobeTexture().then(texture=>{
  globe.material.map=texture;
  globe.material.needsUpdate=true;
}).catch(console.error);

/* DYNAMISCHE TEXTUR */

function updateHomeVideoFrame() {
  if(!homeVideoStarted || !globeTexture ||
     homeVideo.readyState<2) return;

  const cx=4096*.25;
  const iw=4096/5*.56;
  const ih=2048*.19;
  const ix=cx-iw/2, iy=2048*.475;

  globeContext.save();
  globeContext.beginPath();
  globeContext.rect(ix,iy,iw,ih);
  globeContext.clip();
  cover(globeContext,homeVideo,ix,iy,iw,ih);
  globeContext.restore();

  if(homeVideo.paused) playButton(globeContext,cx,iy+ih/2);
  globeTexture.needsUpdate=true;
}

function refreshEchoesTexture() {
  if(!globeTexture || !baseTextureCanvas || !echoesImage) return;

  const w=4096,h=2048,pw=w/5;
  const cx=w*(.25+3/5);
  const x=cx-pw/2;

  globeContext.save();
  globeContext.beginPath();
  globeContext.rect(x,0,pw,h);
  globeContext.clip();
  globeContext.drawImage(baseTextureCanvas,0,0);
  globeContext.restore();

  drawPanel(globeContext,sections[3],echoesImage,cx,pw,h);
  globeTexture.needsUpdate=true;
}

/* NAVIGATION */

function currentIndex() {
  const n=Math.round(-rotationY/sectionStep);
  return ((n%5)+5)%5;
}

function updateIndicator() {
  const index=currentIndex();
  $("current-section").textContent=sections[index].name;
  $("section-number").textContent=
    `${String(index+1).padStart(2,"0")} / 05`;

  navButtons.forEach((b,i)=>{
    b.classList.toggle("active",i===index);
  });

  sensorBox.hidden=
    index!==3 || spotifyOpen || contactOpen;

  if(index===3 && sensorCheck.checked) {
    sensorStatus.textContent=motionStatus;
  } else if(index===3 && !sensorCheck.checked &&
            performance.now()-motionLastAt<2000) {
    sensorStatus.textContent="Sensor automatisch verfügbar";
  }
}

function goToSection(index) {
  const i=((index%5)+5)%5;
  rotationX=0;
  velocityX=velocityY=0;
  isDragging=false;
  pointers.clear();
  pointerStart=null;
  stage.classList.remove("dragging");

  let dest=-i*sectionStep;
  while(dest-rotationY>Math.PI) dest-=2*Math.PI;
  while(dest-rotationY< -Math.PI) dest+=2*Math.PI;

  targetRotationY=dest;
  menuAnimating=true;
}

navButtons.forEach(b=>{
  b.addEventListener("click",()=>{
    goToSection(Number(b.dataset.section));
  });
});

$("logo").addEventListener("click",e=>{
  e.preventDefault();
  goToSection(0);
});

/* SPOTIFY */

const spotifyModal=$("spotify-modal");
const spotifyPlayer=$("spotify-modal-player");
const spotifyClose=$("spotify-modal-close");
let spotifyOpen=false;

if(spotifyModal) document.body.appendChild(spotifyModal);

function openSpotifyModal() {
  if(!spotifyModal || spotifyOpen) return;
  spotifyOpen=true;
  velocityX=velocityY=0;
  isDragging=false;
  menuAnimating=false;
  spotifyModal.hidden=false;
  spotifyModal.style.display="flex";
  document.body.classList.add("spotify-dialog-open");
  if(spotifyPlayer) {
    spotifyPlayer.src=spotifyPlayer.dataset.src ||
      "https://open.spotify.com/embed/artist/7pajHvUWNCnOPhDPyH4M6x?theme=0";
  }
  spotifyClose?.focus({preventScroll:true});
}

function closeSpotifyModal() {
  if(!spotifyModal) return;
  spotifyOpen=false;
  spotifyModal.hidden=true;
  spotifyModal.style.display="none";
  document.body.classList.remove("spotify-dialog-open");
  spotifyPlayer?.removeAttribute("src");
}

spotifyClose?.addEventListener("click",closeSpotifyModal);
spotifyModal?.addEventListener("pointerdown",e=>{
  if(e.target===spotifyModal ||
     e.target.closest?.("[data-close-spotify]")) {
    closeSpotifyModal();
  }
});

/* CONTACT */

const CONTACT_SCRIPT_URL=
  "https://script.google.com/macros/s/AKfycby3SfFxFDJQZNL0PxI75Z0O_HyDZl_MoC2b8jcW5PLy0kwPAuiOnK9macrxFTaUboXftg/exec";

const contactModal=$("contact-modal");
const contactForm=$("contact-form");
const contactClose=$("contact-modal-close");
const contactStatus=$("contact-status");
const contactSubmit=$("contact-submit");

let contactOpen=false;
let contactSending=false;

if(contactModal) document.body.appendChild(contactModal);

function openContactModal() {
  if(!contactModal || contactOpen) return;
  contactOpen=true;
  velocityX=velocityY=0;
  isDragging=false;
  menuAnimating=false;
  contactModal.hidden=false;
  contactModal.style.display="flex";
  document.body.classList.add("contact-dialog-open");
  contactModal.querySelector('input[name="name"]')
    ?.focus({preventScroll:true});
}

function closeContactModal() {
  if(!contactModal) return;
  contactOpen=false;
  contactModal.hidden=true;
  contactModal.style.display="none";
  document.body.classList.remove("contact-dialog-open");
}

contactClose?.addEventListener("click",closeContactModal);
contactModal?.addEventListener("click",e=>{
  if(e.target===contactModal ||
     e.target.closest?.("[data-close-contact]")) {
    closeContactModal();
  }
});

contactForm?.addEventListener("submit",async e=>{
  e.preventDefault();
  if(contactSending || !contactForm.reportValidity()) return;

  contactSending=true;
  if(contactSubmit) contactSubmit.disabled=true;
  if(contactStatus) contactStatus.textContent=
    "Nachricht wird übertragen …";

  const data=new FormData(contactForm);
  data.set("privacy","zugestimmt");
  data.set("website","");

  try {
    await fetch(CONTACT_SCRIPT_URL,{
      method:"POST",
      body:data,
      mode:"no-cors"
    });
    if(contactStatus) contactStatus.textContent=
      "Übertragung abgeschlossen. Empfang nicht bestätigt.";
  } catch(error) {
    console.error(error);
    if(contactStatus) contactStatus.textContent=
      "Übertragung fehlgeschlagen.";
  } finally {
    contactSending=false;
    if(contactSubmit) contactSubmit.disabled=false;
  }
});

/* KUGEL-KLICKS */

function texturePoint(e) {
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set(
    (e.clientX-rect.left)/rect.width*2-1,
    -((e.clientY-rect.top)/rect.height*2-1)
  );
  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(globe)[0];
  if(!hit?.uv) return null;
  return {
    x:hit.uv.x*4096,
    y:(1-hit.uv.y)*2048
  };
}

function localX(point,index) {
  const cx=4096*(.25+index/5);
  return ((point.x-cx+6144)%4096)-2048;
}

function inImage(point,index) {
  return point &&
    Math.abs(localX(point,index))<=4096/5*.56/2 &&
    point.y>=2048*.475 &&
    point.y<=2048*(.475+.19);
}

function handleGlobeClick(e) {
  const index=currentIndex();
  const p=texturePoint(e);
  if(!p) return;

  if(index===1 && inImage(p,1)) {
    openSpotifyModal();
    return;
  }

  if(index===4 && inImage(p,4)) {
    openContactModal();
    return;
  }

  if(index===3) {
    const dx=localX(p,3);
    const dy=p.y-compassCenterY;
    const link=SOCIAL.find(s=>
      Math.hypot(
        dx-Math.cos(s.angle)*compassRadius,
        dy-Math.sin(s.angle)*compassRadius
      )<32
    );
    if(link) {
      window.open(link.url,"_blank","noopener,noreferrer");
      return;
    }
  }

  if(index!==0 || !inImage(p,0) || homeVideoStarting) return;

  if(homeVideoStarted && !homeVideo.paused) {
    homeVideo.pause();
    homeVideoPlaying=false;
    updateHomeVideoFrame();
    return;
  }

  homeVideoStarting=true;
  homeVideo.play().then(()=>{
    homeVideoStarted=true;
    homeVideoPlaying=true;
    homeVideoStarting=false;
    updateHomeVideoFrame();
  }).catch(error=>{
    homeVideoStarting=false;
    console.error(error);
    alert("Das HOME-Video konnte nicht gestartet werden.");
  });
}

/* ZOOM — DESKTOP UND MOBILE */

function setZoom(value) {
  currentZoom=clamp(value,CONFIG.minZoom,CONFIG.maxZoom);
  camera.position.z=currentZoom;
}

$("zoom-in")?.addEventListener("click",()=>{
  setZoom(currentZoom-.7);
});
$("zoom-out")?.addEventListener("click",()=>{
  setZoom(currentZoom+.7);
});
$("zoom-reset")?.addEventListener("click",()=>{
  setZoom(defaultZoom);
});

const zoomControls=document.querySelector(".zoom-controls");

for(const type of [
  "pointerdown","pointermove","pointerup","pointercancel"
]) {
  zoomControls?.addEventListener(type,e=>e.stopPropagation());
}

stage.addEventListener("wheel",e=>{
  if(e.target.closest(".zoom-controls")) return;
  e.preventDefault();
  setZoom(currentZoom+e.deltaY*.008);
},{passive:false});

/* DRAG UND TOUCH */

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

stage.addEventListener("pointerdown",e=>{
  if(spotifyOpen || contactOpen ||
     e.target!==renderer.domElement) return;

  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  pointerStart={x:e.clientX,y:e.clientY};
  stage.setPointerCapture(e.pointerId);

  if(pointers.size===1) {
    isDragging=true;
    previousX=e.clientX;
    previousY=e.clientY;
    lastTime=performance.now();
    velocityX=velocityY=0;
    menuAnimating=false;
    stage.classList.add("dragging");
    $("hint")?.classList.add("hidden");
  } else if(pointers.size===2) {
    isDragging=false;
    pointerStart=null;
    const pts=[...pointers.values()];
    pinchDistance=distance(pts[0],pts[1]);
    pinchZoom=currentZoom;
  }
});

stage.addEventListener("pointermove",e=>{
  if(!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

  if(pointers.size>=2) {
    const pts=[...pointers.values()];
    if(pinchDistance>0) {
      setZoom(pinchZoom/(distance(pts[0],pts[1])/pinchDistance));
    }
    return;
  }

  if(!isDragging) return;

  const now=performance.now();
  const dt=Math.max(1,now-lastTime);
  const dx=e.clientX-previousX;
  const dy=e.clientY-previousY;
  const factor=Math.min(dt/16,2);

  const mx=dx*CONFIG.dragSpeed;
  const my=dy*CONFIG.dragSpeed;

  rotationY+=mx;
  rotationX+=my;
  velocityY=mx/factor;
  velocityX=my/factor;

  previousX=e.clientX;
  previousY=e.clientY;
  lastTime=now;
  updateIndicator();
});

function releasePointer(e) {
  if(!pointers.has(e.pointerId)) return;

  if(e.type==="pointerup" && pointerStart &&
     distance(
       {x:e.clientX,y:e.clientY},
       pointerStart
     )<=7 && !spotifyOpen && !contactOpen) {
    handleGlobeClick(e);
  }

  pointerStart=null;
  pointers.delete(e.pointerId);

  if(pointers.size===0) {
    isDragging=false;
    stage.classList.remove("dragging");
  } else if(pointers.size===1) {
    const p=[...pointers.values()][0];
    previousX=p.x;
    previousY=p.y;
    lastTime=performance.now();
    velocityX=velocityY=0;
    isDragging=true;
  }
}

stage.addEventListener("pointerup",releasePointer);
stage.addEventListener("pointercancel",releasePointer);
stage.addEventListener("lostpointercapture",releasePointer);

/* TASTATUR */

window.addEventListener("keydown",e=>{
  if(e.key==="Escape") {
    if(contactOpen) closeContactModal();
    else if(spotifyOpen) closeSpotifyModal();
    return;
  }

  if(spotifyOpen || contactOpen) return;
  if(["INPUT","TEXTAREA","SELECT"].includes(
    document.activeElement?.tagName
  )) return;

  if(e.key==="ArrowRight") goToSection(currentIndex()+1);
  if(e.key==="ArrowLeft") goToSection(currentIndex()-1);
  if(e.key==="ArrowUp") rotationX-=.25;
  if(e.key==="ArrowDown") rotationX+=.25;
  if(e.key==="+" || e.key==="=") setZoom(currentZoom-.7);
  if(e.key==="-") setZoom(currentZoom+.7);
  if(e.key==="0") setZoom(defaultZoom);
});

/* ANIMATION */

function animate(now=0) {
  requestAnimationFrame(animate);

  if(!isDragging && menuAnimating) {
    const delta=targetRotationY-rotationY;
    rotationY+=delta*.055;
    if(Math.abs(delta)<.001) {
      rotationY=targetRotationY;
      menuAnimating=false;
    }
  } else if(!isDragging) {
    rotationY+=velocityY;
    rotationX+=velocityX;
    velocityY*=CONFIG.friction;
    velocityX*=CONFIG.friction;
    if(Math.abs(velocityY)<.00004) velocityY=0;
    if(Math.abs(velocityX)<.00004) velocityX=0;
  }

  globeGroup.rotation.set(rotationX,rotationY,0);

  if(homeVideoPlaying) updateHomeVideoFrame();

  // Nur bei fehlenden Sensordaten wird
  // die Kugeldrehung als Ersatz verwendet.
  const deltaX=rotationX-lastGlobeX;
  const deltaY=rotationY-lastGlobeY;
  lastGlobeX=rotationX;
  lastGlobeY=rotationY;

  fallbackAngle=wrapAngle(
    fallbackAngle+deltaY*.85+deltaX*.35
  );

  const sensorFresh=
    motionEnabled &&
    motionLastAt>0 &&
    performance.now()-motionLastAt<2500;

  targetNeedleAngle=sensorFresh
    ? motionAngle
    : fallbackAngle;

  const delta=wrapAngle(targetNeedleAngle-needleAngle);
  if(Math.abs(delta)>.0005) {
    needleAngle=wrapAngle(needleAngle+delta*.12);
    if(currentIndex()===3 && now-lastCompassDraw>32) {
      refreshEchoesTexture();
      lastCompassDraw=now;
    }
  }

  renderer.render(scene,camera);
  updateIndicator();
}

requestAnimationFrame(animate);

/* RESIZE */

function resize() {
  const w=Math.max(1,container.clientWidth);
  const h=Math.max(1,container.clientHeight);
  camera.aspect=w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
}

window.addEventListener("resize",resize);
setZoom(defaultZoom);
updateIndicator();
