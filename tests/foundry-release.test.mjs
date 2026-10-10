import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {submitFoundry} from "../tools/foundry-release.mjs";

const repo = "Ginkgo85/foundry-world-status";
const base = "https://github.com/" + repo;
const endpoint = "https://foundryvtt.com/_api/packages/release_version/";
const sha = "a".repeat(40);
const json = (status, data) => ({status, json: async () => data});
function fixture() {
  const manifest = {
    id: "foundry-world-status", version: "1.3.2",
    download: base + "/releases/download/v1.3.2/foundry-world-status.zip",
    compatibility: {minimum: "14.367", verified: "14.368", maximum: "14"}
  };
  const released = {
    tag_name: "v1.3.2", draft: false, prerelease: false,
    assets: ["module.json", "foundry-world-status.zip"].map(name => ({
      name, state: "uploaded", browser_download_url: base + "/releases/download/v1.3.2/" + name
    }))
  };
  const f = {
    calls: [], manifest, released,
    env: {GITHUB_ACTIONS: "true", GITHUB_REF: "refs/heads/main", GITHUB_REPOSITORY: repo,
      GITHUB_SHA: sha, GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_WORKFLOW_REF: repo + "/.github/workflows/release.yml@refs/heads/main",
      FOUNDRY_RELEASE_TOKEN: "fvttp_" + "synthetic", GH_TOKEN: "synthetic-github"},
    head: () => sha, readManifest: async () => manifest,
    fetchImpl: async (url, options) => {
      f.calls.push({url, options});
      if (url === endpoint) return json(200, {status: "success",
        message: "Dry run completed successfully. To save, submit the request again without dry-run"});
      if (url.includes("/releases/tags/")) return json(200, released);
      if (url.includes("/git/ref/tags/")) return json(200, {object: {type: "commit", sha}});
      return json(200, manifest);
    }
  };
  return f;
}
const posts = f => f.calls.filter(c => c.options.method === "POST");

test("Foundry defaults to a non-persistent request using exact release URLs and compatibility", async () => {
  const f = fixture();
  f.env.GITHUB_WORKFLOW_REF = repo + "/.github/workflows/foundry-test.yml@refs/heads/main";
  assert.deepEqual(await submitFoundry(f), {version: "1.3.2", dryRun: true});
  assert.equal(posts(f).length, 1);
  const request = posts(f)[0];
  assert.equal(request.url, endpoint);
  assert.deepEqual(JSON.parse(request.options.body), {
    id: "foundry-world-status", "dry-run": true,
    release: {version: "1.3.2", manifest: base + "/releases/download/v1.3.2/module.json",
      notes: base + "/releases/tag/v1.3.2", compatibility: f.manifest.compatibility}
  });
  assert.equal(request.options.headers.Authorization, f.env.FOUNDRY_RELEASE_TOKEN);
  assert.equal(request.options.redirect, "error");
  assert.ok(request.options.signal instanceof AbortSignal);
  for (const call of f.calls.filter(c => c.url !== endpoint)) {
    assert.notEqual(call.options.headers?.Authorization, f.env.FOUNDRY_RELEASE_TOKEN);
    assert.equal(call.options.method, undefined);
  }
  const download = f.calls.find(c => c.url.endsWith("/module.json"));
  assert.equal(download.options.headers, undefined);
});

test("Foundry publishing verifies the tag SHA before submitting only the published version", async () => {
  const f = fixture();
  assert.deepEqual(await submitFoundry({...f, publish: true}), {version: "1.3.2", dryRun: false});
  assert.ok(f.calls.some(c => c.url.endsWith("/git/ref/tags/v1.3.2")));
  assert.equal(JSON.parse(posts(f)[0].options.body)["dry-run"], false);
  assert.equal(posts(f).length, 1);
});

for (const overrides of [
  {GITHUB_REF: "refs/heads/feature"}, {GITHUB_REPOSITORY: "other/repository"},
  {GITHUB_ACTIONS: "false"}, {GITHUB_EVENT_NAME: "push"}, {FOUNDRY_RELEASE_TOKEN: ""},
  {FOUNDRY_RELEASE_TOKEN: "invalid"}, {FOUNDRY_RELEASE_TOKEN: "fvttp_a\nb"}
]) test("Foundry rejects invalid context or credentials before any requests: " + Object.keys(overrides)[0], async () => {
  const f = fixture();
  await assert.rejects(submitFoundry({...f, env: {...f.env, ...overrides}}));
  assert.equal(f.calls.length, 0);
});

test("connection-test context cannot opt into publishing", async () => {
  const f = fixture();
  f.env.GITHUB_WORKFLOW_REF = repo + "/.github/workflows/foundry-test.yml@refs/heads/main";
  await assert.rejects(submitFoundry({...f, publish: true}), /only in the Release workflow/);
  assert.equal(f.calls.length, 0);
  await assert.rejects(submitFoundry({...f, publish: "true"}), /explicit boolean/);
});

