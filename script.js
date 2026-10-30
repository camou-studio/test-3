import * as THREE from "three";

/* CAMOU — image-textured 3D globe */

const CONFIG = {
  radius: 3.2,
  desktopZoom: 8.7,
  mobileZoom: 8.4,
  minZoom: 6.0,
  maxZoom: 15,
  dragSpeed: 0.0052,
  friction: 0.94
};

const ASSETS = {
  home: "assets/hero.jpg",
  music: "assets/release.jpg",
  visuals: "assets/visuals.jpg",
  archive: "assets/archive.jpg",
  contact: "assets/contact.jpg"
};

const LINKS = {
  instagram: "", // Instagram-Profiladresse hier einsetzen
  spotify: ""    // Spotify-Profiladresse hier einsetzen
};

const sections = [
  {
    name: "HOME",
    eyebrow: "NEW PROJECT / 001",
    title: ["c a m o u"],
    body: ["Gleiche Fragen.", "Neue Perspektiven."],
    image: ASSETS.home
  },
  {
    name: "MUSIC",
    eyebrow: "LATEST RELEASE",
    title: ["f r a g m e n t e"],
    body: [
      "Ein Song zwischen Licht und Schatten.",
      "Zwischen dem, was man sieht –",
      "und dem, was bleibt."
    ],
    image: ASSETS.music,
    extra: [
      "JETZT HÖREN  →",
      "SPOTIFY   /   APPLE MUSIC   /   YOUTUBE"
    ]
  },
  {
    name: "VISUALS",
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

const container = document.getElementById("globe");
const stage = document.querySelector(".globe-stage");
const sectionLabel = document.getElementById("current-section");
const sectionNumber = document.getElementById("section-number");
const hint = document.getElementById("hint");
const navButtons = [...document.querySelectorAll(".nav-link")];

const isMobile = matchMedia("(max-width: 700px)").matches;
const defaultZoom = isMobile
  ? CONFIG.mobileZoom
  : CONFIG.desktopZoom;

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

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(
  container.clientWidth,
  container.clientHeight
);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

container.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xddebd8, 1.15));

const keyLight = new THREE.DirectionalLight(0xe3f0dc, 2.1);
keyLight.position.set(-3, 4, 5);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x9bb99a, 24, 15);
rimLight.position.set(4, -1, -3);
scene.add(rimLight);

const globeGroup = new THREE.Group();
scene.add(globeGroup);

/* Load all five original website images and paint them into one
   equirectangular texture. Each image becomes one 72° longitude panel. */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => reject(
      new Error(`Bild konnte nicht geladen werden: ${src}`)
    );

    image.src = src;
  });
}

function drawCoverCrop(ctx, image, x, y, w, h) {
  const scale = Math.max(
    w / image.width,
    h / image.height
  );

  const sw = w / scale;
  const sh = h / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;

  ctx.drawImage(
    image,
    sx, sy, sw, sh,
    x, y, w, h
  );
}

function drawPanel(ctx, section, image, centerX, panelW, canvasH) {
  const x = centerX - panelW / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, panelW, canvasH);
  ctx.clip();

  // Photo background: darkened enough for readable typography.
  drawCoverCrop(ctx, image, x, 0, panelW, canvasH);

  const shade = ctx.createLinearGradient(
    0, 0, 0, canvasH
  );

  shade.addColorStop(0, "rgba(5,10,7,.45)");
  shade.addColorStop(.38, "rgba(5,10,7,.56)");
  shade.addColorStop(1, "rgba(5,10,7,.83)");

  ctx.fillStyle = shade;
  ctx.fillRect(x, 0, panelW, canvasH);

  // Soft central glow and restrained grain.
  const glow = ctx.createRadialGradient(
    centerX,
    canvasH * .48,
    30,
    centerX,
    canvasH * .48,
    panelW * .8
  );

  glow.addColorStop(0, "rgba(183,201,170,.16)");
  glow.addColorStop(1, "rgba(8,13,9,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(x, 0, panelW, canvasH);

  const pad = panelW * .105;
  const contentX = x + pad;
  const maxTextW = panelW - pad * 2;

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(232,239,226,.78)";
  ctx.font = "500 23px 'DM Mono', monospace";

  ctx.fillText(
    section.eyebrow,
    contentX,
    canvasH * .345,
    maxTextW
  );

  ctx.fillStyle = "#f0f2eb";

  ctx.font = section.name === "MUSIC"
    ? "300 55px Manrope, Arial"
    : "300 72px Manrope, Arial";

  let titleY = canvasH * .445;

  section.title.forEach((line, i) => {
    ctx.fillText(
      line,
      contentX,
      titleY + i * 86,
      maxTextW
    );
  });

  const bodyStart =
    titleY + section.title.length * 86 + 38;

  ctx.fillStyle = "rgba(235,239,230,.86)";
  ctx.font = "300 27px Manrope, Arial";

  section.body.forEach((line, i) => {
    ctx.fillText(
      line,
      contentX,
      bodyStart + i * 43,
      maxTextW
    );
  });

  if (section.extra) {
    const extraStart =
      bodyStart + section.body.length * 43 + 48;

    ctx.fillStyle = "#c1d0b7";
    ctx.font = "500 18px 'DM Mono', monospace";

    section.extra.forEach((line, i) => {
      ctx.fillText(
        line,
        contentX,
        extraStart + i * 39,
        maxTextW
      );
    });
  }

  ctx.strokeStyle = "rgba(226,235,220,.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(contentX, canvasH * .78);
  ctx.lineTo(contentX + maxTextW, canvasH * .78);
  ctx.stroke();

  ctx.fillStyle = "rgba(232,239,226,.62)";
  ctx.font = "19px 'DM Mono', monospace";

  ctx.fillText(
    `${String(sections.indexOf(section) + 1).padStart(2, "0")} / 05`,
    contentX,
    canvasH * .82
  );

  ctx.restore();
}

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

  ctx.fillStyle = "#172019";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const panelW = canvas.width / sections.length;

  // Home is centered at the front of the globe. The other four
  // sections continue around the sphere in the chosen order.
  sections.forEach((section, index) => {
    let center = canvas.width * (
      0.5 + index / sections.length
    );

    center %= canvas.width;

    let x = center - panelW / 2;

    drawPanel(
      ctx,
      section,
      images[index],
      x + panelW / 2,
      panelW,
      canvas.height
    );

    // Copy wrapped panels across the texture seam.
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

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();

  texture.needsUpdate = true;

  return texture;
}

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

createGlobeTexture()
  .then(texture => {
    globeMaterial.map = texture;
    globeMaterial.needsUpdate = true;
  })
  .catch(error => {
    console.error(error);
    sectionLabel.textContent = "BILDER NICHT GELADEN";
  });

/* Camera zoom */

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
    setZoom(currentZoom - .7);
  });

