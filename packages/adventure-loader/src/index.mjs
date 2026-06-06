import { readFile } from "node:fs/promises";

export async function loadAdventureFixture(path) {
  const markdown = await readFile(path, "utf8");
  const result = parseAdventureMarkdown(markdown);

  if (result.errors.length > 0) {
    throw new Error(
      `Adventure fixture is invalid: ${result.errors
        .map((issue) => issue.message)
        .join("; ")}`,
    );
  }

  return result.module;
}

export function parseAdventureMarkdown(markdown) {
  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    throw new Error("Adventure markdown is required");
  }

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const title = parseTitle(lines);
  const metadata = parseKeyValueBlock(readSection(lines, "Metadata"));
  const synopsis = readSection(lines, "Synopsis").trim();
  const truth = parseNamedEntries(readSection(lines, "Truth"), "Secret").map(
    (entry) => ({
      id: requireEntryId(entry),
      title: entry.name,
      text: entry.body.trim(),
      visibility: "dm_only",
    }),
  );
  const scenes = parseScenes(lines);
  const npcs = parseNamedEntries(readAllTopLevelBlocks(lines, "NPC"), "NPC").map(
    parseNpc,
  );
  const clues = parseNamedEntries(
    readAllTopLevelBlocks(lines, "Clue"),
    "Clue",
  ).map(parseClue);
  const encounters = parseNamedEntries(
    readAllTopLevelBlocks(lines, "Encounter"),
    "Encounter",
  ).map(parseEncounter);
  const endings = parseNamedEntries(
    readAllTopLevelBlocks(lines, "Ending"),
    "Ending",
  ).map(parseEnding);

  const module = {
    id: metadata.id,
    title,
    rulesetId: metadata.rulesetId,
    recommendedLevel: metadata.recommendedLevel,
    playerCount: metadata.playerCount,
    estimatedTime: metadata.estimatedTime,
    synopsis,
    startingSceneId: metadata.startingSceneId,
    truth,
    scenes,
    locations: [],
    npcs,
    encounters,
    clues,
    treasure: [],
    endings,
    source: {
      id: "tablemind_demo_original",
      title: "TableMind Demo Fixture",
      contentClass: "embedded_original",
      license: "Original TableMind fixture content",
      attribution: "TableMind project authors",
      visibility: "public",
    },
    status: "draft",
  };

  const issues = collectValidationIssues(module);

  return {
    module,
    errors: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
  };
}

export function validateAdventureModule(module) {
  const errors = collectValidationIssues(module).filter(
    (issue) => issue.severity === "error",
  );

  if (errors.length > 0) {
    throw new Error(errors.map((issue) => issue.message).join("; "));
  }

  return module;
}

export function projectAdventureForPlayers(adventure) {
  validateAdventureModule(adventure);

  const visibleClues = adventure.clues.filter(isPlayerVisibleContent);
  const visibleNpcs = adventure.npcs.filter(isPlayerVisibleContent);
  const visibleEncounters = adventure.encounters.filter(isPlayerVisibleContent);
  const clueHandleById = publicHandleMap(visibleClues, "clue");
  const npcHandleById = publicHandleMap(visibleNpcs, "npc");
  const encounterHandleById = publicHandleMap(visibleEncounters, "encounter");

  return {
    id: adventure.id,
    title: adventure.title,
    rulesetId: adventure.rulesetId,
    recommendedLevel: adventure.recommendedLevel,
    playerCount: adventure.playerCount,
    estimatedTime: adventure.estimatedTime,
    synopsis: adventure.synopsis,
    startingSceneId: adventure.startingSceneId,
    scenes: adventure.scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      readAloud: scene.readAloud,
      clueHandles: scene.clueIds
        .filter((clueId) => clueHandleById.has(clueId))
        .map((clueId) => clueHandleById.get(clueId)),
      npcHandles: scene.npcIds
        .filter((npcId) => npcHandleById.has(npcId))
        .map((npcId) => npcHandleById.get(npcId)),
      encounter:
        scene.encounterId && encounterHandleById.has(scene.encounterId)
          ? projectEncounterForPlayer(
              visibleEncounters.find(
                (encounter) => encounter.id === scene.encounterId,
              ),
              encounterHandleById.get(scene.encounterId),
            )
          : undefined,
    })),
    npcs: visibleNpcs.map((npc) => ({
      publicHandle: npcHandleById.get(npc.id),
      name: npc.name,
      publicDescription: npc.publicDescription,
      visibility: npc.visibility,
    })),
    clues: visibleClues.map((clue) => ({
      publicHandle: clueHandleById.get(clue.id),
      title: clue.title,
      text: clue.text,
      visibility: clue.visibility,
    })),
    encounters: visibleEncounters.map((encounter) =>
      projectEncounterForPlayer(encounter, encounterHandleById.get(encounter.id)),
    ),
    endings: adventure.endings.map((ending) => ({
      id: ending.id,
      title: ending.title,
      publicText: ending.publicText,
    })),
    source: adventure.source,
    status: adventure.status,
  };
}

