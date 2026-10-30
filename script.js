import * as THREE from
  "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

/* =========================================
   CAMOU – 3D GLOBE WEBSITE
   ========================================= */

const container = document.getElementById("globe");
const stage = document.querySelector(".globe-stage");

const sectionLabel = document.getElementById("current-section");
const sectionNumber = document.getElementById("section-number");
const hint = document.getElementById("hint");

const navButtons = [...document.querySelectorAll(".nav-link")];

const sections = [
  {
    name: "HOME",
    eyebrow: "INDEPENDENT CREATIVE STUDIO",
    title: "A WORLD\nOF ITS OWN",
    description: [
      "Sound, images and ideas.",
      "An independent creative space.",
      "Explore the world of CAMOU."
    ],
    number: "01"
  },
  {
    name: "MUSIC",
    eyebrow: "01 — SOUND",
    title: "FRAGMENTE",
    description: [
      "A collection of sounds,",
      "memories and moments.",
      "Listen. Discover. Feel."
    ],
    number: "02"
  },
  {
    name: "VISUALS",
    eyebrow: "02 — VISUAL LANGUAGE",
    title: "BEYOND\nTHE VISIBLE",
    description: [
      "Visual experiments.",
      "Moving images and stills.",
      "Perspectives in motion."
    ],
    number: "03"
  },
  {
    name: "ARCHIVE",
    eyebrow: "03 — COLLECTION",
    title: "THE ARCHIVE",
    description: [
      "Fragments of previous work.",
      "Ideas, sketches and projects.",
      "A growing collection."
    ],
    number: "04"
  },
  {
    name: "CONTACT",
    eyebrow: "04 — GET IN TOUCH",
    title: "LET'S CONNECT",
    description: [
      "For collaborations, questions",
      "or just a conversation.",
      "camou.kontakt@gmail.com"
    ],
    number: "05"
  }
];

/* -----------------------------------------
   TEXTUR ERZEUGEN
   ----------------------------------------- */

