import { readBrowserLocale, storeBrowserLocale } from "./browser-locale.mjs";
import { renderLanguageSwitcher, uiText } from "./i18n.mjs";

const appState = {
  locale: readBrowserLocale(),
};

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button?.dataset.action !== "set-language") {
    return;
  }

  appState.locale = storeBrowserLocale(button.dataset.locale);
  render();
});

render();

function render() {
  const labels = uiText(appState.locale);
  document.documentElement.lang = appState.locale;
  document.querySelector("[data-language-switcher]").innerHTML =
    renderLanguageSwitcher(appState.locale);

  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = labels[node.dataset.i18n];
  }

  for (const link of document.querySelectorAll("[data-locale-link]")) {
    const url = new URL(link.getAttribute("href"), globalThis.location.href);
    url.searchParams.set("lang", appState.locale);
    link.setAttribute("href", `${url.pathname}${url.search}`);
  }
}
