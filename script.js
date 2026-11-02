
import * as THREE from "three";

/* =========================================
   CAMOU — 3D GLOBE
   ANALOGER SOCIAL-KOMPASS
========================================= */

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

const ASSETS = Object.fromEntries(
  Object.entries({
    home: "hero.jpg",
    homeVideo: "test.webm",
    music: "release.jpg",
    visuals: "visuals.jpg",
    archive: "archive.jpg",
    contact: "contact.jpg"
  }).map(([key, filename]) => [
    key,
    new URL("./assets/" + filename, import.meta.url).href
  ])
);

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
   DOM UND THREE.JS
========================================= */

const $ = id => document.getElementById(id);

const container = $("globe");
const stage = document.querySelector(".globe-stage");
const navButtons = [
  ...document.querySelectorAll(".nav-link")
];

const defaultZoom =
  matchMedia("(max-width:700px)").matches
    ? CONFIG.mobileZoom
    : CONFIG.desktopZoom;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#101411");

const camera = new THREE.PerspectiveCamera(
  38,
  Math.max(1, container.clientWidth) /
    Math.max(1, container.clientHeight),
  0.1,
  100
);

let currentZoom = defaultZoom;
camera.position.z = currentZoom;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(
  Math.min(devicePixelRatio, 2)
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
   BELEUCHTUNG
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
   KUGEL
========================================= */

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius,
    160,
    112
  ),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02
  })
);

globeGroup.add(globe);

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
   ZUSTAND
========================================= */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const sectionStep =
  Math.PI * 2 / sections.length;

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

let pinchDistance = 0;
let pinchZoom = currentZoom;

const pointers = new Map();

let globeCanvas = null;
let globeContext = null;
let globeTexture = null;
let baseTextureCanvas = null;

/* =========================================
   HOME VIDEO
========================================= */

const homeVideo = document.createElement("video");

Object.assign(homeVideo, {
  src: ASSETS.homeVideo,
  loop: true,
  muted: false,
  volume: 1,
  playsInline: true,
  preload: "auto"
});

let homeVideoStarted = false;
let homeVideoPlaying = false;
let homeVideoStarting = false;

/* =========================================
   BILDER LADEN
========================================= */

function loadImage(src) {
  return new Promise(resolve => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      const canvas = document.createElement("canvas");

      canvas.width = 1024;
      canvas.height = 1024;

      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(
        0, 0, 1024, 1024
      );

      gradient.addColorStop(0, "#354a39");
      gradient.addColorStop(0.5, "#1b3025");
      gradient.addColorStop(1, "#0a1510");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      resolve(canvas);
    };

    image.src = src;
  });
}

