
import * as THREE from "three";

/* =========================================
   CAMOU — 3D GLOBE
========================================= */

const CONFIG = {
  radius: 3.2,
  desktopZoom: 8.2,
  mobileZoom: 8.4,
  minZoom: 6.0,
  maxZoom: 17,
  dragSpeed: 0.0052,
  friction: 0.94
};

/* =========================================
   BILDER UND VIDEO
========================================= */

const ASSETS = {
  home: new URL("./assets/hero.jpg", import.meta.url).href,
  homeVideo: new URL("./assets/test.webm", import.meta.url).href,
  music: new URL("./assets/release.jpg", import.meta.url).href,
  visuals: new URL("./assets/visuals.jpg", import.meta.url).href,
  archive: new URL("./assets/archive.jpg", import.meta.url).href,
  contact: new URL("./assets/contact.jpg", import.meta.url).href
};

/* =========================================
   INHALTE DER FÜNF BEREICHE
========================================= */

const sections = [
  {
    name: "HOME",
    poleLetter: "c",
    eyebrow: "NEW PROJECT / 001",
    title: ["c a m o u"],
    body: [
      "Gleiche Fragen.",
      "Neue Perspektiven."
    ],
    image: ASSETS.home
  },
  {
    name: "MUSIC",
    poleLetter: "a",
    eyebrow: "LATEST RELEASE",
    title: ["f r a g m e n t e"],
    body: [
      "Ein Song zwischen Licht und Schatten.",
      "Zwischen dem, was man sieht –",
      "und dem, was bleibt."
    ],
    image: ASSETS.music,
    extra: []
  },
  {
    name: "VISUALS",
    poleLetter: "m",
    eyebrow: "02 — VISUAL WORK",
    title: ["Visuals"],
    body: [
      "Bilder, die bleiben.",
      "Momente, die verschwinden."
    ],
    image: ASSETS.visuals
  },
  {
    name: "ECHOES",
    poleLetter: "o",
    eyebrow: "03 — SELECTED WORKS",
    title: ["Echoes"],
    body: [
      "Songs und Spuren, die an",
      "verschiedenen Orten widerhallen."
    ],
    image: ASSETS.archive,
    extra: []
  },
  {
    name: "CONTACT",
    poleLetter: "u",
    eyebrow: "04 — GET IN TOUCH",
    title: ["Contact"],
    body: [
      "Für Anfragen und Zusammenarbeit.",
      "Oder einfach für ein Gespräch."
    ],
    image: ASSETS.contact,
    extra: [
      "camou.kontakt@gmail.com"
    ]
  }
];

/* =========================================
   ELEMENTE
========================================= */

const container = document.getElementById("globe");
const stage = document.querySelector(".globe-stage");

const sectionLabel = document.getElementById("current-section");
const sectionNumber = document.getElementById("section-number");
const hint = document.getElementById("hint");

const navButtons = [
  ...document.querySelectorAll(".nav-link")
];

const isMobile = window.matchMedia(
  "(max-width: 700px)"
).matches;

const defaultZoom = isMobile
  ? CONFIG.mobileZoom
  : CONFIG.desktopZoom;

/* =========================================
   THREE.JS SZENE
========================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color("#101411");

const camera = new THREE.PerspectiveCamera(
  38,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);

let currentZoom = defaultZoom;

camera.position.set(0, 0, currentZoom);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  container.clientWidth,
  container.clientHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

container.appendChild(renderer.domElement);

/* =========================================
   LICHT
========================================= */

scene.add(
  new THREE.AmbientLight(0xddebd8, 1.15)
);

const keyLight = new THREE.DirectionalLight(
  0xe3f0dc,
  2.1
);

keyLight.position.set(-3, 4, 5);
scene.add(keyLight);

const rimLight = new THREE.PointLight(
  0x9bb99a,
  24,
  15
);

rimLight.position.set(4, -1, -3);
scene.add(rimLight);

/* =========================================
   KUGELGRUPPE
========================================= */

const globeGroup = new THREE.Group();
scene.add(globeGroup);

/* =========================================
   HOME-VIDEO
========================================= */

const homeVideo = document.createElement("video");

homeVideo.src = ASSETS.homeVideo;
homeVideo.loop = true;
homeVideo.muted = false;
homeVideo.volume = 1;
homeVideo.playsInline = true;
homeVideo.preload = "auto";

let homeVideoPlaying = false;
let homeVideoStarted = false;
let homeVideoStarting = false;

let globeCanvas = null;
let globeContext = null;
let globeTexture = null;

/* =========================================
   BILDER LADEN
========================================= */

function loadImage(src) {
  return new Promise(resolve => {
    const image = new Image();

    image.onload = () => resolve(image);

    // Auch ohne mitgelieferte assets bleibt die Kugel sichtbar.
    image.onerror = () => {
      const fallback = document.createElement("canvas");
      fallback.width = 1024;
      fallback.height = 1024;
      const c = fallback.getContext("2d");
      const gradient = c.createLinearGradient(0, 0, 1024, 1024);
      gradient.addColorStop(0, "#354a39");
      gradient.addColorStop(0.5, "#1b3025");
      gradient.addColorStop(1, "#0a1510");
      c.fillStyle = gradient;
      c.fillRect(0, 0, 1024, 1024);
      c.strokeStyle = "rgba(220,240,215,0.13)";
      for (let i = -1024; i < 2048; i += 68) {
        c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 1024, 1024); c.stroke();
      }
      resolve(fallback);
    };

    image.decoding = "async";
    image.src = src;
  });
}

