import * as THREE from "three";

/* =========================================
   CAMOU — 3D GLOBE
   WEICHE, NAHTLOSE BEREICHSÜBERGÄNGE
========================================= */

const CONFIG = {
  radius: 3.2,
  desktopZoom: 8.2,
  mobileZoom: 8.4,
  minZoom: 6,
  maxZoom: 17,
  dragSpeed: 0.0052,
  friction: 0.94,

  // 0 = fast einheitlich, 1 = stärkere Unterschiede
  gradientStrength: 0.75,

  // Breite der weichen Übergänge (0.5 bis 1 empfohlen)
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
    name: "HOME",
    poleLetter: "c",
    eyebrow: "NEW PROJECT / 001",
    title: ["c a m o u"],
    body: ["Gleiche Fragen.", "Neue Perspektiven."],
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
    image: ASSETS.music
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
    image: ASSETS.archive
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
    extra: ["camou.kontakt@gmail.com"]
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
const navButtons = [...document.querySelectorAll(".nav-link")];

const isMobile = window.matchMedia("(max-width:700px)").matches;
const defaultZoom = isMobile
  ? CONFIG.mobileZoom
  : CONFIG.desktopZoom;

/* =========================================
   THREE.JS
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

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

container.appendChild(renderer.domElement);

/* =========================================
   LICHT
========================================= */

scene.add(new THREE.AmbientLight(0xddebd8, 1.15));

const keyLight = new THREE.DirectionalLight(0xe3f0dc, 2.1);
keyLight.position.set(-3, 4, 5);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x9bb99a, 24, 15);
rimLight.position.set(4, -1, -3);
scene.add(rimLight);

/* =========================================
   KUGEL
========================================= */

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

/* =========================================
   ZUSTAND
========================================= */

let globeCanvas = null;
let globeContext = null;
let globeTexture = null;

let rotationX = 0;
let rotationY = 0;
let velocityX = 0;
let velocityY = 0;
let isDragging = false;
let menuAnimating = false;
let targetRotationY = 0;

let previousX = 0;
let previousY = 0;
let lastTime = 0;
let pointerStart = null;

const pointers = new Map();
let pinchDistance = 0;
let pinchZoom = currentZoom;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const sectionStep = Math.PI * 2 / sections.length;

/* =========================================
   HOME VIDEO
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

/* =========================================
   BILDER LADEN
========================================= */

function loadImage(src) {
  return new Promise(resolve => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      const fallback = document.createElement("canvas");
      fallback.width = 1024;
      fallback.height = 1024;

      const ctx = fallback.getContext("2d");
      const gradient = ctx.createLinearGradient(
        0, 0, 1024, 1024
      );

      gradient.addColorStop(0, "#354a39");
      gradient.addColorStop(0.5, "#1b3025");
      gradient.addColorStop(1, "#0a1510");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      resolve(fallback);
    };

    image.decoding = "async";
    image.src = src;
  });
}

function drawCoverCrop(ctx, image, x, y, w, h) {
  const sw = image.videoWidth || image.naturalWidth || image.width;
  const sh = image.videoHeight || image.naturalHeight || image.height;

  if (!sw || !sh) return;

  const scale = Math.max(w / sw, h / sh);
  const cropW = w / scale;
  const cropH = h / scale;

  ctx.drawImage(
    image,
    (sw - cropW) / 2,
    (sh - cropH) / 2,
    cropW,
    cropH,
    x, y, w, h
  );
}

/* =========================================
   PLAY-BUTTON
========================================= */

function drawPlayButton(ctx, cx, cy, size) {
  const r = size / 2;

  ctx.save();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(8,13,10,.72)";
  ctx.fill();
  ctx.strokeStyle = "rgba(240,245,235,.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - r * .22, cy - r * .38);
  ctx.lineTo(cx + r * .42, cy);
  ctx.lineTo(cx - r * .22, cy + r * .38);
  ctx.closePath();

  ctx.fillStyle = "#f0f2eb";
  ctx.fill();

  ctx.restore();
}

/* =========================================
   NEU: INDIVIDUELLE FARBWELTEN
========================================= */

