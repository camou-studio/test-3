
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

const LINKS = {
  instagram: "",
  spotify: ""
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
    extra: [
      "JETZT HÖREN →",
      "SPOTIFY / APPLE MUSIC / YOUTUBE"
    ]
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
    name: "ARCHIVE",
    poleLetter: "o",
    eyebrow: "03 — SELECTED WORKS",
    title: ["Archive"],
    body: [
      "Alles hinterlässt Spuren.",
      "Ein wachsendes Archiv aus Musik",
      "und visuellen Arbeiten."
    ],
    image: ASSETS.archive,
    extra: [
      "fragmente",
      "Zwischenräume",
      "ohne titel",
      "notizen"
    ]
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
let homeVideoStarting = false;

let globeCanvas = null;
let globeContext = null;
let globeTexture = null;

/* =========================================
   BILDER LADEN
========================================= */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(new Error(
        `Bild konnte nicht geladen werden: ${src}`
      ));
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
    homeVideoPlaying &&
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

  ctx.restore();

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
    !homeVideoPlaying ||
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

function startHomeVideoFromClick(event) {
  if (!pointerStart) return;

  const movement = Math.hypot(
    event.clientX - pointerStart.x,
    event.clientY - pointerStart.y
  );

  pointerStart = null;

  // Ziehen soll weiterhin nur die Kugel bewegen
  if (movement > 7) return;

  if (homeVideoPlaying || homeVideoStarting) return;

  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  pointer.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;

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

  if (!isInsideButton || !isInsideImage) return;

  homeVideoStarting = true;

  homeVideo.muted = false;
  homeVideo.volume = 1;

  homeVideo.play()
    .then(() => {
      homeVideoPlaying = true;
      homeVideoStarting = false;

      updateHomeVideoFrame();

      console.info("CAMOU: Home-Video gestartet.");
    })
    .catch(error => {
      homeVideoStarting = false;

      console.error(
        "CAMOU: Das Video konnte nicht gestartet werden.",
        error
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
    startHomeVideoFromClick(event);
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
   SOCIAL-MEDIA-LINKS
========================================= */

for (const [id, url] of [
  ["instagram-link", LINKS.instagram],
  ["spotify-link", LINKS.spotify]
]) {
  const link = document.getElementById(id);

  if (url) {
    link.href = url;
  } else {
    link.href = "#";

    link.addEventListener("click", event => {
      event.preventDefault();
    });
  }
}

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

