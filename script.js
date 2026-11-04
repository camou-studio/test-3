import * as THREE from "three";

/* =========================================
   CAMOU — COMPLETE GLOBE SCRIPT
   HYBRID COMPASS / VISUALS / MODALS
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
  gradientSoftness: 0.85,
  visualScale: 0.78
};

const ASSETS = {
  home: new URL("./assets/hero.jpg", import.meta.url).href,
  homeVideo: new URL("./assets/test.webm", import.meta.url).href,
  music: new URL("./assets/release.jpg", import.meta.url).href,
  visuals: new URL("./assets/visuals.jpg", import.meta.url).href,
  visualSlides: [
    new URL("./assets/visuals.jpg", import.meta.url).href,
    new URL("./assets/visuals-01.jpg", import.meta.url).href,
    new URL("./assets/visuals-02.jpg", import.meta.url).href,
    new URL("./assets/visuals-03.jpg", import.meta.url).href
  ],
  archive: new URL("./assets/archive.jpg", import.meta.url).href,
  contact: new URL("./assets/contact.jpg", import.meta.url).href
};

const sections = [
  {
    name: "HOME",
    poleLetter: "c",
    eyebrow: "01 — NEW Project",
    title: ["c a m o u"],
    body: ["Gleiche Fragen.", "Neue Perspektiven."],
    image: ASSETS.home
  },
  {
    name: "MUSIC",
    poleLetter: "a",
    eyebrow: "02 — Releases",
    title: ["f r a g m e n t e"],
    body: [
      "vom Wind getragen,",
       "zwischen Licht und Schatten.",
      "zwischen dem, was man sieht ",
      "und dem, was bleibt."
    ],
    image: ASSETS.music
  },
  {
    name: "VISUALS",
    poleLetter: "m",
    eyebrow: "03 — VISUAL WORK",
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
    eyebrow: "04 — Elsewhere",
    title: ["Echoes"],
    body: [
      "Songs und Spuren, die an",
      "verschiedenen Orten widerhallen.",
      "Folge Ihnen"
    ],
    image: ASSETS.archive
  },
  {
    name: "CONTACT",
    poleLetter: "u",
    eyebrow: "05 — GET IN TOUCH",
    title: ["Contact"],
    body: [
      "Für Anfragen und Zusammenarbeit.",
      "Oder einfach so."
    ],
    image: ASSETS.contact,
    extra: [""]
  }
];

/* =========================================
   HELPERS
========================================= */

const $ = id => document.getElementById(id);

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

const lerp = (a, b, t) =>
  a + (b - a) * t;

const smooth = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

const mix = (a, b, t) =>
  a.map((value, i) => lerp(value, b[i], t));

const wrapAngle = angle =>
  Math.atan2(Math.sin(angle), Math.cos(angle));

const distance = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/* =========================================
   DOM
========================================= */

const container = $("globe");
const stage = document.querySelector(".globe-stage");
const navButtons = [
  ...document.querySelectorAll(".nav-link")
];

const mobile = window.matchMedia(
  "(max-width:700px)"
).matches;

const defaultZoom = mobile
  ? CONFIG.mobileZoom
  : CONFIG.desktopZoom;

/*
  Alte, separat schwebende Sensorfenster
  entfernen. Es wird keine neue HTML-Box
  für die Sensoraktivierung erstellt.
*/

function removeOldSensorBoxes() {
  for (const id of [
    "camou-motion-control",
    "compass-permission"
  ]) {
    document.getElementById(id)?.remove();
  }
}

removeOldSensorBoxes();

/* =========================================
   THREE.JS
========================================= */

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

const light = new THREE.DirectionalLight(
  0xe3f0dc,
  2.1
);

light.position.set(-3, 4, 5);
scene.add(light);

const rim = new THREE.PointLight(
  0x9bb99a,
  24,
  15
);

rim.position.set(4, -1, -3);
scene.add(rim);

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

const sectionStep = Math.PI * 2 / 5;
const pointers = new Map();

let rotationX = 0;
let rotationY = 0;

let velocityX = 0;
let velocityY = 0;

let previousX = 0;
let previousY = 0;
let lastTime = 0;

let isDragging = false;
let menuAnimating = false;

let targetRotationY = 0;
let pointerStart = null;

let pinchDistance = 0;
let pinchZoom = currentZoom;

let globeCanvas = null;
let globeContext = null;
let globeTexture = null;
let baseTextureCanvas = null;
let sceneNeedsRender = true;

let echoesImage = null;

/* =========================================
   VISUALS STATE
========================================= */

let visualImages = [];
let visualIndex = 0;

let visualLeverPointer = null;
let visualLeverMoved = false;
let visualLeverStartY = 0;

/* =========================================
   HOME VIDEO
========================================= */

const homeVideo = document.createElement("video");

homeVideo.src = ASSETS.homeVideo;
homeVideo.loop = true;
homeVideo.playsInline = true;
homeVideo.preload = "none";
homeVideo.volume = 1;

let homeVideoStarted = false;
let homeVideoPlaying = false;
let homeVideoStarting = false;

/* =========================================
   VIDEO-FRAME-OPTIMIERUNG
========================================= */

let homeVideoFrameRequest = null;
let lastVideoFallbackPaint = 0;

function startHomeVideoFrameUpdates() {
  if (
    homeVideoFrameRequest !== null ||
    typeof homeVideo.requestVideoFrameCallback !== "function"
  ) return;

  const onVideoFrame = () => {
    homeVideoFrameRequest = null;

    if (!homeVideoPlaying) return;

    updateHomeVideoFrame();

    homeVideoFrameRequest =
      homeVideo.requestVideoFrameCallback(onVideoFrame);
  };

  homeVideoFrameRequest =
    homeVideo.requestVideoFrameCallback(onVideoFrame);
}

