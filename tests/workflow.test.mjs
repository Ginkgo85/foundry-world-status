import {test} from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, readFile, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {release, assertMain} from "../tools/release.mjs";
import {verifyRelease, assertNoSecrets, releaseInfo} from "../tools/verify-release.mjs";
import {buildRelease, validateManifest} from "../tools/build-release.mjs";

const sha = "a".repeat(40);
function fixture() {
  const calls = [];
  return {
    calls,
    env: {GITHUB_ACTIONS: "true", GITHUB_REF: "refs/heads/main",
      GITHUB_REPOSITORY: "Ginkgo85/foundry-world-status", GITHUB_SHA: sha, GH_TOKEN: "synthetic"},
    command: (name, args) => {calls.push({name, args}); return name === "git" ? sha : "";},
    request: async (route, options) => {
      calls.push({route, options});
      if (route === "branches/main") return {status: 200, data: {commit: {sha}}};
      if (route === "git/refs") return {status: 201, data: {object: {sha}}};
      return {status: 404, data: {}};
    },
    info: async () => ({version: "1.1.0", tag: "v1.1.0"}),
    verify: async () => {}
  };
}
const mutations = f => f.calls.filter(c => c.options?.method === "POST" || c.name === "gh");

test("release refuses non-main, wrong repository, non-Actions and mismatched checkout", () => {
  const f = fixture();
  for (const overrides of [{GITHUB_REF: "refs/heads/feature"}, {GITHUB_REF: "refs/tags/v1.1.0"},
    {GITHUB_REPOSITORY: "other/repo"}, {GITHUB_ACTIONS: "false"}, {GITHUB_SHA: "bad"}]) {
    assert.throws(() => assertMain({...f.env, ...overrides}, sha));
  }
  assert.throws(() => assertMain(f.env, "b".repeat(40)));
  assert.doesNotThrow(() => assertMain(f.env, sha));
});

test("dry run checks current main and availability without creating anything", async () => {
  const f = fixture();
  assert.equal(await release(f), "v1.1.0");
  assert.equal(mutations(f).length, 0);
  assert.ok(f.calls.some(c => c.route === "releases/tags/v1.1.0"));
});

test("release creates the tag atomically at checked SHA and uploads exactly two assets", async () => {
  const f = fixture();
  await release({...f, publish: true});
  const [tag, upload] = mutations(f);
  assert.deepEqual(tag.options, {method: "POST", body: {ref: "refs/tags/v1.1.0", sha}});
  assert.deepEqual(upload.args, ["release", "create", "v1.1.0", "release/module.json",
    "release/foundry-world-status.zip", "--repo", "Ginkgo85/foundry-world-status",
    "--verify-tag", "--target", sha, "--title", "v1.1.0", "--generate-notes"]);
});

for (const target of ["git/ref/tags/v1.1.0", "releases/tags/v1.1.0"]) {
  test("existing " + target + " aborts without mutations", async () => {
    const f = fixture(), normal = f.request;
    f.request = (route, options) => route === target ? {status: 200, data: {}} : normal(route, options);
    await assert.rejects(release({...f, publish: true}), /already exists/);
    assert.equal(mutations(f).length, 0);
  });
}

test("permission/network uncertainty is not mistaken for an absent tag", async () => {
  const f = fixture(), normal = f.request;
  f.request = (route, options) => route.startsWith("git/ref/") ? {status: 403, data: {}} : normal(route, options);
  await assert.rejects(release({...f, publish: true}), /Cannot verify/);
  assert.equal(mutations(f).length, 0);
});

test("main advancing after dispatch prevents release of an old revision", async () => {
  const f = fixture();
  f.request = async () => ({status: 200, data: {commit: {sha: "b".repeat(40)}}});
  await assert.rejects(release({...f, publish: true}), /main changed/);
  assert.equal(mutations(f).length, 0);
});

test("racing tag creation fails closed without release upload", async () => {
  const f = fixture(), normal = f.request;
  f.request = (route, options) => route === "git/refs" ? {status: 422, data: {}} : normal(route, options);
  await assert.rejects(release({...f, publish: true}), /Tag creation/);
  assert.equal(f.calls.some(c => c.name === "gh"), false);
});

test("failed artifact verification prevents tag and release creation", async () => {
  const f = fixture();
  f.verify = async () => {throw new Error("Invalid ZIP");};
  await assert.rejects(release({...f, publish: true}), /Invalid ZIP/);
  assert.equal(mutations(f).length, 0);
});

test("current version is read without a second releaseTag setting", async () => {
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const manifest = JSON.parse(await readFile("module.json", "utf8"));
  assert.equal(pkg.config?.releaseTag, undefined);
  assert.deepEqual(await releaseInfo(), {version: manifest.version, tag: "v" + manifest.version});
  for (const version of ["01.1.0", "1.1", "1.1.0-beta.1", "1.1.0+build", "not-a-version"]) {
    assert.throws(() => validateManifest({...manifest, version}, {...pkg, version}));
  }
  assert.throws(() => validateManifest(manifest, {...pkg, version: "9.9.9"}));
});

test("artifact validation rejects wrong manifest, extra files and corrupted ZIP", async () => {
  for (const corruption of ["manifest", "extra", "zip"]) {
    const output = await mkdtemp(path.join(os.tmpdir(), "fws-invalid-"));
    await buildRelease(output);
    if (corruption === "manifest") await writeFile(path.join(output, "module.json"), "{}");
    else if (corruption === "extra") await writeFile(path.join(output, "unwanted.txt"), "extra");
    else {
      const file = path.join(output, "foundry-world-status.zip");
      const zip = await readFile(file); zip[100] ^= 1; await writeFile(file, zip);
    }
    await assert.rejects(verifyRelease(output));
  }
});

test("known secret patterns fail without exposing the matched value", () => {
  const samples = [
    "https://discord.com/api/webhooks/" + "1".repeat(18) + "/" + "synthetic_".repeat(4),
    "gh" + "p_" + "x".repeat(36),
    "-----BEGIN " + "PRIVATE KEY-----"
  ];
  for (const sample of samples) assert.throws(() => assertNoSecrets(sample, "fixture"), error => {
    assert.equal(error.message.includes(sample), false); return true;
  });
});

test("workflow release is manual only, main-gated and publishes only after successful checks", async () => {
  const source = await readFile(".github/workflows/release.yml", "utf8");
  assert.match(source, /on:\r?\n  workflow_dispatch:/);
  assert.doesNotMatch(source.split("permissions:")[0], /^\s+(push|pull_request|release|schedule):/m);
  assert.match(source, /GITHUB_REF.*refs\/heads\/main/);
  assert.match(source, /ref: \$\{\{ github.sha \}\}/);
  assert.match(source, /contents: write/);
  assert.match(source, /cancel-in-progress: false/);
  const commands = [...source.matchAll(/^\s+run: (.+)$/gm)].map(match => match[1]).filter(value => value !== "|");
  assert.deepEqual(commands, ["npm test", "npm run build:release", "npm run test:release", "node tools/release.mjs --publish"]);
  assert.doesNotMatch(source, /continue-on-error|always\(\)|if:.*failure|write-all|allowUpdates|--clobber/);
  const ci = await readFile(".github/workflows/ci.yml", "utf8");
  assert.match(ci, /contents: read/);
  assert.doesNotMatch(ci, /--publish|contents: write/);
});
