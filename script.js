
import * as THREE from "three";

/* CAMOU – EXPLORE GLOBE
   Five freely positioned environments
   Navigation / Video / Visuals / Compass / Modals
*/

const CONFIG = {
  radius: 3.2,
  desktopZoom: 8.2,
  mobileZoom: 8.4,
  minZoom: 6,
  maxZoom: 17,
  dragSpeed: 0.0052,
  friction: 0.94,
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
    eyebrow: "01 — NEW PROJECT",
    title: ["c a m o u"],
    body: ["Gleiche Fragen.", "Neue Perspektiven."],
    image: ASSETS.home
  },
  {
    name: "MUSIC",
    eyebrow: "02 — RELEASES",
    title: ["f r a g m e n t e"],
    body: [
      "vom Wind getragen,",
      "zwischen Licht und Schatten.",
      "zwischen dem, was man sieht",
      "und dem, was bleibt."
    ],
    image: ASSETS.music
  },
  {
    name: "VISUALS",
    eyebrow: "03 — VISUAL WORKS",
    title: ["Visuals"],
    body: [
      "Bilder, die bleiben.",
      "Momente, die verschwinden."
    ],
    image: ASSETS.visuals
  },
  {
    name: "ECHOES",
    eyebrow: "04 — HALL",
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
    eyebrow: "05 — GET IN TOUCH",
    title: ["Contact"],
    body: [
      "Für Anfragen und Zusammenarbeit.",
      "Oder einfach so."
    ],
    image: ASSETS.contact
  }
];

/* =========================================
   HELPERS
========================================= */

const $ = id => document.getElementById(id);

const clamp = (v, min, max) =>
  Math.max(min, Math.min(max, v));

const lerp = (a, b, t) =>
  a + (b - a) * t;

const smooth = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

const wrapAngle = a =>
  Math.atan2(Math.sin(a), Math.cos(a));

const distance = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/* =========================================
   DOM UND THREE.JS
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

for (const id of [
  "camou-motion-control",
  "compass-permission"
]) {
  document.getElementById(id)?.remove();
}

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

scene.add(new THREE.AmbientLight(0xddebd8, 1.15));

const light = new THREE.DirectionalLight(
  0xe3f0dc, 2.1
);

light.position.set(-3, 4, 5);
scene.add(light);

const rim = new THREE.PointLight(
  0x9bb99a, 24, 15
);

rim.position.set(4, -1, -3);
scene.add(rim);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius, 160, 112
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
    CONFIG.radius * 1.012, 96, 64
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
   FREIE POSITIONIERUNG AUF DER KUGEL
========================================= */

const MAP_W = 4096;
const MAP_H = 2048;
const RAD = Math.PI / 180;

const PHOTO_W = 440;
const PHOTO_H = 320;
const PHOTO_Y = 136;
const COMPASS_Y = 115;

/*
  lon: Längengrad
  lat: Breitengrad
  tilt: Neigung der gesamten Komposition
  photoTilt: zusätzliche Neigung des Bildes
  imageX: horizontale Bildverschiebung
  textX: horizontale Textverschiebung
*/

const PLACES = [
  // 01 HOME – obere Halbkugel
  {
    lon: -150,
    lat: 45,
    tilt: -7,
    photoTilt: 6,
    imageX: 38,
    textX: -32
  },

  // 02 MUSIC – untere Halbkugel
  {
    lon: -120,
    lat: -45,
    tilt: 11,
    photoTilt: -6,
    imageX: -35,
    textX: 36
  },

  // 03 VISUALS – obere Halbkugel
  {
    lon: 0,
    lat: 45,
    tilt: -12,
    photoTilt: 7,
    imageX: 32,
    textX: -28
  },

  // 04 ECHOES – untere Halbkugel
  {
    lon: -15,
    lat: -45,
    tilt: 10,
    photoTilt: 0,
    imageX: -14,
    textX: 30
  },

  // 05 CONTACT – seitlicher Mittelbereich
  {
    lon: 125,
    lat: -5,
    tilt: -11,
    photoTilt: 8,
    imageX: -30,
    textX: 34
  }
].map(p => {
  const lon = p.lon * RAD;
  const lat = p.lat * RAD;

  return {
    ...p,
    x: ((0.25 + p.lon / 360 + 1) % 1) * MAP_W,
    y: (0.5 - p.lat / 180) * MAP_H,
    tiltR: p.tilt * RAD,
    photoR: p.photoTilt * RAD,
    nx: Math.cos(lat) * Math.sin(lon),
    ny: Math.sin(lat),
    nz: Math.cos(lat) * Math.cos(lon)
  };
});

