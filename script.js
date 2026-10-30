import * as THREE from "three";

/* =========================================
   CAMOU – 3D GLOBE WEBSITE
   Inhalte aus Version 2
   ========================================= */

/* -----------------------------------------
   EINSTELLUNGEN
   ----------------------------------------- */

const CONFIG = {
  globeRadius: 3.15,

  // Größerer Wert = weiter entfernte Kamera
  desktopZoom: 12,
  mobileZoom: 14,

  minZoom: 8,
  maxZoom: 18,

  dragSpeed: 0.005,
  friction: 0.94,

  // 5 Bereiche auf einer Kugel
  sectionCount: 5
};

// Hier später die tatsächlichen Profil- und Release-Links eintragen.
// Die Adressen waren in den bisherigen Angaben nicht enthalten.
const LINKS = {
  instagram: "",
  spotify: "",
  appleMusic: "",
  youtube: ""
};

/* -----------------------------------------
   ELEMENTE
   ----------------------------------------- */

const container = document.getElementById("globe");
const stage = document.querySelector(".globe-stage");

const sectionLabel = document.getElementById("current-section");
const sectionNumber = document.getElementById("section-number");
const hint = document.getElementById("hint");

const navButtons = [
  ...document.querySelectorAll(".nav-link")
];

/* -----------------------------------------
   INHALTE
   ----------------------------------------- */

const sections = [
  {
    name: "HOME",
    eyebrow: "camou / 001",
    title: ["Gleiche Fragen.", "Neue Perspektiven."],
    body: [
      "An independent creative space.",
      "Sound, images and ideas."
    ],
    number: "01"
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
    links: [
      "SPOTIFY",
      "APPLE MUSIC",
      "YOUTUBE"
    ],
    number: "02"
  },

  {
    name: "VISUALS",
    eyebrow: "VISUAL WORK",
    title: ["Visuals"],
    body: [
      "Bilder, die bleiben.",
      "Momente, die verschwinden.",
      "",
      "Visuelle Arbeiten, Beobachtungen",
      "und Perspektiven."
    ],
    number: "03"
  },

  {
    name: "ARCHIVE",
    eyebrow: "SELECTED WORKS",
    title: ["Archive"],
    body: [
      "Alles hinterlässt Spuren.",
      "Ein wachsendes Archiv aus Musik",
      "und visuellen Arbeiten."
    ],
    entries: [
      "fragmente",
      "Zwischenräume",
      "ohne titel",
      "notizen"
    ],
    number: "04"
  },

  {
    name: "CONTACT",
    eyebrow: "GET IN TOUCH",
    title: ["Contact"],
    body: [
      "For collaborations, questions",
      "or just a conversation."
    ],
    email: "camou.kontakt@gmail.com",
    number: "05"
  }
];

/* -----------------------------------------
   HILFSFUNKTIONEN FÜR DIE TEXTUR
   ----------------------------------------- */

function drawLetterSpacingText(
  ctx,
  text,
  x,
  y,
  spacing
) {
  const chars = [...text];

  const widths = chars.map(char =>
    ctx.measureText(char).width
  );

  const totalWidth =
    widths.reduce((sum, width) => sum + width, 0) +
    spacing * (chars.length - 1);

  let currentX = x - totalWidth / 2;

  chars.forEach((char, index) => {
    ctx.fillText(char, currentX, y);
    currentX += widths[index] + spacing;
  });
}

function drawCenteredLines(
  ctx,
  lines,
  x,
  startY,
  lineHeight
) {
  lines.forEach((line, index) => {
    if (!line) return;

    ctx.fillText(
      line,
      x,
      startY + index * lineHeight
    );
  });
}

/* -----------------------------------------
   KUGELTEXTUR ERZEUGEN
   ----------------------------------------- */

