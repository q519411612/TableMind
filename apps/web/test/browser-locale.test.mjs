import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  readBrowserLocale,
  storeBrowserLocale,
} from "../src/browser-locale.mjs";

const originalGlobals = {
  document: globalThis.document,
  history: globalThis.history,
  localStorage: globalThis.localStorage,
  location: globalThis.location,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalGlobals)) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value,
    });
  }
});

test("browser locale reads URL lang before localStorage", () => {
  installBrowserLocaleHarness({
    href: "http://localhost:4173/player.html?roomId=room_0001&lang=zh-CN",
    storedLocale: "en",
  });

  assert.equal(readBrowserLocale(), "zh-CN");
});

test("browser locale stores language in localStorage, document lang, and URL", () => {
  const harness = installBrowserLocaleHarness({
    href: "http://localhost:4173/host.html?roomId=room_0001",
    storedLocale: "en",
  });

  assert.equal(storeBrowserLocale("zh-CN"), "zh-CN");
  assert.equal(harness.storage.get("tablemind.locale"), "zh-CN");
  assert.equal(globalThis.document.documentElement.lang, "zh-CN");
  assert.equal(
    harness.replacedUrl,
    "http://localhost:4173/host.html?roomId=room_0001&lang=zh-CN",
  );
});

function installBrowserLocaleHarness(input) {
  const storage = new Map([["tablemind.locale", input.storedLocale]]);
  const harness = {
    replacedUrl: undefined,
    storage,
  };

  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: {
      href: input.href,
    },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
      },
    },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      documentElement: {
        lang: "",
      },
    },
  });
  Object.defineProperty(globalThis, "history", {
    configurable: true,
    value: {
      replaceState(_state, _title, url) {
        harness.replacedUrl = new URL(url, input.href).href;
      },
    },
  });

  return harness;
}