/* =========================================
   BILDER ZUSCHNEIDEN
========================================= */

function drawCoverCrop(ctx, image, x, y, w, h) {
  const sourceWidth =
    image.videoWidth ||
    image.naturalWidth ||
    image.width;

  const sourceHeight =
    image.videoHeight ||
    image.naturalHeight ||
    image.height;

  if (!sourceWidth || !sourceHeight) return;

  const scale = Math.max(
    w / sourceWidth,
    h / sourceHeight
  );

  const sw = w / scale;
  const sh = h / scale;

  const sx = (sourceWidth - sw) / 2;
  const sy = (sourceHeight - sh) / 2;

  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    x,
    y,
    w,
    h
  );
}

/* =========================================
   PLAY-BUTTON ZEICHNEN
========================================= */

function drawPlayButton(ctx, centerX, centerY, size) {
  const radius = size * 0.5;

  ctx.save();

  // Dezenter dunkler Kreis
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(8, 13, 10, 0.72)";
  ctx.fill();

  // Feiner heller Rand
  ctx.strokeStyle = "rgba(240, 245, 235, 0.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Play-Dreieck
  ctx.beginPath();

  ctx.moveTo(
    centerX - radius * 0.22,
    centerY - radius * 0.38
  );

  ctx.lineTo(
    centerX + radius * 0.42,
    centerY
  );

  ctx.lineTo(
    centerX - radius * 0.22,
    centerY + radius * 0.38
  );

  ctx.closePath();

  ctx.fillStyle = "#f0f2eb";
  ctx.fill();

  ctx.restore();
}

/* CONTACT ist eine echte CanvasTexture auf der Kugel. Die Eingabe selbst
   erfolgt kurzzeitig über ein natives Feld, damit Tastatur/IME funktionieren. */
const contactValues = { name:"", email:"", subject:"", message:"", privacy:false };
// Existing Google Apps Script endpoint from the supplied kontakt.html.
const CONTACT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3SfFxFDJQZNL0PxI75Z0O_HyDZl_MoC2b8jcW5PLy0kwPAuiOnK9macrxFTaUboXftg/exec";
let contactSending = false;
let contactStatus = "";
const contactHitAreas = [
  { key:"name",    label:"NAME",     x1:-280,x2:280,y1:650,y2:725 },
  { key:"email",   label:"E-MAIL",   x1:-280,x2:280,y1:738,y2:813 },
  { key:"subject", label:"BETREFF",  x1:-280,x2:280,y1:826,y2:901 },
  { key:"message", label:"NACHRICHT",x1:-280,x2:280,y1:914,y2:1170 },
  { key:"privacy", label:"DATENSCHUTZ",x1:-280,x2:280,y1:1183,y2:1245 },
  { key:"send",    label:"SENDEN",   x1:-280,x2:280,y1:1258,y2:1330 }
];
function contactText(ctx, value, x, y, maxWidth, lineHeight, maxLines) {
  const lines = String(value || "").split("\n"); let count=0;
  for (const paragraph of lines) {
    const words = paragraph.split(/\s+/); let line="";
    for (const word of words) {
      const test = line ? line+" "+word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line,x,y+count*lineHeight); count++; line=word;
        if(count>=maxLines)return;
      } else line=test;
    }
    ctx.fillText(line,x,y+count*lineHeight);count++;
    if(count>=maxLines)return;
  }
}
function drawContactPanel(ctx, section, centerX, panelW, canvasH) {
  const x=centerX-panelW/2;
  ctx.save();ctx.beginPath();ctx.rect(x,0,panelW,canvasH);ctx.clip();
  const bg=ctx.createLinearGradient(x,0,x+panelW,canvasH);
  bg.addColorStop(0,"#18221b");bg.addColorStop(.5,"#202c23");bg.addColorStop(1,"#111813");
  ctx.fillStyle=bg;ctx.fillRect(x,0,panelW,canvasH);
  ctx.textAlign="center";ctx.fillStyle="#d9e6d2";
  ctx.font="300 150px Manrope, Arial";ctx.fillText("u",centerX,canvasH*.115);
  ctx.font="500 21px 'DM Mono', monospace";ctx.fillStyle="#b8c9b0";
  ctx.fillText("04 — GET IN TOUCH",centerX,canvasH*.24,panelW*.8);
  ctx.font="300 58px Manrope, Arial";ctx.fillStyle="#f0f2eb";
  ctx.fillText("Contact",centerX,canvasH*.31,panelW*.8);
  ctx.textAlign="left";
  for(const a of contactHitAreas){
    const left=centerX+a.x1, width=a.x2-a.x1;
    const y=a.y1, h=a.y2-a.y1;
    // Dark fields provide the boundaries; only the action gets a subtle outline.
    ctx.strokeStyle="rgba(226,235,220,.17)";ctx.lineWidth=1;
    ctx.fillStyle="rgba(5,12,8,.5)";
    ctx.fillRect(left,y,width,h);
    if (a.key === 'send') ctx.strokeRect(left+.5,y+.5,width-1,h-1);
    if(a.key==='privacy'){
      ctx.save();
      ctx.strokeStyle="rgba(255,255,255,.95)";
      ctx.lineWidth=2;
      ctx.strokeRect(left+15.5,y+17.5,23,23);
      ctx.restore();
      if(contactValues.privacy){ctx.fillStyle="#ffffff";ctx.font="bold 21px Arial";ctx.fillText("✓",left+18,y+37);}
      ctx.fillStyle="#e2e9df";ctx.font="16px 'DM Mono',monospace";
      ctx.fillText("Angaben zur Bearbeitung speichern",left+49,y+38,width-70);
      continue;
    }
    if(a.key==='send'){
      ctx.fillStyle="#e9f1e4";ctx.font="500 20px 'DM Mono',monospace";
      ctx.textAlign="center";ctx.fillText(contactSending ? "WIRD GESENDET …" : "NACHRICHT SENDEN →",centerX,y+44,width-25);ctx.textAlign="left";
      continue;
    }
    ctx.fillStyle="#b5c5b0";ctx.font="500 15px 'DM Mono',monospace";
    ctx.fillText(a.label,left+15,y+22,width-30);
    ctx.fillStyle="#f0f2eb";ctx.font="500 15px 'DM Mono',monospace";
    const v=contactValues[a.key] || (a.key==='message'?"Hier Nachricht eingeben …":"Antippen zum Eingeben …");
    contactText(ctx,v,left+15,y+48,width-30,30,a.key==='message'?6:1);
  }
  ctx.fillStyle="#a9bda3";ctx.font="17px 'DM Mono',monospace";
  ctx.textAlign="center";ctx.fillText(contactStatus || "Datenschutz: siehe Impressum",centerX,1390,panelW*.75);
  ctx.strokeStyle="rgba(226,235,220,.35)";ctx.beginPath();
  ctx.moveTo(centerX-panelW*.38,canvasH*.88);ctx.lineTo(centerX+panelW*.38,canvasH*.88);ctx.stroke();
  ctx.fillStyle="#b5c5b0";ctx.font="19px 'DM Mono',monospace";
  ctx.fillText("05 / 05",centerX,canvasH*.92);
  ctx.restore();
}
function redrawContactTexture(){
  if(!globeContext||!globeTexture)return;
  const w=globeCanvas.width,h=globeCanvas.height,pw=w/sections.length;
  const center=w*(.25+4/sections.length);
  drawContactPanel(globeContext,sections[4],center,pw,h);
  drawContactPanel(globeContext,sections[4],center-w,pw,h);
  globeTexture.needsUpdate=true;
}
/* ECHOES: Kompass in der bestehenden ARCHIVE-Bildfläche.
   Vorläufige b3nn3t-Links, bis CAMOU-Profile vorhanden sind. */