// Jeder Bereich besitzt eigene Farbnuancen.
// Die Werte sind bewusst nah beieinander,
// damit die Kugel harmonisch bleibt.

const SECTION_COLORS = [
  {
    // HOME — natürliches Waldgrün
    top: [24, 36, 28],
    middle: [32, 47, 36],
    bottom: [15, 25, 19]
  },
  {
    // MUSIC — leicht kühler
    top: [20, 33, 28],
    middle: [29, 43, 37],
    bottom: [13, 23, 20]
  },
  {
    // VISUALS — sanftes Moosgrün
    top: [27, 39, 29],
    middle: [36, 49, 36],
    bottom: [17, 26, 19]
  },
  {
    // ECHOES — tiefes Dunkelgrün
    top: [17, 29, 23],
    middle: [26, 40, 31],
    bottom: [12, 22, 17]
  },
  {
    // CONTACT — warmes Olivgrün
    top: [29, 39, 29],
    middle: [38, 49, 36],
    bottom: [19, 27, 20]
  }
];

/* =========================================
   WEICHE FARBINTERPOLATION
========================================= */

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function mixColor(a, b, t) {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t)
  ];
}

function wrapIndex(i, count) {
  return ((i % count) + count) % count;
}

function getSectionColor(position, vertical) {
  const count = SECTION_COLORS.length;

  // Position ist zyklisch:
  // Nach Contact folgt wieder Home.
  const p = ((position % count) + count) % count;

  const base = Math.floor(p);
  const fraction = p - base;

  const current = SECTION_COLORS[base];
  const next = SECTION_COLORS[(base + 1) % count];

  // Sehr breite, harmonische Übergänge.
  // Durch die Cosinus-Interpolation sind auch
  // die Ableitungen an den Bereichszentren weich.
  const cosineBlend =
    (1 - Math.cos(fraction * Math.PI)) / 2;

  const blend = lerp(
    fraction,
    cosineBlend,
    CONFIG.gradientSoftness
  );

  function verticalColor(section) {
    if (vertical < 0.5) {
      return mixColor(
        section.top,
        section.middle,
        smoothstep(vertical * 2)
      );
    }

    return mixColor(
      section.middle,
      section.bottom,
      smoothstep((vertical - 0.5) * 2)
    );
  }

  const a = verticalColor(current);
  const b = verticalColor(next);

  const mixed = mixColor(a, b, blend);

  // Gemeinsame Grundfarbe verhindert zu starke
  // Unterschiede zwischen den fünf Bereichen.
  const neutral = [26, 39, 30];

  return mixColor(
    neutral,
    mixed,
    CONFIG.gradientStrength
  );
}

/* =========================================
   NEU: NAHTLOSER KUGELHINTERGRUND
========================================= */

function drawSeamlessBackground(ctx, width, height) {
  // Hintergrund wird als EINE zusammenhängende
  // Fläche erzeugt, nicht als fünf Rechtecke.

  // Kleine Arbeitsauflösung für effiziente
  // Farbberechnung; danach weich hochskalieren.
  const workWidth = 1024;
  const workHeight = 512;

  const offscreen = document.createElement("canvas");
  offscreen.width = workWidth;
  offscreen.height = workHeight;

  const offCtx = offscreen.getContext("2d");
  const imageData = offCtx.createImageData(
    workWidth,
    workHeight
  );

  const pixels = imageData.data;

  for (let y = 0; y < workHeight; y++) {
    const v = y / (workHeight - 1);

    for (let x = 0; x < workWidth; x++) {
      const u = x / workWidth;

      // Dieselben Bereichszentren wie die
      // bisherige CAMOU-Kugel:
      // HOME liegt bei u = 0.25.
      const sectionPosition =
        (u - 0.25) * sections.length;

      // Bereichszentren sollen die jeweils
      // individuellen Farben zeigen.
      // Zwischen zwei Zentren wird weich gemischt.
      // Individuelle Bereichsfarben
const sectionColor = getSectionColor(
  sectionPosition,
  v
);

// Einheitliche Polfarbe
const poleColor = [22, 34, 26];

// Am oberen und unteren Kugelpol
// werden die Bereichsfarben sanft vereinheitlicht.
const distanceFromPole = Math.min(v, 1 - v);

// Weicher Übergang von der Polfarbe
// zu den individuellen Bereichsfarben.
const poleBlend = smoothstep(
  Math.min(1, distanceFromPole / 0.24)
);

const color = mixColor(
  poleColor,
  sectionColor,
  poleBlend
);

      // Dezenter, umlaufend periodischer
      // Lichtverlauf. Keine Polygonkanten.
      const wave =
        Math.cos(2 * Math.PI * (u - 0.25));

      const softLight =
        1 + 0.035 * wave *
        Math.sin(Math.PI * v);

      // Vertikale Abdunklung für Tiefe.
      const verticalShade =
        1 - 0.07 * Math.pow(Math.abs(v - 0.5) * 2, 2);

      const index = (y * workWidth + x) * 4;

      pixels[index] = Math.round(
        color[0] * softLight * verticalShade
      );

      pixels[index + 1] = Math.round(
        color[1] * softLight * verticalShade
      );

      pixels[index + 2] = Math.round(
        color[2] * softLight * verticalShade
      );

      pixels[index + 3] = 255;
    }
  }

  offCtx.putImageData(imageData, 0, 0);

  // Hochskalieren mit weicher Interpolation.
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(offscreen, 0, 0, width, height);
  ctx.restore();
}