document
  .getElementById("zoom-out")
  .addEventListener("click", () => {
    setZoom(currentZoom + .7);
  });

document
  .getElementById("zoom-reset")
  .addEventListener("click", () => {
    setZoom(defaultZoom);
  });

stage.addEventListener("wheel", event => {
  event.preventDefault();
  setZoom(currentZoom + event.deltaY * .008);
}, { passive: false });

/* Drag and pinch gestures */

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

  stage.setPointerCapture(event.pointerId);

  if (pointers.size === 1) {
    isDragging = true;

    previousX = event.clientX;
    previousY = event.clientY;
    lastTime = performance.now();

    velocityX = velocityY = 0;

    stage.classList.add("dragging");
    hint.classList.add("hidden");

  } else if (pointers.size === 2) {
    isDragging = false;
    stage.classList.remove("dragging");

    const pts = [...pointers.values()];

    pinchDistance = distance(pts[0], pts[1]);
    pinchZoom = currentZoom;
  }
});

stage.addEventListener("pointermove", event => {
  if (!pointers.has(event.pointerId)) return;

  pointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  if (pointers.size >= 2) {
    const pts = [...pointers.values()];
    const d = distance(pts[0], pts[1]);

    if (pinchDistance > 0) {
      setZoom(pinchZoom / (d / pinchDistance));
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
});

function releasePointer(event) {
  pointers.delete(event.pointerId);

  if (pointers.size === 0) {
    isDragging = false;
    stage.classList.remove("dragging");

  } else if (pointers.size === 1) {
    const p = [...pointers.values()][0];

    previousX = p.x;
    previousY = p.y;
    lastTime = performance.now();

    velocityX = velocityY = 0;

    isDragging = true;
    stage.classList.add("dragging");
  }
}

stage.addEventListener("pointerup", releasePointer);
stage.addEventListener("pointercancel", releasePointer);
stage.addEventListener("lostpointercapture", releasePointer);

/* Section navigation */

const sectionStep = (Math.PI * 2) / sections.length;

let baseRotation = 0;
let targetRotationY = 0;
let menuAnimating = false;

function currentIndex() {
  const raw = Math.round(
    (baseRotation - rotationY) / sectionStep
  );

  return (
    (raw % sections.length) + sections.length
  ) % sections.length;
}

function updateIndicator() {
  const index = currentIndex();

  sectionLabel.textContent = sections[index].name;

  sectionNumber.textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, i) => {
    button.classList.toggle("active", i === index);
  });
}

function goToSection(index) {
  const i = (
    (index % sections.length) + sections.length
  ) % sections.length;

  let destination =
    baseRotation - i * sectionStep;

  const full = Math.PI * 2;

  while (destination - rotationY > Math.PI) {
    destination -= full;
  }

  while (destination - rotationY < -Math.PI) {
    destination += full;
  }

  targetRotationY = destination;

  velocityX = velocityY = 0;
  menuAnimating = true;
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    goToSection(Number(button.dataset.section));
  });
});

document
  .getElementById("logo")
  .addEventListener("click", event => {
    event.preventDefault();
    goToSection(0);
  });

/* Social links: fill in your real profile URLs above. */

for (const [id, url] of [
  ["instagram-link", LINKS.instagram],
  ["spotify-link", LINKS.spotify]
]) {
  const link = document.getElementById(id);

  if (url) {
    link.href = url;
  } else {
    link.href = "#";

    link.addEventListener("click", e => {
      e.preventDefault();
    });
  }
}

/* Keyboard controls */

window.addEventListener("keydown", event => {
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

  if (event.key === "+" || event.key === "=") {
    setZoom(currentZoom - .7);
  }

  if (event.key === "-") {
    setZoom(currentZoom + .7);
  }

  if (event.key === "0") {
    setZoom(defaultZoom);
  }
});

/* Render loop */

function animate() {
  requestAnimationFrame(animate);

  if (!isDragging && menuAnimating) {
    const delta = targetRotationY - rotationY;

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

  renderer.render(scene, camera);
  updateIndicator();
}

animate();

function resize() {
  const w = container.clientWidth;
  const h = container.clientHeight;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setSize(w, h);
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, 2)
  );
}

window.addEventListener("resize", resize);

setZoom(defaultZoom);
updateIndicator();
