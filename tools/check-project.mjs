import {readdir, readFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {assertNoSecrets, releaseInfo} from "./verify-release.mjs";

// Generated/private directories are not source inputs. CI starts from a clean checkout.
const excluded = new Set([".git", "node_modules", "release", "validation", "coverage", ".codex", ".agents"]);
let sources = 0, scripts = 0, json = 0;
async function check(directory = ".") {
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (excluded.has(entry.name)) continue;
    const file = directory + "/" + entry.name;
    if (entry.isDirectory()) {await check(file); continue;}
    if (!entry.isFile()) throw new Error("Source must be a regular file: " + file);
    const text = await readFile(file, "utf8");
    assertNoSecrets(text, file);
    if (/\.m?js$/.test(file)) {
      execFileSync(process.execPath, ["--check", file], {stdio: "inherit"}); scripts++;
    }
    if (file.endsWith(".json")) {JSON.parse(text); json++;}
    sources++;
  }
}
await check();
await releaseInfo();
console.log("Source checks passed: " + sources + " files; " + scripts + " JS/MJS; " + json + " JSON; metadata and secret patterns.");