/* =========================================
   ECHOES KOMPASS
========================================= */

const ECHOES_LINKS = [
  {
    label: "INSTAGRAM",
    angle: -Math.PI / 2,
    url: "https://www.instagram.com/b3nn3t"
  },
  {
    label: "SPOTIFY",
    angle: Math.PI,
    url: "https://open.spotify.com/intl-de/artist/7pajHvUWNCnOPhDPyH4M6x"
  },
  {
    label: "APPLE",
    angle: 0,
    url: "https://music.apple.com/ch/artist/b3nn3t/1786857463"
  },
  {
    label: "YOUTUBE",
    angle: Math.PI / 2,
    url: "https://www.youtube.com/@b333nn3t"
  }
];

let echoesAngle = 0;
let echoesImage = null;
let echoesLastRotationX = 0;
let echoesLastRotationY = 0;

const echoesCompassRadius = 137;

function drawEchoesCompass(ctx, cx, cy) {
  ctx.save();

  ctx.fillStyle = "rgba(5,15,10,.46)";
  ctx.beginPath();
  ctx.arc(cx, cy, 198, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(220,240,215,.45)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 48; i++) {
    const a = i * Math.PI / 24;
    const r1 = 114;
    const r2 = i % 4 === 0 ? 125 : 119;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

  for (const item of ECHOES_LINKS) {
    const x = cx + Math.cos(item.angle) * echoesCompassRadius;
    const y = cy + Math.sin(item.angle) * echoesCompassRadius;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    ctx.fillStyle = "rgba(6,17,11,.88)";
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(235,245,230,.8)";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "500 10px 'DM Mono', monospace";
    ctx.fillStyle = "#f0f4ec";
    ctx.fillText(item.label, x, y, 48);
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(echoesAngle);

  ctx.fillStyle = "#dcebd7";
  ctx.beginPath();
  ctx.moveTo(0, -90);
  ctx.lineTo(10, 8);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#829e83";
  ctx.beginPath();
  ctx.moveTo(0, 90);
  ctx.lineTo(-10, -8);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = "#f5fff0";
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* =========================================
   THEMENBEREICHE ZEICHNEN
========================================= */

function drawPanel(ctx, section, image, centerX, panelW, canvasH) {
  const x = centerX - panelW / 2;

  ctx.save();

  ctx.beginPath();
  ctx.rect(x, 0, panelW, canvasH);
  ctx.clip();

  // WICHTIG:
  // Hier wird KEIN eigener rechteckiger
  // Hintergrund mehr gezeichnet.
  // Der nahtlose Hintergrund liegt bereits
  // unter sämtlichen fünf Bereichen.

  const contentW = panelW * 0.76;

  /* BUCHSTABE */

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(235,242,229,.82)";
  ctx.font = "300 75px Manrope, Arial";

  ctx.fillText(
    section.poleLetter,
    centerX,
    canvasH * .081
  );

  /* KATEGORIE */

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(232,239,226,.65)";
  ctx.font = "500 21px 'DM Mono', monospace";

  ctx.fillText(
    section.eyebrow,
    centerX,
    canvasH * .24,
    contentW
  );

  /* TITEL */

  ctx.fillStyle = "#f0f2eb";
  ctx.font = section.name === "MUSIC"
    ? "300 45px Manrope, Arial"
    : "300 58px Manrope, Arial";

  const titleY = canvasH * .31;

  section.title.forEach((line, i) => {
    ctx.fillText(
      line,
      centerX,
      titleY + i * 76,
      contentW
    );
  });

  /* TEXT */

  const bodyStart =
    titleY + (section.title.length - 1) * 76 + 100;

  ctx.fillStyle = "rgba(235,239,230,.86)";
  ctx.font = "300 22px Manrope, Arial";

  section.body.forEach((line, i) => {
    ctx.fillText(
      line,
      centerX,
      bodyStart + i * 43,
      contentW
    );
  });

  /* ZUSATZINFORMATION */

  if (section.extra) {
    const extraStart =
      bodyStart + section.body.length * 43 + 35;

    ctx.fillStyle = "#c1d0b7";
    ctx.font = "500 18px 'DM Mono', monospace";

    section.extra.forEach((line, i) => {
      ctx.fillText(
        line,
        centerX,
        extraStart + i * 39,
        contentW
      );
    });
  }

  /* BILDFENSTER */

  const imageW = panelW * .56;
  const imageH = canvasH * .19;
  const imageX = centerX - imageW / 2;
  const imageY = canvasH * .475;

  ctx.save();

  ctx.fillStyle = "rgba(8,13,10,.9)";
  ctx.fillRect(
    imageX - 8,
    imageY - 8,
    imageW + 16,
    imageH + 16
  );

  ctx.save();
  ctx.beginPath();
  ctx.rect(imageX, imageY, imageW, imageH);
  ctx.clip();

  if (
    section.name === "HOME" &&
    homeVideoStarted &&
    homeVideo.readyState >= 2
  ) {
    drawCoverCrop(
      ctx, homeVideo,
      imageX, imageY, imageW, imageH
    );
  } else {
    drawCoverCrop(
      ctx, image,
      imageX, imageY, imageW, imageH
    );

    if (section.name === "HOME") {
      drawPlayButton(
        ctx,
        centerX,
        imageY + imageH / 2,
        48
      );
    }
  }

  ctx.restore();

  /* MUSIC UND CONTACT */

  if (
    section.name === "MUSIC" ||
    section.name === "CONTACT"
  ) {
    ctx.save();

    ctx.fillStyle = "#e2ebdc";
    ctx.font = "300 45px Manrope, Arial";
    ctx.textAlign = "center";

    ctx.fillText(
      "ÖFFNEN  ↗",
      centerX,
      imageY - 23
    );

    ctx.restore();
  }

  /* ECHOES */

  if (section.name === "ECHOES") {
    drawEchoesCompass(
      ctx,
      centerX,
      imageY + imageH / 2
    );
  }

  ctx.strokeStyle = "rgba(226,235,220,.48)";
  ctx.lineWidth = 2;
  ctx.strokeRect(imageX, imageY, imageW, imageH);

  ctx.restore();

  /* UNTERE LINIE */

  ctx.strokeStyle = "rgba(226,235,220,.35)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(centerX - contentW / 2, canvasH * .88);
  ctx.lineTo(centerX + contentW / 2, canvasH * .88);
  ctx.stroke();

  /* SEITENNUMMER */

  ctx.fillStyle = "rgba(232,239,226,.62)";
  ctx.font = "19px 'DM Mono', monospace";
  ctx.textAlign = "center";

  ctx.fillText(
    `${String(sections.indexOf(section) + 1).padStart(2, "0")} / 05`,
    centerX,
    canvasH * .92
  );

  ctx.restore();
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

  // Zuerst den durchgehenden Hintergrund.
  drawSeamlessBackground(
    ctx,
    canvas.width,
    canvas.height
  );

  // Danach sämtliche Inhalte darüberzeichnen.
  const panelW = canvas.width / sections.length;

  sections.forEach((section, index) => {
    const center =
      canvas.width * (.25 + index / sections.length);

    const x = center - panelW / 2;

    drawPanel(
      ctx, section, images[index],
      center, panelW, canvas.height
    );

    // Naht zwischen letztem und erstem Bereich.
    if (x < 0) {
      drawPanel(
        ctx, section, images[index],
        center + canvas.width,
        panelW, canvas.height
      );
    } else if (x + panelW > canvas.width) {
      drawPanel(
        ctx, section, images[index],
        center - canvas.width,
        panelW, canvas.height
      );
    }
  });

  const texture = new THREE.CanvasTexture(canvas);

  globeTexture = texture;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;

  return texture;
}

createGlobeTexture()
  .then(texture => {
    globe.material.map = texture;
    globe.material.needsUpdate = true;

    console.info(
      "CAMOU: Nahtlose Kugeltextur geladen."
    );
  })
  .catch(error => {
    console.error(
      "CAMOU: Textur konnte nicht geladen werden.",
      error
    );
  });

/* =========================================
   HOME VIDEO AKTUALISIEREN
========================================= */

function updateHomeVideoFrame() {
  if (
    !homeVideoStarted ||
    !globeContext ||
    !globeTexture ||
    homeVideo.readyState < 2
  ) return;

  const w = globeCanvas.width;
  const h = globeCanvas.height;
  const pw = w / sections.length;

  const cx = w * .25;
  const iw = pw * .56;
  const ih = h * .19;
  const ix = cx - iw / 2;
  const iy = h * .475;

  globeContext.save();
  globeContext.beginPath();
  globeContext.rect(ix, iy, iw, ih);
  globeContext.clip();

  drawCoverCrop(
    globeContext,
    homeVideo,
    ix, iy, iw, ih
  );

  globeContext.restore();

  if (homeVideo.paused) {
    drawPlayButton(
      globeContext,
      cx,
      iy + ih / 2,
      48
    );
  }

  globeTexture.needsUpdate = true;
}

/* =========================================
   ECHOES AKTUALISIEREN
========================================= */

function refreshEchoesTexture() {
  if (
    !echoesImage ||
    !globeContext ||
    !globeTexture
  ) return;

  const w = globeCanvas.width;
  const h = globeCanvas.height;
  const pw = w / sections.length;

  const center =
    w * (.25 + 3 / sections.length);

  // Nur den Echoes-Bereich neu zeichnen.
  // Der nahtlose Hintergrund muss dabei
  // zunächst wiederhergestellt werden.
  const x = center - pw / 2;

  globeContext.save();
  globeContext.beginPath();
  globeContext.rect(x, 0, pw, h);
  globeContext.clip();

  // Hintergrund aus der gespeicherten
  // Grundtextur wiederherstellen.
  if (baseBackgroundCanvas) {
    globeContext.drawImage(
      baseBackgroundCanvas,
      0, 0
    );
  }

  globeContext.restore();

  drawPanel(
    globeContext,
    sections[3],
    echoesImage,
    center,
    pw,
    h
  );

  if (center + pw / 2 > w) {
    drawPanel(
      globeContext,
      sections[3],
      echoesImage,
      center - w,
      pw,
      h
    );
  }

  globeTexture.needsUpdate = true;
}

/* =========================================
   HINTERGRUND ZWISCHENSPEICHERN
========================================= */

let baseBackgroundCanvas = null;

// Hintergrund einmal separat erzeugen,
// damit der Kompass keine Bildspuren hinterlässt.
function prepareBackgroundCache() {
  const canvas = document.createElement("canvas");
  canvas.width = 4096;
  canvas.height = 2048;

  drawSeamlessBackground(
    canvas.getContext("2d"),
    canvas.width,
    canvas.height
  );

  baseBackgroundCanvas = canvas;
}

prepareBackgroundCache();

/* =========================================
   NAVIGATION
========================================= */

function currentIndex() {
  const raw = Math.round(-rotationY / sectionStep);

  return (
    (raw % sections.length + sections.length)
    % sections.length
  );
}

function updateIndicator() {
  const index = currentIndex();

  sectionLabel.textContent = sections[index].name;
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
  const i =
    ((index % sections.length) + sections.length)
    % sections.length;

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
    goToSection(Number(button.dataset.section));
  });
});