/* =========================================
   ZUSTAND
========================================= */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointers = new Map();

let rotationX = PLACES[0].lat * RAD;
let rotationY = -PLACES[0].lon * RAD;

let velocityX = 0;
let velocityY = 0;

let previousX = 0;
let previousY = 0;
let lastTime = 0;

let isDragging = false;
let menuAnimating = false;

let targetRotationX = 0;
let targetRotationY = 0;
let pointerStart = null;

let pinchDistance = 0;
let pinchZoom = currentZoom;

let globeCanvas = null;
let globeContext = null;
let globeTexture = null;
let baseTextureCanvas = null;
let sceneNeedsRender = true;

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
   BILDER UND GRAFIKEN
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
   ORGANISCHER HINTERGRUND
========================================= */

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

      const wave =
        Math.sin(u * Math.PI * 2 + v * 2.2);

      const glow =
        Math.cos(u * Math.PI * 4 - v * 3.1);

      const base = [22, 34, 26];

      const target = [
        26 + wave * 2,
        39 + glow * 2.5,
        30 + wave * 1.6
      ];

      const color = base.map((value, i) =>
        lerp(value, target[i], pole)
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
    small, 0, 0, width, height
  );
}

/* =========================================
   ECHOES / KOMPASS / SOCIAL LINKS
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

let needleAngle = 0;
let targetNeedleAngle = 0;
let fallbackAngle = 0;


let lastGlobeX = rotationX;
let lastGlobeY = rotationY;
let lastCompassDraw = 0;

let motionAngle = 0;
let motionLastAt = 0;

let orientationPrevious = null;
let orientationLastAt = 0;
let motionPreviousTime = 0;

let sensorHeading = null;
let headingLastAt = 0;

let sensorOptIn = false;
let sensorRequestPending = false;
let sensorStatusText = "KUGELSTEUERUNG";

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
      alpha, orientationPrevious.alpha
    );

    const db = difference(
      beta, orientationPrevious.beta
    );

    const dg = difference(
      gamma, orientationPrevious.gamma
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

    if (now - orientationLastAt < 450) return;

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
  if (!sensorOptIn) return "KUGELSTEUERUNG";

  if (fresh(headingLastAt)) {
    return "KOMPASS AKTIV";
  }

  if (fresh(motionLastAt)) {
    return "BEWEGUNG AKTIV";
  }

  return "KUGELSTEUERUNG";
}

const SENSOR_CONTROL = {
  y: COMPASS_Y + 207,
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

  ctx.font = "500 11px 'DM Mono', monospace";
  ctx.fillStyle = "#e5eee0";

  ctx.fillText(
    "SENSOR AKTIVIEREN",
    cx + SENSOR_CONTROL.labelX,
    cy
  );

  ctx.font = "9px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(193,211,188,.82)";

  ctx.fillText(
    sensorStatusText,
    cx,
    cy + 23,
    260
  );

  ctx.restore();
}

function requestSensorAccess() {
  if (sensorRequestPending) return;

  sensorOptIn = !sensorOptIn;

  if (!sensorOptIn) {
    fallbackAngle = needleAngle;
    targetNeedleAngle = needleAngle;
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

  ctx.strokeStyle = "rgba(230,242,224,.7)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(230,242,224,.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 163, 0, Math.PI * 2);
  ctx.stroke();

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

  for (const item of SOCIAL) {
    const x =
      cx + Math.cos(item.angle) * compassRadius;

    const y =
      cy + Math.sin(item.angle) * compassRadius;

    ctx.fillStyle = "#142019";
    ctx.beginPath();
    ctx.arc(x, y, 27, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(234,245,230,.75)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    socialIcon(ctx, item.name, x, y);
  }

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
   ANALOGER DIA-BETRACHTER
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
    bodyX, bodyY, bodyW, bodyH, 30
  );

  ctx.fill();
  ctx.restore();

  ctx.save();

  ctx.strokeStyle = "rgba(218,231,207,.65)";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(
    bodyX, bodyY, bodyW, bodyH, 30
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

  const reflection = ctx.createLinearGradient(
    windowX,
    windowY,
    windowX + windowW * 0.8,
    windowY + windowH
  );

  reflection.addColorStop(
    0, "rgba(255,255,255,.18)"
  );
  reflection.addColorStop(
    0.35, "rgba(255,255,255,.035)"
  );
  reflection.addColorStop(
    1, "rgba(255,255,255,0)"
  );

  ctx.fillStyle = reflection;

  ctx.fillRect(
    windowX,
    windowY,
    windowW,
    windowH
  );

  ctx.restore();

  ctx.fillStyle = "rgba(224,235,216,.8)";
  ctx.font = "bold 15px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "CAMOU  /  VIEWER",
    cx,
    bodyY + bodyH - 15
  );

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

  // Dezente PRESS-Markierung.
  ctx.save();

  ctx.shadowColor = "rgba(190,235,165,.65)";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "#c5e8b6";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(leverX, knobY, 24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
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

  ctx.fillStyle = "rgba(226,237,218,.85)";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    "↓",
    leverX,
    leverBottom + 25
  );

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

function advanceVisualSlide() {
  if (!visualImages.length) return;

  visualIndex =
    (visualIndex + 1) % visualImages.length;

  refreshVisualsTexture();
}

function refreshVisualsTexture() {
  refreshIsland(2);
}

/* =========================================
   ÖFFNEN-BESCHRIFTUNG
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
    0, "rgba(5,12,8,0)"
  );

  shade.addColorStop(
    1, "rgba(5,12,8,.85)"
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
  ctx.font = "500 21px 'DM Mono', monospace";

  ctx.fillText(
    "ÖFFNEN  ↗",
    cx,
    iy + ih - 33,
    iw - 24
  );

  ctx.restore();
}

/* =========================================
   FREI PLATZIERTE BEREICHE
========================================= */

