// Coordinates are measured on the original iPhone captures, before adding the frame.
const hints = {
  today: {
    steps: [["cover", 89, 12.7], ["cover"], ["today", 89, 48.5]],
    operations: [
      ["cover", 42.5, 14.2], ["cover", 29, 42.3, "swipe"], ["cover", 14, 42.3],
      ["cover"], ["today", 89, 48.5], ["cover"]
    ]
  },
  focus: {
    steps: [["cover", 70, 12.7], ["focus", 50, 27], ["focus", 50, 92]],
    operations: [
      ["cover", 86, 42.3], ["focus", 80, 74.4], ["focus", 89, 10],
      ["focus"], ["focus"], ["analysis"]
    ]
  },
  limits: {
    steps: [["control", 85, 22.3], ["control", 89.5, 12.7], ["control"]],
    operations: [
      ["control", 89.5, 12.7], ["control", 89.5, 12.7], ["control", 89.5, 12.7],
      ["control", 89.5, 12.7], ["control", 89.5, 12.7], ["control", 89.5, 12.7],
      ["control"], ["control"], ["control", 50, 52.8]
    ]
  },
  review: {
    steps: [["review", 89, 25.2], ["review", 32, 40], ["review", 89, 11.2]],
    operations: [
      ["review", 20.6, 18], ["analysis"], ["journal"], ["journal"],
      ["inbox"], ["journal"]
    ]
  }
};

export function enableGuide(panel, reduceMotion) {
  const map = hints[panel.dataset.topic];
  const controls = panel.querySelector(".step-targets");
  const steps = [...panel.querySelectorAll(".steps li")];
  const buttons = [...controls.querySelectorAll("button")];
  const operations = [...panel.querySelectorAll(".operation")];
  const shots = [...panel.querySelectorAll("[data-guide-screen]")];
  const marker = panel.querySelector(".tour-marker");
  let selectedStep = 0;

  function animateMarker(dot, action) {
    dot.getAnimations().forEach(animation => animation.cancel());
    if (reduceMotion.matches) return;
    const frames = action === "swipe" ? [
      { transform: "translateX(0)", opacity: 0.6 },
      { transform: "translateX(28px)", opacity: 1 },
      { transform: "translateX(42px)", opacity: 0.3 }
    ] : [
      { transform: "scale(.72)", opacity: 0.75 },
      { transform: "scale(1.28)", opacity: 1 },
      { transform: "scale(1)", opacity: 1 }
    ];
    dot.animate(frames, { duration: 650, iterations: 2, easing: "ease-out" });
  }

  function showHint([screen, x, y, action]) {
    for (const shot of shots) {
      shot.setAttribute("aria-hidden", String(shot.dataset.guideScreen !== screen));
    }
    marker.hidden = x === undefined;
    if (marker.hidden) return;
    marker.style.setProperty("--x", x + "%");
    marker.style.setProperty("--y", y + "%");
    marker.dataset.action = action || "tap";
    animateMarker(marker.firstElementChild, action);
  }

  function showInlineHint(operation, [screen, x, y, action]) {
    if (x === undefined || !matchMedia("(max-width: 680px)").matches) return;
    const sample = shots.find(shot => shot.dataset.guideScreen === screen);
    let peek = operation.querySelector(".operation-peek");
    if (!peek) {
      peek = document.createElement("span");
      peek.className = "operation-peek";
      peek.setAttribute("aria-hidden", "true");
      const image = document.createElement("img");
      image.alt = "";
      image.src = sample.src;
      const pin = document.createElement("span");
      pin.className = "tour-marker";
      pin.dataset.action = action || "tap";
      pin.append(document.createElement("i"));
      peek.append(image, pin);
      operation.querySelector("summary").after(peek);
      const width = 250;
      const height = width * sample.height / sample.width;
      const anchorX = width * x / 100;
      const anchorY = height * y / 100;
      const left = Math.min(0, Math.max(166 - width, 83 - anchorX));
      const top = Math.min(0, Math.max(72 - height, 36 - anchorY));
      image.style.left = left + "px";
      image.style.top = top + "px";
      pin.style.setProperty("--x", anchorX + left + "px");
      pin.style.setProperty("--y", anchorY + top + "px");
    }
    animateMarker(peek.querySelector("i"), action);
  }

  function stepTo(index) {
    selectedStep = index;
    steps.forEach((step, i) => {
      step.hidden = i !== index;
      buttons[i].setAttribute("aria-pressed", String(i === index));
    });
    for (const operation of operations) operation.open = false;
    showHint(map.steps[index]);
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => stepTo(index));
  });
  operations.forEach((operation, index) => {
    operation.addEventListener("toggle", () => {
      if (operation.open) {
        for (const other of operations) {
          if (other !== operation && other.open) other.open = false;
        }
        showHint(map.operations[index]);
        showInlineHint(operation, map.operations[index]);
      } else if (!operations.some(item => item.open)) {
        showHint(map.steps[selectedStep]);
      }
    });
  });
  controls.hidden = false;
  stepTo(0);
}