document.getElementById("logo")
  .addEventListener("click", event => {
    event.preventDefault();
    goToSection(0);
  });

/* =========================================
   SPOTIFY MODAL
========================================= */

const spotifyModal =
  document.getElementById("spotify-modal");

const spotifyPlayer =
  document.getElementById("spotify-modal-player");

const spotifyClose =
  document.getElementById("spotify-modal-close");

let spotifyOpen = false;

if (
  spotifyModal &&
  spotifyModal.parentElement !== document.body
) {
  document.body.appendChild(spotifyModal);
}

function openSpotifyModal() {
  if (!spotifyModal || spotifyOpen) return;

  spotifyOpen = true;

  velocityX = 0;
  velocityY = 0;
  isDragging = false;
  menuAnimating = false;

  spotifyModal.hidden = false;
  spotifyModal.style.display = "flex";

  document.body.classList.add(
    "spotify-dialog-open"
  );

  spotifyPlayer.src =
    spotifyPlayer.dataset.src ||
    "https://open.spotify.com/embed/artist/7pajHvUWNCnOPhDPyH4M6x?theme=0";

  spotifyClose?.focus({ preventScroll: true });
}

function closeSpotifyModal() {
  if (!spotifyModal) return;

  spotifyOpen = false;
  spotifyModal.hidden = true;
  spotifyModal.style.display = "none";

  document.body.classList.remove(
    "spotify-dialog-open"
  );

  spotifyPlayer?.removeAttribute("src");
}