const ECHOES_LINKS = [
  {label:"INSTAGRAM", angle:-Math.PI/2, url:"https://www.instagram.com/b3nn3t"},
  {label:"SPOTIFY", angle:Math.PI, url:"https://open.spotify.com/intl-de/artist/7pajHvUWNCnOPhDPyH4M6x"},
  {label:"APPLE", angle:0, url:"https://music.apple.com/ch/artist/b3nn3t/1786857463"},
  {label:"YOUTUBE", angle:Math.PI/2, url:"https://www.youtube.com/@b333nn3t"}
];
let echoesAngle = 0;
let echoesImage = null;
// Nadel reagiert nur auf tatsächliche Drehung der Kugel (auch Auslaufen).
let echoesLastRotationX = 0;
let echoesLastRotationY = 0;
const echoesCompassRadius = 137;
function drawEchoesCompass(ctx, cx, cy) {
  ctx.save();
  ctx.fillStyle="rgba(5,15,10,.46)";
  ctx.beginPath();ctx.arc(cx,cy,198,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle="rgba(220,240,215,.45)";ctx.lineWidth=1.4;
  ctx.beginPath();ctx.arc(cx,cy,110,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle="rgba(230,245,224,.48)";
  for(let i=0;i<48;i++){
    const a=i*Math.PI/24;
    const r1=114,r2=i%4===0?125:119;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);
    ctx.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);ctx.stroke();
  }
  ctx.strokeStyle="rgba(230,245,224,.55)";
  for(const e of ECHOES_LINKS){
    const ex=cx+Math.cos(e.angle)*echoesCompassRadius;
    const ey=cy+Math.sin(e.angle)*echoesCompassRadius;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(ex,ey);ctx.stroke();
    ctx.fillStyle="rgba(6,17,11,.88)";
    ctx.beginPath();ctx.arc(ex,ey,25,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="rgba(235,245,230,.8)";ctx.stroke();
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="500 10px 'DM Mono', monospace";
    ctx.fillStyle="#f0f4ec";
    ctx.fillText(e.label,ex,ey,48);
  }
  // Die Nadel dreht sich sanft; die vier anklickbaren Ziele bleiben stehen.
  ctx.save();ctx.translate(cx,cy);ctx.rotate(echoesAngle);
  ctx.fillStyle="#dcebd7";ctx.beginPath();ctx.moveTo(0,-90);
  ctx.lineTo(10,8);ctx.lineTo(0,0);ctx.closePath();ctx.fill();
  ctx.fillStyle="#829e83";ctx.beginPath();ctx.moveTo(0,90);
  ctx.lineTo(-10,-8);ctx.lineTo(0,0);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.fillStyle="#f5fff0";ctx.beginPath();ctx.arc(cx,cy,7,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function refreshEchoesTexture() {
  if (!echoesImage || !globeContext || !globeTexture) return;
  const w=globeCanvas.width,h=globeCanvas.height,pw=w/sections.length;
  const center=w*(.25+3/sections.length);
  drawPanel(globeContext,sections[3],echoesImage,center,pw,h);
  if(center+pw/2>w)drawPanel(globeContext,sections[3],echoesImage,center-w,pw,h);
  globeTexture.needsUpdate=true;
}
function handleEchoesClick(event) {
  if(currentIndex()!==3 || !pointerStart || !editor.hidden) return false;
  if(Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7)return false;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX-rect.left)/rect.width)*2-1,
              -((event.clientY-rect.top)/rect.height)*2+1);
  globeGroup.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(globe)[0];
  if(!hit?.uv)return false;
  const x=hit.uv.x*4096,y=(1-hit.uv.y)*2048;
  const center=4096*(.25+3/sections.length);
  const dx=((x-center+2048+4096)%4096)-2048;
  const cy=2048*(.475+.19/2);
  const chosen=ECHOES_LINKS.find(e=>Math.hypot(dx-Math.cos(e.angle)*echoesCompassRadius,
                                y-cy-Math.sin(e.angle)*echoesCompassRadius)<31);
  if(!chosen)return false;
  window.open(chosen.url,"_blank","noopener,noreferrer");
  return true;
}