function cover(ctx, image, x, y, w, h) {
  const iw =
    image.videoWidth ||
    image.naturalWidth ||
    image.width;

  const ih =
    image.videoHeight ||
    image.naturalHeight ||
    image.height;

  if (!iw || !ih) return;

  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;

  ctx.drawImage(
    image,
    (iw - sw) / 2,
    (ih - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h
  );
}

function playButton(ctx, x, y) {
  ctx.save();

  ctx.fillStyle = "rgba(8,13,10,.72)";
  ctx.strokeStyle = "#f0f2eb";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f0f2eb";
  ctx.beginPath();

  ctx.moveTo(x - 6, y - 10);
  ctx.lineTo(x + 11, y);
  ctx.lineTo(x - 6, y + 10);

  ctx.fill();
  ctx.restore();
}

/* =========================================
   FARBWELTEN
========================================= */

const SECTION_COLORS = [
  {
    top: [24, 36, 28],
    middle: [32, 47, 36],
    bottom: [15, 25, 19]
  },
  {
    top: [20, 33, 28],
    middle: [29, 43, 37],
    bottom: [13, 23, 20]
  },
  {
    top: [27, 39, 29],
    middle: [36, 49, 36],
    bottom: [17, 26, 19]
  },
  {
    top: [17, 29, 23],
    middle: [26, 40, 31],
    bottom: [12, 22, 17]
  },
  {
    top: [29, 39, 29],
    middle: [38, 49, 36],
    bottom: [19, 27, 20]
  }
];

const lerp = (a, b, t) =>
  a + (b - a) * t;

const smooth = t => {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
};

const mix = (a, b, t) =>
  a.map((value, i) =>
    lerp(value, b[i], t)
  );

function sectionColor(position, vertical) {
  const count = SECTION_COLORS.length;

  const p =
    ((position % count) + count) % count;

  const index = Math.floor(p);
  const fraction = p - index;

  const blend = lerp(
    fraction,
    (1 - Math.cos(fraction * Math.PI)) / 2,
    CONFIG.gradientSoftness
  );

  const verticalColor = color => {
    if (vertical < 0.5) {
      return mix(
        color.top,
        color.middle,
        smooth(vertical * 2)
      );
    }

    return mix(
      color.middle,
      color.bottom,
      smooth((vertical - 0.5) * 2)
    );
  };

  return mix(
    [26, 39, 30],
    mix(
      verticalColor(SECTION_COLORS[index]),
      verticalColor(
        SECTION_COLORS[(index + 1) % count]
      ),
      blend
    ),
    CONFIG.gradientStrength
  );
}

/* =========================================
   NAHTLOSER HINTERGRUND
========================================= */

function drawBackground(ctx, width, height) {
  const small = document.createElement("canvas");

  small.width = 1024;
  small.height = 512;

  const g = small.getContext("2d");

  const image = g.createImageData(1024, 512);

  for (let y = 0; y < 512; y++) {
    const v = y / 511;

    for (let x = 0; x < 1024; x++) {
      const u = x / 1024;

      const original = sectionColor(
        (u - 0.25) * 5,
        v
      );

      const poleMix = smooth(
        Math.min(
          1,
          Math.min(v, 1 - v) / 0.24
        )
      );

      const color = mix(
        [22, 34, 26],
        original,
        poleMix
      );

      const light =
        (
          1 +
          0.035 *
          Math.cos(2 * Math.PI * (u - 0.25)) *
          Math.sin(Math.PI * v)
        ) *
        (
          1 -
          0.07 *
          Math.pow(Math.abs(v - 0.5) * 2, 2)
        );

      const j = (y * 1024 + x) * 4;

      for (let k = 0; k < 3; k++) {
        image.data[j + k] =
          Math.round(color[k] * light);
      }

      image.data[j + 3] = 255;
    }
  }

  g.putImageData(image, 0, 0);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(small, 0, 0, width, height);
  ctx.restore();
}

/* =========================================
   ECHOES — SOCIAL LINKS
========================================= */

const ECHOES_LINKS = [
  {
    label: "SPOTIFY",
    angle: -Math.PI / 2,
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
  },
  {
    label: "INSTAGRAM",
    angle: Math.PI,
    url: "https://www.instagram.com/b3nn3t"
  }
];

const compassRadius = 132;

const compassCenterY =
  2048 * (0.475 + 0.19 / 2);

let echoesImage = null;

let needleAngle = 0;
let targetNeedleAngle = 0;

let sensorHeading = null;
let lastSensorAt = 0;
let compassLastRedraw = 0;

const wrapAngle = angle =>
  Math.atan2(
    Math.sin(angle),
    Math.cos(angle)
  );

/* =========================================
   SENSORSTEUERUNG
   KEINE BERECHTIGUNGSABFRAGE
========================================= */

window.addEventListener(
  "deviceorientation",
  event => {
    let heading = null;

    if (
      Number.isFinite(
        event.webkitCompassHeading
      )
    ) {
      heading = event.webkitCompassHeading;

    } else if (
      event.absolute === true &&
      Number.isFinite(event.alpha)
    ) {
      heading = 360 - event.alpha;
    }

    if (heading === null) return;

    sensorHeading = heading;
    lastSensorAt = performance.now();
  },
  { passive: true }
);

/* =========================================
   SOCIAL ICONS ZEICHNEN
========================================= */

function socialIcon(ctx, label, x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = "#eef5eb";
  ctx.fillStyle = "#eef5eb";
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (label === "SPOTIFY") {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();

      ctx.arc(
        0,
        8 + i * 3,
        17 - i * 4,
        Math.PI * 1.18,
        Math.PI * 1.83
      );

      ctx.stroke();
    }
  }

  if (label === "APPLE") {
    ctx.font = "bold 27px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♫", 0, 1);
  }

  if (label === "YOUTUBE") {
    ctx.beginPath();
    ctx.roundRect(-17, -12, 34, 24, 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-4, -7);
    ctx.lineTo(8, 0);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fill();
  }

  if (label === "INSTAGRAM") {
    ctx.beginPath();
    ctx.roundRect(-15, -15, 30, 30, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(9, -9, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/* =========================================
   ANALOGEN KOMPASS ZEICHNEN
========================================= */

function drawEchoesCompass(ctx, cx, cy) {
  ctx.save();

  const gradient = ctx.createRadialGradient(
    cx - 32,
    cy - 44,
    10,
    cx,
    cy,
    185
  );

  gradient.addColorStop(
    0,
    "rgba(33,49,36,.96)"
  );

  gradient.addColorStop(
    0.7,
    "rgba(8,17,11,.96)"
  );

  gradient.addColorStop(
    1,
    "rgba(4,10,7,.96)"
  );

  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.arc(cx, cy, 174, 0, Math.PI * 2);
  ctx.fill();

  // Äusserer Ring

  ctx.strokeStyle =
    "rgba(230,242,224,.65)";

  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 174, 0, Math.PI * 2);
  ctx.stroke();

  // Innerer Ring

  ctx.strokeStyle =
    "rgba(230,242,224,.24)";

  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(cx, cy, 163, 0, Math.PI * 2);
  ctx.stroke();

  // 120 Gradmarkierungen

  for (let i = 0; i < 120; i++) {
    const angle =
      i * Math.PI / 60 - Math.PI / 2;

    const major = i % 10 === 0;

    const inner = major
      ? 148
      : i % 5 === 0
        ? 154
        : 159;

    ctx.beginPath();

    ctx.moveTo(
      cx + Math.cos(angle) * inner,
      cy + Math.sin(angle) * inner
    );

    ctx.lineTo(
      cx + Math.cos(angle) * 163,
      cy + Math.sin(angle) * 163
    );

    ctx.strokeStyle = major
      ? "rgba(240,248,237,.9)"
      : "rgba(240,248,237,.5)";

    ctx.lineWidth = major ? 1.8 : 0.8;
    ctx.stroke();
  }

  // Dezente Richtungslinien

  ctx.strokeStyle =
    "rgba(220,237,216,.18)";

  ctx.lineWidth = 1;

  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;

    ctx.beginPath();

    ctx.moveTo(
      cx + Math.cos(angle) * 58,
      cy + Math.sin(angle) * 58
    );

    ctx.lineTo(
      cx + Math.cos(angle) * 115,
      cy + Math.sin(angle) * 115
    );

    ctx.stroke();
  }

  // Gradangaben

  ctx.font =
    "500 12px 'DM Mono', monospace";

  ctx.fillStyle =
    "rgba(224,236,218,.75)";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const degrees = [
    ["45°", -Math.PI / 4],
    ["135°", Math.PI / 4],
    ["225°", 3 * Math.PI / 4],
    ["315°", 5 * Math.PI / 4]
  ];

  for (const [text, angle] of degrees) {
    ctx.fillText(
      text,
      cx + Math.cos(angle) * 136,
      cy + Math.sin(angle) * 136
    );
  }

  /* ROTE UND WEISSE NADEL */

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(needleAngle);

  // Rote Nordspitze

  ctx.fillStyle = "#ed4438";

  ctx.beginPath();
  ctx.moveTo(0, -112);
  ctx.lineTo(-12, 8);
  ctx.lineTo(0, -3);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fill();

  // Weisse Südspitze

  ctx.fillStyle = "#e9eee5";

  ctx.beginPath();
  ctx.moveTo(0, 112);
  ctx.lineTo(-12, -8);
  ctx.lineTo(0, 3);
  ctx.lineTo(12, -8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  /* FESTE SOCIAL ICONS */

  for (const item of ECHOES_LINKS) {
    const x =
      cx +
      Math.cos(item.angle) * compassRadius;

    const y =
      cy +
      Math.sin(item.angle) * compassRadius;

    ctx.fillStyle = "#142019";

    ctx.beginPath();
    ctx.arc(x, y, 27, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle =
      "rgba(234,245,230,.75)";

    ctx.lineWidth = 1.5;
    ctx.stroke();

    socialIcon(ctx, item.label, x, y);
  }

  // Mittlere Achse

  ctx.fillStyle = "#15231a";
  ctx.strokeStyle = "#e1ebe0";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#dbe7d6";

  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* =========================================
   BEREICHE ZEICHNEN
========================================= */

function drawPanel(
  ctx,
  section,
  image,
  cx,
  panelWidth,
  canvasHeight
) {
  const x = cx - panelWidth / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, panelWidth, canvasHeight);
  ctx.clip();

  const contentW = panelWidth * 0.76;

  // CAMOU-Buchstabe

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle =
    "rgba(235,242,229,.82)";

  ctx.font = "300 30px Manrope, Arial";

  ctx.fillText(
    section.poleLetter,
    cx,
    canvasHeight * 0.020
  );

  // Kategorie

  ctx.textBaseline = "alphabetic";

  ctx.fillStyle =
    "rgba(232,239,226,.65)";

  ctx.font =
    "500 21px 'DM Mono', monospace";

  ctx.fillText(
    section.eyebrow,
    cx,
    canvasHeight * 0.24,
    contentW
  );

  // Titel

  ctx.fillStyle = "#f0f2eb";

  ctx.font = section.name === "MUSIC"
    ? "300 45px Manrope, Arial"
    : "300 58px Manrope, Arial";

  const titleY = canvasHeight * 0.31;

  section.title.forEach((line, i) => {
    ctx.fillText(
      line,
      cx,
      titleY + i * 76,
      contentW
    );
  });

  // Beschreibung

  const bodyStart =
    titleY +
    (section.title.length - 1) * 76 +
    100;

  ctx.fillStyle =
    "rgba(235,239,230,.86)";

  ctx.font = "300 22px Manrope, Arial";

  section.body.forEach((line, i) => {
    ctx.fillText(
      line,
      cx,
      bodyStart + i * 43,
      contentW
    );
  });

  // Zusätzliche Informationen

  if (section.extra) {
    ctx.fillStyle = "#c1d0b7";

    ctx.font =
      "500 18px 'DM Mono', monospace";

    section.extra.forEach((line, i) => {
      ctx.fillText(
        line,
        cx,
        bodyStart +
          section.body.length * 43 +
          35 +
          i * 39,
        contentW
      );
    });
  }

  /* BILDFENSTER */

  const imageW = panelWidth * 0.56;
  const imageH = canvasHeight * 0.19;

  const imageX = cx - imageW / 2;
  const imageY = canvasHeight * 0.475;

  if (section.name === "ECHOES") {
    // Echoes zeigt den analogen Kompass
    // statt eines Foto-Rechtecks.

    drawEchoesCompass(
      ctx,
      cx,
      imageY + imageH / 2
    );

  } else {
    ctx.fillStyle = "rgba(8,13,10,.9)";

    ctx.fillRect(
      imageX - 8,
      imageY - 8,
      imageW + 16,
      imageH + 16
    );

    ctx.save();
    ctx.beginPath();

    ctx.rect(
      imageX,
      imageY,
      imageW,
      imageH
    );

    ctx.clip();

    if (
      section.name === "HOME" &&
      homeVideoStarted &&
      homeVideo.readyState >= 2
    ) {
      cover(
        ctx,
        homeVideo,
        imageX,
        imageY,
        imageW,
        imageH
      );

    } else {
      cover(
        ctx,
        image,
        imageX,
        imageY,
        imageW,
        imageH
      );

      if (section.name === "HOME") {
        playButton(
          ctx,
          cx,
          imageY + imageH / 2
        );
      }
    }

    ctx.restore();

    if (
      section.name === "MUSIC" ||
      section.name === "CONTACT"
    ) {
      ctx.fillStyle = "#e2ebdc";
      ctx.font = "300 45px Manrope, Arial";

      ctx.fillText(
        "ÖFFNEN  ↗",
        cx,
        imageY - 23
      );
    }

    ctx.strokeStyle =
      "rgba(226,235,220,.48)";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      imageX,
      imageY,
      imageW,
      imageH
    );
  }

  // Untere Linie

  ctx.strokeStyle =
    "rgba(226,235,220,.35)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    cx - contentW / 2,
    canvasHeight * 0.88
  );

  ctx.lineTo(
    cx + contentW / 2,
    canvasHeight * 0.88
  );

  ctx.stroke();

  // Seitennummer

  ctx.fillStyle =
    "rgba(232,239,226,.62)";

  ctx.font =
    "19px 'DM Mono', monospace";

  ctx.fillText(
    `${String(
      sections.indexOf(section) + 1
    ).padStart(2, "0")} / 05`,
    cx,
    canvasHeight * 0.92
  );

  ctx.restore();
}

/* =========================================
   TEXTUR ERSTELLEN
========================================= */

function drawWrappedPanel(ctx, index, image) {
  const w = 4096;
  const h = 2048;
  const pw = w / sections.length;

  const cx =
    w * (0.25 + index / sections.length);

  drawPanel(
    ctx,
    sections[index],
    image,
    cx,
    pw,
    h
  );

  if (cx - pw / 2 < 0) {
    drawPanel(
      ctx,
      sections[index],
      image,
      cx + w,
      pw,
      h
    );
  }

  if (cx + pw / 2 > w) {
    drawPanel(
      ctx,
      sections[index],
      image,
      cx - w,
      pw,
      h
    );
  }
}

async function createGlobeTexture() {
  const images = await Promise.all(
    [
      ASSETS.home,
      ASSETS.music,
      ASSETS.visuals,
      ASSETS.archive,
      ASSETS.contact
    ].map(loadImage)
  );

  echoesImage = images[3];

  const canvas = document.createElement("canvas");

  canvas.width = 4096;
  canvas.height = 2048;

  const ctx = canvas.getContext("2d");

  globeCanvas = canvas;
  globeContext = ctx;

  drawBackground(ctx, 4096, 2048);

  images.forEach((image, index) => {
    drawWrappedPanel(ctx, index, image);
  });

  // Statische Textur speichern,
  // damit die Kompassnadel keine Spuren erzeugt.

  baseTextureCanvas =
    document.createElement("canvas");

  baseTextureCanvas.width = 4096;
  baseTextureCanvas.height = 2048;

  baseTextureCanvas
    .getContext("2d")
    .drawImage(canvas, 0, 0);

  const texture = new THREE.CanvasTexture(
    canvas
  );

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;

  texture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();

  globeTexture = texture;

  return texture;
}

createGlobeTexture()
  .then(texture => {
    globe.material.map = texture;
    globe.material.needsUpdate = true;
  })
  .catch(console.error);

/* =========================================
   HOME VIDEO AKTUALISIEREN
========================================= */

function updateHomeVideoFrame() {
  if (
    !homeVideoStarted ||
    !globeTexture ||
    homeVideo.readyState < 2
  ) return;

  const w = 4096;
  const h = 2048;
  const pw = w / 5;

  const cx = w * 0.25;
  const iw = pw * 0.56;
  const ih = h * 0.19;

  const ix = cx - iw / 2;
  const iy = h * 0.475;

  globeContext.save();
  globeContext.beginPath();
  globeContext.rect(ix, iy, iw, ih);
  globeContext.clip();

  cover(
    globeContext,
    homeVideo,
    ix,
    iy,
    iw,
    ih
  );

  globeContext.restore();

  if (homeVideo.paused) {
    playButton(
      globeContext,
      cx,
      iy + ih / 2
    );
  }

  globeTexture.needsUpdate = true;
}

/* =========================================
   KOMPASS AKTUALISIEREN
========================================= */

function refreshEchoesTexture() {
  if (
    !globeTexture ||
    !echoesImage ||
    !baseTextureCanvas
  ) return;

  const w = 4096;
  const h = 2048;
  const pw = w / 5;

  const cx = w * (0.25 + 3 / 5);
  const x = cx - pw / 2;

  globeContext.save();
  globeContext.beginPath();
  globeContext.rect(x, 0, pw, h);
  globeContext.clip();

  globeContext.drawImage(
    baseTextureCanvas,
    0,
    0
  );

  globeContext.restore();

  drawPanel(
    globeContext,
    sections[3],
    echoesImage,
    cx,
    pw,
    h
  );

  globeTexture.needsUpdate = true;
}

/* =========================================
   NAVIGATION
========================================= */

function currentIndex() {
  const index = Math.round(
    -rotationY / sectionStep
  );

  return ((index % 5) + 5) % 5;
}

function updateIndicator() {
  const index = currentIndex();

  $("current-section").textContent =
    sections[index].name;

  $("section-number").textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, i) => {
    button.classList.toggle(
      "active",
      index === i
    );
  });
}

