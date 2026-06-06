const riskOrder = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function checkSpoilers(input) {
  if (!["player", "host", "system"].includes(input.viewerRole)) {
    throw new Error(`Unsupported viewerRole: ${input.viewerRole}`);
  }

  if (input.viewerRole !== "player") {
    return {
      allowed: true,
      riskLevel: "none",
      findings: [],
    };
  }

  requireString(input, "publicMessage");
  const normalizedMessage = normalize(input.publicMessage);
  const findings = [
    ...secretFindings(normalizedMessage, input.dmOnlySecrets ?? []),
    ...hiddenEntityFindings(normalizedMessage, input.hiddenEntities ?? []),
    ...clueFindings(normalizedMessage, input.unrevealedClues ?? []),
  ];
  const riskLevel = findings.reduce(
    (current, finding) =>
      riskOrder[finding.riskLevel] > riskOrder[current]
        ? finding.riskLevel
        : current,
    "none",
  );

  return {
    allowed: riskLevel === "none" || riskLevel === "low",
    riskLevel,
    findings: findings.map(({ riskLevel: _riskLevel, ...finding }) => finding),
  };
}

function secretFindings(normalizedMessage, secrets) {
  const findings = [];
  for (const secret of secrets) {
    const candidates = [
      { text: secret.text, reason: "DM-only secret text appeared in public output." },
      { text: secret.title, reason: "DM-only secret title appeared in public output." },
      ...(secret.aliases ?? []).map((alias) => ({
        text: alias,
        reason: "DM-only secret alias appeared in public output.",
      })),
    ];
    for (const candidate of candidates) {
      if (containsCandidate(normalizedMessage, candidate.text)) {
        findings.push({
          entityId: secret.id,
          entityType: "secret",
          reason: candidate.reason,
          matchedText: candidate.text,
          riskLevel: "high",
        });
      }
    }
  }
  return findings;
}

function hiddenEntityFindings(normalizedMessage, entities) {
  const findings = [];
  for (const entity of entities) {
    const candidates = [
      ...(entity.aliases ?? []),
      ...(entity.visibility === "dm_only" ? [entity.title, entity.name] : []),
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (containsCandidate(normalizedMessage, candidate)) {
        findings.push({
          entityId: entity.id,
          entityType: entity.entityType,
          reason: "Hidden entity name or alias appeared in public output.",
          matchedText: candidate,
          riskLevel: "high",
        });
      }
    }
  }
  return findings;
}

function clueFindings(normalizedMessage, clues) {
  const findings = [];
  for (const clue of clues) {
    const candidates = [
      { text: clue.title, reason: "Unrevealed clue title appeared in public output." },
      { text: clue.text, reason: "Unrevealed clue text appeared in public output." },
      ...(clue.aliases ?? []).map((alias) => ({
        text: alias,
        reason: "Unrevealed clue alias appeared in public output.",
      })),
    ];
    for (const candidate of candidates) {
      if (containsCandidate(normalizedMessage, candidate.text)) {
        findings.push({
          entityId: clue.id,
          entityType: "clue",
          reason: candidate.reason,
          matchedText: candidate.text,
          riskLevel: "medium",
        });
      }
    }
  }
  return findings;
}

function containsCandidate(normalizedMessage, candidate) {
  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    return false;
  }
  return normalizedMessage.includes(normalize(candidate));
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function requireString(object, key) {
  if (typeof object?.[key] !== "string" || object[key].length === 0) {
    throw new Error(`${key} is required`);
  }
}