/* =========================================
   THEMENBEREICH ZEICHNEN
========================================= */

function drawPanel(
  ctx,
  section,
  image,
  centerX,
  panelW,
  canvasH
) {
  if (section.name === "CONTACT") {
    drawContactPanel(ctx,section,centerX,panelW,canvasH);
    return;
  }
  const x = centerX - panelW / 2;

  ctx.save();

  ctx.beginPath();
  ctx.rect(x, 0, panelW, canvasH);
  ctx.clip();

  /* 1. EIGENER HINTERGRUND */

  const background = ctx.createLinearGradient(
    x,
    0,
    x + panelW,
    canvasH
  );

  background.addColorStop(0, "#18221b");
  background.addColorStop(0.5, "#202c23");
  background.addColorStop(1, "#111813");

  ctx.fillStyle = background;
  ctx.fillRect(x, 0, panelW, canvasH);

  /* 2. DEZENTER LICHTSCHEIN */

  const glow = ctx.createRadialGradient(
    centerX,
    canvasH * 0.45,
    20,
    centerX,
    canvasH * 0.45,
    panelW * 0.8
  );

  glow.addColorStop(
    0,
    "rgba(183,201,170,0.12)"
  );

  glow.addColorStop(
    1,
    "rgba(8,13,9,0)"
  );

  ctx.fillStyle = glow;
  ctx.fillRect(x, 0, panelW, canvasH);

  /* 3. ZENTRIERTER TEXTBEREICH */

  const contentW = panelW * 0.76;
  const maxTextW = contentW;

  /* 4. CAMOU-BUCHSTABE */

  ctx.save();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(235,242,229,0.82)";
  ctx.font = "300 150px Manrope, Arial";

  ctx.fillText(
    section.poleLetter,
    centerX,
    canvasH * 0.115
  );

  ctx.restore();

  /* 5. KATEGORIEZEILE */

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "rgba(232,239,226,0.65)";
  ctx.font = "500 21px 'DM Mono', monospace";

  ctx.fillText(
    section.eyebrow,
    centerX,
    canvasH * 0.24,
    maxTextW
  );

  /* 6. GROSSE ÜBERSCHRIFT */

  ctx.fillStyle = "#f0f2eb";

  ctx.font = section.name === "MUSIC"
    ? "300 45px Manrope, Arial"
    : "300 58px Manrope, Arial";

  const titleY = canvasH * 0.31;
  const titleGap = 76;

  section.title.forEach((line, i) => {
    ctx.fillText(
      line,
      centerX,
      titleY + i * titleGap,
      maxTextW
    );
  });

  /* 7. FLIESSTEXT */

  const bodyStart =
    titleY +
    (section.title.length - 1) * titleGap +
    100;

  ctx.fillStyle = "rgba(235,239,230,0.86)";
  ctx.font = "300 22px Manrope, Arial";

  section.body.forEach((line, i) => {
    ctx.fillText(
      line,
      centerX,
      bodyStart + i * 43,
      maxTextW
    );
  });

  /* 8. ZUSATZINFORMATIONEN */

  if (section.extra) {
    const extraStart =
      bodyStart +
      section.body.length * 43 +
      35;

    ctx.fillStyle = "#c1d0b7";
    ctx.font = "500 18px 'DM Mono', monospace";

    section.extra.forEach((line, i) => {
      ctx.fillText(
        line,
        centerX,
        extraStart + i * 39,
        maxTextW
      );
    });
  }

  /* 9. BILDFENSTER */

  const imageW = panelW * 0.56;
  const imageH = canvasH * 0.19;

  const imageX = centerX - imageW / 2;
  const imageY = canvasH * 0.475;

  ctx.save();

  // Dunkler Rahmenhintergrund
  ctx.fillStyle = "rgba(8,13,10,0.9)";

  ctx.fillRect(
    imageX - 8,
    imageY - 8,
    imageW + 16,
    imageH + 16
  );

  // Bildfläche begrenzen
  ctx.save();

  ctx.beginPath();
  ctx.rect(imageX, imageY, imageW, imageH);
  ctx.clip();

  // Video oder bisheriges Vorschaubild
  if (
    section.name === "HOME" &&
    homeVideoStarted &&
    homeVideo.readyState >= 2
  ) {
    drawCoverCrop(
      ctx,
      homeVideo,
      imageX,
      imageY,
      imageW,
      imageH
    );
  } else {
    drawCoverCrop(
      ctx,
      image,
      imageX,
      imageY,
      imageW,
      imageH
    );

    // Play-Button nur auf Home
    if (section.name === "HOME") {
      drawPlayButton(
        ctx,
        centerX,
        imageY + imageH / 2,
        48
      );
    }
  }

  if (section.name === "MUSIC") {
    ctx.fillStyle = "rgba(8,12,9,.78)";
    ctx.fillRect(imageX, imageY + imageH - 85, imageW, 85);
    ctx.textAlign = "center";
    ctx.fillStyle = "#edf2e9";
    ctx.font = "500 21px 'DM Mono', monospace";
    ctx.fillText("B3NN3T / SPOTIFY", centerX, imageY + imageH - 48, imageW*.9);
    ctx.font = "400 17px 'DM Mono', monospace";
    ctx.fillText("PLAYER ÖFFNEN ↗", centerX, imageY + imageH - 18, imageW*.9);
  }
  ctx.restore();

  if (section.name === "ECHOES") {
    drawEchoesCompass(ctx, centerX, imageY + imageH / 2);
  }

  // Feiner Rahmen
  ctx.strokeStyle = "rgba(226,235,220,0.48)";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    imageX,
    imageY,
    imageW,
    imageH
  );

  ctx.restore();

  /* 10. UNTERE LINIE */

  ctx.strokeStyle = "rgba(226,235,220,0.35)";
  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    centerX - contentW / 2,
    canvasH * 0.88
  );

  ctx.lineTo(
    centerX + contentW / 2,
    canvasH * 0.88
  );

  ctx.stroke();

  /* 11. SEITENNUMMER */

  ctx.fillStyle = "rgba(232,239,226,0.62)";
  ctx.font = "19px 'DM Mono', monospace";

  ctx.textAlign = "center";

  ctx.fillText(
    `${String(sections.indexOf(section) + 1).padStart(2, "0")} / 05`,
    centerX,
    canvasH * 0.92
  );

  ctx.restore();
}