function goToSection(index) {
  const i = ((index % 5) + 5) % 5;

  rotationX = 0;
  velocityX = 0;
  velocityY = 0;

  isDragging = false;

  pointers.clear();
  pointerStart = null;

  stage.classList.remove("dragging");

  let destination = -i * sectionStep;

  while (destination - rotationY > Math.PI) {
    destination -= 2 * Math.PI;
  }

  while (destination - rotationY < -Math.PI) {
    destination += 2 * Math.PI;
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

$("logo").addEventListener("click", event => {
  event.preventDefault();
  goToSection(0);
});

/* =========================================
   SPOTIFY MODAL
========================================= */

const spotifyModal = $("spotify-modal");
const spotifyPlayer = $("spotify-modal-player");
const spotifyClose = $("spotify-modal-close");

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

  if (spotifyPlayer) {
    spotifyPlayer.src =
      spotifyPlayer.dataset.src ||
      "https://open.spotify.com/embed/artist/7pajHvUWNCnOPhDPyH4M6x?theme=0";
  }

  spotifyClose?.focus({
    preventScroll: true
  });
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

spotifyClose?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    event.stopPropagation();
    closeSpotifyModal();
  }
);

spotifyModal?.addEventListener(
  "pointerdown",
  event => {
    if (
      event.target === spotifyModal ||
      event.target.closest?.(
        "[data-close-spotify]"
      )
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

const contactModal = $("contact-modal");
const contactForm = $("contact-form");
const contactClose = $("contact-modal-close");
const contactStatus = $("contact-status");
const contactSubmit = $("contact-submit");

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

  contactModal
    .querySelector('input[name="name"]')
    ?.focus({ preventScroll: true });
}

function closeContactModal() {
  if (!contactModal) return;

  contactOpen = false;
  contactModal.hidden = true;
  contactModal.style.display = "none";

  document.body.classList.remove(
    "contact-dialog-open"
  );
}

contactClose?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    closeContactModal();
  }
);