function eachIslandInstance(index, callback) {
  const p = PLACES[index];

  for (const shift of [-MAP_W, 0, MAP_W]) {
    if (
      shift !== 0 &&
      p.x + shift < -460
    ) continue;

    if (
      shift !== 0 &&
      p.x + shift > MAP_W + 460
    ) continue;

    callback(p.x + shift, p.y, p);
  }
}

function islandTransform(ctx, x, y, p) {
  ctx.translate(x, y);
  ctx.rotate(p.tiltR);
}

function paintPhoto(
  ctx,
  index,
  image,
  onlyVideo = false
) {
  const p = PLACES[index];

  ctx.save();
  ctx.translate(p.imageX, PHOTO_Y);
  ctx.rotate(p.photoR);

  if (!onlyVideo) {
    ctx.fillStyle = "rgba(7,12,9,.92)";

    ctx.fillRect(
      -PHOTO_W / 2 - 8,
      -PHOTO_H / 2 - 8,
      PHOTO_W + 16,
      PHOTO_H + 16
    );
  }

  ctx.save();

  ctx.beginPath();
  ctx.rect(
    -PHOTO_W / 2,
    -PHOTO_H / 2,
    PHOTO_W,
    PHOTO_H
  );
  ctx.clip();

  if (
    index === 0 &&
    homeVideoStarted &&
    homeVideo.readyState >= 2
  ) {
    cover(
      ctx,
      homeVideo,
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    if (homeVideo.paused) {
      playButton(ctx, 0, 0);
    }
  } else if (!onlyVideo) {
    cover(
      ctx,
      image,
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    if (index === 0) {
      playButton(ctx, 0, 0);
    }
  }

  ctx.restore();

  if (!onlyVideo) {
    if (index === 1 || index === 4) {
      drawOpenLabel(
        ctx,
        0,
        -PHOTO_W / 2,
        -PHOTO_H / 2,
        PHOTO_W,
        PHOTO_H
      );
    }

    ctx.strokeStyle = "rgba(225,237,220,.52)";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );
  }

  ctx.restore();
}

function drawPanel(ctx, index, image) {
  const section = sections[index];
  const p = PLACES[index];
  const textX = p.textX;

  ctx.save();
  ctx.textAlign = "center";

  // Dezente Linie statt rechteckiger Bereichsgrenze.
  ctx.strokeStyle = "rgba(207,226,200,.27)";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(textX - 105, -351);
  ctx.lineTo(textX + 105, -351);
  ctx.stroke();

  // Kategorie.
  ctx.fillStyle = "rgba(231,242,225,.65)";
  ctx.font = "500 19px 'DM Mono', monospace";

  ctx.fillText(
    section.eyebrow,
    textX,
    -318,
    610
  );

  // Titel.
  ctx.fillStyle = "#f0f2eb";
  ctx.font = "300 58px Manrope, Arial";

  section.title.forEach((line, i) => {
    ctx.fillText(
      line,
      textX,
      -247 + i * 68,
      600
    );
  });

  // Beschreibung.
  ctx.fillStyle = "rgba(236,242,232,.87)";
  ctx.font = "400 22px Manrope, Arial";

  section.body.forEach((line, i) => {
    ctx.fillText(
      line,
      textX,
      -180 + i * 36,
      650
    );
  });

  if (index === 2) {
    // Visuals – geneigter mechanischer Betrachter.
    ctx.save();

    ctx.translate(p.imageX, PHOTO_Y);
    ctx.rotate(p.photoR);
    ctx.scale(
      CONFIG.visualScale,
      CONFIG.visualScale
    );

    drawVisualViewer(
      ctx,
      0,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    ctx.restore();
  } else if (index === 3) {
    // Echoes – Kompass.
    drawCompass(
      ctx,
      p.imageX,
      COMPASS_Y
    );

    drawSensorControl(
      ctx,
      p.imageX
    );
  } else {
    // Home, Music, Contact.
    paintPhoto(ctx, index, image);
  }

  // Kleine Sektionsnummer.
  ctx.fillStyle = "rgba(225,235,219,.62)";
  ctx.font = "500 17px 'DM Mono', monospace";

  ctx.fillText(
    `${String(index + 1).padStart(2, "0")} / 05`,
    p.imageX + 142,
    376
  );

  ctx.restore();
}

function drawWrappedPanel(ctx, index, image) {
  eachIslandInstance(
    index,
    (x, y, p) => {
      ctx.save();
      islandTransform(ctx, x, y, p);
      drawPanel(ctx, index, image);
      ctx.restore();
    }
  );
}

function refreshIsland(index) {
  if (
    !globeTexture ||
    !globeContext ||
    !baseTextureCanvas
  ) return;

  eachIslandInstance(
    index,
    (x, y, p) => {
      globeContext.save();

      islandTransform(
        globeContext,
        x,
        y,
        p
      );

      globeContext.beginPath();
      globeContext.rect(
        -445, -405, 890, 810
      );
      globeContext.clip();

      globeContext.setTransform(
        1, 0, 0, 1, 0, 0
      );

      globeContext.drawImage(
        baseTextureCanvas,
        0,
        0
      );

      globeContext.restore();
    }
  );

  const image = index === 2
    ? visualImages[visualIndex]
    : null;

  drawWrappedPanel(
    globeContext,
    index,
    image
  );

  globeTexture.needsUpdate = true;
  sceneNeedsRender = true;
}

function refreshEchoesTexture() {
  refreshIsland(3);
}

/* =========================================
   KUGELTEXTUR ERSTELLEN
========================================= */

async function createGlobeTexture() {
  const canvasFontsReady = document.fonts?.load
    ? Promise.allSettled([
        document.fonts.load("300 58px Manrope"),
        document.fonts.load("400 22px Manrope"),
        document.fonts.load('500 19px "DM Mono"'),
        document.fonts.load('400 19px "DM Mono"')
      ])
    : Promise.resolve();

  const images = await Promise.all([
    ASSETS.home,
    ASSETS.music,
    ASSETS.visuals,
    ASSETS.archive,
    ASSETS.contact
  ].map(loadImage));

  visualImages = await Promise.all(
    ASSETS.visualSlides.map(loadImage)
  );

  visualIndex = 0;
  await canvasFontsReady;

  globeCanvas = document.createElement("canvas");
  globeCanvas.width = MAP_W;
  globeCanvas.height = MAP_H;
  globeContext = globeCanvas.getContext("2d");

  drawBackground(
    globeContext,
    MAP_W,
    MAP_H
  );

  // Unveränderliche Grundtextur ohne Bilder.
  baseTextureCanvas = document.createElement("canvas");

  baseTextureCanvas.width = MAP_W;
  baseTextureCanvas.height = MAP_H;

  baseTextureCanvas
    .getContext("2d")
    .drawImage(globeCanvas, 0, 0);

  images.forEach((image, index) => {
    drawWrappedPanel(
      globeContext,
      index,
      index === 2 ? visualImages[0] : image
    );
  });

  globeTexture = new THREE.CanvasTexture(
    globeCanvas
  );

  globeTexture.colorSpace = THREE.SRGBColorSpace;
  globeTexture.wrapS = THREE.RepeatWrapping;

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
      "CAMOU: Entdecker-Kugel geladen."
    );
  })
  .catch(error => {
    console.error(
      "CAMOU: Fehler beim Laden der Kugeltextur",
      error
    );
  });

