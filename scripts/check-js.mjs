import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const roots = ["scripts", "packages", "apps", "tests"];

async function collectJavaScriptFiles(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childPath = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJavaScriptFiles(childPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".mjs")) {
      files.push(childPath);
    }
  }

  return files;
}

async function checkFile(path) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--check", path], {
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Syntax check failed: ${path}`));
    });
  });
}

const files = [];
for (const root of roots) {
  files.push(...(await collectJavaScriptFiles(root)));
}

for (const file of files) {
  await checkFile(file);
}

console.log(`Checked ${files.length} JavaScript files.`);
