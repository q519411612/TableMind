import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const roots = process.argv.slice(2);

async function collectTests(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const tests = [];

  for (const entry of entries) {
    const childPath = join(path, entry.name);
    if (entry.isDirectory()) {
      tests.push(...(await collectTests(childPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".test.mjs")) {
      tests.push(childPath);
    }
  }

  return tests;
}

async function main() {
  if (roots.includes("--list")) {
    console.log("Repository scripts are available.");
    return;
  }

  const targets = roots.length > 0 ? roots : ["packages", "apps", "tests"];
  const testFiles = [];

  for (const target of targets) {
    if (target.endsWith(".test.mjs")) {
      testFiles.push(target);
      continue;
    }

    testFiles.push(...(await collectTests(target)));
  }

  if (testFiles.length === 0) {
    throw new Error(`No test files found for: ${targets.join(", ")}`);
  }

  const child = spawn(process.execPath, ["--test", ...testFiles], {
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