/* =========================================
   VIDEO AUF GENEIGTEM BILDRAHMEN
========================================= */

function updateHomeVideoFrame() {
  if (
    !homeVideoStarted ||
    !globeTexture ||
    homeVideo.readyState < 2
  ) return;

  eachIslandInstance(
    0,
    (x, y, p) => {
      globeContext.save();

      islandTransform(
        globeContext,
        x,
        y,
        p
      );

      paintPhoto(
        globeContext,
        0,
        null,
        true
      );

      globeContext.restore();
    }
  );

  globeTexture.needsUpdate = true;
  sceneNeedsRender = true;
}

/* =========================================
   NAVIGATION / POSITIONEN
========================================= */

function currentIndex() {
  const x =
    -Math.sin(rotationY) * Math.cos(rotationX);

  const y = Math.sin(rotationX);

  const z =
    Math.cos(rotationY) * Math.cos(rotationX);

  let best = 0;
  let bestDot = -Infinity;

  PLACES.forEach((p, i) => {
    const dot =
      x * p.nx +
      y * p.ny +
      z * p.nz;

    if (dot > bestDot) {
      bestDot = dot;
      best = i;
    }
  });

  return best;
}

let lastIndicatorIndex = -1;

function updateIndicator() {
  const index = currentIndex();

  if (index === lastIndicatorIndex) return;
  lastIndicatorIndex = index;

  $("current-section").textContent =
    sections[index].name;

  $("section-number").textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, i) => {
    button.classList.toggle(
      "active",
      i === index
    );
  });
}