/* =========================================
   VIDEO IM HOME-FENSTER AKTUALISIEREN
========================================= */

function updateHomeVideoFrame() {
  if (
    !homeVideoStarted ||
    !globeCanvas ||
    !globeContext ||
    !globeTexture ||
    homeVideo.readyState < 2
  ) {
    return;
  }

  const canvasW = globeCanvas.width;
  const canvasH = globeCanvas.height;

  const panelW = canvasW / sections.length;
  const homeCenter = canvasW * 0.25;

  const imageW = panelW * 0.56;
  const imageH = canvasH * 0.19;

  const imageX = homeCenter - imageW / 2;
  const imageY = canvasH * 0.475;

  globeContext.save();

  globeContext.beginPath();
  globeContext.rect(
    imageX,
    imageY,
    imageW,
    imageH
  );

  globeContext.clip();

  drawCoverCrop(
    globeContext,
    homeVideo,
    imageX,
    imageY,
    imageW,
    imageH
  );

  globeContext.restore();

  if (homeVideo.paused) {
    globeContext.save();
    drawPlayButton(globeContext, homeCenter, imageY + imageH / 2, 48);
    globeContext.restore();
  }

  globeTexture.needsUpdate = true;
}

/* =========================================
   KUGELTEXTUR ERSTELLEN
========================================= */

async function createGlobeTexture() {
  const images = await Promise.all([
    loadImage(ASSETS.home),
    loadImage(ASSETS.music),
    loadImage(ASSETS.visuals),
    loadImage(ASSETS.archive),
    loadImage(ASSETS.contact)
  ]);

  echoesImage = images[3];
  const canvas = document.createElement("canvas");

  canvas.width = 4096;
  canvas.height = 2048;

  const ctx = canvas.getContext("2d");

  globeCanvas = canvas;
  globeContext = ctx;

  ctx.fillStyle = "#172019";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = canvas.width / sections.length;

  sections.forEach((section, index) => {
    const center =
      canvas.width * (0.25 + index / sections.length);

    const x = center - panelW / 2;

    drawPanel(
      ctx,
      section,
      images[index],
      x + panelW / 2,
      panelW,
      canvas.height
    );

    // Übergang am Rand der Textur
    if (x < 0) {
      drawPanel(
        ctx,
        section,
        images[index],
        x + canvas.width + panelW / 2,
        panelW,
        canvas.height
      );
    } else if (x + panelW > canvas.width) {
      drawPanel(
        ctx,
        section,
        images[index],
        x - canvas.width + panelW / 2,
        panelW,
        canvas.height
      );
    }
  });

  const texture = new THREE.CanvasTexture(canvas);

  globeTexture = texture;

  texture.colorSpace = THREE.SRGBColorSpace;

  texture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();

  texture.needsUpdate = true;

  return texture;
}

/* =========================================
   KUGEL ERSTELLEN
========================================= */

const globeGeometry = new THREE.SphereGeometry(
  CONFIG.radius,
  160,
  112
);

const globeMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.88,
  metalness: 0.02
});

const globe = new THREE.Mesh(
  globeGeometry,
  globeMaterial
);

globeGroup.add(globe);

/* ATMOSPHÄRE */

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius * 1.012,
    96,
    64
  ),
  new THREE.MeshBasicMaterial({
    color: 0xa9bd9f,
    transparent: true,
    opacity: 0.055,
    side: THREE.BackSide
  })
);

globeGroup.add(atmosphere);

/* =========================================
   TEXTUR AUF DIE KUGEL LEGEN
========================================= */

createGlobeTexture()
  .then(texture => {
    globeMaterial.map = texture;
    globeMaterial.needsUpdate = true;

    console.info(
      "CAMOU: Alle fünf Bereiche wurden geladen."
    );
  })
  .catch(error => {
    console.error(
      "CAMOU: Die Bildtextur konnte nicht erstellt werden.",
      error
    );

    sectionLabel.textContent = "BILDER NICHT GELADEN";
  });

/* =========================================
   VIDEO-PLAY-BUTTON ERKENNEN
========================================= */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let pointerStart = null;