function createGlobeTexture() {
  const canvas = document.createElement("canvas");

  canvas.width = 4096;
  canvas.height = 2048;

  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;
  const panelWidth = width / sections.length;

  // Grundfarbe
  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#202a22");
  background.addColorStop(0.45, "#303b31");
  background.addColorStop(1, "#111812");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  // Subtile horizontale Lichtzonen
  const glow = ctx.createRadialGradient(
    width / 2,
    height / 2,
    50,
    width / 2,
    height / 2,
    height * 0.8
  );

  glow.addColorStop(0, "rgba(177, 194, 164, 0.17)");
  glow.addColorStop(1, "rgba(10, 15, 11, 0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Dezente Oberflächenstruktur
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    ctx.fillStyle = `rgba(230,240,220,${Math.random() * 0.035})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Die fünf Website-Bereiche werden rund um die Kugel verteilt.
  sections.forEach((section, index) => {
    const centerX = index * panelWidth + panelWidth / 2;

    ctx.save();
    ctx.translate(centerX, 0);

    // Leichte vertikale Begrenzung der einzelnen Themenbereiche
    ctx.strokeStyle = "rgba(220,235,215,0.15)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-panelWidth / 2 + 35, 300);
    ctx.lineTo(-panelWidth / 2 + 35, 1700);
    ctx.stroke();

    // Oberer Bereich
    ctx.textAlign = "left";

    ctx.font = "26px monospace";
    ctx.fillStyle = "rgba(220,230,215,0.68)";
    ctx.fillText(section.eyebrow, -panelWidth / 2 + 85, 620);

    // Hauptüberschrift
    ctx.font = "bold 100px Arial";
    ctx.fillStyle = "#edf1e9";

    const titleLines = section.title.split("\n");

    titleLines.forEach((line, lineIndex) => {
      ctx.fillText(
        line,
        -panelWidth / 2 + 80,
        850 + lineIndex * 120
      );
    });

    // Beschreibung
    ctx.font = "34px Arial";
    ctx.fillStyle = "rgba(225,233,220,0.76)";

    section.description.forEach((line, lineIndex) => {
      ctx.fillText(
        line,
        -panelWidth / 2 + 85,
        1150 + lineIndex * 57
      );
    });

    // Nummer des Bereichs
    ctx.font = "24px monospace";
    ctx.fillStyle = "rgba(220,230,215,0.5)";
    ctx.fillText(
      section.number + " / 05",
      -panelWidth / 2 + 85,
      1500
    );

    // Dezentes grafisches Element
    ctx.strokeStyle = "rgba(180,198,169,0.38)";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(
      panelWidth / 2 - 100,
      500,
      65,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.restore();
  });

  // Nahtlose Textur für die Kugel
  const texture = new THREE.CanvasTexture(canvas);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  return texture;
}

/* -----------------------------------------
   THREE.JS SZENE
   ----------------------------------------- */

const scene = new THREE.Scene();

scene.background = new THREE.Color("#101411");

const camera = new THREE.PerspectiveCamera(
  38,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);

camera.position.set(0, 0, 5.15);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(
  container.clientWidth,
  container.clientHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

/* -----------------------------------------
   LICHT
   ----------------------------------------- */

const ambientLight = new THREE.AmbientLight(
  0xddebd8,
  1.1
);

scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(
  0xe3f0dc,
  2.2
);

mainLight.position.set(-3, 4, 5);
scene.add(mainLight);

const sideLight = new THREE.PointLight(
  0x9bb99a,
  30,
  15
);

sideLight.position.set(4, -1, -3);
scene.add(sideLight);

/* -----------------------------------------
   KUGEL ERSTELLEN
   ----------------------------------------- */

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const texture = createGlobeTexture();

const geometry = new THREE.SphereGeometry(
  3.15,
  128,
  96
);

const material = new THREE.MeshStandardMaterial({
  map: texture,
  roughness: 0.78,
  metalness: 0.08
});

const globe = new THREE.Mesh(geometry, material);

globeGroup.add(globe);

/* Dezente Atmosphäre am Kugelrand */

const atmosphereGeometry = new THREE.SphereGeometry(
  3.19,
  96,
  64
);

const atmosphereMaterial = new THREE.MeshBasicMaterial({
  color: 0x9bad91,
  transparent: true,
  opacity: 0.075,
  side: THREE.BackSide
});

const atmosphere = new THREE.Mesh(
  atmosphereGeometry,
  atmosphereMaterial
);

globeGroup.add(atmosphere);

/* -----------------------------------------
   STARTPOSITION
   ----------------------------------------- */

globeGroup.rotation.set(0, 0, 0);

let rotationX = 0;
let rotationY = 0;

let velocityX = 0;
let velocityY = 0;

let targetRotationX = 0;
let targetRotationY = 0;

let isDragging = false;

let previousX = 0;
let previousY = 0;

let lastPointerTime = 0;

const DRAG_SPEED = 0.005;
const FRICTION = 0.94;
const NAV_DURATION = 1000;

/* -----------------------------------------
   TOUCH UND MAUS
   ----------------------------------------- */

stage.addEventListener("pointerdown", event => {
  isDragging = true;

  previousX = event.clientX;
  previousY = event.clientY;

  lastPointerTime = performance.now();

  velocityX = 0;
  velocityY = 0;

  stage.classList.add("dragging");

  stage.setPointerCapture(event.pointerId);

  hint.classList.add("hidden");
});

stage.addEventListener("pointermove", event => {
  if (!isDragging) return;

  const now = performance.now();
  const elapsed = Math.max(1, now - lastPointerTime);

  const dx = event.clientX - previousX;
  const dy = event.clientY - previousY;

  const speedFactor = Math.min(elapsed / 16, 2);

  const movementY = dx * DRAG_SPEED;
  const movementX = dy * DRAG_SPEED;

  rotationY += movementY;
  rotationX += movementX;

  velocityY = movementY / speedFactor;
  velocityX = movementX / speedFactor;

  previousX = event.clientX;
  previousY = event.clientY;
  lastPointerTime = now;

  updateSectionIndicator();
});

function stopDragging() {
  if (!isDragging) return;

  isDragging = false;
  stage.classList.remove("dragging");
}

stage.addEventListener("pointerup", stopDragging);
stage.addEventListener("pointercancel", stopDragging);
stage.addEventListener("lostpointercapture", stopDragging);

/* -----------------------------------------
   NAVIGATION
   ----------------------------------------- */

function navigateToSection(index) {
  const normalizedIndex =
    (index + sections.length) % sections.length;

  // Jeder Bereich liegt 72 Grad weiter auf der Kugel.
  targetRotationY = -normalizedIndex * (
    Math.PI * 2 / sections.length
  );

  // Nächste sinnvolle Umdrehung auswählen
  const fullTurn = Math.PI * 2;

  while (targetRotationY - rotationY > Math.PI) {
    targetRotationY -= fullTurn;
  }

  while (targetRotationY - rotationY < -Math.PI) {
    targetRotationY += fullTurn;
  }

  velocityX = 0;
  velocityY = 0;

  navButtons.forEach((button, buttonIndex) => {
    button.classList.toggle(
      "active",
      buttonIndex === normalizedIndex
    );
  });

  sectionLabel.textContent = sections[normalizedIndex].name;

  sectionNumber.textContent =
    `${String(normalizedIndex + 1).padStart(2, "0")} / 05`;
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    navigateToSection(Number(button.dataset.section));
  });
});

document.getElementById("logo").addEventListener("click", event => {
  event.preventDefault();
  navigateToSection(0);
});

/* -----------------------------------------
   AKTIVEN BEREICH ERMITTELN
   ----------------------------------------- */

function updateSectionIndicator() {
  const step = Math.PI * 2 / sections.length;

  let normalized = rotationY % (Math.PI * 2);

  if (normalized < 0) {
    normalized += Math.PI * 2;
  }

  let index = Math.round(-normalized / step);

  index = (index % sections.length + sections.length) %
    sections.length;

  sectionLabel.textContent = sections[index].name;

  sectionNumber.textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, buttonIndex) => {
    button.classList.toggle(
      "active",
      buttonIndex === index
    );
  });
}

/* -----------------------------------------
   ANIMATION
   ----------------------------------------- */

function animate() {
  requestAnimationFrame(animate);

  if (!isDragging) {
    // Sanftes Auslaufen nach dem Loslassen
    rotationY += velocityY;
    rotationX += velocityX;

    velocityY *= FRICTION;
    velocityX *= FRICTION;

    // Menü-Zielposition weich anfahren
    const differenceY = targetRotationY - rotationY;

    if (Math.abs(differenceY) > 0.001 &&
        Math.abs(velocityY) < 0.0005) {
      rotationY += differenceY * 0.055;
    }
  }

  globeGroup.rotation.y = rotationY;
  globeGroup.rotation.x = rotationX;

  renderer.render(scene, camera);

  if (!isDragging) {
    updateSectionIndicator();
  }
}

animate();

/* -----------------------------------------
   RESPONSIVE GRÖSSE
   ----------------------------------------- */

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("resize", resize);

/* -----------------------------------------
   TASTATUR
   ----------------------------------------- */

window.addEventListener("keydown", event => {
  if (event.key === "ArrowRight") {
    navigateToSection(
      sections.findIndex(section =>
        section.name === sectionLabel.textContent
      ) + 1
    );
  }

  if (event.key === "ArrowLeft") {
    navigateToSection(
      sections.findIndex(section =>
        section.name === sectionLabel.textContent
      ) - 1
    );
  }

  if (event.key === "ArrowUp") {
    rotationX -= 0.3;
  }

  if (event.key === "ArrowDown") {
    rotationX += 0.3;
  }
});