spotifyClose?.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();
  closeSpotifyModal();
});

spotifyModal?.addEventListener(
  "pointerdown",
  event => {
    if (
      event.target === spotifyModal ||
      event.target.closest?.("[data-close-spotify]")
    ) {
      closeSpotifyModal();
    }
  }
);

/* =========================================
   CONTACT MODAL
========================================= */

const CONTACT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby3SfFxFDJQZNL0PxI75Z0O_HyDZl_MoC2b8jcW5PLy0kwPAuiOnK9macrxFTaUboXftg/exec";

const contactModal =
  document.getElementById("contact-modal");

const contactForm =
  document.getElementById("contact-form");

const contactClose =
  document.getElementById("contact-modal-close");

const contactStatusEl =
  document.getElementById("contact-status");

const contactSubmit =
  document.getElementById("contact-submit");

let contactOpen = false;
let contactSending = false;

if (
  contactModal &&
  contactModal.parentElement !== document.body
) {
  document.body.appendChild(contactModal);
}

function openContactModal() {
  if (!contactModal || contactOpen) return;

  contactOpen = true;

  velocityX = 0;
  velocityY = 0;
  isDragging = false;
  menuAnimating = false;

  contactModal.hidden = false;
  contactModal.style.display = "flex";

  document.body.classList.add(
    "contact-dialog-open"
  );

  contactModal.querySelector('input[name="name"]')
    ?.focus({ preventScroll: true });
}