const editor = document.getElementById("contact-editor");
const editorForm = document.getElementById("contact-editor-form");
const editorInput = document.getElementById("contact-editor-input");
const editorTextarea = document.getElementById("contact-editor-textarea");
const editorLabel = document.getElementById("contact-editor-label");
let editingKey = null;
function openContactEditor(key){
  editingKey=key;editor.hidden=false;
  const multiline=key==="message";
  editorInput.hidden=multiline;editorTextarea.hidden=!multiline;
  const el=multiline?editorTextarea:editorInput;
  editorLabel.textContent=contactHitAreas.find(a=>a.key===key).label;
  if(!multiline){editorInput.type=key==="email"?"email":"text";}
  el.value=contactValues[key];
  velocityX=0;velocityY=0;menuAnimating=false;
  setTimeout(()=>el.focus(),40);
}
function closeContactEditor(){editor.hidden=true;editingKey=null;}
editorForm.addEventListener("submit",event=>{
  event.preventDefault();if(!editingKey)return;
  const el=editingKey==="message"?editorTextarea:editorInput;
  contactValues[editingKey]=el.value.trim().slice(0,editingKey==="message"?1200:120);
  closeContactEditor();redrawContactTexture();
});
document.getElementById("contact-editor-cancel").addEventListener("click",closeContactEditor);
editor.addEventListener("pointerdown",e=>e.stopPropagation());
editor.addEventListener("pointermove",e=>e.stopPropagation());
editor.addEventListener("pointerup",e=>e.stopPropagation());
function handleContactClick(event){
  if(!pointerStart||!editor.hidden)return;
  // CONTACT-Hit-Tests nur dann ausführen, wenn CONTACT vorne ist.
  if(currentIndex() !== 4)return;
  if(Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7)return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set(((event.clientX-rect.left)/rect.width)*2-1,-((event.clientY-rect.top)/rect.height)*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(globe)[0];if(!hit||!hit.uv)return;
  const u=hit.uv.x*4096,v=(1-hit.uv.y)*2048;
  const center=4096*(.25+4/sections.length);
  const dx=((u-center+2048+4096)%4096)-2048;
  const target=contactHitAreas.find(a=>dx>=a.x1&&dx<=a.x2&&v>=a.y1&&v<=a.y2);
  if(!target)return;
  if(target.key==="privacy"){
    contactValues.privacy=!contactValues.privacy;redrawContactTexture();return;
  }
  if(target.key==="send"){
    if(!contactValues.name||!contactValues.email||!contactValues.subject||!contactValues.message||!contactValues.privacy){
      alert("Bitte alle Felder ausfüllen und Datenschutz bestätigen.");return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValues.email)){
      alert("Bitte eine gültige E-Mail-Adresse eingeben.");return;
    }
    if (contactSending) return;
    contactSending = true;
    contactStatus = "Übertragung läuft …";
    redrawContactTexture();
    const formData = new FormData();
    formData.append("name", contactValues.name);
    formData.append("email", contactValues.email);
    formData.append("subject", contactValues.subject);
    formData.append("message", contactValues.message);
    formData.append("privacy", "zugestimmt");
    formData.append("website", ""); // Honeypot field used by the existing endpoint.
    fetch(CONTACT_SCRIPT_URL, { method:"POST", body:formData, mode:"no-cors" })
      .then(() => {
        // no-cors returns an opaque response: server acceptance cannot be verified.
        contactStatus = "Übermittelt – Empfang nicht bestätigt";
        contactSending = false;
        redrawContactTexture();
      })
      .catch(error => {
        console.error("Kontaktformular: Übertragungsfehler", error);
        contactStatus = "Übertragung fehlgeschlagen";
        contactSending = false;
        redrawContactTexture();
      });
    return;
  }
  openContactEditor(target.key);
}


function startHomeVideoFromClick(event) {
  if (!pointerStart) return;

  const movement = Math.hypot(
    event.clientX - pointerStart.x,
    event.clientY - pointerStart.y
  );

  pointerStart = null;

  // Ziehen soll weiterhin nur die Kugel bewegen
  if (movement > 7) return;

  if (homeVideoStarting || !globeTexture) return;

  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  pointer.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Nach einer Drag-/Menü-Animation müssen die Weltmatrizen aktuell sein.
  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(pointer, camera);

  const intersections = raycaster.intersectObject(globe);

  if (!intersections.length) return;

  const uv = intersections[0].uv;

  if (!uv) return;

  const canvasW = 4096;
  const canvasH = 2048;
  const panelW = canvasW / sections.length;

  const homeCenter = canvasW * 0.25;

  const imageW = panelW * 0.56;
  const imageH = canvasH * 0.19;

  const imageX = homeCenter - imageW / 2;
  const imageY = canvasH * 0.475;

  const textureX = uv.x * canvasW;
  const textureY = (1 - uv.y) * canvasH;

  const buttonX = homeCenter;
  const buttonY = imageY + imageH / 2;
  const buttonRadius = 30;

  const isInsideButton =
    Math.hypot(
      textureX - buttonX,
      textureY - buttonY
    ) <= buttonRadius;

  const isInsideImage =
    textureX >= imageX &&
    textureX <= imageX + imageW &&
    textureY >= imageY &&
    textureY <= imageY + imageH;

  // Der erste Start akzeptiert das sichtbare Play-Symbol und die
  // umgebende Videofläche; später kann dieselbe Fläche pausieren/fortsetzen.
  if (!isInsideImage) return;

  if (homeVideoStarted && !homeVideo.paused) {
    homeVideo.pause();
    homeVideoPlaying = false;
    updateHomeVideoFrame();
    return;
  }

  homeVideoStarting = true;

  homeVideo.muted = false;
  homeVideo.volume = 1;

  homeVideo.play()
    .then(() => {
      homeVideoStarted = true;
      homeVideoPlaying = true;
      homeVideoStarting = false;
      updateHomeVideoFrame();
    })
    .catch(error => {
      homeVideoStarting = false;
      console.error("CAMOU: Home-Video nicht abspielbar", error);
      // Fehlermeldung statt stillem Fehlschlag; so lässt sich zwischen
      // fehlender Datei, Codec und Browser-Blockade unterscheiden.
      const detail = homeVideo.error
        ? ` (Medienfehler ${homeVideo.error.code})`
        : ` (${error.name || "unbekannt"})`;
      alert("Das HOME-Video konnte nicht gestartet werden" + detail +
            ". Bitte assets/test.webm und dessen Codec prüfen.");
    });
}