function isPlayerVisibleContent(entity) {
  return entity.visibility === "public" || entity.visibility === "revealed";
}

function publicHandleMap(items, prefix) {
  return new Map(
    items.map((item, index) => [item.id, `${prefix}_${index + 1}`]),
  );
}

function projectEncounterForPlayer(encounter, publicHandle) {
  return {
    publicHandle,
    title: encounter.title,
    publicSetup: encounter.publicSetup,
    visibility: encounter.visibility,
  };
}

function parseTitle(lines) {
  const titleLine = lines.find((line) => line.startsWith("# Adventure: "));
  if (!titleLine) {
    return undefined;
  }

  return titleLine.replace("# Adventure: ", "").trim();
}

function parseScenes(lines) {
  return readAllTopLevelBlocks(lines, "Scene").map((block) => {
    const entry = parseNamedBlock(block, "Scene");
    const metadata = parseKeyValueBlock(entry.beforeSubsections);
    const readAloud = readSubsection(entry.body, "Read Aloud").trim();
    const dmNotes = readSubsection(entry.body, "DM Notes").trim();
    const clueIds = parseList(readSubsection(entry.body, "Clues"));
    const npcIds = parseList(readSubsection(entry.body, "NPCs"));
    const encounterId = readSubsection(entry.body, "Encounter").trim();

    return {
      id: metadata.id,
      title: entry.name,
      readAloud: {
        text: readAloud,
        visibility: "public",
      },
      dmNotes: dmNotes
        ? {
            text: dmNotes,
            visibility: "dm_only",
          }
        : undefined,
      clueIds,
      npcIds,
      encounterId: encounterId || undefined,
    };
  });
}

function parseNpc(entry) {
  const metadata = parseKeyValueBlock(entry.beforeSubsections);
  return {
    id: requireEntryId(entry),
    name: entry.name,
    publicDescription: readSubsection(entry.body, "Public").trim(),
    dmNotes: readSubsection(entry.body, "DM Notes").trim(),
    visibility: metadata.visibility ?? "public",
  };
}

function parseClue(entry) {
  const metadata = parseKeyValueBlock(entry.beforeSubsections);
  return {
    id: requireEntryId(entry),
    title: entry.name,
    text: readSubsection(entry.body, "Text").trim(),
    aliases: parseInlineList(metadata.aliases),
    visibility: metadata.visibility ?? "dm_only",
    sourceSceneId: metadata.sourceSceneId,
  };
}

function parseEncounter(entry) {
  const metadata = parseKeyValueBlock(entry.beforeSubsections);
  return {
    id: requireEntryId(entry),
    title: entry.name,
    publicSetup: readSubsection(entry.body, "Public Setup").trim(),
    dmNotes: readSubsection(entry.body, "DM Notes").trim(),
    combatants: parseCombatants(readSubsection(entry.body, "Combatants")),
    visibility: metadata.visibility ?? "dm_only",
  };
}

function parseEnding(entry) {
  return {
    id: requireEntryId(entry),
    title: entry.name,
    publicText: readSubsection(entry.body, "Public").trim(),
    dmNotes: readSubsection(entry.body, "DM Notes").trim(),
  };
}

function parseNamedEntries(content, kind) {
  if (Array.isArray(content)) {
    return content.map((block) => parseNamedBlock(block, kind));
  }

  return splitNamedBlocks(content, kind).map((block) =>
    parseNamedBlock(block, kind),
  );
}

function parseNamedBlock(block, kind) {
  const lines = block.replace(/\n+$/g, "").split("\n");
  const heading = lines[0]?.trim();
  const prefix = `### ${kind}: `;
  const topLevelPrefix = `## ${kind}: `;

  let name;
  if (heading?.startsWith(prefix)) {
    name = heading.slice(prefix.length).trim();
  } else if (heading?.startsWith(topLevelPrefix)) {
    name = heading.slice(topLevelPrefix.length).trim();
  } else {
    throw new Error(`Expected ${kind} heading`);
  }

  const body = lines.slice(1).join("\n").trim();
  const firstSubsectionIndex = lines.findIndex(
    (line, index) => index > 0 && line.startsWith("### "),
  );
  const beforeSubsections =
    firstSubsectionIndex === -1
      ? body
      : lines.slice(1, firstSubsectionIndex).join("\n").trim();

  return {
    name,
    body,
    beforeSubsections,
  };
}