function stopHomeVideoFrameUpdates() {
  if (
    homeVideoFrameRequest !== null &&
    typeof homeVideo.cancelVideoFrameCallback === "function"
  ) {
    homeVideo.cancelVideoFrameCallback(
      homeVideoFrameRequest
    );
  }

  homeVideoFrameRequest = null;
}


/* =========================================
   BILDER LADEN
========================================= */

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => {
      const canvas = document.createElement("canvas");

      canvas.width = 1024;
      canvas.height = 1024;

      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(
        0, 0, 1024, 1024
      );

      gradient.addColorStop(0, "#354a39");
      gradient.addColorStop(1, "#0a1510");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      resolve(canvas);
    };

    img.src = src;
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

/* =========================================
   NAHTLOSE FARBVERLÄUFE
========================================= */

const COLORS = [
  [[24,36,28],[32,47,36],[15,25,19]],
  [[20,33,28],[29,43,37],[13,23,20]],
  [[27,39,29],[36,49,36],[17,26,19]],
  [[17,29,23],[26,40,31],[12,22,17]],
  [[29,39,29],[38,49,36],[19,27,20]]
];

function sectionColor(position, vertical) {
  const p = ((position % 5) + 5) % 5;

  const index = Math.floor(p);
  const fraction = p - index;

  const blend = lerp(
    fraction,
    (1 - Math.cos(fraction * Math.PI)) / 2,
    CONFIG.gradientSoftness
  );

  const verticalColor = color =>
    vertical < 0.5
      ? mix(
          color[0],
          color[1],
          smooth(vertical * 2)
        )
      : mix(
          color[1],
          color[2],
          smooth((vertical - 0.5) * 2)
        );

  return mix(
    [26, 39, 30],
    mix(
      verticalColor(COLORS[index]),
      verticalColor(COLORS[(index + 1) % 5]),
      blend
    ),
    CONFIG.gradientStrength
  );
}

function drawBackground(ctx, width, height) {
  const small = document.createElement("canvas");

  small.width = 512;
  small.height = 256;

  const g = small.getContext("2d");
  const image = g.createImageData(512, 256);

  for (let y = 0; y < 256; y++) {
    const v = y / 255;

    for (let x = 0; x < 512; x++) {
      const u = x / 512;

      const pole = smooth(
        Math.min(
          1,
          Math.min(v, 1 - v) / 0.24
        )
      );

      const color = mix(
        [22, 34, 26],
        sectionColor((u - 0.25) * 5, v),
        pole
      );

      const lighting =
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

      const j = (y * 512 + x) * 4;

      for (let k = 0; k < 3; k++) {
        image.data[j + k] =
          color[k] * lighting;
      }

      image.data[j + 3] = 255;
    }
  }

  g.putImageData(image, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    small,
    0,
    0,
    width,
    height
  );
}

/* =========================================
   ECHOES SOCIAL LINKS
========================================= */

const SOCIAL = [
  {
    name: "SPOTIFY",
    angle: -Math.PI / 2,
    url: "https://open.spotify.com/intl-de/artist/7pajHvUWNCnOPhDPyH4M6x"
  },
  {
    name: "APPLE",
    angle: 0,
    url: "https://music.apple.com/ch/artist/b3nn3t/1786857463"
  },
  {
    name: "YOUTUBE",
    angle: Math.PI / 2,
    url: "https://www.youtube.com/@b333nn3t"
  },
  {
    name: "INSTAGRAM",
    angle: Math.PI,
    url: "https://www.instagram.com/b3nn3t"
  }
];

const compassRadius = 132;

const compassCenterY =
  2048 * (0.475 + 0.19 / 2);

let needleAngle = 0;
let targetNeedleAngle = 0;
let fallbackAngle = 0;

let lastGlobeX = 0;
let lastGlobeY = 0;
let lastCompassDraw = 0;

/* =========================================
   HYBRID-SENSOREN
========================================= */

let motionAngle = 0;
let motionLastAt = 0;

let orientationPrevious = null;
let orientationLastAt = 0;
let motionPreviousTime = 0;

let sensorHeading = null;
let headingLastAt = 0;

let sensorOptIn = false;
let sensorRequestPending = false;

let sensorStatusText = "AUTOMATISCHE ERKENNUNG";

const fresh = (timestamp, ms = 2200) =>
  timestamp > 0 &&
  performance.now() - timestamp < ms;

function registerMotion(delta) {
  if (!Number.isFinite(delta)) return;

  motionAngle = wrapAngle(
    motionAngle + clamp(delta, -0.18, 0.18)
  );

  motionLastAt = performance.now();
}

function onOrientation(event) {
  const now = performance.now();

  const alpha = event.alpha;
  const beta = event.beta;
  const gamma = event.gamma;

  if (
    ![alpha, beta, gamma].some(Number.isFinite)
  ) return;

  if (Number.isFinite(event.webkitCompassHeading)) {
    sensorHeading = event.webkitCompassHeading;
    headingLastAt = now;

  } else if (
    event.absolute === true &&
    Number.isFinite(alpha)
  ) {
    const screenAngle =
      Number.isFinite(screen.orientation?.angle)
        ? screen.orientation.angle
        : 0;

    sensorHeading =
      ((360 - alpha + screenAngle) % 360 + 360) % 360;

    headingLastAt = now;
  }

  const current = { alpha, beta, gamma };

  if (orientationPrevious) {
    const difference = (a, b) =>
      Number.isFinite(a) && Number.isFinite(b)
        ? wrapAngle((a - b) * Math.PI / 180)
        : 0;

    const da = difference(
      alpha,
      orientationPrevious.alpha
    );

    const db = difference(
      beta,
      orientationPrevious.beta
    );

    const dg = difference(
      gamma,
      orientationPrevious.gamma
    );

    registerMotion(
      -da * 0.85 +
      db * 0.35 +
      dg * 0.55
    );

  } else {
    motionLastAt = now;
  }

  orientationPrevious = current;
  orientationLastAt = now;
}