contactModal?.addEventListener(
  "click",
  event => {
    if (
      event.target === contactModal ||
      event.target.closest?.(
        "[data-close-contact]"
      )
    ) {
      closeContactModal();
    }
  }
);

/* =========================================
   KONTAKTFORMULAR
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

    if (contactStatus) {
      contactStatus.textContent =
        "Nachricht wird übertragen …";
    }

    const data = new FormData(contactForm);

    data.set("privacy", "zugestimmt");
    data.set("website", "");

    try {
      await fetch(CONTACT_SCRIPT_URL, {
        method: "POST",
        body: data,
        mode: "no-cors"
      });

      if (contactStatus) {
        contactStatus.textContent =
          "Übertragung abgeschlossen. Empfang konnte nicht bestätigt werden.";
      }

    } catch (error) {
      console.error(
        "Kontaktformular:",
        error
      );

      if (contactStatus) {
        contactStatus.textContent =
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
   RAYCASTING
========================================= */

function texturePoint(event) {
  const rect =
    renderer.domElement.getBoundingClientRect();

  pointer.set(
    (event.clientX - rect.left) /
      rect.width * 2 - 1,

    -(
      (event.clientY - rect.top) /
      rect.height * 2 - 1
    )
  );

  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  raycaster.setFromCamera(
    pointer,
    camera
  );

  const hit =
    raycaster.intersectObject(globe)[0];

  if (!hit?.uv) return null;

  return {
    x: hit.uv.x * 4096,
    y: (1 - hit.uv.y) * 2048
  };
}