function splitNamedBlocks(content, kind) {
  const lines = content.split("\n");
  const blocks = [];
  let current = [];
  const heading = `### ${kind}: `;

  for (const line of lines) {
    if (line.startsWith(heading)) {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
      }
      current = [line];
      continue;
    }

    if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join("\n"));
  }

  return blocks;
}

function readSection(lines, sectionName) {
  const heading = `## ${sectionName}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return "";
  }

  const content = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) {
      break;
    }
    content.push(line);
  }

  return content.join("\n").trim();
}

function readAllTopLevelBlocks(lines, kind) {
  const blocks = [];
  let current = [];
  const heading = `## ${kind}: `;

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith(heading)) {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }

    if (line.startsWith(heading)) {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
      }
      current = [line];
      continue;
    }

    if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join("\n"));
  }

  return blocks;
}

function readSubsection(content, subsectionName) {
  const lines = content.split("\n");
  const heading = `### ${subsectionName}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return "";
  }

  const output = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("### ")) {
      break;
    }
    output.push(line);
  }

  return output.join("\n").trim();
}

function parseKeyValueBlock(content) {
  const values = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("### ")) {
      continue;
    }

    const match = /^([A-Za-z][A-Za-z0-9]*):\s*(.+)$/.exec(trimmed);
    if (match) {
      values[match[1]] = match[2].trim();
    }
  }

  return values;
}

function parseList(content) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function parseInlineList(value) {
  if (value === undefined) {
    return undefined;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCombatants(content) {
  return parseList(content).map((item) => {
    const match = /^([a-z0-9_]+)\s+x(\d+)$/i.exec(item);
    if (!match) {
      throw new Error(`Invalid combatant entry: ${item}`);
    }

    return {
      compendiumEntryId: match[1],
      count: Number.parseInt(match[2], 10),
    };
  });
}

function requireEntryId(entry) {
  const metadata = parseKeyValueBlock(entry.beforeSubsections);
  if (!metadata.id) {
    throw new Error(`${entry.name} requires id`);
  }
  return metadata.id;
}

function collectValidationIssues(module) {
  const issues = [];
  const sceneIds = new Set((module?.scenes ?? []).map((scene) => scene.id));
  const clueIds = new Set((module?.clues ?? []).map((clue) => clue.id));
  const npcIds = new Set((module?.npcs ?? []).map((npc) => npc.id));
  const encounterIds = new Set(
    (module?.encounters ?? []).map((encounter) => encounter.id),
  );

  for (const key of [
    "id",
    "title",
    "rulesetId",
    "synopsis",
    "startingSceneId",
    "source",
    "status",
  ]) {
    if (!module?.[key]) {
      issues.push(errorIssue(`MISSING_${key.toUpperCase()}`, `${key} is required`));
    }
  }

  if (!Array.isArray(module?.scenes) || module.scenes.length === 0) {
    issues.push(errorIssue("MISSING_SCENES", "scenes are required"));
  }

  if (!Array.isArray(module?.endings) || module.endings.length === 0) {
    issues.push(warningIssue("MISSING_ENDINGS", "endings are recommended"));
  }

  if (
    module?.startingSceneId &&
    Array.isArray(module?.scenes) &&
    !module.scenes.some((scene) => scene.id === module.startingSceneId)
  ) {
    issues.push(
      errorIssue(
        "MISSING_STARTING_SCENE",
        `startingSceneId not found: ${module.startingSceneId}`,
      ),
    );
  }

  validateSource(module?.source, issues);
  validateScenes(module?.scenes, { clueIds, npcIds, encounterIds }, issues);
  validateClues(module?.clues, { sceneIds }, issues);
  validateNpcs(module?.npcs, issues);
  validateEncounters(module?.encounters, issues);
  validateEndings(module?.endings, issues);

  return issues;
}

const visibilityValues = new Set([
  "public",
  "dm_only",
  "revealed",
  "player_specific",
]);

function validateSource(source, issues) {
  if (!source || typeof source !== "object") {
    return;
  }
  for (const key of ["id", "title", "contentClass", "license", "attribution"]) {
    if (typeof source[key] !== "string" || source[key].length === 0) {
      issues.push(errorIssue(`MISSING_SOURCE_${key.toUpperCase()}`, `source.${key} is required`));
    }
  }
}

function validateScenes(scenes, refs, issues) {
  if (!Array.isArray(scenes)) {
    return;
  }
  for (const scene of scenes) {
    for (const key of ["id", "title"]) {
      if (typeof scene?.[key] !== "string" || scene[key].length === 0) {
        issues.push(errorIssue(`MISSING_SCENE_${key.toUpperCase()}`, `scene.${key} is required`));
      }
    }
    if (!scene?.readAloud?.text) {
      issues.push(errorIssue("MISSING_SCENE_READALOUD", `scene ${scene?.id ?? "<unknown>"} readAloud.text is required`));
    }
    for (const clueId of scene?.clueIds ?? []) {
      if (!refs.clueIds.has(clueId)) {
        issues.push(errorIssue("BROKEN_SCENE_CLUE", `scene clue not found: ${clueId}`));
      }
    }
    for (const npcId of scene?.npcIds ?? []) {
      if (!refs.npcIds.has(npcId)) {
        issues.push(errorIssue("BROKEN_SCENE_NPC", `scene NPC not found: ${npcId}`));
      }
    }
    if (scene?.encounterId && !refs.encounterIds.has(scene.encounterId)) {
      issues.push(errorIssue("BROKEN_SCENE_ENCOUNTER", `scene encounter not found: ${scene.encounterId}`));
    }
  }
}

function validateClues(clues, refs, issues) {
  if (!Array.isArray(clues)) {
    return;
  }
  for (const clue of clues) {
    for (const key of ["id", "title", "text"]) {
      if (typeof clue?.[key] !== "string" || clue[key].length === 0) {
        issues.push(errorIssue(`MISSING_CLUE_${key.toUpperCase()}`, `clue.${key} is required`));
      }
    }
    validateVisibility(clue?.visibility, "clue.visibility", issues);
    if (clue?.sourceSceneId && !refs.sceneIds.has(clue.sourceSceneId)) {
      issues.push(errorIssue("BROKEN_CLUE_SCENE", `clue sourceSceneId not found: ${clue.sourceSceneId}`));
    }
  }
}

function validateNpcs(npcs, issues) {
  if (!Array.isArray(npcs)) {
    return;
  }
  for (const npc of npcs) {
    for (const key of ["id", "name", "publicDescription"]) {
      if (typeof npc?.[key] !== "string" || npc[key].length === 0) {
        issues.push(errorIssue(`MISSING_NPC_${key.toUpperCase()}`, `npc.${key} is required`));
      }
    }
    validateVisibility(npc?.visibility, "npc.visibility", issues);
  }
}

function validateEncounters(encounters, issues) {
  if (!Array.isArray(encounters)) {
    return;
  }
  for (const encounter of encounters) {
    for (const key of ["id", "title", "publicSetup"]) {
      if (typeof encounter?.[key] !== "string" || encounter[key].length === 0) {
        issues.push(errorIssue(`MISSING_ENCOUNTER_${key.toUpperCase()}`, `encounter.${key} is required`));
      }
    }
    validateVisibility(encounter?.visibility, "encounter.visibility", issues);
    if (!Array.isArray(encounter?.combatants)) {
      issues.push(errorIssue("MISSING_ENCOUNTER_COMBATANTS", "encounter.combatants is required"));
      continue;
    }
    for (const combatant of encounter.combatants) {
      if (
        typeof combatant.compendiumEntryId !== "string" ||
        combatant.compendiumEntryId.length === 0
      ) {
        issues.push(errorIssue("MISSING_ENCOUNTER_COMPENDIUM", "encounter combatant compendiumEntryId is required"));
      }
      if (!Number.isInteger(combatant.count) || combatant.count < 1) {
        issues.push(errorIssue("INVALID_ENCOUNTER_COUNT", "encounter combatant count must be positive"));
      }
    }
  }
}

function validateEndings(endings, issues) {
  if (!Array.isArray(endings)) {
    return;
  }
  for (const ending of endings) {
    for (const key of ["id", "title", "publicText"]) {
      if (typeof ending?.[key] !== "string" || ending[key].length === 0) {
        issues.push(errorIssue(`MISSING_ENDING_${key.toUpperCase()}`, `ending.${key} is required`));
      }
    }
  }
}

function validateVisibility(value, label, issues) {
  if (!visibilityValues.has(value)) {
    issues.push(errorIssue("INVALID_VISIBILITY", `${label} must be a supported visibility`));
  }
}

function errorIssue(code, message) {
  return {
    code,
    message,
    severity: "error",
  };
}

function warningIssue(code, message) {
  return {
    code,
    message,
    severity: "warning",
  };
}