/*
  Verfügbare Sensorereignisse werden
  automatisch abonniert.

  Es wird hier KEINE Berechtigungsabfrage
  ausgelöst.
*/

window.addEventListener(
  "deviceorientation",
  onOrientation,
  { passive: true }
);

window.addEventListener(
  "deviceorientationabsolute",
  onOrientation,
  { passive: true }
);

window.addEventListener(
  "devicemotion",
  event => {
    const now = performance.now();

    if (now - orientationLastAt < 450) {
      return;
    }

    const rate = event.rotationRate;
    const acceleration =
      event.accelerationIncludingGravity;

    const dt = motionPreviousTime
      ? Math.min(
          0.1,
          (now - motionPreviousTime) / 1000
        )
      : 0.016;

    motionPreviousTime = now;

    if (
      rate &&
      [rate.alpha, rate.beta, rate.gamma]
        .some(Number.isFinite)
    ) {
      registerMotion(
        (
          (Number(rate.alpha) || 0) * -0.85 +
          (Number(rate.beta) || 0) * 0.35 +
          (Number(rate.gamma) || 0) * 0.55
        ) * Math.PI / 180 * dt
      );

    } else if (
      acceleration &&
      Number.isFinite(acceleration.x) &&
      Number.isFinite(acceleration.y)
    ) {
      registerMotion(
        clamp(
          (acceleration.x - acceleration.y) * 0.0005,
          -0.012,
          0.012
        )
      );
    }
  },
  { passive: true }
);


function sensorMode() {
  // Sensoren nur bei aktivierter Checkbox verwenden
  if (!sensorOptIn) {
    return "KUGELSTEUERUNG";
  }

  // Kompasssensor hat Priorität
  if (fresh(headingLastAt)) {
    return "KOMPASS AKTIV";
  }

  // Alternativ Bewegungssensor
  if (fresh(motionLastAt)) {
    return "BEWEGUNG AKTIV";
  }

  return "KUGELSTEUERUNG";
}


/* =========================================
   SENSORAKTIVIERUNG AUF DER KUGEL

   KEIN SEPARATES FENSTER
========================================= */

const SENSOR_CONTROL = {
  y: compassCenterY + 207,

  checkboxX: -109,
  labelX: -85,

  hitLeft: -130,
  hitRight: 130,

  hitTop: -21,
  hitBottom: 30
};

function drawSensorControl(ctx, cx) {
  const cy = SENSOR_CONTROL.y;

  ctx.save();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  /* Kleine Checkbox */

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(225,238,220,.7)";

  ctx.strokeRect(
    cx + SENSOR_CONTROL.checkboxX,
    cy - 7,
    14,
    14
  );

  if (sensorOptIn) {
    ctx.strokeStyle = "#d9e8d2";
    ctx.lineWidth = 2.5;

    ctx.beginPath();

    ctx.moveTo(
      cx + SENSOR_CONTROL.checkboxX + 2,
      cy
    );

    ctx.lineTo(
      cx + SENSOR_CONTROL.checkboxX + 6,
      cy + 4
    );

    ctx.lineTo(
      cx + SENSOR_CONTROL.checkboxX + 13,
      cy - 5
    );

    ctx.stroke();
  }

  /* Kleine Beschriftung */

  ctx.font =
    "500 11px 'DM Mono', monospace";

  ctx.fillStyle = "#e5eee0";

  ctx.fillText(
    "SENSOR AKTIVIEREN",
    cx + SENSOR_CONTROL.labelX,
    cy
  );

  /* Status unter der Checkbox */

  ctx.font =
    "9px 'DM Mono', monospace";

  ctx.textAlign = "center";

  ctx.fillStyle =
    "rgba(193,211,188,.82)";

  ctx.fillText(
    sensorStatusText,
    cx,
    cy + 23,
    260
  );

  ctx.restore();
}

/* =========================================
   SENSORFREIGABE
========================================= */

function requestSensorAccess() {
  if (sensorRequestPending) return;

  sensorOptIn = !sensorOptIn;


if (!sensorOptIn) {
  // Aktuelle Nadelposition übernehmen
  fallbackAngle = needleAngle;
  targetNeedleAngle = needleAngle;

  // Zur Kugelsteuerung zurückkehren
  sensorStatusText = "KUGELSTEUERUNG";

  refreshEchoesTexture();
  return;
}


  if (!window.isSecureContext) {
    sensorOptIn = false;
    sensorStatusText = "HTTPS ERFORDERLICH";
    refreshEchoesTexture();
    return;
  }

  const requests = [];

  try {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission ===
        "function"
    ) {
      requests.push(
        DeviceOrientationEvent.requestPermission()
      );
    }

    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission ===
        "function"
    ) {
      requests.push(
        DeviceMotionEvent.requestPermission()
      );
    }

  } catch (error) {
    sensorOptIn = false;
    sensorStatusText = "FREIGABE NICHT MÖGLICH";
    refreshEchoesTexture();
    return;
  }

  if (!requests.length) {
    sensorStatusText = "SENSOREN WERDEN GEPRÜFT";
    refreshEchoesTexture();
    return;
  }

  sensorRequestPending = true;
  sensorStatusText = "FREIGABE WIRD GEPRÜFT";

  refreshEchoesTexture();

  Promise.allSettled(requests).then(results => {
    sensorRequestPending = false;

    if (
      results.some(
        result =>
          result.status === "fulfilled" &&
          result.value === "granted"
      )
    ) {
      sensorStatusText = "WARTE AUF SENSORDATEN";

    } else {
      sensorOptIn = false;
      sensorStatusText = "FREIGABE NICHT ERTEILT";
    }

    refreshEchoesTexture();
  });
}

/* =========================================
   SOCIAL ICONS
========================================= */