function goToSection(index) {
  const i = ((index % 5) + 5) % 5;
  const p = PLACES[i];

  velocityX = 0;
  velocityY = 0;

  isDragging = false;
  pointers.clear();
  pointerStart = null;

  stage.classList.remove("dragging");

  // Breitengrad.
  targetRotationX = p.lat * RAD;

  // Kürzesten Weg zum Längengrad suchen.
  let yaw = -p.lon * RAD;

  while (yaw - rotationY > Math.PI) {
    yaw -= Math.PI * 2;
  }

  while (yaw - rotationY < -Math.PI) {
    yaw += Math.PI * 2;
  }

  targetRotationY = yaw;

  menuAnimating = true;

  // Den gewählten Bereich wieder gut lesbar anzeigen.
  setZoom(defaultZoom);

  sceneNeedsRender = true;
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
   SPOTIFY POPUP
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
   CONTACT POPUP
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
   3D KLICKERKENNUNG
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
    x: hit.uv.x * MAP_W,
    y: (1 - hit.uv.y) * MAP_H
  };
}

function islandPoint(point, index) {
  if (!point) return null;

  const p = PLACES[index];

  let dx = point.x - p.x;

  if (dx > MAP_W / 2) {
    dx -= MAP_W;
  }

  if (dx < -MAP_W / 2) {
    dx += MAP_W;
  }

  const dy = point.y - p.y;

  const c = Math.cos(p.tiltR);
  const s = Math.sin(p.tiltR);

  return {
    x: c * dx + s * dy,
    y: -s * dx + c * dy
  };
}

function photoPoint(point, index) {
  const local = islandPoint(point, index);

  if (!local) return null;

  const p = PLACES[index];

  const dx = local.x - p.imageX;
  const dy = local.y - PHOTO_Y;

  const c = Math.cos(p.photoR);
  const s = Math.sin(p.photoR);

  return {
    x: c * dx + s * dy,
    y: -s * dx + c * dy
  };
}

