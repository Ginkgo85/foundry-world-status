// Optional destructive test for the disposable local world specified in VALIDIERUNG.md.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createRequire} from "node:module";
import path from "node:path";

const base = "http://127.0.0.1:39171";
const moduleId = "foundry-world-status";
const fakeHook = "https://discord.com/api/webhooks/" + "9".repeat(18) + "/" + "q".repeat(32);
if (!process.env.NODE_DEPENDENCIES) throw new Error("Set NODE_DEPENDENCIES to the directory containing Playwright.");
const require = createRequire(path.join(process.env.NODE_DEPENDENCIES, "package.json"));
const {chromium} = require("playwright");

const deliveries = [];
const shutdownPosts = [];
let acceptDelivery = false;
const receiver = createServer(async (request, response) => {
  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const form = await new Response(Buffer.concat(chunks), {headers: request.headers}).formData();
    const {embeds} = JSON.parse(form.get("payload_json"));
    deliveries.push({title: embeds[0].title, accepted: acceptDelivery});
    response.writeHead(acceptDelivery ? 200 : 403, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"});
    response.end(JSON.stringify(acceptDelivery ? {id: "100002"} : {}));
  } catch {
    response.writeHead(400).end();
  }
});

let browser;
try {
  await new Promise(resolve => receiver.listen(0, "127.0.0.1", resolve));
  const receiverUrl = "http://127.0.0.1:" + receiver.address().port;
  browser = await chromium.launch({channel: "chrome", args: ["--no-proxy-server", "--enable-unsafe-swiftshader", "--use-angle=swiftshader"]});
  const context = await browser.newContext({serviceWorkers: "block", viewport: {width: 1920, height: 1080}});
  await context.route("**/*", async route => {
    const request = route.request();
    if (new URL(request.url()).origin === base) return route.continue();
    if (request.url() !== fakeHook + "?wait=true" || request.method() !== "POST") return route.abort();
    const reply = await fetch(receiverUrl, {
      method: "POST", headers: {"Content-Type": request.headers()["content-type"]}, body: request.postDataBuffer()
    });
    await route.fulfill({status: reply.status, headers: Object.fromEntries(reply.headers), body: await reply.text()});
  });

  const page = await context.newPage();
  page.on("request", request => {
    if (request.method() === "POST" && request.url() === base + "/setup") shutdownPosts.push(request.postData());
  });
  await page.goto(base + "/join");
  await page.getByRole("heading", {name: "FWS Shutdown QA", exact: true}).waitFor();
  await page.locator("#join-username").selectOption({label: "Gamemaster"});
  await page.locator("#join-game-form button[type=submit]").click();
  const waitReady = () => page.waitForFunction(() => window.game?.ready === true, null, {timeout: 60000});
  await waitReady();
  // Refuse other worlds, other systems, administrator sessions, and worlds with other users.
  const session = await page.evaluate(id => ({
    world: game.world.id, system: game.system.id, build: game.release.build, version: game.modules.get(id)?.version,
    gm: game.user.isGM, admin: !!game.data.isAdmin, otherUsers: game.users.filter(user => user.active && !user.isSelf).length
  }), moduleId);
  assert.deepEqual(session, {world: "fws-qa", system: "fws-minimal", build: 371, version: "1.3.5", gm: true, admin: false, otherUsers: 0});
  if (!await page.evaluate(id => game.modules.get(id).active, moduleId)) {
    await page.evaluate(id => game.settings.set("core", "moduleConfiguration", {...game.settings.get("core", "moduleConfiguration"), [id]: true}), moduleId);
    await page.reload();
    await waitReady();
  }
  await page.evaluate(async ({id, hook}) => {
    if (!game.modules.get(id).active) throw new Error("QA module is not active.");
    await game.settings.set(id, "webhooks", {[JSON.stringify([game.world.id, game.user.id])]: hook});
    await game.settings.set(id, "configuration", {sendOffline: true, autoOnlineOnStartup: false, serverUrl: location.origin, offlineTitle: "QA-371 OFFLINE"});
    await game.settings.set(id, "online", true);
    ui.sidebar.activateTab("settings");
    ui.sidebar.expand();
  }, {id: moduleId, hook: fakeHook});

  const button = page.locator('button[data-app="setup"]:visible');
  await button.click();
  await page.getByText("Automatic shutdown has been stopped.", {exact: false}).waitFor();
  assert.deepEqual(deliveries, [{title: "QA-371 OFFLINE", accepted: false}]);
  assert.equal(shutdownPosts.length, 0);
  assert.equal(await page.evaluate(id => game.ready && game.settings.get(id, "online"), moduleId), true);
  console.log("Rejected delivery: zero accepted messages, zero shutdown requests, world still open with status ON.");

  // The previous, deliberately rejected click starts the module's 800 ms click cooldown.
  await new Promise(resolve => setTimeout(resolve, 1000));
  acceptDelivery = true;
  await button.click();
  await page.waitForURL(url => ["/setup", "/auth"].includes(url.pathname));
  // A fresh request without a browser session checks the server, independently of GM navigation.
  const join = await fetch(base + "/join", {redirect: "manual"});
  assert.match(await join.text(), /There is currently no active game session/);
  const root = await fetch(base + "/", {redirect: "manual"});
  assert.equal(root.status, 302);
  assert.equal(new URL(root.headers.get("location"), base).pathname, "/setup");
  assert.deepEqual(shutdownPosts, ["action=worldShutdown"]);
  assert.deepEqual(deliveries, [{title: "QA-371 OFFLINE", accepted: false}, {title: "QA-371 OFFLINE", accepted: true}]);
  console.log("Successful click: one OFFLINE received, one shutdown POST, GM reached " + new URL(page.url()).pathname + ", world closed on the real server.");
} finally {
  try { await browser?.close(); } finally { receiver.close(); }
}