function localX(point, index) {
  const cx =
    4096 * (0.25 + index / 5);

  return (
    (point.x - cx + 6144) % 4096
  ) - 2048;
}

function inImage(point, index) {
  if (!point) return false;

  const pw = 4096 / 5;

  return (
    Math.abs(localX(point, index)) <=
      pw * 0.56 / 2 &&

    point.y >= 2048 * 0.475 &&

    point.y <=
      2048 * (0.475 + 0.19)
  );
}

/* =========================================
   KLICK AUF KUGEL
========================================= */

function handleGlobeClick(event) {
  const index = currentIndex();
  const point = texturePoint(event);

  if (!point) return;

  // Spotify

  if (
    index === 1 &&
    inImage(point, 1)
  ) {
    openSpotifyModal();
    return;
  }

  // Contact

  if (
    index === 4 &&
    inImage(point, 4)
  ) {
    openContactModal();
    return;
  }

  // Echoes Social-Icons

  if (index === 3) {
    const dx = localX(point, 3);

    const dy =
      point.y - compassCenterY;

    const item = ECHOES_LINKS.find(link => {
      const x =
        Math.cos(link.angle) *
        compassRadius;

      const y =
        Math.sin(link.angle) *
        compassRadius;

      return Math.hypot(
        dx - x,
        dy - y
      ) < 31;
    });

    if (item) {
      window.open(
        item.url,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }
  }

  // Home-Video

  if (
    index !== 0 ||
    !inImage(point, 0) ||
    homeVideoStarting
  ) return;

  if (
    homeVideoStarted &&
    !homeVideo.paused
  ) {
    homeVideo.pause();
    homeVideoPlaying = false;
    updateHomeVideoFrame();
    return;
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

$("zoom-in")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(currentZoom - 0.7);
  }
);

$("zoom-out")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(currentZoom + 0.7);
  }
);