function inImage(point, index) {
  const q = photoPoint(point, index);

  return !!q &&
    Math.abs(q.x) <= PHOTO_W / 2 &&
    Math.abs(q.y) <= PHOTO_H / 2;
}

function isOnVisualLever(point) {
  const q = photoPoint(point, 2);

  if (!q) return false;

  const dx =
    q.x / CONFIG.visualScale;

  const y =
    q.y / CONFIG.visualScale;

  const leverX =
    PHOTO_W / 2 + 43;

  const leverTop =
    -PHOTO_H / 2 + 15;

  const leverBottom =
    -PHOTO_H / 2 +
    PHOTO_H * 0.72;

  return (
    Math.abs(dx - leverX) < 38 &&
    y >= leverTop - 28 &&
    y <= leverBottom + 35
  );
}

function handleGlobeClick(event) {
  const point = texturePoint(event);

  if (!point) return;

  // Spotify.
  if (inImage(point, 1)) {
    openSpotifyModal();
    return;
  }

  // Contact.
  if (inImage(point, 4)) {
    openContactModal();
    return;
  }

  // Kompass, Checkbox und Social Links.
  const echoPoint = islandPoint(point, 3);

  if (echoPoint) {
    const p = PLACES[3];

    const dx =
      echoPoint.x - p.imageX;

    const dy =
      echoPoint.y - COMPASS_Y;

    const controlY =
      echoPoint.y - SENSOR_CONTROL.y;

    if (
      dx >= SENSOR_CONTROL.hitLeft &&
      dx <= SENSOR_CONTROL.hitRight &&
      controlY >= SENSOR_CONTROL.hitTop &&
      controlY <= SENSOR_CONTROL.hitBottom
    ) {
      requestSensorAccess();
      return;
    }

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

  // Home Video.
  if (
    inImage(point, 0) &&
    !homeVideoStarting
  ) {
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

    const point = texturePoint(event);

    // Visuals Hebel.
    if (isOnVisualLever(point)) {
      visualLeverPointer = event.pointerId;
      visualLeverMoved = false;
      visualLeverStartY = event.clientY;

      stage.setPointerCapture(
        event.pointerId
      );
      return;
    }

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
    // Mechanischer Dia-Hebel.
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

    if (!pointers.has(event.pointerId)) {
      return;
    }

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    // Pinch Zoom.
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
      dt / 16, 2
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
  // Visuals Hebel.
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

  if (!pointers.has(event.pointerId)) {
    return;
  }

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
    stage.classList.remove("dragging");
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

    if (spotifyOpen || contactOpen) return;

    if (
      ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName
      )
    ) return;

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

  // Automatischer Flug zum gewählten Bereich.
  if (!isDragging && menuAnimating) {
    const dy =
      targetRotationY - rotationY;

    const dx =
      targetRotationX - rotationX;

    rotationY += dy * 0.075;
    rotationX += dx * 0.075;

    if (
      Math.abs(dy) < 0.0005 &&
      Math.abs(dx) < 0.0005
    ) {
      rotationY = targetRotationY;
      rotationX = targetRotationX;
      menuAnimating = false;
    }
  } else if (!isDragging) {
    // Trägheit bei freier Drehung.
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

  // Video nur bei neuen Frames.
  if (
    homeVideoPlaying &&
    typeof homeVideo.requestVideoFrameCallback !== "function" &&
    now - lastVideoFallbackPaint >= 33
  ) {
    lastVideoFallbackPaint = now;
    updateHomeVideoFrame();
  }

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

  const mode = sensorMode();

  if (mode === "KOMPASS AKTIV") {
    targetNeedleAngle =
      -sensorHeading * Math.PI / 180;
  } else if (mode === "BEWEGUNG AKTIV") {
    targetNeedleAngle = motionAngle;
  } else {
    targetNeedleAngle = fallbackAngle;
  }

  if (mode !== lastShownSensorMode) {
    lastShownSensorMode = mode;
    sensorStatusText = mode;
    refreshEchoesTexture();
  }

  const needleDelta = wrapAngle(
    targetNeedleAngle - needleAngle
  );

  if (Math.abs(needleDelta) > 0.0005) {
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

  // Nur rendern, wenn sich etwas geändert hat.
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
    1, container.clientWidth
  );

  const h = Math.max(
    1, container.clientHeight
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

/* ENDE CAMOU – EXPLORE GLOBE */
