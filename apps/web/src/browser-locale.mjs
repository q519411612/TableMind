import { resolveLocale } from "./i18n.mjs";

const STORAGE_KEY = "tablemind.locale";

export function readBrowserLocale() {
  const searchLocale = new URL(globalThis.location.href).searchParams.get("lang");
  if (searchLocale) {
    return resolveLocale(searchLocale);
  }

  return resolveLocale(globalThis.localStorage?.getItem(STORAGE_KEY) ?? "");
}

export function storeBrowserLocale(locale) {
  const nextLocale = resolveLocale(locale);
  globalThis.localStorage?.setItem(STORAGE_KEY, nextLocale);
  globalThis.document.documentElement.lang = nextLocale;

  const url = new URL(globalThis.location.href);
  url.searchParams.set("lang", nextLocale);
  globalThis.history.replaceState(null, "", url);
  return nextLocale;
}
