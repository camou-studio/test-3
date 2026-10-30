import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "three/addons/renderers/CSS3DRenderer.js";

/* =========================================
   CAMOU — 3D CONTENT GLOBE
========================================= */

const CONFIG = {
  radius: 550,
  cameraDistance: 1500,
  minZoom: 1050,
  maxZoom: 2300,
  dragSpeed: 0.005,
  friction: 0.94
};

const ASSETS = {
  home: "./assets/hero.jpg",
  music: "./assets/release.jpg",
  visuals: "./assets/visuals.jpg",
  archive: "./assets/archive.jpg",
  contact: "./assets/contact.jpg"
};

/*
  Später hier deine echten Videodateien eintragen.
  Die Vorschaubilder werden angezeigt, bevor das Video startet.
*/

const VIDEOS = {
  music: {
    poster: "./assets/video-music-poster.jpg",
    source: "./assets/video-music.mp4"
  },
  visuals: {
    poster: "./assets/video-visuals-poster.jpg",
    source: "./assets/video-visuals.mp4"
  }
};

const LINKS = {
  instagram: "",
  spotify: ""
};

const SECTION_NAMES = [
  "HOME",
  "MUSIC",
  "VISUALS",
  "ARCHIVE",
  "CONTACT"
];

const SECTION_COUNT = SECTION_NAMES.length;
const SECTION_STEP = (Math.PI * 2) / SECTION_COUNT;

/* =========================================
   HTML-FENSTER
========================================= */

function createPanel(index, content) {
  const element = document.createElement("article");

  element.className = "globe-panel";
  element.dataset.section = String(index);

  element.innerHTML = content;

  return element;
}

function createImageWindow(image, alt) {
  return `
    <div class="media-window">
      <img src="${image}" alt="${alt}" loading="lazy">
    </div>
  `;
}

function createVideoWindow(video, alt) {
  return `
    <div class="video-window">

      <video
        poster="${video.poster}"
        preload="none"
        playsinline
        controls
        aria-label="${alt}"
      >
        <source src="${video.source}" type="video/mp4">
        Dein Browser unterstützt dieses Video nicht.
      </video>

      <button
        class="video-play"
        type="button"
        aria-label="Video abspielen"
      >
        ▶
      </button>

    </div>
  `;
}

function createHeading(label, number) {
  return `
    <div class="panel-heading">
      <span class="panel-eyebrow">${label}</span>
      <span class="panel-number">${number} / 05</span>
    </div>
  `;
}

/* =========================================
   INHALTE DER FÜNF BEREICHE
========================================= */

const panelContents = [

  /* HOME */

  `
    ${createHeading("NEW PROJECT / 001", "01")}

    <div class="panel-content">

      <div class="panel-copy">
        <h1>c a m o u</h1>

        <p>Gleiche Fragen.</p>
        <p>Neue Perspektiven.</p>

        <div class="small-note">
          INDEPENDENT ARTIST / SWITZERLAND
        </div>
      </div>

      ${createImageWindow(ASSETS.home, "Camou Home")}
    </div>
  `,

  /* MUSIC */

  `
    ${createHeading("LATEST RELEASE", "02")}

    <div class="panel-content">

      <div class="panel-copy">
        <h2>f r a g m e n t e</h2>

        <p>Ein Song zwischen Licht und Schatten.</p>
        <p>Zwischen dem, was man sieht – und dem, was bleibt.</p>

        <div class="small-note">
          SPOTIFY / APPLE MUSIC / YOUTUBE
        </div>
      </div>

      <div class="window-scroll">

        ${createImageWindow(ASSETS.music, "Aktuelle Veröffentlichung")}

        <h3>Latest release</h3>

        <p>
          Musik zwischen Atmosphäre, Melodie und Fragmenten.
        </p>

        <p>
          Hier können später Veröffentlichungen,
          Streaming-Links und weitere Informationen stehen.
        </p>

        ${createVideoWindow(VIDEOS.music, "Musikvideo")}

      </div>
    </div>
  `,

  /* VISUALS */

  `
    ${createHeading("VISUAL WORK", "03")}

    <div class="panel-content">

      <div class="panel-copy">
        <h2>Visuals</h2>

        <p>Bilder, die bleiben.</p>
        <p>Momente, die verschwinden.</p>

        <div class="small-note">
          IMAGE / MOTION / EXPERIMENT
        </div>
      </div>

      <div class="window-scroll">

        ${createImageWindow(ASSETS.visuals, "Camou Visuals")}

        <h3>Visual work</h3>

        <p>
          Eine Sammlung visueller Arbeiten,
          Fotografien und bewegter Bilder.
        </p>

        <p>
          Die einzelnen Arbeiten können hier
          später ergänzt und beschrieben werden.
        </p>

        ${createVideoWindow(VIDEOS.visuals, "Visual Video")}

      </div>
    </div>
  `,

  /* ARCHIVE */

  `
    ${createHeading("SELECTED WORKS", "04")}

    <div class="panel-content">

      <div class="panel-copy">
        <h2>Archive</h2>

        <p>Alles hinterlässt Spuren.</p>

        <p>
          Ein wachsendes Archiv aus Musik
          und visuellen Arbeiten.
        </p>

        <div class="small-note">
          SELECTED FRAGMENTS
        </div>
      </div>

      <div class="window-scroll">

        ${createImageWindow(ASSETS.archive, "Camou Archiv")}

        <div class="archive-list">

          <div class="archive-item">01 — fragmente</div>
          <div class="archive-item">02 — Zwischenräume</div>
          <div class="archive-item">03 — ohne titel</div>
          <div class="archive-item">04 — notizen</div>
          <div class="archive-item">05 — studies</div>
          <div class="archive-item">06 — experiments</div>
          <div class="archive-item">07 — visuals</div>
          <div class="archive-item">08 — sounds</div>

        </div>

      </div>
    </div>
  `,

  /* CONTACT */

  `
    ${createHeading("GET IN TOUCH", "05")}

    <div class="panel-content">

      <div class="panel-copy">
        <h2>Contact</h2>

        <p>Für Anfragen und Zusammenarbeit.</p>
        <p>Oder einfach für ein Gespräch.</p>

        <div class="small-note">
          camou.kontakt@gmail.com
        </div>
      </div>

      ${createImageWindow(ASSETS.contact, "Camou Contact")}
    </div>
  `
];