$("zoom-reset")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(defaultZoom);
  }
);

const zoomControls =
  document.querySelector(".zoom-controls");

for (const type of [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel",
  "wheel"
]) {
  zoomControls?.addEventListener(
    type,
    event => event.stopPropagation()
  );
}

stage.addEventListener(
  "wheel",
  event => {
    if (
      event.target.closest(".zoom-controls")
    ) return;

    event.preventDefault();

    setZoom(
      currentZoom + event.deltaY * 0.008
    );
  },
  { passive: false }
);

/* =========================================
   MAUS UND TOUCH
========================================= */

const distance = (a, b) =>
  Math.hypot(
    a.x - b.x,
    a.y - b.y
  );

stage.addEventListener(
  "pointerdown",
  event => {
    if (
      spotifyOpen ||
      contactOpen ||
      event.target !== renderer.domElement
    ) return;

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    pointerStart = {
      x: event.clientX,
      y: event.clientY
    };

    stage.setPointerCapture(
      event.pointerId
    );

    if (pointers.size === 1) {
      isDragging = true;

      previousX = event.clientX;
      previousY = event.clientY;
      lastTime = performance.now();

      velocityX = 0;
      velocityY = 0;
      menuAnimating = false;

      stage.classList.add("dragging");

      $("hint")?.classList.add(
        "hidden"
      );

    } else if (pointers.size === 2) {
      isDragging = false;
      pointerStart = null;

      stage.classList.remove("dragging");

      const points = [
        ...pointers.values()
      ];

      pinchDistance = distance(
        points[0],
        points[1]
      );

      pinchZoom = currentZoom;
    }
  }
);

