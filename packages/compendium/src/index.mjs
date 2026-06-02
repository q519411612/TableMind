import { readFile } from "node:fs/promises";

export const entryTypes = [
  "rule",
  "condition",
  "action",
  "spell",
  "monster",
  "item",
  "class",
];

export const allowedEmbeddedContentClasses = [
  "embedded_srd",
  "embedded_original",
];

export function validateContentSource(source) {
  if (!source || typeof source !== "object") {
    throw new Error("Content source is required");
  }

  for (const key of ["id", "title", "contentClass", "visibility"]) {
    requireString(source, key);
  }

  if (
    source.visibility === "public" &&
    source.contentClass === "unknown"
  ) {
    throw new Error("Unknown public content is not allowed");
  }

  if (allowedEmbeddedContentClasses.includes(source.contentClass)) {
    requireString(source, "license");
    requireString(source, "attribution");
  }

  if (
    source.contentClass === "user_private_upload" &&
    source.visibility === "public"
  ) {
    throw new Error("Private uploads cannot be public");
  }

  return source;
}

export function validateCompendiumEntry(entry) {
  if (!entry || typeof entry !== "object") {
    throw new Error("Compendium entry is required");
  }

  for (const key of ["id", "type", "name", "normalizedName", "rawText"]) {
    requireString(entry, key);
  }

  if (!entryTypes.includes(entry.type)) {
    throw new Error(`Unsupported compendium entry type: ${entry.type}`);
  }

  if (!Array.isArray(entry.sectionPath) || entry.sectionPath.length === 0) {
    throw new Error("sectionPath is required");
  }

  if (!Array.isArray(entry.tags)) {
    throw new Error("tags is required");
  }

  validateContentSource(entry.source);
  return entry;
}

export async function loadCompendiumFixture(path) {
  const fixture = JSON.parse(await readFile(path, "utf8"));

  if (!Array.isArray(fixture.entries)) {
    throw new Error("Compendium fixture requires entries");
  }

  const entries = fixture.entries.map((entry) => {
    validateCompendiumEntry(entry);

    if (!allowedEmbeddedContentClasses.includes(entry.source.contentClass)) {
      throw new Error(`Disallowed embedded content class: ${entry.source.contentClass}`);
    }

    return entry;
  });

  return entries;
}

export function searchCompendium(entries, query) {
  requireString(query, "query");
  const terms = normalize(query.query).split(" ").filter(Boolean);
  const limit = query.limit ?? 10;

  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`Invalid search limit: ${limit}`);
  }

  return entries
    .filter((entry) => !query.types || query.types.includes(entry.type))
    .map((entry) => scoreEntry(entry, terms))
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.entry.id.localeCompare(right.entry.id);
    })
    .slice(0, limit);
}

export function formatAttribution(entry) {
  validateCompendiumEntry(entry);
  return `${entry.source.title} (${entry.source.license}): ${entry.source.attribution}`;
}

function scoreEntry(entry, terms) {
  const fields = [
    ["name", normalize(entry.name), 10],
    ["summary", normalize(entry.summary ?? ""), 5],
    ["rawText", normalize(entry.rawText), 2],
    ["tags", normalize(entry.tags.join(" ")), 3],
  ];

  let score = 0;
  let matchReason;

  for (const term of terms) {
    for (const [field, text, weight] of fields) {
      if (text.includes(term)) {
        score += weight;
        matchReason ??= field;
      }
    }
  }

  return {
    entry,
    score,
    matchReason,
  };
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function requireString(object, key) {
  if (typeof object?.[key] !== "string" || object[key].length === 0) {
    throw new Error(`${key} is required`);
  }
}