function createGlobeTexture() {
  const canvas = document.createElement("canvas");

  canvas.width = 4096;
  canvas.height = 2048;

  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;

  const panelWidth = width / sections.length;

  // Dunkelgrüne Grundfarbe
  const background = ctx.createLinearGradient(
    0,
    0,
    0,
    height
  );

  background.addColorStop(0, "#202a22");
  background.addColorStop(0.45, "#303b31");
  background.addColorStop(1, "#111812");

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  // Weicher Lichtschein
  const glow = ctx.createRadialGradient(
    width / 2,
    height / 2,
    50,
    width / 2,
    height / 2,
    height * 0.8
  );

  glow.addColorStop(
    0,
    "rgba(177,194,164,0.17)"
  );

  glow.addColorStop(
    1,
    "rgba(10,15,11,0)"
  );

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Sehr feine Oberflächenstruktur
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;

    ctx.fillStyle =
      `rgba(230,240,220,${Math.random() * 0.035})`;

    ctx.fillRect(x, y, 2, 2);
  }

  // Alle fünf Bereiche zeichnen
  sections.forEach((section, index) => {
    const centerX =
      index * panelWidth + panelWidth / 2;

    ctx.save();

    ctx.translate(centerX, 0);

    const left = -panelWidth / 2;

    // Dezente Trennlinie
    ctx.strokeStyle = "rgba(220,235,215,0.13)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(left + 65, 300);
    ctx.lineTo(left + 65, 1700);
    ctx.stroke();

    // Oberer kleiner Text
    ctx.textAlign = "center";
    ctx.font = "24px monospace";
    ctx.fillStyle = "rgba(220,230,215,0.65)";

    drawLetterSpacingText(
      ctx,
      section.eyebrow.toUpperCase(),
      0,
      590,
      3
    );

    // Hauptüberschrift
    ctx.fillStyle = "#edf1e9";
    ctx.textAlign = "center";

    const titleSize =
      section.name === "MUSIC" ? 72 : 88;

    ctx.font = `300 ${titleSize}px Arial`;

    drawCenteredLines(
      ctx,
      section.title,
      0,
      830,
      115
    );

    // Beschreibung
    ctx.font = "30px Arial";
    ctx.fillStyle = "rgba(225,233,220,0.76)";

    drawCenteredLines(
      ctx,
      section.body,
      0,
      1100,
      58
    );

    // Music: Streaming-Plattformen
    if (section.links) {
      ctx.font = "21px monospace";
      ctx.fillStyle = "#b8c7ae";

      drawLetterSpacingText(
        ctx,
        section.links.join("     /     "),
        0,
        1430,
        1
      );
    }

    // Archive: Einträge
    if (section.entries) {
      ctx.textAlign = "center";
      ctx.font = "26px Arial";
      ctx.fillStyle = "#dce5d8";

      section.entries.forEach((entry, entryIndex) => {
        const y = 1390 + entryIndex * 62;

        ctx.fillText(
          entry,
          0,
          y
        );

        ctx.strokeStyle = "rgba(220,235,215,0.15)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(-170, y + 17);
        ctx.lineTo(170, y + 17);
        ctx.stroke();
      });
    }

    // Contact: E-Mail
    if (section.email) {
      ctx.font = "28px Arial";
      ctx.fillStyle = "#b8c7ae";

      ctx.fillText(
        section.email,
        0,
        1400
      );
    }

    // Nummer am unteren Rand
    ctx.font = "22px monospace";
    ctx.fillStyle = "rgba(220,230,215,0.45)";

    ctx.fillText(
      `${section.number} / 05`,
      0,
      1690
    );

    // Dezentes grafisches Element
    ctx.strokeStyle = "rgba(180,198,169,0.35)";
    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
      panelWidth / 2 - 115,
      450,
      48,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
  });

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

const isMobile = window.innerWidth <= 700;

const defaultZoom = isMobile
  ? CONFIG.mobileZoom
  : CONFIG.desktopZoom;

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
   KUGEL
   ----------------------------------------- */

const globeGroup = new THREE.Group();

scene.add(globeGroup);

const texture = createGlobeTexture();

const geometry = new THREE.SphereGeometry(
  CONFIG.globeRadius,
  128,
  96
);

const material = new THREE.MeshStandardMaterial({
  map: texture,
  roughness: 0.78,
  metalness: 0.08
});

const globe = new THREE.Mesh(
  geometry,
  material
);

globeGroup.add(globe);

