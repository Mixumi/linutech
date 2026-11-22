import "./language.js?v=whole-phone-1";
import { setupWave } from "./mascot.js";

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
    steps: [["focus"], ["focus", 50, 27], ["focus", 50, 92]],
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

const topics = Object.keys(hints);
const showcase = document.querySelector(".showcase");
const stage = document.querySelector(".demo-stage");
const screen = document.querySelector("#preview-image");
const phone = document.querySelector("#preview-phone");
const phoneHome = document.querySelector("#phone-home");
const marker = document.querySelector("#tour-marker");
const markerInk = marker.firstElementChild;
const waveButton = document.querySelector("#wave-button");
const waveReply = document.querySelector("#wave-reply");
const waveCopy = document.querySelector("#wave-copy");
const poses = [...document.querySelectorAll("[data-panda]")];
const initialPanda = poses[0].querySelector("img");
const topicButtons = [...document.querySelectorAll("button[data-topic]")];
const guideTopics = [...document.querySelectorAll("[data-guide-topic]")];
const stepButtons = [...document.querySelectorAll("button[data-step]")];
const stepCopy = [...document.querySelectorAll("[data-step-copy]")];
const screenCopy = new Map([...document.querySelectorAll("[data-screen-copy]")].map(node => [node.dataset.screenCopy, node]));
const dialog = document.querySelector("#screen-dialog");
const dialogPhone = document.querySelector("#dialog-phone");
const openScreen = document.querySelector("#screen-open");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const wave = setupWave(poses[0].querySelector("canvas"), initialPanda, reduceMotion);

let topic = "today";
let step = 0;
let currentScreen = "cover";
let frameRequest = 0;
let replyTimer;
let swipeStart;
let returnFocus;
let activeDetail;
const prepared = new Map();

function prepareScreen(name) {
  if (!prepared.has(name)) {
    const image = new Image();
    image.fetchPriority = "low";
    image.src = new URL("screen-" + name + ".webp", import.meta.url);
    prepared.set(name, image.decode().then(() => image, () => {
      prepared.delete(name);
      return null;
    }));
  }
  return prepared.get(name);
}

function syncAlt() {
  screen.alt = screenCopy.get(currentScreen)?.textContent ??
    activeDetail?.querySelector("summary")?.textContent ?? screen.alt;
}

function markControl(x, y, action) {
  marker.hidden = x === undefined;
  markerInk.getAnimations().forEach(animation => animation.cancel());
  if (marker.hidden) return;
  marker.style.setProperty("--x", x + "%");
  marker.style.setProperty("--y", y + "%");
  marker.dataset.action = action || "tap";
  if (reduceMotion.matches) return;
  const keyframes = action === "swipe" ?
    [{ transform: "none" }, { transform: "translateX(19px)", opacity: .7 }, { transform: "none" }] :
    [{ transform: "scale(.8)" }, { transform: "scale(1.22)" }, { transform: "none" }];
  markerInk.animate(keyframes, { duration: 600, iterations: 2, easing: "ease-out" });
}

async function showHint([name, x, y, action]) {
  const request = ++frameRequest;
  if (name !== currentScreen) {
    const next = await prepareScreen(name);
    if (request !== frameRequest || !next) return;
    // Preserve the old frame until the new one has decoded, then replace its source.
    screen.getAnimations().forEach(animation => animation.cancel());
    screen.src = next.src;
    currentScreen = name;
    if (!reduceMotion.matches) {
      screen.animate([{ opacity: .82 }, { opacity: 1 }], { duration: 180, easing: "ease-out" });
    }
  }
  syncAlt();
  markControl(x, y, action);
}

function selectStep(index) {
  step = index;
  stepButtons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  for (const line of stepCopy) line.hidden = line.dataset.stepCopy !== topic + "-" + (index + 1);
  showHint(hints[topic].steps[index]);
}

function selectTopic(next) {
  if (next !== topic) {
    wave.stop();
    clearTimeout(replyTimer);
    waveReply.textContent = "";
    step = 0;
  }
  topic = next;
  showcase.dataset.scene = topic;
  for (const button of topicButtons) button.setAttribute("aria-pressed", String(button.dataset.topic === topic));
  for (const pose of poses) pose.hidden = pose.dataset.panda !== topic;
  for (const section of guideTopics) section.hidden = section.dataset.guideTopic !== topic;
  selectStep(step);
}

for (const button of topicButtons) button.addEventListener("click", () => selectTopic(button.dataset.topic));
stepButtons.forEach((button, index) => button.addEventListener("click", () => selectStep(index)));
stage.addEventListener("pointerdown", event => {
  if (!event.isPrimary || event.pointerType === "mouse" || event.target.closest("button")) return;
  swipeStart = { x: event.clientX, y: event.clientY };
});
stage.addEventListener("pointerup", event => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = undefined;
  if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.35) {
    const next = (topics.indexOf(topic) + (dx < 0 ? 1 : topics.length - 1)) % topics.length;
    selectTopic(topics[next]);
  }
});
stage.addEventListener("pointercancel", () => { swipeStart = undefined; });

waveButton.disabled = false;
waveButton.addEventListener("click", () => {
  if (topic === "today") wave.play();
  else if (!reduceMotion.matches) {
    const pose = poses.find(node => node.dataset.panda === topic);
    pose.getAnimations().forEach(animation => animation.cancel());
    pose.animate([{ transform: "none" }, { transform: "translateY(-8px) rotate(-8deg)" }, { transform: "none" }], { duration: 430 });
  }
  clearTimeout(replyTimer);
  waveReply.textContent = waveCopy.textContent;
  replyTimer = setTimeout(() => { waveReply.textContent = ""; }, 2000);
});

function openViewer(trigger, detail) {
  if (dialog.open) return;
  returnFocus = trigger;
  activeDetail = detail;
  dialogPhone.append(phone);
  dialog.showModal();
  if (detail) {
    const index = Number(detail.dataset.operation) - 1;
    showHint(hints[topic].operations[index]);
  } else {
    markControl(...hints[topic].steps[step].slice(1));
  }
}

if (typeof dialog.showModal === "function") {
  openScreen.hidden = false;
  openScreen.addEventListener("click", () => openViewer(openScreen));
  for (const button of document.querySelectorAll(".operation-view")) {
    button.hidden = false;
    button.addEventListener("click", () => openViewer(button, button.closest("details")));
  }
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    phoneHome.append(phone);
    activeDetail = undefined;
    showHint(hints[topic].steps[step]);
    returnFocus?.focus({ preventScroll: true });
  });
}

document.addEventListener("timehabit-language-change", () => {
  syncAlt();
  if (waveReply.textContent) waveReply.textContent = waveCopy.textContent;
});

function syncLinkedTopic() {
  const linked = new URL(location.href).hash.slice("#guide-".length);
  if (location.hash.startsWith("#guide-") && topics.includes(linked)) selectTopic(linked);
}
document.querySelector(".demo-controls").hidden = false;
document.querySelector(".guide-tabs").hidden = false;
selectTopic(topic);
syncLinkedTopic();
window.addEventListener("hashchange", syncLinkedTopic);
for (const name of ["focus", "control", "review", "today"]) prepareScreen(name);
function greetAtOpening() {
  if (topic === "today" && !location.hash.startsWith("#guide") && !document.hidden) wave.play();
}
if (initialPanda.complete) requestAnimationFrame(greetAtOpening);
else initialPanda.addEventListener("load", greetAtOpening, { once: true });