/* =========================================
   THREE.JS / CSS3D SZENE
========================================= */

const container = document.getElementById("globe");
const stage = document.querySelector(".globe-stage");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  38,
  container.clientWidth / container.clientHeight,
  1,
  5000
);

let currentZoom = CONFIG.cameraDistance;
camera.position.set(0, 0, currentZoom);

const renderer = new CSS3DRenderer();

renderer.setSize(
  container.clientWidth,
  container.clientHeight
);

renderer.domElement.style.position = "absolute";
renderer.domElement.style.inset = "0";

container.appendChild(renderer.domElement);

/* =========================================
   KUGEL-ANORDNUNG
========================================= */

const globeGroup = new THREE.Group();
scene.add(globeGroup);

const panels = [];

panelContents.forEach((content, index) => {

  const element = createPanel(index, content);
  const panel = new CSS3DObject(element);

  const sectionGroup = new THREE.Group();

  sectionGroup.rotation.y = index * SECTION_STEP;

  panel.position.set(0, 0, CONFIG.radius);

  sectionGroup.add(panel);
  globeGroup.add(sectionGroup);

  panels.push({
    element,
    panel,
    group: sectionGroup
  });

});

/*
  Die fünf Fenster liegen rund um die Kugel.
  Sie zeigen nach außen und werden durch die Drehung
  der gemeinsamen Gruppe bewegt.
*/

/* =========================================
   VIDEO-FUNKTION
========================================= */

document.querySelectorAll(".video-window").forEach(windowElement => {

  const video = windowElement.querySelector("video");
  const playButton = windowElement.querySelector(".video-play");

  if (!video || !playButton) return;

  playButton.addEventListener("click", async event => {

    event.stopPropagation();

    try {
      await video.play();
      windowElement.classList.add("playing");
    } catch (error) {
      console.warn("Video konnte nicht gestartet werden:", error);
    }

  });

  video.addEventListener("play", () => {
    windowElement.classList.add("playing");
  });

  video.addEventListener("pause", () => {
    windowElement.classList.remove("playing");
  });

  video.addEventListener("ended", () => {
    windowElement.classList.remove("playing");
  });

});

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

document.getElementById("zoom-in").addEventListener("click", () => {
  setZoom(currentZoom - 100);
});

document.getElementById("zoom-out").addEventListener("click", () => {
  setZoom(currentZoom + 100);
});

document.getElementById("zoom-reset").addEventListener("click", () => {
  setZoom(CONFIG.cameraDistance);
});

stage.addEventListener("wheel", event => {

  /*
    Scrollen innerhalb eines Inhaltsfensters
    soll nicht den Zoom der Kugel verändern.
  */

  if (event.target.closest(".window-scroll")) return;

  event.preventDefault();

  setZoom(currentZoom + event.deltaY * 0.8);

}, { passive: false });

