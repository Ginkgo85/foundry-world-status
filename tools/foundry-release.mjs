import {readFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {assertMain} from "./release.mjs";

const repository = "Ginkgo85/foundry-world-status";
const github = "https://github.com/" + repository;
const endpoint = "https://foundryvtt.com/_api/packages/release_version/";
const root = fileURLToPath(new URL("../", import.meta.url));

function releaseData(manifest) {
  if (manifest?.id !== "foundry-world-status"
    || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(manifest.version ?? "")
    || typeof manifest.compatibility?.minimum !== "string" || !manifest.compatibility.minimum
    || typeof manifest.compatibility?.verified !== "string" || !manifest.compatibility.verified
    || (manifest.compatibility.maximum !== undefined && typeof manifest.compatibility.maximum !== "string")) {
    throw new Error("Invalid package identity, version or compatibility.");
  }
  const tag = "v" + manifest.version;
  const download = github + "/releases/download/" + tag + "/";
  if (manifest.download !== download + "foundry-world-status.zip") {
    throw new Error("Package download does not match the versioned GitHub release.");
  }
  return {tag, manifest: download + "module.json", notes: github + "/releases/tag/" + tag};
}

async function jsonRequest(fetchImpl, url, options, label) {
  try {
    const response = await fetchImpl(url, {...options, signal: AbortSignal.timeout(30000)});
    const data = await response.json();
    return {status: response.status, data};
  } catch {
    // Never print raw network errors, response bodies or credentials.
    throw new Error(label + " request failed or returned invalid JSON. Nothing retried.");
  }
}

/** Defaults to Foundry's non-persistent dry-run. No automatic retries or GitHub writes. */
export async function submitFoundry({
  publish = false, connectionTest = false, env = process.env, fetchImpl = fetch,
  readManifest = async () => JSON.parse(await readFile(path.join(root, "module.json"), "utf8")),
  head = () => execFileSync("git", ["rev-parse", "HEAD"], {encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]}).trim()
} = {}) {
  assertMain(env, head());
  if (env.GITHUB_EVENT_NAME !== "workflow_dispatch") throw new Error("An explicitly dispatched workflow is required.");
  if (typeof publish !== "boolean") throw new Error("Publish must be an explicit boolean.");
  if (publish && env.GITHUB_WORKFLOW_REF !== repository + "/.github/workflows/release.yml@refs/heads/main") {
    throw new Error("Foundry publishing is allowed only in the Release workflow on main.");
  }
  if (typeof connectionTest !== "boolean") throw new Error("Connection test must be an explicit boolean.");
  if (connectionTest && (publish
    || env.GITHUB_WORKFLOW_REF !== repository + "/.github/workflows/foundry-test.yml@refs/heads/main"
    || !/^[1-9]\d{0,14}$/.test(env.GITHUB_RUN_ID ?? "")
    || !/^[1-9]\d{0,4}$/.test(env.GITHUB_RUN_ATTEMPT ?? ""))) {
    throw new Error("Connection probes require the test workflow, valid run identifiers and dry-run mode.");
  }
  const token = env.FOUNDRY_RELEASE_TOKEN?.trim();
  if (!token?.startsWith("fvttp_") || /\s/.test(token)) throw new Error("FOUNDRY_RELEASE_TOKEN is missing or has an invalid format.");
  const manifest = await readManifest();
  const urls = releaseData(manifest);
  const headers = {Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"};
  if (env.GH_TOKEN) headers.Authorization = "Bearer " + env.GH_TOKEN;
  const ghRead = route => jsonRequest(fetchImpl, "https://api.github.com/repos/" + repository + "/" + route,
    {headers, redirect: "error"}, "GitHub");
  const released = await ghRead("releases/tags/" + urls.tag);
  if (released.status !== 200 || released.data.tag_name !== urls.tag
    || released.data.draft !== false || released.data.prerelease !== false) {
    throw new Error("A published stable GitHub release for this version is required.");
  }
  for (const [name, url] of [["module.json", urls.manifest], ["foundry-world-status.zip", manifest.download]]) {
    if (!released.data.assets?.some(asset => asset.name === name && asset.state === "uploaded"
      && asset.browser_download_url === url)) throw new Error("The required GitHub release assets are not available.");
  }
  if (publish) {
    const tag = await ghRead("git/ref/tags/" + urls.tag);
    if (tag.status !== 200 || tag.data.object?.type !== "commit" || tag.data.object.sha !== env.GITHUB_SHA) {
      throw new Error("The released tag does not point directly to this workflow commit.");
    }
  }
  // The public download may redirect to GitHub's asset host. Never attach either token here.
  const published = await jsonRequest(fetchImpl, urls.manifest, {redirect: "follow"}, "Public manifest");
  if (published.status !== 200) throw new Error("The public versioned manifest is unavailable.");
  releaseData(published.data);
  if (published.data.id !== manifest.id || published.data.version !== manifest.version
    || published.data.download !== manifest.download
    || ["minimum", "verified", "maximum"].some(key => published.data.compatibility[key] !== manifest.compatibility[key])) {
    throw new Error("The public manifest differs from the selected package version or compatibility.");
  }
  // This identifier exists only in the non-persistent API request, never in a manifest or tag.
  // It tests authentication/validation, not a matching future release and its installation.
  const requestVersion = connectionTest
    ? "0.0.0-test." + env.GITHUB_RUN_ID + "." + env.GITHUB_RUN_ATTEMPT : manifest.version;
  const payload = {
    id: manifest.id,
    "dry-run": !publish,
    release: {version: requestVersion, manifest: urls.manifest, notes: urls.notes, compatibility: manifest.compatibility}
  };
  const result = await jsonRequest(fetchImpl, endpoint, {
    method: "POST", redirect: "error",
    headers: {"Content-Type": "application/json", Authorization: token},
    body: JSON.stringify(payload)
  }, "Foundry");
  if (result.status !== 200 || result.data?.status !== "success") {
    const errors = result.data?.errors;
    if (result.status === 400 && errors && Object.keys(errors).length === 1
      && Array.isArray(errors.__all__) && errors.__all__.length === 1
      && errors.__all__[0]?.code === "unique_together") {
      throw new Error("Foundry responded: this package version already exists. No version was created; no retry was made.");
    }
    throw new Error("Foundry did not confirm the request (HTTP " + result.status + "). Check token, package and release data; no automatic retry.");
  }
  if (!publish && !/^Dry run completed successfully\b/.test(result.data.message ?? "")) {
    throw new Error("Foundry did not explicitly confirm dry-run completion. Nothing retried.");
  }
  return {version: requestVersion, dryRun: !publish};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const option = process.argv[2] ?? "--dry-run";
    if (!["--dry-run", "--publish", "--connection-test"].includes(option) || process.argv.length > 3) throw new Error("Use --dry-run, --publish or --connection-test.");
    const result = await submitFoundry({publish: option === "--publish", connectionTest: option === "--connection-test"});
    if (option === "--connection-test") console.log("Connection/token probe only; this does not validate a future release.");
    console.log(result.dryRun
      ? "Foundry dry-run succeeded for " + result.version + ". No changes saved."
      : "Foundry confirmed publication of " + result.version + ".");
  } catch (error) {
    console.error(error.status !== undefined || error.code ? "Foundry workflow failed; details withheld to protect credentials." : error.message);
    process.exitCode = 1;
  }
}