function socialIcon(ctx, name, x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = "#eef5eb";
  ctx.fillStyle = "#eef5eb";
  ctx.lineWidth = 2.7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (name === "SPOTIFY") {
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

  } else if (name === "APPLE") {
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("♫", 0, 1);

  } else if (name === "YOUTUBE") {
    ctx.beginPath();
    ctx.roundRect(-17, -12, 34, 24, 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-4, -7);
    ctx.lineTo(8, 0);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fill();

  } else if (name === "INSTAGRAM") {
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
   ANALOGER KOMPASS
========================================= */

function drawCompass(ctx, cx, cy) {
  ctx.save();

  const gradient = ctx.createRadialGradient(
    cx - 32,
    cy - 44,
    10,
    cx,
    cy,
    185
  );

  gradient.addColorStop(0, "#24372b");
  gradient.addColorStop(0.7, "#0e1912");
  gradient.addColorStop(1, "#050b07");

  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.arc(cx, cy, 174, 0, Math.PI * 2);
  ctx.fill();

  /* Äusserer Ring */

  ctx.strokeStyle = "rgba(230,242,224,.7)";
  ctx.lineWidth = 2;
  ctx.stroke();

  /* Innerer Ring */

  ctx.strokeStyle = "rgba(230,242,224,.25)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(cx, cy, 163, 0, Math.PI * 2);
  ctx.stroke();

  /* Gradmarkierungen */

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

  /* Dezente Richtungslinien */

  ctx.strokeStyle = "rgba(220,237,216,.18)";
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

  /* Rot-weisse Nadel */

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(needleAngle);

  ctx.fillStyle = "#ed4438";

  ctx.beginPath();
  ctx.moveTo(0, -112);
  ctx.lineTo(-12, 8);
  ctx.lineTo(0, -3);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e9eee5";

  ctx.beginPath();
  ctx.moveTo(0, 112);
  ctx.lineTo(-12, -8);
  ctx.lineTo(0, 3);
  ctx.lineTo(12, -8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  /* Feste Social-Icons */

  for (const item of SOCIAL) {
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

    ctx.strokeStyle = "rgba(234,245,230,.75)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    socialIcon(ctx, item.name, x, y);
  }

  /* Nadelachse */

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
   VISUALS — ANALOGER DIA-BETRACHTER
========================================= */

function drawVisualViewer(ctx, cx, iy, iw, ih) {
  const image = visualImages[visualIndex];

  const bodyW = iw + 112;
  const bodyH = ih + 100;

  const bodyX = cx - bodyW / 2;
  const bodyY = iy - 50;

  const windowX = cx - iw / 2 + 13;
  const windowY = iy + 13;

  const windowW = iw - 26;
  const windowH = ih - 26;

  ctx.save();

  /* Gehäuseschatten */

  ctx.shadowColor = "rgba(0,0,0,.65)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 13;

  const bodyGradient = ctx.createLinearGradient(
    bodyX,
    bodyY,
    bodyX + bodyW,
    bodyY + bodyH
  );

  bodyGradient.addColorStop(0, "#75816e");
  bodyGradient.addColorStop(0.18, "#3b493b");
  bodyGradient.addColorStop(0.55, "#1b281f");
  bodyGradient.addColorStop(0.82, "#354334");
  bodyGradient.addColorStop(1, "#101811");

  ctx.fillStyle = bodyGradient;

  ctx.beginPath();
  ctx.roundRect(
    bodyX,
    bodyY,
    bodyW,
    bodyH,
    30
  );
  ctx.fill();

  ctx.restore();
  ctx.save();

  /* Gehäusekanten */

  ctx.strokeStyle = "rgba(218,231,207,.65)";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(
    bodyX,
    bodyY,
    bodyW,
    bodyH,
    30
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,.65)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(
    bodyX + 7,
    bodyY + 7,
    bodyW - 14,
    bodyH - 14,
    24
  );
  ctx.stroke();

  /* Lichtkante */

  const highlight = ctx.createLinearGradient(
    bodyX,
    bodyY,
    bodyX + bodyW,
    bodyY
  );

  highlight.addColorStop(0, "rgba(255,255,255,0)");
  highlight.addColorStop(0.25, "rgba(255,255,255,.2)");
  highlight.addColorStop(0.75, "rgba(255,255,255,.08)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");

  ctx.strokeStyle = highlight;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(bodyX + 32, bodyY + 10);
  ctx.lineTo(bodyX + bodyW - 32, bodyY + 10);
  ctx.stroke();

  /* Schrauben */

  const screws = [
    [bodyX + 22, bodyY + 22],
    [bodyX + bodyW - 22, bodyY + 22],
    [bodyX + 22, bodyY + bodyH - 22],
    [bodyX + bodyW - 22, bodyY + bodyH - 22]
  ];

  for (const [sx, sy] of screws) {
    ctx.fillStyle = "#101711";

    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(221,232,213,.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,.8)";

    ctx.beginPath();
    ctx.moveTo(sx - 3, sy + 3);
    ctx.lineTo(sx + 3, sy - 3);
    ctx.stroke();
  }

  /* Sichtfensterrahmen */

  const frameGradient = ctx.createLinearGradient(
    windowX,
    windowY,
    windowX,
    windowY + windowH
  );

  frameGradient.addColorStop(0, "#050906");
  frameGradient.addColorStop(0.5, "#18231b");
  frameGradient.addColorStop(1, "#050906");

  ctx.fillStyle = frameGradient;

  ctx.beginPath();
  ctx.roundRect(
    windowX - 13,
    windowY - 13,
    windowW + 26,
    windowH + 26,
    14
  );
  ctx.fill();

  ctx.strokeStyle = "rgba(210,225,200,.65)";
  ctx.lineWidth = 3;
  ctx.stroke();

  /* Dia-Bild */

  ctx.save();
  ctx.beginPath();

  ctx.roundRect(
    windowX,
    windowY,
    windowW,
    windowH,
    5
  );

  ctx.clip();

  if (image) {
    cover(
      ctx,
      image,
      windowX,
      windowY,
      windowW,
      windowH
    );

  } else {
    ctx.fillStyle = "#101811";
    ctx.fillRect(
      windowX,
      windowY,
      windowW,
      windowH
    );
  }

  /* Glasreflexion */

  const reflection = ctx.createLinearGradient(
    windowX,
    windowY,
    windowX + windowW * 0.8,
    windowY + windowH
  );

  reflection.addColorStop(0, "rgba(255,255,255,.18)");
  reflection.addColorStop(0.35, "rgba(255,255,255,.035)");
  reflection.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = reflection;

  ctx.fillRect(
    windowX,
    windowY,
    windowW,
    windowH
  );

  ctx.restore();

  /* Beschriftung */

  ctx.fillStyle = "rgba(224,235,216,.8)";
  ctx.font = "bold 15px 'DM Mono', monospace";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "CAMOU  /  VIEWER",
    cx,
    bodyY + bodyH - 15
  );

  /* Mechanischer Hebel */

  const leverX = cx + iw / 2 + 43;
  const leverTop = iy + 15;
  const leverBottom = iy + ih * 0.72;

  const knobY =
    leverTop +
    (leverBottom - leverTop) * 0.30;

  const railGradient = ctx.createLinearGradient(
    leverX - 9,
    0,
    leverX + 9,
    0
  );

  railGradient.addColorStop(0, "#090e0a");
  railGradient.addColorStop(0.5, "#a7b39b");
  railGradient.addColorStop(1, "#101711");

  ctx.fillStyle = railGradient;

  ctx.beginPath();
  ctx.roundRect(
    leverX - 8,
    leverTop,
    16,
    leverBottom - leverTop,
    8
  );
  ctx.fill();

  ctx.strokeStyle = "rgba(220,232,212,.65)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  /* Hebelstange */

  const rodGradient = ctx.createLinearGradient(
    leverX - 5,
    0,
    leverX + 5,
    0
  );

  rodGradient.addColorStop(0, "#151c16");
  rodGradient.addColorStop(0.45, "#d1d9c9");
  rodGradient.addColorStop(1, "#394638");

  ctx.strokeStyle = rodGradient;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(leverX, knobY);
  ctx.lineTo(leverX, knobY + 38);
  ctx.stroke();

  /* Hebelknauf */

  const knobGradient = ctx.createRadialGradient(
    leverX - 8,
    knobY - 8,
    2,
    leverX,
    knobY,
    23
  );

  knobGradient.addColorStop(0, "#dce5d3");
  knobGradient.addColorStop(0.35, "#82917a");
  knobGradient.addColorStop(0.75, "#354333");
  knobGradient.addColorStop(1, "#111a12");

  ctx.fillStyle = knobGradient;

  ctx.beginPath();
  ctx.arc(leverX, knobY, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(225,237,215,.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

/* =========================================
   PRESS – MARKIERUNG DES SCHALTERS
========================================= */

// Dezenter salbeigrüner Leuchtring
ctx.save();

ctx.shadowColor = "rgba(190, 235, 165, 0.65)";
ctx.shadowBlur = 16;

ctx.strokeStyle = "#c5e8b6";
ctx.lineWidth = 2.5;

ctx.beginPath();
ctx.arc(
  leverX,
  knobY,
  24,
  0,
  Math.PI * 2
);
ctx.stroke();

ctx.restore();

// PRESS-Beschriftung direkt auf dem Knopf
ctx.save();

ctx.font = "700 15px 'DM Mono', monospace";
ctx.textAlign = "center";
ctx.textBaseline = "middle";

ctx.fillStyle = "#101b12";

ctx.fillText(
  "PRESS",
  leverX,
  knobY + 1,
  38
);

ctx.restore();

  /* Pfeil */

  ctx.fillStyle = "rgba(226,237,218,.85)";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    "↓",
    leverX,
    leverBottom + 25
  );

  /* Bildnummer */

  ctx.fillStyle = "#dce7d5";
  ctx.font = "bold 15px 'DM Mono', monospace";
  ctx.textAlign = "right";

  ctx.fillText(
    `${String(visualIndex + 1).padStart(2, "0")} / ${String(visualImages.length).padStart(2, "0")}`,
    bodyX + bodyW - 25,
    bodyY + bodyH - 15
  );

  ctx.restore();
}

/* =========================================
   VISUALS BILDWECHSEL
========================================= */

function advanceVisualSlide() {
  if (!visualImages.length) return;

  visualIndex =
    (visualIndex + 1) % visualImages.length;

  refreshVisualsTexture();
}

function refreshVisualsTexture() {
  if (
    !globeTexture ||
    !baseTextureCanvas ||
    !globeContext
  ) return;

  const w = 4096;
  const h = 2048;
  const pw = w / 5;

  const cx = w * (0.25 + 2 / 5);
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

  drawWrappedPanel(
    globeContext,
    2,
    visualImages[visualIndex]
  );

  globeTexture.needsUpdate = true;
sceneNeedsRender = true;
}

/* =========================================
   ÖFFNEN-BESCHRIFTUNG IM BILD
========================================= */

function drawOpenLabel(ctx, cx, ix, iy, iw, ih) {
  ctx.save();

  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();

  const shade = ctx.createLinearGradient(
    0,
    iy + ih - 100,
    0,
    iy + ih
  );

  shade.addColorStop(
    0,
    "rgba(5,12,8,0)"
  );

  shade.addColorStop(
    1,
    "rgba(5,12,8,.85)"
  );

  ctx.fillStyle = shade;

  ctx.fillRect(
    ix,
    iy + ih - 100,
    iw,
    100
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#edf4e9";

  ctx.font =
    "500 21px 'DM Mono', monospace";

  ctx.fillText(
    "ÖFFNEN  ↗",
    cx,
    iy + ih - 33,
    iw - 24
  );

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
  pw,
  h
) {
  const x = cx - pw / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, pw, h);
  ctx.clip();

  const contentW = pw * 0.76;

  /* CAMOU-Buchstabe */

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(235,242,229,.82)";
  ctx.font = "300 30px Manrope, Arial";

  ctx.fillText(
    section.poleLetter,
    cx,
    h * 0.020
  );


  /* =========================================
     KATEGORIE – DM MONO
  ========================================= */

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(232,239,226,.65)";

  ctx.font = "500 19px 'DM Mono', monospace";

  ctx.fillText(
    section.eyebrow,
    cx,
    h * 0.24,
    contentW
  );

  /* =========================================
     TITEL – MANROPE
  ========================================= */

  ctx.fillStyle = "#f0f2eb";

  // Einheitliche Schriftgrösse für alle Bereiche
  ctx.font = "300 58px Manrope, Arial";

  const titleY = h * 0.335;

  section.title.forEach((line, i) => {
    ctx.fillText(
      line,
      cx,
      titleY + i * 76,
      contentW
    );
  });

  /* =========================================
     BESCHREIBUNG – MANROPE
  ========================================= */

  // Abstand zwischen Überschrift und Beschreibung
  const bodyStart =
    titleY +
    (section.title.length - 1) * 76 +
    82;

  ctx.fillStyle = "rgba(235,239,230,.86)";

  // Etwas kräftigere und besser lesbare Schrift
  ctx.font = "400 22px Manrope, Arial";

  // Einheitlicher Zeilenabstand
  section.body.forEach((line, i) => {
    ctx.fillText(
      line,
      cx,
      bodyStart + i * 40,
      contentW
    );
  });



  /* Zusatzinformationen */

  if (section.extra) {
    ctx.fillStyle = "#c1d0b7";

    ctx.font =
      "500 18px 'DM Mono', monospace";

    section.extra.forEach((line, i) => {
      ctx.fillText(
        line,
        cx,
        bodyStart +
          section.body.length * 40 +
          35 +
          i * 39,
        contentW
      );
    });
  }

  /* Bildposition */

  const iw = pw * 0.56;
  const ih = h * 0.19;

  const ix = cx - iw / 2;
  const iy = h * 0.475;

  if (section.name === "ECHOES") {

    /* Kompass und Sensor auf Kugel */

    drawCompass(
      ctx,
      cx,
      iy + ih / 2
    );

    drawSensorControl(ctx, cx);

  } else if (section.name === "VISUALS") {

    /* Verkleinerter Dia-Betrachter */

    const scale = CONFIG.visualScale;
    const centerY = iy + ih / 2;

    ctx.save();

    ctx.translate(cx, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -centerY);

    drawVisualViewer(
      ctx,
      cx,
      iy,
      iw,
      ih
    );

    ctx.restore();

  } else {

    /* Normale Bildrahmen */

    ctx.fillStyle = "rgba(8,13,10,.9)";

    ctx.fillRect(
      ix - 8,
      iy - 8,
      iw + 16,
      ih + 16
    );

    ctx.save();
    ctx.beginPath();
    ctx.rect(ix, iy, iw, ih);
    ctx.clip();

    if (
      section.name === "HOME" &&
      homeVideoStarted &&
      homeVideo.readyState >= 2
    ) {
      cover(
        ctx,
        homeVideo,
        ix,
        iy,
        iw,
        ih
      );

    } else {
      cover(
        ctx,
        image,
        ix,
        iy,
        iw,
        ih
      );

      if (section.name === "HOME") {
        playButton(
          ctx,
          cx,
          iy + ih / 2
        );
      }
    }

    ctx.restore();

    /* Music und Contact */

    if (
      section.name === "MUSIC" ||
      section.name === "CONTACT"
    ) {
      drawOpenLabel(
        ctx,
        cx,
        ix,
        iy,
        iw,
        ih
      );
    }

    ctx.strokeStyle =
      "rgba(226,235,220,.48)";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      ix,
      iy,
      iw,
      ih
    );
  }

  /* Untere Linie */

  ctx.strokeStyle = "rgba(226,235,220,.35)";
  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    cx - contentW / 2,
    h * 0.88
  );

  ctx.lineTo(
    cx + contentW / 2,
    h * 0.88
  );

  ctx.stroke();

  /* Seitennummer */

  ctx.fillStyle = "rgba(232,239,226,.62)";
  ctx.font = "19px 'DM Mono', monospace";

  ctx.textAlign = "center";

  ctx.fillText(
    `${String(sections.indexOf(section) + 1).padStart(2, "0")} / 05`,
    cx,
    h * 0.92
  );

  ctx.restore();
}

/* =========================================
   WRAPPED PANELS
========================================= */

function drawWrappedPanel(ctx, index, image) {
  const w = 4096;
  const h = 2048;
  const pw = w / 5;

  const cx =
    w * (0.25 + index / 5);

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

/* =========================================
   KUGELTEXTUR ERSTELLEN
========================================= */

async function createGlobeTexture() {

  // Schriftarten parallel zu den Bildern vorbereiten
  const canvasFontsReady = document.fonts?.load
    ? Promise.allSettled([
        document.fonts.load("300 58px Manrope"),
        document.fonts.load("400 22px Manrope"),
        document.fonts.load('500 19px "DM Mono"'),
        document.fonts.load('400 19px "DM Mono"')
      ])
    : Promise.resolve();

   const images = await Promise.all(
    [
      ASSETS.home,
      ASSETS.music,
      ASSETS.visuals,
      ASSETS.archive,
      ASSETS.contact
    ].map(loadImage)
  );

  visualImages = await Promise.all(
    ASSETS.visualSlides.map(loadImage)
  );

  visualIndex = 0;
  echoesImage = images[3];
   
  // Vor dem Zeichnen sicherstellen, dass die
  // angeforderten Schriftarten geladen wurden.
  await canvasFontsReady;

  globeCanvas = document.createElement("canvas");

  globeCanvas.width = 4096;
  globeCanvas.height = 2048;

  globeContext = globeCanvas.getContext("2d");

  drawBackground(
    globeContext,
    4096,
    2048
  );

  images.forEach((image, index) => {
    drawWrappedPanel(
      globeContext,
      index,
      index === 2
        ? visualImages[0]
        : image
    );
  });

  baseTextureCanvas =
    document.createElement("canvas");

  baseTextureCanvas.width = 4096;
  baseTextureCanvas.height = 2048;

  baseTextureCanvas
    .getContext("2d")
    .drawImage(globeCanvas, 0, 0);

  globeTexture =
    new THREE.CanvasTexture(globeCanvas);

  globeTexture.colorSpace =
    THREE.SRGBColorSpace;

  globeTexture.wrapS =
    THREE.RepeatWrapping;

  globeTexture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();

  return globeTexture;
}

createGlobeTexture()
  .then(texture => {
    globe.material.map = texture;
    globe.material.needsUpdate = true;
sceneNeedsRender = true;

    console.info(
      "CAMOU: Kugeltextur geladen."
    );
  })
  .catch(error => {
    console.error(
      "CAMOU: Fehler beim Laden der Kugeltextur",
      error
    );
  });

/* =========================================
   HOME VIDEO AKTUALISIEREN
========================================= */

function updateHomeVideoFrame() {
  if (
    !homeVideoStarted ||
    !globeTexture ||
    homeVideo.readyState < 2
  ) return;

  const cx = 4096 * 0.25;

  const iw = 4096 / 5 * 0.56;
  const ih = 2048 * 0.19;

  const ix = cx - iw / 2;
  const iy = 2048 * 0.475;

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
sceneNeedsRender = true;
}

/* =========================================
   ECHOES TEXTUR AKTUALISIEREN
========================================= */

function refreshEchoesTexture() {
  if (
    !globeTexture ||
    !baseTextureCanvas ||
    !echoesImage
  ) return;

  const w = 4096;
  const h = 2048;
  const pw = w / 5;

  const cx =
    w * (0.25 + 3 / 5);

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
sceneNeedsRender = true;
}

/* =========================================
   NAVIGATION
========================================= */

function currentIndex() {
  const n = Math.round(
    -rotationY / sectionStep
  );

  return ((n % 5) + 5) % 5;
}

let lastIndicatorIndex = -1;
function updateIndicator() {
  const index = currentIndex();
  if (index === lastIndicatorIndex) return;
  lastIndicatorIndex = index;

  $("current-section").textContent = sections[index].name;
  $("section-number").textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, i) => {
    button.classList.toggle("active", i === index);
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

  while (
    destination - rotationY > Math.PI
  ) {
    destination -= 2 * Math.PI;
  }

  while (
    destination - rotationY < -Math.PI
  ) {
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

$("logo")?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    goToSection(0);
  }
);

/* =========================================
   SPOTIFY MODAL
========================================= */

const spotifyModal = $("spotify-modal");
const spotifyPlayer = $("spotify-modal-player");
const spotifyClose = $("spotify-modal-close");

let spotifyOpen = false;

if (spotifyModal) {
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
  "https://script.google.com/macros/s/AKfycbyx-lPLqnkym7hppwVxu4sTedAtXpAL5iedagg8aA48DiOWKDtELm6nwU4O8Se0In9z/exec";

const contactModal = $("contact-modal");
const contactForm = $("contact-form");

const contactClose = $("contact-modal-close");
const contactStatus = $("contact-status");
const contactSubmit = $("contact-submit");

let contactOpen = false;
let contactSending = false;

if (contactModal) {
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

    if (contactStatus) {
      contactStatus.textContent =
        "Nachricht wird übertragen …";
    }

    const data = new FormData(contactForm);

    data.set("privacy", "on");
    data.set("website", "");

    try {
      await fetch(CONTACT_SCRIPT_URL, {
        method: "POST",
        body: data,
        mode: "no-cors"
      });

      if (contactStatus) {
        contactStatus.textContent =
          "Übertragung abgeschlossen. Empfang nicht bestätigt.";
      }

    } catch (error) {
      console.error(
        "CAMOU Kontaktformular:",
        error
      );

      if (contactStatus) {
        contactStatus.textContent =
          "Übertragung fehlgeschlagen.";
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
   KUGEL-RAYCASTING
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

  return (
    Math.abs(localX(point, index)) <=
      4096 / 5 * 0.56 / 2 &&

    point.y >= 2048 * 0.475 &&

    point.y <=
      2048 * (0.475 + 0.19)
  );
}

/* =========================================
   VISUALS HEBEL-KLICKERKENNUNG
   ANGEPASST AN 78 % SKALIERUNG
========================================= */

function isOnVisualLever(point) {
  if (!point) return false;

  const scale = CONFIG.visualScale;

  const centerY =
    2048 * (0.475 + 0.19 / 2);

  const dx =
    localX(point, 2) / scale;

  const py =
    centerY +
    (point.y - centerY) / scale;

  const iw = 4096 / 5 * 0.56;

  const leverX = iw / 2 + 43;
  const leverTop = 2048 * 0.475 + 15;

  const leverBottom =
    2048 * 0.475 +
    2048 * 0.19 * 0.72;

  return (
    Math.abs(dx - leverX) < 38 &&
    py >= leverTop - 28 &&
    py <= leverBottom + 35
  );
}

/* =========================================
   KLICK AUF KUGEL
========================================= */

function handleGlobeClick(event) {
  const index = currentIndex();
  const point = texturePoint(event);

  if (!point) return;

  /* Music */

  if (
    index === 1 &&
    inImage(point, 1)
  ) {
    openSpotifyModal();
    return;
  }

  /* Contact */

  if (
    index === 4 &&
    inImage(point, 4)
  ) {
    openContactModal();
    return;
  }

  /* Echoes */

  if (index === 3) {
    const dx = localX(point, 3);

    const dy =
      point.y - compassCenterY;

    const controlY =
      point.y - SENSOR_CONTROL.y;

    /* Sensor-Checkbox */

    if (
      dx >= SENSOR_CONTROL.hitLeft &&
      dx <= SENSOR_CONTROL.hitRight &&
      controlY >= SENSOR_CONTROL.hitTop &&
      controlY <= SENSOR_CONTROL.hitBottom
    ) {
      requestSensorAccess();
      return;
    }

    /* Social Links */

    const link = SOCIAL.find(item => {
      const x =
        Math.cos(item.angle) * compassRadius;

      const y =
        Math.sin(item.angle) * compassRadius;

      return Math.hypot(
        dx - x,
        dy - y
      ) < 32;
    });

    if (link) {
      window.open(
        link.url,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }
  }

  /* Home Video */

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

stopHomeVideoFrameUpdates();

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

    startHomeVideoFrameUpdates();
  })

    .catch(error => {
      homeVideoStarting = false;

      console.error(
        "CAMOU Home-Video:",
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
  currentZoom = clamp(
    value,
    CONFIG.minZoom,
    CONFIG.maxZoom
  );

  camera.position.z = currentZoom;
sceneNeedsRender = true;
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
  "pointercancel"
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
      currentZoom +
      event.deltaY * 0.008
    );
  },
  { passive: false }
);

/* =========================================
   DRAG UND TOUCH
========================================= */

stage.addEventListener(
  "pointerdown",
  event => {
    if (
      spotifyOpen ||
      contactOpen ||
      event.target !== renderer.domElement
    ) return;

    /* Visuals Hebel */

    if (currentIndex() === 2) {
      const point = texturePoint(event);

      if (isOnVisualLever(point)) {
        visualLeverPointer = event.pointerId;
        visualLeverMoved = false;

        visualLeverStartY = event.clientY;

        stage.setPointerCapture(
          event.pointerId
        );

        return;
      }
    }

    /* Normale Kugeldrehung */

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

      $("hint")?.classList.add("hidden");

    } else if (pointers.size === 2) {
      isDragging = false;
      pointerStart = null;

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

    /* Dia-Hebel */

    if (
      visualLeverPointer === event.pointerId
    ) {
      const pullDistance =
        event.clientY - visualLeverStartY;

      if (
        pullDistance > 35 &&
        !visualLeverMoved
      ) {
        visualLeverMoved = true;
        advanceVisualSlide();
      }

      return;
    }

    if (
      !pointers.has(event.pointerId)
    ) return;

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    /* Pinch Zoom */

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

/* =========================================
   POINTER RELEASE
========================================= */

function releasePointer(event) {

  /* Visuals Hebel */

  if (
    visualLeverPointer === event.pointerId
  ) {
    if (
      event.type === "pointerup" &&
      !visualLeverMoved
    ) {
      advanceVisualSlide();
    }

    visualLeverPointer = null;
    visualLeverMoved = false;

    return;
  }

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
  pointers.delete(event.pointerId);

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

    if (event.key === "Escape") {
      if (contactOpen) {
        closeContactModal();

      } else if (spotifyOpen) {
        closeSpotifyModal();
      }

      return;
    }

    if (
      spotifyOpen ||
      contactOpen
    ) return;

    if (
      ["INPUT", "TEXTAREA", "SELECT"].includes(
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

let lastShownSensorMode = "";

function animate(now = 0) {
  requestAnimationFrame(animate);

  /* Kugelrotation */

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


/* =========================================
   HOME VIDEO – FRAME-SYNCHRONISATION
========================================= */

if (
  homeVideoPlaying &&
  typeof homeVideo.requestVideoFrameCallback !== "function" &&
  now - lastVideoFallbackPaint >= 33
) {
  lastVideoFallbackPaint = now;

  updateHomeVideoFrame();
}


  /* Kompass Fallback */

  const deltaX =
    rotationX - lastGlobeX;

  const deltaY =
    rotationY - lastGlobeY;
   
if (
  Math.abs(deltaX) > 1e-9 ||
  Math.abs(deltaY) > 1e-9
) {
  sceneNeedsRender = true;
}


  lastGlobeX = rotationX;
  lastGlobeY = rotationY;

  fallbackAngle = wrapAngle(
    fallbackAngle +
    deltaY * 0.85 +
    deltaX * 0.35
  );

  /* Sensorpriorität */

  const mode = sensorMode();

  if (mode === "KOMPASS AKTIV") {
    targetNeedleAngle =
      -sensorHeading * Math.PI / 180;

  } else if (mode === "BEWEGUNG AKTIV") {
    targetNeedleAngle = motionAngle;

  } else {
    targetNeedleAngle = fallbackAngle;
  }

  /* Statusänderung */

  if (
    mode !== lastShownSensorMode
  ) {
    lastShownSensorMode = mode;
    sensorStatusText = mode;

    refreshEchoesTexture();
  }

  /* Weiche Nadelbewegung */

  const needleDelta = wrapAngle(
    targetNeedleAngle - needleAngle
  );

  if (
    Math.abs(needleDelta) > 0.0005
  ) {
    needleAngle = wrapAngle(
      needleAngle +
      needleDelta * 0.12
    );

    if (
      currentIndex() === 3 &&
      now - lastCompassDraw > 32
    ) {
      refreshEchoesTexture();

      lastCompassDraw = now;
    }
  }


if (sceneNeedsRender) {
  sceneNeedsRender = false;

  renderer.render(
    scene,
    camera
  );
}


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
    Math.min(window.devicePixelRatio, 2)
  );
   sceneNeedsRender = true;
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
