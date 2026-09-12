import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";
import assert from "node:assert/strict";

// Two real local origins exercise browser CORS enforcement; no Discord traffic.
const runtime = process.env.NODE_DEPENDENCIES;
if (!runtime) throw new Error("NODE_DEPENDENCIES is required (directory containing playwright).");
const require = createRequire(path.join(runtime, "package.json"));
const {chromium, firefox} = require("playwright");
const browserName = process.env.TEST_BROWSER ?? "chrome";
if (!["chrome", "firefox"].includes(browserName)) throw new Error("TEST_BROWSER must be chrome or firefox.");
const root = path.resolve(".");
let mode = "ok", preflights = 0, posts = 0;
const received = [], failures = [];
const listen = server => new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = server => `http://127.0.0.1:${server.address().port}`;
const site = createServer(async (req, res) => {
  const files = {"/discord.js": "discord.js", "/config.js": "config.js"};
  try {
    if (req.url === "/") {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end("<!doctype html><title>Local CORS verification</title>");
    } else if (files[req.url]) {
      res.writeHead(200, {"Content-Type": "text/javascript"});
      res.end(await readFile(path.join(root, "scripts", files[req.url])));
    } else { res.writeHead(404); res.end(); }
  } catch { res.writeHead(500); res.end(); }
});
const endpoint = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    preflights++; res.writeHead(403); res.end(); return;
  }
  if (req.method !== "POST") { res.writeHead(405); res.end(); return; }
  posts++;
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    assert.match(req.headers["content-type"], /^multipart\/form-data; boundary=/);
    assert.equal(req.headers.origin, origin(site));
    assert.equal(req.headers.cookie, undefined); assert.equal(req.headers.referer, undefined);
    const form = await new Response(Buffer.concat(chunks), {headers: {"Content-Type": req.headers["content-type"]}}).formData();
    assert.deepEqual([...form.keys()], ["payload_json"]);
    received.push({payload: JSON.parse(form.get("payload_json")), url: new URL(req.url, origin(endpoint))});
    const headers = {"Content-Type": "application/json"};
    if (mode !== "blocked") headers["Access-Control-Allow-Origin"] = origin(site);
    res.writeHead(mode === "rateLimit" ? 429 : 200, headers);
    res.end(JSON.stringify(mode === "rateLimit" ? {retry_after: 1} : mode === "empty" ? {} : {id: "123456789012345678"}));
  } catch (error) { failures.push(error.message); res.writeHead(500); res.end(); }
});

let browser;
try {
  await listen(site); await listen(endpoint);
  browser = browserName === "firefox" ? await firefox.launch({headless: true, timeout: 30000})
    : await chromium.launch({channel: "chrome", headless: true, args: ["--no-proxy-server"]});
  const page = await browser.newPage();
  await page.goto(origin(site));
  // Control: the previous JSON transport fails when the OPTIONS path is blocked.
  assert.equal(await page.evaluate(async target => {
    try { await fetch(target, {method: "POST", headers: {"Content-Type": "application/json"}, body: "{}"}); return "unexpected"; }
    catch { return "blocked"; }
  }, origin(endpoint)), "blocked");
  assert.equal(preflights, 1); assert.equal(posts, 0);

  await page.evaluate(async target => {
    window.game = {user: {isGM: true}};
    const nativeFetch = window.fetch.bind(window);
    // The module still validates a synthetic Discord URL; only fetch's destination
    // is remapped to our local endpoint. Request options and body remain untouched.
    window.fetch = (value, options) => {
      const url = new URL(value);
      if (url.origin !== "https://discord.com") throw new Error("Non-test destination");
      return nativeFetch(`${target}${url.pathname}${url.search}`, options);
    };
    const {sendWebhook, buildPayload} = await import("/discord.js");
    const {DEFAULTS} = await import("/config.js");
    window.payload = buildPayload({...DEFAULTS, serverUrl: "https://foundry.example.invalid/game", roleId: "123456789012345678", content: "🎲 Grüße"}, true);
    window.send = async () => {
      try {
        await sendWebhook(`https://discord.com/api/webhooks/${"1".repeat(18)}/${"test_token_".repeat(7)}?thread_id=123456789012345678`, window.payload);
        return "confirmed";
      } catch (error) { return error.code; }
    };
  }, origin(endpoint));
  assert.equal(await page.evaluate(() => window.send()), "confirmed");
  assert.equal(preflights, 1); assert.equal(posts, 1);
  assert.deepEqual(received[0].payload, await page.evaluate(() => window.payload));
  assert.equal(received[0].url.searchParams.get("wait"), "true");
  assert.equal(received[0].url.searchParams.get("thread_id"), "123456789012345678");

  mode = "blocked";
  assert.equal(await page.evaluate(() => window.send()), "network");
  assert.equal(posts, 2); // A blocked response must not cause a second POST.
  mode = "empty";
  assert.equal(await page.evaluate(() => window.send()), "confirmation");
  assert.equal(posts, 3);
  mode = "rateLimit";
  assert.equal(await page.evaluate(() => window.send()), "rateLimit");
  assert.equal(await page.evaluate(() => window.send()), "rateLimit");
  assert.equal(posts, 4);
  await page.evaluate(() => {game.user.isGM = false;});
  assert.equal(await page.evaluate(() => window.send()), "gmOnly");
  assert.equal(posts, 4); assert.equal(preflights, 1);
  assert.deepEqual(failures, []);
  console.log(`${browserName} ${browser.version()}: CORS browser checks passed: blocked JSON preflight reproduced; multipart POST succeeds without OPTIONS; payload intact; missing CORS response, missing confirmation, rate limits and GM-only access handled. No requests sent to Discord.`);
} finally {
  await browser?.close();
  await Promise.all([site, endpoint].filter(server => server.listening).map(server => new Promise(resolve => server.close(resolve))));
}