/* Atmosphärischer Rand */

const atmosphereGeometry = new THREE.SphereGeometry(
  CONFIG.globeRadius * 1.013,
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

// Home auf die Vorderseite der Kugel bringen.
const baseRotation =
  Math.PI * 2 * 0.15;

const sectionStep =
  (Math.PI * 2) / sections.length;

let rotationX = 0;
let rotationY = baseRotation;

let velocityX = 0;
let velocityY = 0;

let targetRotationY = rotationY;
let navigationActive = false;

globeGroup.rotation.set(
  rotationX,
  rotationY,
  0
);

/* -----------------------------------------
   ZOOM
   ----------------------------------------- */

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
    setZoom(currentZoom - 0.8);
  });

document
  .getElementById("zoom-out")
  .addEventListener("click", () => {
    setZoom(currentZoom + 0.8);
  });

document
  .getElementById("zoom-reset")
  .addEventListener("click", () => {
    setZoom(defaultZoom);
  });

// Zoom mit Mausrad
stage.addEventListener(
  "wheel",
  event => {
    event.preventDefault();

    setZoom(currentZoom + event.deltaY * 0.008);
  },
  { passive: false }
);

/* -----------------------------------------
   TOUCH UND MAUS
   ----------------------------------------- */

let isDragging = false;

let previousX = 0;
let previousY = 0;

let lastPointerTime = 0;

const activePointers = new Map();

let pinchStartDistance = 0;
let pinchStartZoom = currentZoom;

function pointerDistance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function stopDragging() {
  isDragging = false;
  stage.classList.remove("dragging");
}

stage.addEventListener("pointerdown", event => {
  activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  stage.setPointerCapture(event.pointerId);

  navigationActive = false;

  if (activePointers.size === 1) {
    isDragging = true;

    previousX = event.clientX;
    previousY = event.clientY;

    lastPointerTime = performance.now();

    velocityX = 0;
    velocityY = 0;

    stage.classList.add("dragging");
    hint.classList.add("hidden");
  }

  if (activePointers.size === 2) {
    stopDragging();

    const points = [...activePointers.values()];

    pinchStartDistance = pointerDistance(
      points[0],
      points[1]
    );

    pinchStartZoom = currentZoom;
  }
});

stage.addEventListener("pointermove", event => {
  if (!activePointers.has(event.pointerId)) return;

  activePointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  // Zwei Finger: Zoom
  if (activePointers.size >= 2) {
    const points = [...activePointers.values()];

    const distance = pointerDistance(
      points[0],
      points[1]
    );

    if (pinchStartDistance > 0) {
      const factor = distance / pinchStartDistance;

      setZoom(pinchStartZoom / factor);
    }

    return;
  }

  // Ein Finger: Kugel drehen
  if (!isDragging) return;

  const now = performance.now();

  const elapsed = Math.max(
    1,
    now - lastPointerTime
  );

  const dx = event.clientX - previousX;
  const dy = event.clientY - previousY;

  const speedFactor = Math.min(
    elapsed / 16,
    2
  );

  const movementY = dx * CONFIG.dragSpeed;
  const movementX = dy * CONFIG.dragSpeed;

  rotationY += movementY;
  rotationX += movementX;

  velocityY = movementY / speedFactor;
  velocityX = movementX / speedFactor;

  previousX = event.clientX;
  previousY = event.clientY;

  lastPointerTime = now;

  updateSectionIndicator();
});

function releasePointer(event) {
  activePointers.delete(event.pointerId);

  if (activePointers.size === 0) {
    stopDragging();
  }

  // Wenn ein Finger übrig bleibt, wieder drehen
  if (activePointers.size === 1) {
    const remaining = [
      ...activePointers.values()
    ][0];

    previousX = remaining.x;
    previousY = remaining.y;

    lastPointerTime = performance.now();

    velocityX = 0;
    velocityY = 0;

    isDragging = true;

    stage.classList.add("dragging");
  }
}

stage.addEventListener("pointerup", releasePointer);
stage.addEventListener("pointercancel", releasePointer);
stage.addEventListener("lostpointercapture", releasePointer);