stage.addEventListener(
  "pointermove",
  event => {
    if (
      !pointers.has(event.pointerId)
    ) return;

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (pointers.size >= 2) {
      const points = [
        ...pointers.values()
      ];

      if (pinchDistance > 0) {
        setZoom(
          pinchZoom /
          (
            distance(
              points[0],
              points[1]
            ) / pinchDistance
          )
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

    const dx =
      event.clientX - previousX;

    const dy =
      event.clientY - previousY;

    const factor = Math.min(
      dt / 16,
      2
    );

    const mx =
      dx * CONFIG.dragSpeed;

    const my =
      dy * CONFIG.dragSpeed;

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
    !pointers.has(event.pointerId)
  ) return;

  if (
    event.type === "pointerup" &&
    pointerStart &&
    distance(
      {
        x: event.clientX,
        y: event.clientY
      },
      pointerStart
    ) <= 7 &&
    !spotifyOpen &&
    !contactOpen
  ) {
    handleGlobeClick(event);
  }

  pointerStart = null;

  pointers.delete(
    event.pointerId
  );

  if (pointers.size === 0) {
    isDragging = false;

    stage.classList.remove(
      "dragging"
    );

  } else if (pointers.size === 1) {
    const point = [
      ...pointers.values()
    ][0];

    previousX = point.x;
    previousY = point.y;

    lastTime = performance.now();

    velocityX = 0;
    velocityY = 0;

    isDragging = true;

    stage.classList.add(
      "dragging"
    );
  }
}

stage.addEventListener(
  "pointerup",
  releasePointer
);

stage.addEventListener(
  "pointercancel",
  releasePointer
);

stage.addEventListener(
  "lostpointercapture",
  releasePointer
);

/* =========================================
   TASTATUR
========================================= */

window.addEventListener(
  "keydown",
  event => {
    if (
      spotifyOpen ||
      contactOpen ||
      [
        "INPUT",
        "TEXTAREA",
        "SELECT"
      ].includes(
        document.activeElement?.tagName
      )
    ) return;

    if (event.key === "ArrowRight") {
      goToSection(
        currentIndex() + 1
      );
    }

    if (event.key === "ArrowLeft") {
      goToSection(
        currentIndex() - 1
      );
    }

    if (event.key === "ArrowUp") {
      rotationX -= 0.25;
    }

    if (event.key === "ArrowDown") {
      rotationX += 0.25;
    }

    if (
      event.key === "+" ||
      event.key === "="
    ) {
      setZoom(currentZoom - 0.7);
    }

    if (event.key === "-") {
      setZoom(currentZoom + 0.7);
    }

    if (event.key === "0") {
      setZoom(defaultZoom);
    }
  }
);

/* =========================================
   ANIMATION
========================================= */

let lastRotationX = 0;
let lastRotationY = 0;

let fallbackHeading = 0;

function animate(now = 0) {
  requestAnimationFrame(animate);

  if (
    !isDragging &&
    menuAnimating
  ) {
    const delta =
      targetRotationY - rotationY;

    rotationY += delta * 0.055;

    if (
      Math.abs(delta) < 0.001
    ) {
      rotationY = targetRotationY;
      menuAnimating = false;
    }

  } else if (!isDragging) {
    rotationY += velocityY;
    rotationX += velocityX;

    velocityY *= CONFIG.friction;
    velocityX *= CONFIG.friction;

    if (
      Math.abs(velocityY) < 0.00004
    ) {
      velocityY = 0;
    }

    if (
      Math.abs(velocityX) < 0.00004
    ) {
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

  /* KOMPASSBEWEGUNG */

  const deltaY =
    rotationY - lastRotationY;

  const deltaX =
    rotationX - lastRotationX;

  lastRotationY = rotationY;
  lastRotationX = rotationX;

  // Gestalterischer Fallback:
  // Kugeldrehung bewegt die Nadel.

  fallbackHeading +=
    deltaY * 0.85 +
    deltaX * 0.35;

  // Sensordaten haben Vorrang,
  // sofern sie aktuell sind.

  const sensorFresh =
    sensorHeading !== null &&
    now - lastSensorAt < 2500;

  targetNeedleAngle = sensorFresh
    ? -sensorHeading * Math.PI / 180
    : fallbackHeading;

  const delta = wrapAngle(
    targetNeedleAngle - needleAngle
  );

  if (
    Math.abs(delta) > 0.001
  ) {
    // Sanfte Nadelbewegung

    needleAngle += delta * 0.12;

    // Maximal etwa 30 Aktualisierungen
    // pro Sekunde für die Kompass-Textur.

    if (
      currentIndex() === 3 &&
      now - compassLastRedraw > 32
    ) {
      refreshEchoesTexture();

      compassLastRedraw = now;
    }
  }

  renderer.render(
    scene,
    camera
  );

  updateIndicator();
}

requestAnimationFrame(animate);

/* =========================================
   RESIZE
========================================= */

function resize() {
  const w = Math.max(
    1,
    container.clientWidth
  );

  const h = Math.max(
    1,
    container.clientHeight
  );

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);

  renderer.setPixelRatio(
    Math.min(devicePixelRatio, 2)
  );
}

window.addEventListener(
  "resize",
  resize
);

setZoom(defaultZoom);
updateIndicator();

/* =========================================
   ENDE CAMOU SCRIPT
========================================= */