/* Spotify kann technisch nicht als interaktives iframe auf eine
   WebGL-Kugeltextur gezeichnet werden. Ein Klick auf das Fenster
   in FRAGMENTE öffnet daher einen scrollbaren Player darüber. */
const musicOverlay = document.getElementById("music-player-overlay");
const musicClose = document.getElementById("music-player-close");
const musicIframe = document.getElementById("music-spotify-frame");
function closeMusicPlayer() {
  musicOverlay.hidden = true;
  musicIframe.src = "about:blank";
}
function openMusicPlayer() {
  velocityX = 0;
  velocityY = 0;
  musicIframe.src = "https://open.spotify.com/embed/artist/7pajHvUWNCnOPhDPyH4M6x?theme=0";
  musicOverlay.hidden = false;
}
musicClose.addEventListener("click", closeMusicPlayer);
musicOverlay.addEventListener("pointerdown", event => event.stopPropagation());
musicOverlay.addEventListener("pointermove", event => event.stopPropagation());
musicOverlay.addEventListener("pointerup", event => event.stopPropagation());
musicOverlay.addEventListener("wheel", event => event.stopPropagation(), {passive:true});
musicOverlay.addEventListener("click", event => {
  if (event.target === musicOverlay) closeMusicPlayer();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !musicOverlay.hidden) closeMusicPlayer();
});
function handleMusicClick(event) {
  if (!pointerStart) return false;
  if (Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>7) return false;
  if (!globe || !globeTexture) return false;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX-rect.left)/rect.width)*2-1;
  pointer.y = -((event.clientY-rect.top)/rect.height)*2+1;
  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObject(globe)[0];
  if (!hit || !hit.uv) return false;
  const tx=hit.uv.x*4096, ty=(1-hit.uv.y)*2048;
  const pw=4096/sections.length;
  const center=4096*(.25+1/sections.length);
  const imageW=pw*.56, imageH=2048*.19;
  const imageX=center-imageW/2, imageY=2048*.475;
  const inWindow=tx>=imageX && tx<=imageX+imageW && ty>=imageY && ty<=imageY+imageH;
  if (inWindow) { openMusicPlayer(); pointerStart=null; return true; }
  return false;
}

/* =========================================
   ZOOM
========================================= */

function setZoom(value) {
  currentZoom = Math.max(
    CONFIG.minZoom,
    Math.min(CONFIG.maxZoom, value)
  );

  camera.position.z = currentZoom;
}

document
  .getElementById("zoom-in")
  .addEventListener("click", () => {
    setZoom(currentZoom - 0.7);
  });

document
  .getElementById("zoom-out")
  .addEventListener("click", () => {
    setZoom(currentZoom + 0.7);
  });

document
  .getElementById("zoom-reset")
  .addEventListener("click", () => {
    setZoom(defaultZoom);
  });

stage.addEventListener(
  "wheel",
  event => {
    event.preventDefault();
    setZoom(currentZoom + event.deltaY * 0.008);
  },
  { passive: false }
);

/* =========================================
   DREHUNG UND TOUCH
========================================= */

let rotationX = 0;
let rotationY = 0;

let velocityX = 0;
let velocityY = 0;

let isDragging = false;

let previousX = 0;
let previousY = 0;
let lastTime = 0;

const pointers = new Map();

let pinchDistance = 0;
let pinchZoom = currentZoom;

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

stage.addEventListener("pointerdown", event => {
  pointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  pointerStart = {
    x: event.clientX,
    y: event.clientY
  };

  stage.setPointerCapture(event.pointerId);

  if (pointers.size === 1) {
    isDragging = true;

    previousX = event.clientX;
    previousY = event.clientY;

    lastTime = performance.now();

    velocityX = 0;
    velocityY = 0;

    stage.classList.add("dragging");
    hint.classList.add("hidden");
  } else if (pointers.size === 2) {
    isDragging = false;
    pointerStart = null;

    stage.classList.remove("dragging");

    const pts = [...pointers.values()];

    pinchDistance = distance(
      pts[0],
      pts[1]
    );

    pinchZoom = currentZoom;
  }
});