/* -----------------------------------------
   NAVIGATION ÜBER DAS MENÜ
   ----------------------------------------- */

function navigateToSection(index) {
  const normalizedIndex =
    (index + sections.length) % sections.length;

  // Die fünf Inhalte liegen jeweils 72 Grad auseinander.
  let desiredRotation =
    baseRotation - normalizedIndex * sectionStep;

  const fullTurn = Math.PI * 2;

  // Immer die kürzeste Drehrichtung wählen.
  while (desiredRotation - rotationY > Math.PI) {
    desiredRotation -= fullTurn;
  }

  while (desiredRotation - rotationY < -Math.PI) {
    desiredRotation += fullTurn;
  }

  targetRotationY = desiredRotation;

  velocityX = 0;
  velocityY = 0;

  navigationActive = true;

  updateSectionIndicator();
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    navigateToSection(
      Number(button.dataset.section)
    );
  });
});

document
  .getElementById("logo")
  .addEventListener("click", event => {
    event.preventDefault();
    navigateToSection(0);
  });

/* -----------------------------------------
   AKTUELLEN BEREICH ERMITTELN
   ----------------------------------------- */

function getCurrentSectionIndex() {
  const relativeRotation =
    baseRotation - rotationY;

  return (
    Math.round(relativeRotation / sectionStep) %
    sections.length +
    sections.length
  ) % sections.length;
}

function updateSectionIndicator() {
  const index = getCurrentSectionIndex();

  sectionLabel.textContent =
    sections[index].name;

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
   EXTERNE LINKS
   ----------------------------------------- */

function setupExternalLink(id, url) {
  const element = document.getElementById(id);

  if (!element) return;

  if (url && url.trim() !== "") {
    element.href = url;
    element.classList.remove("link-disabled");
  } else {
    element.href = "#";
    element.classList.add("link-disabled");

    element.addEventListener("click", event => {
      event.preventDefault();
    });
  }
}

setupExternalLink(
  "instagram-link",
  LINKS.instagram
);

setupExternalLink(
  "spotify-link",
  LINKS.spotify
);

/* -----------------------------------------
   ANIMATION
   ----------------------------------------- */

function animate() {
  requestAnimationFrame(animate);

  if (isDragging) {
    // Während des Ziehens direkt der Hand folgen.
  } else if (navigationActive) {
    // Sanft zur gewählten Position fahren.
    const difference =
      targetRotationY - rotationY;

    rotationY += difference * 0.055;

    if (Math.abs(difference) < 0.001) {
      rotationY = targetRotationY;
      navigationActive = false;
    }
  } else {
    // Nach dem Loslassen weiterdrehen.
    rotationY += velocityY;
    rotationX += velocityX;

    velocityY *= CONFIG.friction;
    velocityX *= CONFIG.friction;

    if (Math.abs(velocityY) < 0.00005) {
      velocityY = 0;
    }

    if (Math.abs(velocityX) < 0.00005) {
      velocityX = 0;
    }
  }

  globeGroup.rotation.y = rotationY;
  globeGroup.rotation.x = rotationX;

  renderer.render(scene, camera);

  updateSectionIndicator();
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

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );
}

window.addEventListener("resize", resize);

/* -----------------------------------------
   TASTATUR
   ----------------------------------------- */

window.addEventListener("keydown", event => {
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  if (event.key === "ArrowRight") {
    navigateToSection(
      getCurrentSectionIndex() + 1
    );
  }

  if (event.key === "ArrowLeft") {
    navigateToSection(
      getCurrentSectionIndex() - 1
    );
  }

  if (event.key === "ArrowUp") {
    rotationX -= 0.3;
  }

  if (event.key === "ArrowDown") {
    rotationX += 0.3;
  }

  if (event.key === "+" || event.key === "=") {
    setZoom(currentZoom - 0.8);
  }

  if (event.key === "-") {
    setZoom(currentZoom + 0.8);
  }

  if (event.key === "0") {
    setZoom(defaultZoom);
  }
});

/* -----------------------------------------
   START
   ----------------------------------------- */

updateSectionIndicator();
setZoom(defaultZoom);
