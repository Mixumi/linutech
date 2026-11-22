(() => {
  const scriptUrl = new URL(import.meta.url);
  const languages = ["zh-Hans", "zh-Hant", "en", "ja", "ko", "fr", "it", "es-ES", "pt-PT", "ru"];
  const picker = document.querySelector("#language-select");
  const languageLinks = [...document.querySelectorAll("[data-language-link]")];
  const textNodes = [...document.querySelectorAll("[data-copy]")];
  const attributes = [...document.querySelectorAll("[data-copy-attr]")];
  const defaultCopy = {
    ...Object.fromEntries(textNodes.map(node => [node.dataset.copy, node.textContent])),
    ...Object.fromEntries(attributes.map(node => {
      const [attr, key] = node.dataset.copyAttr.split(" ");
      return [key, node.getAttribute(attr)];
    }))
  };
  const translations = new Map([["zh-Hans", defaultCopy]]);
  let currentLanguage = "zh-Hans";
  let languageRequest = 0;

  function resolveLanguage(tag) {
    if (!tag) return undefined;
    if (languages.includes(tag)) return tag;
    const normalized = tag.toLowerCase();
    if (normalized.startsWith("zh")) return /(?:hant|tw|hk|mo)/.test(normalized) ? "zh-Hant" : "zh-Hans";
    const [base] = normalized.split("-");
    if (base === "es") return "es-ES";
    if (base === "pt") return "pt-PT";
    return languages.includes(base) ? base : undefined;
  }

  async function applyLanguage(language, updateUrl = false) {
    const request = ++languageRequest;
    try {
      if (!translations.has(language)) {
        const translationUrl = new URL("i18n/" + language + ".json", scriptUrl);
        const version = scriptUrl.searchParams.get("v");
        if (version) translationUrl.searchParams.set("v", version);
        const response = await fetch(translationUrl);
        if (!response.ok) throw new Error("Translation unavailable");
        const copy = await response.json();
        if (!Object.keys(defaultCopy).every(key => typeof copy[key] === "string" && copy[key])) {
          throw new Error("Incomplete translation");
        }
        translations.set(language, copy);
      }
      if (request !== languageRequest) return;
      const copy = translations.get(language);
      document.documentElement.lang = language;
      for (const node of textNodes) node.textContent = copy[node.dataset.copy];
      for (const node of attributes) {
        const [attr, key] = node.dataset.copyAttr.split(" ");
        node.setAttribute(attr, copy[key]);
      }
      currentLanguage = picker.value = language;
      for (const link of languageLinks) {
        const url = new URL(link.href);
        url.searchParams.set("lang", language);
        link.href = url;
      }
      document.dispatchEvent(new Event("timehabit-language-change"));
      if (updateUrl) {
        const url = new URL(location.href);
        url.searchParams.set("lang", language);
        history.replaceState(null, "", url);
      }
    } catch (error) {
      if (request === languageRequest) picker.value = currentLanguage;
      console.warn("TimeHabit:", error);
    }
  }
  function requestedLanguage() {
    return resolveLanguage(new URL(location.href).searchParams.get("lang")) ||
      navigator.languages.map(resolveLanguage).find(Boolean) || "en";
  }

  picker.hidden = false;
  picker.addEventListener("change", () => applyLanguage(picker.value, true));
  window.addEventListener("popstate", () => applyLanguage(requestedLanguage()));
  applyLanguage(requestedLanguage());
})();
