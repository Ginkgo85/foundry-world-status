import {readFile, writeFile, mkdir, lstat} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {crc32} from "node:zlib";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("../", import.meta.url));
export const releaseFiles = [
  "module.json", "README.md", "CHANGELOG.md", "LICENSE",
  "scripts/config.js", "scripts/discord.js", "scripts/main.js",
  "scripts/settings.js", "scripts/shutdown.js",
  "templates/settings.hbs", "styles/foundry-world-status.css",
  "icons/discord-on.svg", "icons/discord-off.svg", "lang/de.json", "lang/en.json", "scripts/localization.js"
].sort();

export function validateManifest(manifest, pkg) {
  assert.equal(manifest.id, "foundry-world-status");
  assert.equal(manifest.title, "Foundry World Status");
  // This workflow publishes stable releases only, with canonical SemVer numbers.
  assert.match(manifest.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.equal(pkg.version, manifest.version);
  // Validate the planned tag only; this does not assert that release assets exist.
  const tag = `v${manifest.version}`;
  const repo = pkg.repository.url.replace(/\.git$/, "");
  assert.equal(manifest.url, repo);
  assert.equal(manifest.authors[0].url, repo);
  assert.equal(manifest.bugs, `${repo}/issues`);
  assert.equal(manifest.manifest, `${repo}/releases/latest/download/module.json`);
  assert.equal(manifest.download,
    `${repo}/releases/download/${tag}/foundry-world-status.zip`);
}

export async function buildRelease(outputDirectory = path.join(root, "release")) {
  const manifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  validateManifest(manifest, pkg);
  const localEntries = [], directoryEntries = [];
  let offset = 0;
  for (const file of releaseFiles) {
    const source = path.join(root, file);
    assert.equal((await lstat(source)).isSymbolicLink(), false, "Release files must not be symbolic links");
    const data = await readFile(source), name = Buffer.from(file);
    assert.ok(data.length < 0xffffffff, "ZIP64 is not supported");
    if (/https:\/\/[^\s"'<>]*discord[^\s"'<>]*\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{20,}/.test(data.toString("utf8"))) {
      // Assertion errors can echo their input. Report only the filename, never the matched content.
      throw new Error(`Credential-shaped webhook URL in release input: ${file}`);
    }
    const checksum = crc32(data);
    // Standard ZIP, STORE method, fixed 1980-01-01 timestamp: identical input gives identical bytes.
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6); // UTF-8 filenames
    local.writeUInt16LE(0x21, 12); // DOS date
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localEntries.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    directoryEntries.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const directory = Buffer.concat(directoryEntries), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(releaseFiles.length, 8);
  end.writeUInt16LE(releaseFiles.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  const zip = Buffer.concat([...localEntries, directory, end]);
  await mkdir(outputDirectory, {recursive: true});
  await writeFile(path.join(outputDirectory, "foundry-world-status.zip"), zip);
  await writeFile(path.join(outputDirectory, "module.json"), await readFile(path.join(root, "module.json")));
  return {zip, files: releaseFiles};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await buildRelease();
  console.log(`Local ZIP built: release/foundry-world-status.zip (${result.files.length} files, module.json at root). Nothing uploaded.`);
}
