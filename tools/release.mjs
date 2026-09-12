import {execFileSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {releaseInfo, verifyRelease} from "./verify-release.mjs";

const repository = "Ginkgo85/foundry-world-status";
const run = (command, args) => execFileSync(command, args, {encoding: "utf8", stdio: ["ignore", "pipe", "pipe"]}).trim();

export function assertMain(env, head) {
  if (env.GITHUB_ACTIONS !== "true" || env.GITHUB_REF !== "refs/heads/main"
    || env.GITHUB_REPOSITORY !== repository || !/^[0-9a-f]{40}$/.test(env.GITHUB_SHA ?? "")
    || head !== env.GITHUB_SHA) {
    throw new Error("Release requires the checked-out main commit of " + repository + " in GitHub Actions.");
  }
}

async function api(route, {method = "GET", body} = {}) {
  const response = await fetch("https://api.github.com/repos/" + repository + "/" + route, {
    method,
    headers: {Authorization: "Bearer " + process.env.GH_TOKEN, Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json"},
    ...(body ? {body: JSON.stringify(body)} : {})
  });
  return {status: response.status, data: await response.json()};
}

// Only the external boundaries are injectable, so guards can be tested without publishing.
export async function release({publish = false, env = process.env, command = run,
  request = api, info = releaseInfo, verify = verifyRelease} = {}) {
  assertMain(env, command("git", ["rev-parse", "HEAD"]));
  if (!env.GH_TOKEN) throw new Error("The workflow's automatic GitHub token is missing.");
  const {tag} = await info();
  await verify();
  const main = await request("branches/main");
  if (main.status !== 200 || main.data.commit?.sha !== env.GITHUB_SHA) {
    throw new Error("main changed or cannot be verified. Start a new workflow on main.");
  }
  for (const route of ["git/ref/tags/" + tag, "releases/tags/" + tag]) {
    const result = await request(route);
    if (result.status === 200) throw new Error(tag + " already exists. Use a new version; nothing will be replaced.");
    if (result.status !== 404) throw new Error("Cannot verify tag/release availability (HTTP " + result.status + ").");
  }
  if (!publish) return tag;
  // Atomic ref creation fails if somebody created this tag since the checks. Never force/update.
  const created = await request("git/refs", {method: "POST", body: {ref: "refs/tags/" + tag, sha: env.GITHUB_SHA}});
  if (created.status !== 201 || created.data.object?.sha !== env.GITHUB_SHA) {
    throw new Error("Tag creation was not confirmed. No release upload attempted.");
  }
  command("gh", ["release", "create", tag, "release/module.json", "release/foundry-world-status.zip",
    "--repo", repository, "--verify-tag", "--target", env.GITHUB_SHA, "--title", tag, "--generate-notes"]);
  return tag;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const publish = process.argv[2] === "--publish";
    if (process.argv[2] && !publish) throw new Error("Unknown option.");
    const tag = await release({publish});
    console.log(publish ? "Release created: " + tag : "Remote checks passed for " + tag + ". Nothing published.");
  } catch (error) {
    // Child-process stderr may include credentials; never echo the raw CLI error object.
    console.error(error.status !== undefined || error.code ? "Release command failed. Existing tags/assets remain untouched." : error.message);
    process.exitCode = 1;
  }
}