function closeContactModal() {
  if (!contactModal || !contactOpen) return;

  contactOpen = false;
  contactModal.hidden = true;
  contactModal.style.display = "none";

  document.body.classList.remove(
    "contact-dialog-open"
  );
}

contactClose?.addEventListener("click", event => {
  event.preventDefault();
  closeContactModal();
});

contactModal?.addEventListener("click", event => {
  if (
    event.target === contactModal ||
    event.target.closest?.("[data-close-contact]")
  ) {
    closeContactModal();
  }
});

/* =========================================
   KONTAKTFORMULAR SENDEN
========================================= */

contactForm?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    if (
      contactSending ||
      !contactForm.reportValidity()
    ) return;

    contactSending = true;

    if (contactSubmit) {
      contactSubmit.disabled = true;
    }

    if (contactStatusEl) {
      contactStatusEl.textContent =
        "Nachricht wird übertragen …";
    }

    const formData = new FormData(contactForm);

    formData.set("privacy", "zugestimmt");
    formData.set("website", "");

    try {
      await fetch(CONTACT_SCRIPT_URL, {
        method: "POST",
        body: formData,
        mode: "no-cors"
      });

      if (contactStatusEl) {
        contactStatusEl.textContent =
          "Übertragung abgeschlossen. Empfang konnte nicht bestätigt werden.";
      }

    } catch (error) {
      console.error(
        "Kontaktformular:",
        error
      );

      if (contactStatusEl) {
        contactStatusEl.textContent =
          "Übertragung fehlgeschlagen. Bitte erneut versuchen.";
      }

    } finally {
      contactSending = false;

      if (contactSubmit) {
        contactSubmit.disabled = false;
      }
    }
  }
);

