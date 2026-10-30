/* =========================================
   CAMOU – 360° DRAG NAVIGATION
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
  const scene = document.querySelector(".scene");
  const panels = Array.from(document.querySelectorAll(".panel"));

  if (!scene || panels.length === 0) return;

  const sectionNames = ["home", "music", "visuals", "archive", "contact"];

  // Reihenfolge anhand der IDs festlegen
  const orderedPanels = sectionNames
    .map(name => panels.find(panel => panel.id === name))
    .filter(Boolean);

  // Falls die IDs anders heißen, vorhandene Reihenfolge verwenden
  const pages = orderedPanels.length === panels.length
    ? orderedPanels
    : panels;

  const STEP = 72;
  const DRAG_SENSITIVITY = 180;

  let position = 0;
  let activeIndex = 0;

  let pointerDown = false;
  let startX = 0;
  let startY = 0;
  let startPosition = 0;

  let currentTiltX = 0;
  let currentTiltY = 0;

  function normalizeIndex(value) {
    return ((value % pages.length) + pages.length) % pages.length;
  }

  function showPanel(index) {
    activeIndex = normalizeIndex(index);

    pages.forEach((panel, i) => {
      const isActive = i === activeIndex;

      panel.classList.toggle("active", isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
    });

    // Menü-Markierung aktualisieren
    document.querySelectorAll(".menu a, nav a").forEach(link => {
      const target = link.getAttribute("href");

      if (!target || !target.startsWith("#")) return;

      link.classList.toggle(
        "active",
        target.slice(1) === pages[activeIndex].id
      );
    });
  }

  function updatePosition() {
    const nearest = Math.round(position);
    showPanel(nearest);
  }

  function applyTilt(x, y) {
    currentTiltX = x;
    currentTiltY = y;

    const activePanel = pages[activeIndex];

    if (!activePanel) return;

    activePanel.style.setProperty("--tilt-x", `${x}deg`);
    activePanel.style.setProperty("--tilt-y", `${y}deg`);
  }

  function resetTilt() {
    pages.forEach(panel => {
      panel.style.setProperty("--tilt-x", "0deg");
      panel.style.setProperty("--tilt-y", "0deg");
    });

    currentTiltX = 0;
    currentTiltY = 0;
  }

  function goTo(index) {
    position = index;
    showPanel(index);
    resetTilt();
  }

  /* Maus- und Touch-Steuerung */

  scene.addEventListener("pointerdown", event => {
    // Klicks auf Links und Buttons nicht als Ziehen behandeln
    if (event.target.closest("a, button, input, textarea")) return;

    pointerDown = true;

    startX = event.clientX;
    startY = event.clientY;
    startPosition = position;

    scene.classList.add("is-dragging");

    if (scene.setPointerCapture) {
      scene.setPointerCapture(event.pointerId);
    }
  });

  scene.addEventListener("pointermove", event => {
    if (!pointerDown) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    // Horizontal: durch die Seiten navigieren
    position = startPosition - dx / DRAG_SENSITIVITY;

    updatePosition();

    // Vertikal und diagonal: Oberfläche räumlich kippen
    const tiltY = Math.max(-18, Math.min(18, dx * 0.035));
    const tiltX = Math.max(-18, Math.min(18, -dy * 0.045));

    applyTilt(tiltX, tiltY);
  });

  function finishDrag() {
    if (!pointerDown) return;

    pointerDown = false;
    scene.classList.remove("is-dragging");

    // Auf die nächste Seite einrasten
    position = Math.round(position);
    showPanel(position);

    resetTilt();
  }

  scene.addEventListener("pointerup", finishDrag);
  scene.addEventListener("pointercancel", finishDrag);
  scene.addEventListener("lostpointercapture", finishDrag);

  /* Menü-Navigation */

  document.querySelectorAll(".menu a, nav a").forEach(link => {
    link.addEventListener("click", event => {
      const target = link.getAttribute("href");

      if (!target || !target.startsWith("#")) return;

      const index = pages.findIndex(
        panel => `#${panel.id}` === target
      );

      if (index === -1) return;

      event.preventDefault();
      goTo(index);

      history.replaceState(null, "", target);
    });
  });

  /* Tastatursteuerung */

  document.addEventListener("keydown", event => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      goTo(activeIndex + 1);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      goTo(activeIndex - 1);
    }
  });

  /* Startseite anhand des URL-Fragments auswählen */

  const initialHash = window.location.hash.slice(1);

  if (initialHash) {
    const initialIndex = pages.findIndex(
      panel => panel.id === initialHash
    );

    if (initialIndex !== -1) {
      position = initialIndex;
      activeIndex = initialIndex;
    }
  }

  showPanel(activeIndex);
  resetTilt();
});