stage.addEventListener("pointermove", event => {
  if (!pointers.has(event.pointerId)) return;

  pointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  // Zwei Finger: Zoom
  if (pointers.size >= 2) {
    const pts = [...pointers.values()];

    const d = distance(
      pts[0],
      pts[1]
    );

    if (pinchDistance > 0) {
      setZoom(
        pinchZoom / (d / pinchDistance)
      );
    }

    return;
  }

  if (!isDragging) return;

  const now = performance.now();

  const dt = Math.max(
    1,
    now - lastTime
  );

  const dx = event.clientX - previousX;
  const dy = event.clientY - previousY;

  const factor = Math.min(
    dt / 16,
    2
  );

  const mx = dx * CONFIG.dragSpeed;
  const my = dy * CONFIG.dragSpeed;

  rotationY += mx;
  rotationX += my;

  velocityY = mx / factor;
  velocityX = my / factor;

  previousX = event.clientX;
  previousY = event.clientY;

  lastTime = now;

  updateIndicator();
});

function releasePointer(event) {
  if (event.type === "pointerup") {
    if (!handleEchoesClick(event)) {
      if (!handleMusicClick(event)) {
        handleContactClick(event);
        startHomeVideoFromClick(event);
      }
    } else {
      pointerStart = null;
    }
  } else {
    pointerStart = null;
  }

  pointers.delete(event.pointerId);

  if (pointers.size === 0) {
    isDragging = false;
    stage.classList.remove("dragging");
  } else if (pointers.size === 1) {
    const p = [...pointers.values()][0];

    previousX = p.x;
    previousY = p.y;

    lastTime = performance.now();

    velocityX = 0;
    velocityY = 0;

    isDragging = true;

    stage.classList.add("dragging");
  }
}

stage.addEventListener("pointerup", releasePointer);
stage.addEventListener("pointercancel", releasePointer);
stage.addEventListener("lostpointercapture", releasePointer);

/* =========================================
   NAVIGATION ZWISCHEN DEN BEREICHEN
========================================= */

const sectionStep =
  (Math.PI * 2) / sections.length;

let targetRotationY = 0;
let menuAnimating = false;

function currentIndex() {
  const raw = Math.round(
    -rotationY / sectionStep
  );

  return (
    (raw % sections.length) +
    sections.length
  ) % sections.length;
}

function updateIndicator() {
  const index = currentIndex();

  sectionLabel.textContent =
    sections[index].name;

  sectionNumber.textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, i) => {
    button.classList.toggle(
      "active",
      i === index
    );
  });
}

function goToSection(index) {
  if (!musicOverlay.hidden) closeMusicPlayer();
  const i =
    ((index % sections.length) + sections.length) %
    sections.length;

  rotationX = 0;

  velocityX = 0;
  velocityY = 0;

  isDragging = false;

  pointers.clear();
  pointerStart = null;

  stage.classList.remove("dragging");

  let destination = -i * sectionStep;

  const full = Math.PI * 2;

  while (destination - rotationY > Math.PI) {
    destination -= full;
  }

  while (destination - rotationY < -Math.PI) {
    destination += full;
  }

  targetRotationY = destination;
  menuAnimating = true;
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    goToSection(
      Number(button.dataset.section)
    );
  });
});

document
  .getElementById("logo")
  .addEventListener("click", event => {
    event.preventDefault();
    goToSection(0);
  });

/* =========================================
   TASTATURSTEUERUNG
========================================= */

window.addEventListener("keydown", event => {
  if (event.key === "ArrowRight") {
    goToSection(currentIndex() + 1);
  }

  if (event.key === "ArrowLeft") {
    goToSection(currentIndex() - 1);
  }

  if (event.key === "ArrowUp") {
    rotationX -= 0.25;
  }

  if (event.key === "ArrowDown") {
    rotationX += 0.25;
  }

  if (event.key === "+" || event.key === "=") {
    setZoom(currentZoom - 0.7);
  }

  if (event.key === "-") {
    setZoom(currentZoom + 0.7);
  }

  if (event.key === "0") {
    setZoom(defaultZoom);
  }
});

/* =========================================
   ANIMATION
========================================= */

function animate() {
  requestAnimationFrame(animate);

  if (!isDragging && menuAnimating) {
    const delta =
      targetRotationY - rotationY;

    rotationY += delta * 0.055;

    if (Math.abs(delta) < 0.001) {
      rotationY = targetRotationY;
      menuAnimating = false;
    }
  } else if (!isDragging) {
    rotationY += velocityY;
    rotationX += velocityX;

    velocityY *= CONFIG.friction;
    velocityX *= CONFIG.friction;

    if (Math.abs(velocityY) < 0.00004) {
      velocityY = 0;
    }

    if (Math.abs(velocityX) < 0.00004) {
      velocityX = 0;
    }
  }

  globeGroup.rotation.set(
    rotationX,
    rotationY,
    0
  );

  // Laufendes Video in die Kugeltextur zeichnen
  if (homeVideoPlaying) {
    updateHomeVideoFrame();
  }

  // Die Nadel folgt nur einer tatsächlichen Drehung des Bildes/Globus.
  // Bei stillstehender Kugel bleibt sie exakt stehen; kein Zeit-Antrieb.
  const deltaX = rotationX - echoesLastRotationX;
  const deltaY = rotationY - echoesLastRotationY;
  echoesLastRotationX = rotationX;
  echoesLastRotationY = rotationY;
  if (currentIndex() === 3 && globeTexture &&
      (Math.abs(deltaX) > 0.000001 || Math.abs(deltaY) > 0.000001)) {
    // Winkeländerung proportional zur realen horizontalen und vertikalen Kugeldrehung.
    echoesAngle += deltaY * 0.85 + deltaX * 0.35;
    refreshEchoesTexture();
  }
  renderer.render(scene, camera);

  updateIndicator();
}

animate();

/* =========================================
   FENSTERGRÖSSE ANPASSEN
========================================= */

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );
}

window.addEventListener("resize", resize);

setZoom(defaultZoom);
updateIndicator();