/* =========================================
   ESCAPE
========================================= */

window.addEventListener(
  "keydown",
  event => {
    if (event.key !== "Escape") return;

    if (contactOpen) {
      event.preventDefault();
      closeContactModal();

    } else if (spotifyOpen) {
      event.preventDefault();
      closeSpotifyModal();
    }
  },
  true
);

/* =========================================
   KLICK AUF KUGEL
========================================= */

function getTexturePoint(event) {
  const rect =
    renderer.domElement.getBoundingClientRect();

  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );

  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  raycaster.setFromCamera(pointer, camera);

  const hit =
    raycaster.intersectObject(globe)[0];

  if (!hit?.uv) return null;

  return {
    x: hit.uv.x * 4096,
    y: (1 - hit.uv.y) * 2048
  };
}

function isInsideSectionImage(point, index) {
  if (!point) return false;

  const w = 4096;
  const h = 2048;
  const pw = w / sections.length;

  const cx = w * (.25 + index / sections.length);
  const iw = pw * .56;
  const ih = h * .19;

  const dx =
    ((point.x - cx + w / 2 + w) % w) - w / 2;

  return (
    Math.abs(dx) <= iw / 2 &&
    point.y >= h * .475 &&
    point.y <= h * .475 + ih
  );
}

function handleMusicImageClick(event) {
  if (currentIndex() !== 1) return false;

  const point = getTexturePoint(event);

  if (!isInsideSectionImage(point, 1)) {
    return false;
  }

  openSpotifyModal();
  return true;
}

function handleContactImageClick(event) {
  if (currentIndex() !== 4) return false;

  const point = getTexturePoint(event);

  if (!isInsideSectionImage(point, 4)) {
    return false;
  }

  openContactModal();
  return true;
}

function handleEchoesClick(event) {
  if (currentIndex() !== 3) return false;

  const point = getTexturePoint(event);
  if (!point) return false;

  const w = 4096;
  const h = 2048;

  const center =
    w * (.25 + 3 / sections.length);

  const dx =
    ((point.x - center + w / 2 + w) % w) - w / 2;

  const cy = h * (.475 + .19 / 2);

  const chosen = ECHOES_LINKS.find(item => {
    const x =
      Math.cos(item.angle) * echoesCompassRadius;

    const y =
      cy + Math.sin(item.angle) * echoesCompassRadius;

    return Math.hypot(
      dx - x,
      point.y - y
    ) < 31;
  });

  if (!chosen) return false;

  window.open(
    chosen.url,
    "_blank",
    "noopener,noreferrer"
  );

  return true;
}

