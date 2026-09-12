import {readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {crc32} from "node:zlib";
import assert from "node:assert/strict";
import {releaseFiles, validateManifest} from "./build-release.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
export function assertNoSecrets(text, filename) {
  if (/https:\/\/[^\s"'<>]*discord[^\s"'<>]*\/webhooks\/\d{17,20}\/[A-Za-z0-9_-]{20,}/.test(text)
    || /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text)) {
    throw new Error("Secret pattern detected in " + filename + "; value withheld.");
  }
}

export async function releaseInfo() {
  const manifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));
  const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  validateManifest(manifest, pkg);
  const changelog = await readFile(path.join(root, "CHANGELOG.md"), "utf8");
  assert.ok(changelog.split(/\r?\n/).some(line => line === "## " + manifest.version
    || line.startsWith("## " + manifest.version + " – ")), "Changelog must contain the current version heading");
  return {version: manifest.version, tag: "v" + manifest.version};
}

export async function verifyRelease(directory = path.join(root, "release")) {
  await releaseInfo();
  assert.deepEqual((await readdir(directory)).sort(), ["foundry-world-status.zip", "module.json"]);
  const manifest = await readFile(path.join(root, "module.json"));
  assert.deepEqual(await readFile(path.join(directory, "module.json")), manifest);
  const zip = await readFile(path.join(directory, "foundry-world-status.zip"));
  assertNoSecrets(zip.toString("utf8"), "release ZIP");
  const end = zip.length - 22;
  assert.ok(end >= 0);
  assert.equal(zip.readUInt32LE(end), 0x06054b50);
  assert.equal(zip.readUInt16LE(end + 10), releaseFiles.length);
  let position = zip.readUInt32LE(end + 16);
  assert.equal(position + zip.readUInt32LE(end + 12), end);
  const names = [];
  for (let i = 0; i < releaseFiles.length; i++) {
    assert.equal(zip.readUInt32LE(position), 0x02014b50);
    assert.equal(zip.readUInt16LE(position + 10), 0);
    const length = zip.readUInt32LE(position + 24);
    const nameLength = zip.readUInt16LE(position + 28);
    const name = zip.subarray(position + 46, position + 46 + nameLength).toString();
    assert.equal(name, releaseFiles[i], "Unexpected or missing ZIP entry");
    names.push(name);
    const local = zip.readUInt32LE(position + 42);
    assert.equal(zip.readUInt32LE(local), 0x04034b50);
    assert.equal(zip.readUInt16LE(local + 8), 0);
    const localNameLength = zip.readUInt16LE(local + 26);
    assert.equal(zip.subarray(local + 30, local + 30 + localNameLength).toString(), name);
    const start = local + 30 + localNameLength + zip.readUInt16LE(local + 28);
    const data = zip.subarray(start, start + length);
    assert.equal(data.length, length);
    assert.equal(crc32(data), zip.readUInt32LE(position + 16));
    assert.equal(crc32(data), zip.readUInt32LE(local + 14));
    assert.deepEqual(data, await readFile(path.join(root, name)));
    position += 46 + nameLength + zip.readUInt16LE(position + 30) + zip.readUInt16LE(position + 32);
  }
  assert.deepEqual(names, releaseFiles);
  assert.ok(names.includes("module.json"));
  assert.equal(position, end);
  return names;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await verifyRelease();
  console.log("Release artifacts verified: " + files.length + " files, root manifest, exact contents, no secret patterns. Nothing published.");
}