for (const change of [
  f => {f.manifest.id = "different";},
  f => {f.manifest.version = "1.3.2/other";},
  f => {delete f.manifest.compatibility.verified;},
  f => {f.manifest.download = "https://example.invalid/file.zip";},
  f => {f.released.draft = true;},
  f => {f.released.prerelease = true;},
  f => {f.released.assets.pop();},
  f => {f.released.assets[0].browser_download_url = base + "/releases/latest/download/module.json";}
]) test("Foundry rejects mismatched or incomplete package data: " + change.toString(), async () => {
  const f = fixture(); change(f);
  await assert.rejects(submitFoundry(f));
  assert.equal(posts(f).length, 0);
});

for (const problem of ["missing-release", "wrong-tag", "wrong-public-manifest"]) {
  test("no Foundry request when GitHub verification fails: " + problem, async () => {
    const f = fixture(), fetchImpl = f.fetchImpl;
    f.fetchImpl = async (url, options) => {
      if (problem === "missing-release" && url.includes("/releases/tags/")) return json(404, {});
      if (problem === "wrong-tag" && url.includes("/git/ref/")) return json(200, {object: {type: "commit", sha: "b".repeat(40)}});
      if (problem === "wrong-public-manifest" && url.endsWith("/module.json")) {
        return json(200, {...f.manifest, compatibility: {...f.manifest.compatibility, verified: "99"}});
      }
      return fetchImpl(url, options);
    };
    await assert.rejects(submitFoundry({...f, publish: true}));
    assert.equal(posts(f).length, 0);
  });
}

for (const status of [400, 401, 403, 429, 500]) test("Foundry HTTP " + status + " is not success and never retries or echoes tokens", async () => {
  const f = fixture(), fetchImpl = f.fetchImpl;
  f.fetchImpl = (url, options) => {
    if (url !== endpoint) return fetchImpl(url, options);
    f.calls.push({url, options}); return json(status, {status: "error", message: f.env.FOUNDRY_RELEASE_TOKEN});
  };
  await assert.rejects(submitFoundry(f), error => error.message.includes("HTTP " + status)
    && !error.message.includes(f.env.FOUNDRY_RELEASE_TOKEN));
  assert.equal(posts(f).length, 1);
});

for (const failure of ["network", "json", "unconfirmed", "missing-dry-run", "existing-version"]) {
  test("Foundry safely reports " + failure, async () => {
    const f = fixture(), fetchImpl = f.fetchImpl;
    f.fetchImpl = (url, options) => {
      if (url !== endpoint) return fetchImpl(url, options);
      f.calls.push({url, options});
      if (failure === "network") throw new Error(f.env.FOUNDRY_RELEASE_TOKEN);
      if (failure === "json") return {status: 200, json: () => {throw new Error(f.env.FOUNDRY_RELEASE_TOKEN);}};
      if (failure === "unconfirmed") return json(200, {status: "error"});
      if (failure === "existing-version") return json(400, {status: "error", errors: {
        __all__: [{code: "unique_together", message: f.env.FOUNDRY_RELEASE_TOKEN}]
      }});
      return json(200, {status: "success"});
    };
    await assert.rejects(submitFoundry(f), error => !error.message.includes(f.env.FOUNDRY_RELEASE_TOKEN)
      && (failure !== "existing-version" || error.message.includes("already exists")));
    assert.equal(posts(f).length, 1);
  });
}

test("connection workflow has no publishing path and Foundry publication depends on release success", async () => {
  const check = await readFile(".github/workflows/foundry-test.yml", "utf8");
  assert.match(check, /on:\r?\n  workflow_dispatch:/);
  assert.match(check, /contents: read/);
  assert.match(check, /github.ref == 'refs\/heads\/main'/);
  assert.match(check, /node tools\/foundry-release.mjs --dry-run/);
  assert.doesNotMatch(check, /--publish|contents: write|build:release|inputs:|pull_request:|push:/);
  const release = await readFile(".github/workflows/release.yml", "utf8");
  const job = release.split("\n  foundry:")[1];
  assert.ok(job);
  assert.match(job, /needs: release/);
  assert.match(job, /contents: read/);
  assert.match(job, /node tools\/foundry-release.mjs --publish/);
  assert.match(job, /secrets.FOUNDRY_RELEASE_TOKEN/);
  assert.doesNotMatch(job, /always\(\)|continue-on-error|if:.*failure/);
  assert.doesNotMatch(release.split("\n  foundry:")[0], /FOUNDRY_RELEASE_TOKEN/);
});