function handleHomeVideoClick(event) {
  if (currentIndex() !== 0) return false;

  const point = getTexturePoint(event);

  if (!isInsideSectionImage(point, 0)) {
    return false;
  }

  if (homeVideoStarting) return true;

  if (
    homeVideoStarted &&
    !homeVideo.paused
  ) {
    homeVideo.pause();
    homeVideoPlaying = false;
    updateHomeVideoFrame();
    return true;
  }

  homeVideoStarting = true;

  homeVideo.play()
    .then(() => {
      homeVideoStarted = true;
      homeVideoPlaying = true;
      homeVideoStarting = false;

      updateHomeVideoFrame();
    })
    .catch(error => {
      homeVideoStarting = false;

      console.error(
        "HOME-Video:",
        error
      );

      alert(
        "Das HOME-Video konnte nicht gestartet werden."
      );
    });

  return true;
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

document.getElementById("zoom-in")
  .addEventListener("click", () => {
    setZoom(currentZoom - .7);
  });

document.getElementById("zoom-out")
  .addEventListener("click", () => {
    setZoom(currentZoom + .7);
  });

document.getElementById("zoom-reset")
  .addEventListener("click", () => {
    setZoom(defaultZoom);
  });

stage.addEventListener(
  "wheel",
  event => {
    event.preventDefault();
    setZoom(currentZoom + event.deltaY * .008);
  },
  { passive: false }
);

/* =========================================
   DRAG UND TOUCH
========================================= */

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

stage.addEventListener(
  "pointerdown",
  event => {
    if (spotifyOpen || contactOpen) return;

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
      menuAnimating = false;

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
  }
);

stage.addEventListener(
  "pointermove",
  event => {
    if (!pointers.has(event.pointerId)) return;

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (pointers.size >= 2) {
      const pts = [...pointers.values()];
      const d = distance(pts[0], pts[1]);

      if (pinchDistance > 0) {
        setZoom(
          pinchZoom / (d / pinchDistance)
        );
      }

      return;
    }

    if (!isDragging) return;

    const now = performance.now();
    const dt = Math.max(1, now - lastTime);

    const dx = event.clientX - previousX;
    const dy = event.clientY - previousY;

    const factor = Math.min(dt / 16, 2);

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
  }
);

function releasePointer(event) {
  if (
    event.type === "pointerup" &&
    pointerStart
  ) {
    const movement = Math.hypot(
      event.clientX - pointerStart.x,
      event.clientY - pointerStart.y
    );

    if (
      movement <= 7 &&
      !spotifyOpen &&
      !contactOpen
    ) {
      if (!handleMusicImageClick(event)) {
        if (!handleContactImageClick(event)) {
          if (!handleEchoesClick(event)) {
            handleHomeVideoClick(event);
          }
        }
      }
    }
  }

  pointerStart = null;
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
   TASTATUR
========================================= */

window.addEventListener("keydown", event => {
  if (spotifyOpen || contactOpen) return;

  const tag = document.activeElement?.tagName;

  if (
    tag === "INPUT" ||
    tag === "TEXTAREA"
  ) return;

  if (event.key === "ArrowRight") {
    goToSection(currentIndex() + 1);
  }

  if (event.key === "ArrowLeft") {
    goToSection(currentIndex() - 1);
  }

  if (event.key === "ArrowUp") {
    rotationX -= .25;
  }

  if (event.key === "ArrowDown") {
    rotationX += .25;
  }

  if (
    event.key === "+" ||
    event.key === "="
  ) {
    setZoom(currentZoom - .7);
  }

  if (event.key === "-") {
    setZoom(currentZoom + .7);
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

    rotationY += delta * .055;

    if (Math.abs(delta) < .001) {
      rotationY = targetRotationY;
      menuAnimating = false;
    }

  } else if (!isDragging) {
    rotationY += velocityY;
    rotationX += velocityX;

    velocityY *= CONFIG.friction;
    velocityX *= CONFIG.friction;

    if (Math.abs(velocityY) < .00004) {
      velocityY = 0;
    }

    if (Math.abs(velocityX) < .00004) {
      velocityX = 0;
    }
  }

  globeGroup.rotation.set(
    rotationX,
    rotationY,
    0
  );

  if (homeVideoPlaying) {
    updateHomeVideoFrame();
  }

  const deltaX =
    rotationX - echoesLastRotationX;

  const deltaY =
    rotationY - echoesLastRotationY;

  echoesLastRotationX = rotationX;
  echoesLastRotationY = rotationY;

  if (
    currentIndex() === 3 &&
    globeTexture &&
    (
      Math.abs(deltaX) > .000001 ||
      Math.abs(deltaY) > .000001
    )
  ) {
    echoesAngle +=
      deltaY * .85 + deltaX * .35;

    refreshEchoesTexture();
  }

  renderer.render(scene, camera);
  updateIndicator();
}

animate();

/* =========================================
   RESIZE
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

/* =========================================
   ENDE CAMOU SCRIPT
========================================= */
