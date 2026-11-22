import "./language.js";
import { enableGuide } from "./guide.js";
import { setupWave } from "./mascot.js";

(() => {
  const tabs = [...document.querySelectorAll(".guide-tab")];
  const panels = tabs.map(tab => document.querySelector(tab.hash));
  const preview = document.querySelector(".hero-art");
  const guidePanels = document.querySelector(".guide-panels");
  const scenePicker = document.querySelector(".scene-picker");
  const stickers = [...document.querySelectorAll(".scene-sticker")];
  const shots = [...document.querySelectorAll(".scene-shot")];
  const pandas = [...document.querySelectorAll(".scene-panda")];
  const waveButton = document.querySelector("#wave-button");
  const waveReply = document.querySelector("#wave-reply");
  const waveCopy = document.querySelector("#wave-copy");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const openingPanda = pandas[0].querySelector("img");
  const wave = setupWave(pandas[0].querySelector("canvas"), openingPanda, reduceMotion);
  let replyTimer;
  let swipeStart;
  let activeScene = 0;
  panels.forEach(panel => enableGuide(panel, reduceMotion));
  function activateTab(index, moveFocus = false) {
    activeScene = index;
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].inert = !active;
      panels[i].setAttribute("aria-hidden", String(!active));
    });
    const scene = stickers[index].dataset.preview;
    if (preview.dataset.scene !== scene) {
      preview.dataset.scene = scene;
      wave.stop();
      clearTimeout(replyTimer);
      waveReply.textContent = "";
    }
    stickers.forEach((sticker, i) => {
      const active = i === index;
      sticker.setAttribute("aria-pressed", String(active));
      shots[i].setAttribute("aria-hidden", String(!active));
      pandas[i].setAttribute("aria-hidden", String(!active));
    });
    if (moveFocus) tabs[index].focus();
  }

  guidePanels.classList.add("is-enhanced");
  document.querySelector(".guide-tabs").setAttribute("role", "tablist");
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panels[index].id);
    panels[index].setAttribute("role", "tabpanel");
    panels[index].setAttribute("aria-labelledby", tab.id);
    panels[index].tabIndex = 0;
    tab.addEventListener("click", event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      activateTab(index);
    });
    tab.addEventListener("keydown", event => {
      const last = tabs.length - 1;
      const destinations = {
        ArrowLeft: (index + last) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: last
      };
      if (!Object.hasOwn(destinations, event.key)) return;
      event.preventDefault();
      activateTab(destinations[event.key], true);
    });
  });
  stickers.forEach((sticker, index) => {
    sticker.addEventListener("click", () => activateTab(index));
  });
  preview.addEventListener("pointerdown", event => {
    if (!event.isPrimary || event.pointerType === "mouse" || event.target.closest("button")) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  });
  preview.addEventListener("pointerup", event => {
    if (!swipeStart) return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = undefined;
    if (Math.abs(dx) > 42 && Math.abs(dx) > 1.35 * Math.abs(dy)) {
      activateTab((activeScene + (dx < 0 ? 1 : stickers.length - 1)) % stickers.length);
    }
  });
  preview.addEventListener("pointercancel", () => { swipeStart = undefined; });
  scenePicker.hidden = false;
  waveButton.disabled = false;
  waveButton.addEventListener("click", () => {
    if (preview.dataset.scene === "today") {
      wave.play();
    } else if (!reduceMotion.matches) {
      const panda = waveButton.querySelector('.scene-panda[aria-hidden="false"]');
      panda.getAnimations().forEach(animation => animation.cancel());
      panda.animate([
        { transform: "rotate(0) translateY(0)" },
        { transform: "rotate(-10deg) translateY(-12%)" },
        { transform: "rotate(5deg) translateY(-3%)" },
        { transform: "rotate(0) translateY(0)" }
      ], { duration: 540, easing: "ease-out" });
    }
    clearTimeout(replyTimer);
    waveReply.textContent = waveCopy.textContent;
    replyTimer = setTimeout(() => { waveReply.textContent = ""; }, 2400);
  });
  function activateLinkedTab() {
    const linked = panels.findIndex(panel => "#" + panel.id === location.hash);
    if (linked >= 0) activateTab(linked);
    return linked;
  }
  if (activateLinkedTab() < 0) activateTab(0);
  function waveOnOpening() {
    if (preview.dataset.scene !== "today" || document.hidden || location.hash || waveReply.textContent) return;
    if (preview.getBoundingClientRect().top < document.documentElement.clientHeight) wave.play();
  }
  if (openingPanda.complete) {
    requestAnimationFrame(waveOnOpening);
  } else {
    openingPanda.addEventListener("load", waveOnOpening, { once: true });
  }
  window.addEventListener("hashchange", activateLinkedTab);

  document.addEventListener("timehabit-language-change", () => {
    if (waveReply.textContent) waveReply.textContent = waveCopy.textContent;
  });
})();