/* =========================================
   DREHUNG / TOUCH / MAUS
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

function isInteractiveElement(target) {

  return Boolean(
    target.closest(
      ".window-scroll, video, button, a"
    )
  );

}

stage.addEventListener("pointerdown", event => {

  if (isInteractiveElement(event.target)) return;

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

    velocityX = 0;
    velocityY = 0;

    stage.classList.add("dragging");

    document.getElementById("hint").classList.add("hidden");
  }

});

stage.addEventListener("pointermove", event => {

  if (!pointers.has(event.pointerId)) return;

  pointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  if (!isDragging || pointers.size !== 1) return;

  const now = performance.now();

  const dt = Math.max(1, now - lastTime);

  const dx = event.clientX - previousX;
  const dy = event.clientY - previousY;

  const mx = dx * CONFIG.dragSpeed;
  const my = dy * CONFIG.dragSpeed;

  rotationY += mx;
  rotationX += my;

  velocityY = mx / Math.min(dt / 16, 2);
  velocityX = my / Math.min(dt / 16, 2);

  previousX = event.clientX;
  previousY = event.clientY;

  lastTime = now;

});

function releasePointer(event) {

  pointers.delete(event.pointerId);

  if (pointers.size === 0) {

    isDragging = false;

    stage.classList.remove("dragging");

  }

}

stage.addEventListener("pointerup", releasePointer);
stage.addEventListener("pointercancel", releasePointer);
stage.addEventListener("lostpointercapture", releasePointer);

/* =========================================
   NAVIGATION
========================================= */

const navButtons = [
  ...document.querySelectorAll(".nav-link")
];

const sectionLabel = document.getElementById("current-section");
const sectionNumber = document.getElementById("section-number");

let targetRotationY = 0;
let menuAnimating = false;

function normalizeIndex(index) {

  return (
    (index % SECTION_COUNT) + SECTION_COUNT
  ) % SECTION_COUNT;

}

function currentIndex() {

  const raw = Math.round(-rotationY / SECTION_STEP);

  return normalizeIndex(raw);

}

function updateIndicator() {

  const index = currentIndex();

  sectionLabel.textContent = SECTION_NAMES[index];

  sectionNumber.textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, i) => {

    button.classList.toggle("active", i === index);

  });

}

function goToSection(index) {

  const i = normalizeIndex(index);

  velocityX = 0;
  velocityY = 0;

  isDragging = false;
  pointers.clear();

  stage.classList.remove("dragging");

  let destination = -i * SECTION_STEP;

  const fullCircle = Math.PI * 2;

  while (destination - rotationY > Math.PI) {
    destination -= fullCircle;
  }

  while (destination - rotationY < -Math.PI) {
    destination += fullCircle;
  }

  targetRotationY = destination;

  menuAnimating = true;

}

navButtons.forEach(button => {

  button.addEventListener("click", () => {

    goToSection(Number(button.dataset.section));

  });

});

document.getElementById("logo").addEventListener("click", event => {

  event.preventDefault();

  goToSection(0);

});

/* =========================================
   SOCIAL LINKS
========================================= */

function setSocialLink(id, url) {

  const link = document.getElementById(id);

  if (!link) return;

  if (url) {

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

  } else {

    link.href = "#";

    link.addEventListener("click", event => {
      event.preventDefault();
    });

  }

}

setSocialLink("instagram-link", LINKS.instagram);
setSocialLink("spotify-link", LINKS.spotify);

/* =========================================
   TASTATUR
========================================= */

window.addEventListener("keydown", event => {

  if (event.key === "ArrowRight") {
    goToSection(currentIndex() + 1);
  }

  if (event.key === "ArrowLeft") {
    goToSection(currentIndex() - 1);
  }

  if (event.key === "ArrowUp") {
    rotationX -= 0.2;
  }

  if (event.key === "ArrowDown") {
    rotationX += 0.2;
  }

  if (event.key === "+" || event.key === "=") {
    setZoom(currentZoom - 100);
  }

  if (event.key === "-") {
    setZoom(currentZoom + 100);
  }

  if (event.key === "0") {
    setZoom(CONFIG.cameraDistance);
  }

});

/* =========================================
   ANIMATION
========================================= */

function animate() {

  requestAnimationFrame(animate);

  if (!isDragging && menuAnimating) {

    const delta = targetRotationY - rotationY;

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

  renderer.render(scene, camera);

  updateIndicator();

}

/* =========================================
   RESPONSIVE GRÖSSE
========================================= */

function resize() {

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);

}

window.addEventListener("resize", resize);

setZoom(CONFIG.cameraDistance);
updateIndicator();

animate();
