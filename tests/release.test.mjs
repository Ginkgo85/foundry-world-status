import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile, readdir, access, mkdtemp} from "node:fs/promises";
import os from "node:os";
import {buildRelease, validateManifest} from "../tools/build-release.mjs";
import path from "node:path";
import {verifyRelease} from "../tools/verify-release.mjs";

const root = path.resolve(".");
const manifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const repo = "https://github.com/Ginkgo85/foundry-world-status";

test("release version, author, exact description and supported Foundry build are consistent", () => {
  assert.equal(pkg.version, manifest.version);
  assert.equal(manifest.authors[0].name, "Ginkgo85"); assert.equal(manifest.authors[0].url, repo);
  assert.equal(manifest.description, "Den Status der aktiven Foundry-Spielwelt per Discord-Webhook als ONLINE oder OFFLINE ankündigen. Nur für Spielleiter.");
  assert.deepEqual(manifest.compatibility, {minimum:"14.367", verified:"14.368", maximum:"14"});
});

test("installation URLs use the current repository and planned release without assuming asset availability", () => {
  assert.equal(manifest.url, repo); assert.equal(manifest.bugs, `${repo}/issues`);
  assert.equal(manifest.manifest, `${repo}/releases/latest/download/module.json`);
  assert.equal(manifest.download, `${repo}/releases/download/v${manifest.version}/foundry-world-status.zip`);
  for (const url of [manifest.url, manifest.bugs, manifest.manifest, manifest.download]) {
    assert.equal(new URL(url).protocol, "https:"); assert.doesNotMatch(url, /PLACEHOLDER|YOUR_|USERNAME/);
  }
});

test("MIT license exists and is referenced by both manifest and developer package", async () => {
  assert.equal(manifest.license, "LICENSE"); assert.equal(pkg.license, "MIT");
  const license = await readFile(path.join(root, manifest.license), "utf8");
  assert.match(license, /^MIT License/); assert.match(license, /Copyright \(c\) 2026 Frank/);
  assert.match(license, /Permission is hereby granted/); assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
});

test("publication documentation describes manual ONLINE and a ZIP-root manifest", async () => {
  const readme = await readFile(path.join(root, "README.md"), "utf8");
  assert.ok(readme.includes(`**${manifest.version}**`));
  assert.ok(readme.includes(manifest.manifest));
  assert.ok(readme.includes(manifest.download));
  assert.match(readme, /ONLINE wird bewusst per GM-Klick/); assert.match(readme, /keine automatische Erreichbarkeitsprüfung/);
  assert.match(readme, /Data\/modules\/foundry-world-status/);
  assert.match(readme, /module\.json.*ZIP-Root/);
  const changelog = await readFile(path.join(root, "CHANGELOG.md"), "utf8");
  assert.match(changelog, /## 1\.0\.0/); assert.ok(changelog.includes("## " + manifest.version));
});

test("gitignore covers generated assets, dependencies, private data and credentials", async () => {
  const rules = await readFile(path.join(root, ".gitignore"), "utf8");
  for (const rule of ["/release/", "*.zip", "node_modules/", ".env", "/backups/", "/Data/", "/Config/", "/validation/", "*.har"]) assert.ok(rules.split(/\r?\n/).includes(rule));
});

test("all runtime references and declared license/readme resolve", async () => {
  for (const file of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(l => l.path), manifest.license, manifest.readme]) await access(path.join(root, file));
  for (const file of await readdir(path.join(root, "scripts"))) {
    const source = await readFile(path.join(root, "scripts", file), "utf8");
    for (const match of source.matchAll(/from "(\.[^"]+)"/g)) await access(path.resolve(root, "scripts", match[1]));
  }
});

test("runtime source ships no embedded Discord webhook token or personal installation path", async () => {
  for (const dir of ["scripts", "lang", "templates", "styles", "icons"]) {
    for (const file of await readdir(path.join(root, dir))) {
      const source = await readFile(path.join(root, dir, file), "utf8");
      assert.equal(/https:\/\/[^\s"']*discord[^\s"']*\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{20,}/.test(source), false, `Remove embedded credentials from ${dir}/${file}`);
      assert.doesNotMatch(source, /[A-Z]:[\\/]Users[\\/]/i);
    }
  }
});

test("release build is byte reproducible and includes no developer files", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "fws-zip-test-"));
  const first = await buildRelease(output);
  const second = await buildRelease(output);
  assert.deepEqual(first.zip, second.zip);
  assert.ok(first.files.includes("module.json"));
  assert.ok(first.files.includes("scripts/shutdown.js"));
  assert.ok(first.files.every(file => !/tests|tools|node_modules|validation|\.github/i.test(file)));
  assert.equal(await readFile(path.join(output, "module.json"), "utf8"),
    await readFile(path.join(root, "module.json"), "utf8"));
});

test("release validation rejects inconsistent versions, tags and future download URLs", () => {
  assert.throws(() => validateManifest({...manifest, version: "9.0.0"}, pkg));
  assert.throws(() => validateManifest({...manifest, version: "01.1.0"}, {...pkg, version: "01.1.0"}));
  assert.throws(() => validateManifest({...manifest, manifest: undefined}, pkg));
  assert.throws(() => validateManifest({...manifest, download: undefined}, pkg));
  assert.throws(() => validateManifest({...manifest, download: "https://example.invalid/archive.zip"}, pkg));
  assert.doesNotThrow(() => validateManifest(manifest, pkg));
});

test("ZIP directory entries match source bytes and checksums", async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), "fws-content-test-"));
  await buildRelease(output);
  const files = await verifyRelease(output);
  assert.equal(files.length, 14);
});

test("only real German localization is declared", () => {
  assert.deepEqual(manifest.languages, [{lang: "de", name: "Deutsch", path: "lang/de.json"}]);
});

test("README local links and images resolve in the repository and ZIP", async () => {
  const source = await readFile(path.join(root, "README.md"), "utf8");
  const files = (await buildRelease(await mkdtemp(path.join(os.tmpdir(), "fws-links-")))).files;
  for (const match of source.matchAll(/\]\(([^)]+)\)|src="([^"]+)"/g)) {
    const target = match[1] ?? match[2];
    if (/^(https?:|#)/.test(target)) continue;
    await access(path.join(root, target));
    assert.ok(files.includes(target), "README link must also resolve inside the runtime ZIP");
  }
  for (const doc of ["VALIDIERUNG.md", "CONTRIBUTING.md"]) await access(path.join(root, doc));
});
