import {test, beforeEach, after} from "node:test";
import assert from "node:assert/strict";
import {readFile, access, readdir} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {createRequire} from "node:module";

const root = path.resolve(".");
const language = JSON.parse(await readFile(path.join(root, "lang/de.json"), "utf8"));
const lookup = key => key.split(".").reduce((value, part) => value?.[part], language) ?? key;
const hookCallbacks = new Map();
const registrations = new Map();
const stored = new Map();
let notifications = [], calls = [], logs = [], writes = [], failWrite = false;
let clock = 100000;
const originalNow = Date.now;
const originalError = console.error;
Date.now = () => clock;
console.error = (...args) => logs.push(args);
after(() => { Date.now = originalNow; console.error = originalError; });

class AppMock {
  static emittedEvents = [];
  _canRender() {}
  _configureRenderOptions() {}
  async _prepareContext() { return {}; }
  async _onRender() {}
  async render() { return this; }
}
globalThis.Hooks = {
  once: (key, callback) => hookCallbacks.set(key, callback),
  on: (key, callback) => hookCallbacks.set(key, callback),
  callAll: (key, ...args) => hookCallbacks.get(key)?.(...args)
};
globalThis.foundry = {
  applications: {api: {ApplicationV2: AppMock, HandlebarsApplicationMixin: Base => class extends Base {}}},
  data: {fields: {BooleanField: class {constructor(options) {this.options = options;}}}}
};
globalThis.game = {
  ready: true, world: {id: "test-world"}, user: {id: "test-gm", isGM: true},
  i18n: {localize: lookup, format: (key, data) => lookup(key).replace(/\{(\w+)\}/g, (_, k) => String(data[k]))},
  settings: {
    register: (module, key, config) => {assert.equal(module, "foundry-world-status"); registrations.set(key, config); if (!stored.has(key)) stored.set(key, structuredClone(config.default));},
    registerMenu: (module, key, config) => {assert.equal(module, "foundry-world-status"); registrations.set("menu", config);},
    get: (module, key) => {if (module === "core") return false; assert.equal(module, "foundry-world-status"); return structuredClone(stored.get(key));},
    set: async (module, key, value) => {
      assert.equal(module, "foundry-world-status");
      if (failWrite) throw new Error("sensitive failure must not be logged");
      writes.push({key, value}); stored.set(key, structuredClone(value)); registrations.get(key)?.onChange?.(value);
      return value;
    }
  }
};
globalThis.ui = {
  controls: {controls: {}, render: async () => {}},
  notifications: Object.fromEntries(["info", "warn", "error"].map(level => [level, message => notifications.push({level, message})]))
};

const configModule = await import("../scripts/config.js");
const {DEFAULTS, MODULE_ID, TOOL_ID, webhookUrl, validateConfig, normalizeConfig, readConfig, reportError} = configModule;
const discord = await import("../scripts/discord.js");
const {buildPayload, sendWebhook, runExclusive, isBusy} = discord;
const main = await import("../scripts/main.js");
const {WorldStatusSettings, registerSettings} = await import("../scripts/settings.js");
const {installShutdownHandler} = await import("../scripts/shutdown.js");

hookCallbacks.get("init")();
const fakeWebhook = `https://discord.com/api/webhooks/${"1".repeat(18)}/${"test_token_".repeat(7)}`;
const goodConfig = () => ({...DEFAULTS, webhookUrl: fakeWebhook, serverUrl: "https://foundry.example.invalid/game"});
const response = (status = 200, data = {id: "123456789012345678"}) => ({
  status, ok: status >= 200 && status < 300,
  headers: {get: () => null}, json: async () => data
});
const setFetch = handler => globalThis.fetch = async (...args) => { calls.push(args); return handler(...args); };
const context = () => ({tokens: {name: "tokens", activeTool: "select", tools: {select: {name: "select", order: 0, icon: "fa-solid fa-expand", title: "Select"}}}, walls: {name: "walls", tools: {draw: {name: "draw", order: 0}}}});

function storeConfig(config) {
  const {webhookUrl, ...shared} = config;
  stored.set("configuration", shared);
  stored.set("webhooks", {[JSON.stringify([game.world.id, game.user.id])]: webhookUrl ?? ""});
}

beforeEach(() => {
  clock += 1000000;
  game.user.isGM = true;
  storeConfig(goodConfig()); stored.set("online", false);
  notifications = []; calls = []; logs = []; writes = []; failWrite = false;
  ui.controls = {controls: context(), render: async () => {}};
  setFetch(() => response());
});

test("manifest, imports, templates, CSS and icon files resolve", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "module.json"), "utf8"));
  assert.equal(manifest.id, MODULE_ID); assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.authors[0].name, "Ginkgo85");
  assert.equal(manifest.compatibility.minimum, "14.367");
  assert.equal(manifest.compatibility.verified, "14.368");
  for (const file of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(l => l.path), manifest.readme, "templates/settings.hbs"]) await access(path.join(root, file));
  for (const file of await readdir(path.join(root, "scripts"))) {
    const text = await readFile(path.join(root, "scripts", file), "utf8");
    for (const match of text.matchAll(/from "(\.[^"]+)"/g)) await access(path.resolve(root, "scripts", match[1]));
    assert.doesNotMatch(text, /\bjQuery\b|\bFormApplication\b|\bonClick\s*:/);
  }
  const cssPath = path.join(root, manifest.styles[0]);
  const css = await readFile(cssPath, "utf8");
  for (const match of css.matchAll(/url\("([^"]+)"\)/g)) await access(path.resolve(path.dirname(cssPath), match[1]));
  for (const state of ["on", "off"]) {
    const svg = await readFile(path.join(root, "icons", `discord-${state}.svg`), "utf8");
    assert.match(svg, /viewBox="0 0 40 40"/); assert.ok(svg.includes(`>${state.toUpperCase()}</text>`));
    assert.doesNotMatch(svg, /<script|<image|href=/);
  }
});

test("restricted submenu and persistent world settings start OFF and survive registration", () => {
  assert.equal(MODULE_ID, "foundry-world-status");
  assert.equal(registrations.get("configuration").default.webhookUrl, undefined);
  assert.equal(registrations.get("webhooks").scope, "client");
  assert.equal(registrations.get("configuration").default.serverUrl, "");
  assert.equal(registrations.get("menu").restricted, true);
  assert.equal(registrations.get("online").default, false);
  for (const key of ["online", "configuration"]) {
    assert.equal(registrations.get(key).scope, "world"); assert.equal(registrations.get(key).config, false);
  }
  stored.set("online", true); storeConfig({...goodConfig(), onlineTitle: "Persistiert"});
  registerSettings(main.refreshControls);
  assert.equal(game.settings.get(MODULE_ID, "online"), true);
  assert.equal(readConfig().onlineTitle, "Persistiert");
});

test("startup, renders and setting changes never send", async () => {
  hookCallbacks.get("ready")(); main.addSceneTools(ui.controls.controls);
  await game.settings.set(MODULE_ID, "online", true);
  assert.equal(calls.length, 0);
  for (const control of Object.values(ui.controls.controls)) assert.match(control.tools[TOOL_ID].icon, /fws-on/);
});

test("players have no tool and cannot render, read, save, test or send through module", async () => {
  game.user.isGM = false;
  const controls = context(); main.addSceneTools(controls);
  assert.equal(controls.tokens.tools[TOOL_ID], undefined);
  assert.throws(readConfig, {code: "gmOnly"});
  const app = new WorldStatusSettings();
  assert.throws(() => app._canRender({}), {code: "gmOnly"});
  assert.throws(() => WorldStatusSettings.toggleWebhookVisibility.call(app, {}, {}), {code: "gmOnly"});
  await assert.rejects(app._prepareContext({}), {code: "gmOnly"});
  await assert.rejects(sendWebhook(fakeWebhook, {content: "test"}), {code: "gmOnly"});
  await main.toggleAnnouncement();
  app.element = {querySelector: () => ({})};
  await WorldStatusSettings.save.call(app, {}, {}, {object: goodConfig()});
  await WorldStatusSettings.testConnection.call(app, {}, {});
  assert.equal(calls.length, 0); assert.equal(writes.length, 0);
});

test("missing webhook is a handled German UI error and does not change OFF", async () => {
  storeConfig({...goodConfig(), webhookUrl: ""});
  await main.toggleAnnouncement();
  assert.equal(calls.length, 0); assert.equal(stored.get("online"), false);
  assert.equal(notifications.at(-1).message, lookup("FWS.errors.webhook"));
});

test("webhook validation blocks misleading hosts, unsafe protocols and invalid paths", () => {
  for (const value of ["", "abc", fakeWebhook.replace("https:", "http:"), fakeWebhook.replace("discord.com", "discord.com.evil.invalid"), fakeWebhook.replace("discord.com", "evil.invalid@discord.com"), `${fakeWebhook}/messages/1`, `${fakeWebhook}#secret`, `${fakeWebhook}?thread_id=bad`]) {
    assert.throws(() => webhookUrl(value), {code: "webhook"});
  }
  const url = new URL(webhookUrl(`${fakeWebhook}?wait=false&thread_id=123456789012345678&unknown=1`));
  assert.equal(url.searchParams.get("wait"), "true"); assert.equal(url.searchParams.get("thread_id"), "123456789012345678");
  assert.equal(url.searchParams.has("unknown"), false);
});

test("missing server URL never sends ONLINE", async () => {
  storeConfig({...goodConfig(), serverUrl: ""});
  await main.toggleAnnouncement(); assert.equal(calls.length, 0); assert.equal(stored.get("online"), false);
  assert.equal(notifications.at(-1).message, lookup("FWS.errors.server"));
});

test("ONLINE payload uses editable fields, clickable server and only the explicit role", () => {
  const c = {...goodConfig(), roleId: "123456789012345678", content: "@everyone <@123456789012345679> Los!", onlineThumbnail: "https://example.invalid/thumb.png", onlineImage: "https://example.invalid/image.png", avatarUrl: "https://example.invalid/avatar.png"};
  const payload = buildPayload(c, true);
  assert.equal(payload.embeds[0].title, c.onlineTitle);
  assert.equal(payload.embeds[0].description, c.onlineDescription + "\n\n🔗 [" + c.onlineLinkText + "](" + c.serverUrl + ")");
  assert.equal(payload.embeds[0].footer.text, c.onlineFooter);
  assert.equal(payload.embeds[0].color, 0x2ecc71);
  assert.equal(payload.embeds[0].url, c.serverUrl);
  assert.deepEqual(payload.allowed_mentions.parse, []); assert.deepEqual(payload.allowed_mentions.users, []);
  assert.deepEqual(payload.allowed_mentions.roles, [c.roleId]);
  assert.ok(payload.content.startsWith(`<@&${c.roleId}>`));
  assert.equal(payload.avatar_url, c.avatarUrl);
});

test("OFFLINE has independent texts and no ping, and allows a missing server URL", () => {
  const payload = buildPayload({...goodConfig(), serverUrl: "", roleId: "123456789012345678", content: "ping"}, false);
  assert.equal(payload.embeds[0].title, DEFAULTS.offlineTitle);
  assert.equal(payload.embeds[0].description, DEFAULTS.offlineDescription);
  assert.equal(payload.embeds[0].color, 0xe74c3c);
  assert.equal(payload.content, undefined); assert.equal(payload.embeds[0].url, undefined);
  assert.deepEqual(payload.allowed_mentions.roles, []);
});

test("state stays OFF while sending; rapid clicks are blocked; ON is saved after confirmation", async () => {
  let resolve;
  setFetch(() => new Promise(r => {resolve = r;}));
  const pending = main.toggleAnnouncement();
  assert.equal(isBusy(), true); assert.equal(stored.get("online"), false);
  await main.toggleAnnouncement(); assert.equal(calls.length, 1);
  resolve(response()); await pending;
  assert.equal(stored.get("online"), true); assert.equal(isBusy(), false);
  await main.toggleAnnouncement(); assert.equal(calls.length, 1); // cooldown
  assert.equal(notifications.at(-1).message, lookup("FWS.onlineSent"));
});

test("ON to OFF sends the offline embed and only then saves false", async () => {
  stored.set("online", true); await main.toggleAnnouncement();
  assert.equal(stored.get("online"), false);
  assert.equal(JSON.parse(calls[0][1].body.get("payload_json")).embeds[0].title, DEFAULTS.offlineTitle);
  assert.equal(notifications.at(-1).message, lookup("FWS.offlineSent"));
});

test("silent OFF works even with empty webhook/server and sends nothing", async () => {
  stored.set("online", true); storeConfig({...goodConfig(), webhookUrl: "", serverUrl: "", sendOffline: false});
  await main.toggleAnnouncement(); assert.equal(stored.get("online"), false); assert.equal(calls.length, 0);
  assert.equal(notifications.at(-1).message, lookup("FWS.offlineLocal"));
});

for (const status of [400, 401, 403, 404, 500]) test(`HTTP ${status} preserves OFF and ON without exposing secret`, async () => {
  setFetch(() => response(status, {message: fakeWebhook}));
  await main.toggleAnnouncement(); assert.equal(stored.get("online"), false);
  clock += 1000; stored.set("online", true);
  await main.toggleAnnouncement(); assert.equal(stored.get("online"), true);
  assert.equal(isBusy(), false); assert.equal(notifications.at(-1).level, "error");
  assert.ok(!JSON.stringify({logs, notifications}).includes(fakeWebhook));
});

test("429 respects retry_after and does not retry automatically", async () => {
  setFetch(() => response(429, {retry_after: 3.2}));
  await main.toggleAnnouncement(); assert.equal(stored.get("online"), false);
  clock += 1000; await main.toggleAnnouncement(); assert.equal(calls.length, 1);
  assert.match(notifications.at(-1).message, /3 Sekunden/);
  clock += 4000; setFetch(() => response()); await main.toggleAnnouncement();
  assert.equal(stored.get("online"), true); assert.equal(calls.length, 2);
});

test("multipart transport preserves payload, thread, confirmation and privacy without custom headers", async () => {
  const payload = buildPayload({...goodConfig(), content: "🎲 Grüße", roleId: "123456789012345678"}, true);
  await sendWebhook(`${fakeWebhook}?thread_id=123456789012345678`, payload);
  const [url, options] = calls[0];
  assert.equal(calls.length, 1);
  assert.equal(new URL(url).searchParams.get("wait"), "true");
  assert.equal(new URL(url).searchParams.get("thread_id"), "123456789012345678");
  assert.equal(options.method, "POST"); assert.equal(options.mode, "cors");
  assert.equal(options.headers, undefined); assert.ok(options.body instanceof FormData);
  assert.deepEqual([...options.body.keys()], ["payload_json"]);
  assert.deepEqual(JSON.parse(options.body.get("payload_json")), payload);
  assert.equal(options.credentials, "omit"); assert.equal(options.referrerPolicy, "no-referrer");
  assert.equal(options.redirect, "error");
});

test("opaque response cannot confirm delivery or trigger another POST", async () => {
  setFetch(() => response(0));
  await main.toggleAnnouncement();
  assert.equal(calls.length, 1); assert.equal(stored.get("online"), false);
  assert.equal(notifications.at(-1).level, "error");
});

test("network exceptions are replaced with safe errors", async () => {
  setFetch(() => {throw new Error(`Network failure ${fakeWebhook}`);});
  await main.toggleAnnouncement(); assert.equal(stored.get("online"), false);
  assert.equal(notifications.at(-1).message, lookup("FWS.errors.network"));
  assert.equal(calls.length, 1);
  assert.ok(!JSON.stringify({logs, notifications}).includes(fakeWebhook));
});

test("timeout aborts the request, keeps OFF and releases the lock", async () => {
  const originalTimeout = globalThis.setTimeout;
  globalThis.setTimeout = callback => originalTimeout(callback, 1);
  setFetch((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error(fakeWebhook)))));
  try { await main.toggleAnnouncement(); } finally { globalThis.setTimeout = originalTimeout; }
  assert.equal(stored.get("online"), false); assert.equal(isBusy(), false);
  assert.equal(notifications.at(-1).message, lookup("FWS.errors.timeout"));
});

test("timeout while reading the confirmation body is reported as a timeout", async () => {
  const originalTimeout = globalThis.setTimeout;
  globalThis.setTimeout = callback => originalTimeout(callback, 1);
  setFetch((_url, options) => ({...response(), json: () => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error(fakeWebhook)));
  })}));
  try { await main.toggleAnnouncement(); } finally { globalThis.setTimeout = originalTimeout; }
  assert.equal(calls.length, 1); assert.equal(stored.get("online"), false); assert.equal(isBusy(), false);
  assert.equal(notifications.at(-1).message, lookup("FWS.errors.timeout"));
  assert.ok(!JSON.stringify({logs, notifications}).includes(fakeWebhook));
});

test("unexpected successful HTTP response does not falsely confirm ONLINE", async () => {
  setFetch(() => response(200, {})); await main.toggleAnnouncement();
  assert.equal(stored.get("online"), false); assert.equal(notifications.at(-1).message, lookup("FWS.errors.confirmation"));
});

test("failed status persistence reports already-sent message without a false success", async () => {
  failWrite = true; await main.toggleAnnouncement();
  assert.equal(calls.length, 1); assert.equal(stored.get("online"), false);
  assert.equal(notifications.at(-1).message, lookup("FWS.errors.stateAfterSend"));
  assert.equal(notifications.some(n => n.level === "info"), false);
});

test("render failure does not prevent announcement or turn success into a failure", async () => {
  ui.controls.render = () => {throw new Error("render");};
  await main.toggleAnnouncement(); assert.equal(stored.get("online"), true);
  assert.equal(notifications.at(-1).message, lookup("FWS.onlineSent"));
});

test("all saved configuration fields are validated together before the single world write", async () => {
  const app = new WorldStatusSettings(); app.element = {querySelector: () => ({})};
  const bad = {...goodConfig(), onlineColor: "oops"};
  await WorldStatusSettings.save.call(app, {}, {}, {object: bad}); assert.equal(writes.length, 0);
  await WorldStatusSettings.save.call(app, {}, {}, {object: {...goodConfig(), onlineTitle: "Neue Runde"}});
  assert.equal(writes.length, 2); assert.equal(stored.get("configuration").webhookUrl, undefined); assert.equal(stored.get("configuration").onlineTitle, "Neue Runde");
  assert.equal(calls.length, 0);
});

test("field, role, scheme, combined-content and aggregate-embed limits", () => {
  for (const changes of [
    {onlineTitle: "x".repeat(257)}, {onlineColor: "red"}, {offlineColor: "#abc"},
    {onlineTitle: ""}, {avatarUrl: "javascript:alert(1)"}, {onlineImage: "file:///secret"},
    {roleId: "abc"}, {roleId: "1".repeat(18), content: "x".repeat(2000)},
    {onlineDescription: "x".repeat(4096), onlineFooter: "x".repeat(2048)}
  ]) assert.throws(() => validateConfig({...goodConfig(), ...changes}));
  assert.doesNotThrow(() => validateConfig({...DEFAULTS}));
  assert.equal(normalizeConfig({...DEFAULTS, extra: "discard"}).extra, undefined);
});

test("connection test uses unsaved webhook, no ping, no status write", async () => {
  const app = new WorldStatusSettings();
  const unsaved = fakeWebhook.replace("discord.com", "canary.discord.com");
  app.currentValues = () => ({...DEFAULTS, webhookUrl: unsaved});
  const button = {}; await WorldStatusSettings.testConnection.call(app, {}, button);
  assert.equal(new URL(calls[0][0]).hostname, "canary.discord.com");
  const payload = JSON.parse(calls[0][1].body.get("payload_json"));
  assert.equal(payload.content, "Foundry World Status – Verbindung erfolgreich.");
  assert.deepEqual(payload.allowed_mentions.parse, []); assert.deepEqual(payload.allowed_mentions.roles, []);
  assert.equal(writes.length, 0); assert.equal(stored.get("online"), false); assert.equal(button.disabled, false);
  assert.equal(notifications.at(-1).message, lookup("FWS.testSuccess"));
});

test("connection test failure is contained and safe", async () => {
  const app = new WorldStatusSettings(); app.currentValues = goodConfig;
  setFetch(() => {throw new Error(fakeWebhook);});
  await WorldStatusSettings.testConnection.call(app, {}, {});
  assert.equal(notifications.at(-1).message, `${lookup("FWS.testFailed")} ${lookup("FWS.errors.network")}`);
  assert.ok(!JSON.stringify(logs).includes(fakeWebhook));
});

test("connection test keeps actionable HTTP errors without exposing webhook details", async () => {
  const app = new WorldStatusSettings(); app.currentValues = goodConfig;
  setFetch(() => response(404));
  await WorldStatusSettings.testConnection.call(app, {}, {});
  assert.equal(notifications.at(-1).message, `${lookup("FWS.testFailed")} ${lookup("FWS.errors.notFound")}`);
  assert.ok(!JSON.stringify({logs, notifications}).includes(fakeWebhook));
});

test("webhook visibility toggles only the input type and accessibility state", () => {
  const app = new WorldStatusSettings();
  const input = {type: "password", value: fakeWebhook};
  const icon = {}; const attributes = {};
  const button = {setAttribute: (key, value) => {attributes[key] = value;}, querySelector: () => icon};
  app.element = {querySelector: () => input};
  WorldStatusSettings.toggleWebhookVisibility.call(app, {}, button);
  assert.equal(input.type, "text"); assert.equal(input.value, fakeWebhook);
  assert.equal(attributes["aria-pressed"], "true");
  assert.equal(attributes["aria-label"], lookup("FWS.hideWebhook"));
  assert.equal(icon.className, "fa-solid fa-eye-slash");
  WorldStatusSettings.toggleWebhookVisibility.call(app, {}, button);
  assert.equal(input.type, "password"); assert.equal(input.value, fakeWebhook);
  assert.equal(attributes["aria-pressed"], "false");
  assert.equal(button.title, lookup("FWS.showWebhook"));
  assert.equal(calls.length, 0); assert.equal(writes.length, 0);
});

test("test and announce actions share a lock", async () => {
  let release;
  const job = runExclusive(() => new Promise(r => {release = r;}));
  await main.toggleAnnouncement(); assert.equal(calls.length, 0); release(); await job;
});

test("every form field has a German label and hint; prepared values stay escaped in Handlebars", async t => {
  const app = new WorldStatusSettings(); const context = await app._prepareContext({});
  assert.equal(context.groups.flatMap(g => g.fields).length, Object.keys(DEFAULTS).length);
  for (const f of context.groups.flatMap(g => g.fields)) {
    assert.ok(f.label && !f.label.startsWith("FWS.")); assert.ok(f.hint && !f.hint.startsWith("FWS."));
  }
  const foundryRoot = process.env.FOUNDRY_APP_PATH;
  if (!foundryRoot) { t.diagnostic("Handlebars integration skipped; set FOUNDRY_APP_PATH."); return; }
  const require = createRequire(path.join(foundryRoot, "package.json"));
  const handlebars = require("handlebars").create();
  handlebars.registerHelper("localize", lookup); handlebars.registerHelper("checked", value => value ? "checked" : "");
  context.groups[0].fields[0].value = '\"><script>alert(1)</script>';
  const html = handlebars.compile(await readFile(path.join(root, "templates/settings.hbs"), "utf8"))(context);
  assert.doesNotMatch(html, /<script>/); assert.match(html, /&lt;script&gt;/);
  assert.match(html, /type="password"/); assert.match(html, /name="sendOffline" type="checkbox" checked/);
});

test("actual Foundry 14.368 SceneControls builds, renders and clicks the module tool", async t => {
  const foundryRoot = process.env.FOUNDRY_APP_PATH;
  if (!foundryRoot) { t.skip("Set FOUNDRY_APP_PATH to the installed resources/app folder."); return; }
  const release = JSON.parse(await readFile(path.join(foundryRoot, "package.json"), "utf8")).release;
  assert.equal(release.generation, 14); assert.equal(release.build, 368);
  let source = await readFile(path.join(foundryRoot, "client/applications/ui/scene-controls.mjs"), "utf8");
  // Execute the actual core class with boundary mocks. Proprietary source is neither copied into the module nor shipped.
  source = source.replace(/^import .*;\r?$/gm, "");
  source = `const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;
    const {InteractionLayer, PlaceablesLayer} = globalThis.__coreTest;
    const Hooks = globalThis.Hooks;\n` + source;
  class InteractionLayer {}
  class PlaceablesLayer extends InteractionLayer {}
  class TokenLayer extends InteractionLayer {static prepareSceneControls() {return context().tokens;}}
  globalThis.__coreTest = {InteractionLayer, PlaceablesLayer};
  globalThis.CONFIG = {Canvas: {layers: {tokens: {layerClass: TokenLayer}}}};
  globalThis.canvas = {ready: true};
  const clone = value => Array.isArray(value) ? value.map(clone) : value && typeof value === "object"
    ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)])) : value;
  foundry.utils = {isSubclass: (a, b) => a.prototype instanceof b, isEmpty: a => !Object.keys(a).length, deepClone: clone};
  Array.prototype.filterJoin = function(separator) {return this.filter(Boolean).join(separator);};
  try {
    const {default: SceneControls} = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
    const controls = new SceneControls();
    controls._configureRenderOptions({isFirstRender: true});
    const context = await controls._prepareContext({});
    const tool = context.tools.find(tool => tool.name === TOOL_ID);
    assert.equal(tool.button, true); assert.equal(tool.toggle, undefined); assert.match(tool.icon, /fws-off/);
    const require = createRequire(path.join(foundryRoot, "package.json"));
    const handlebars = require("handlebars").create(); handlebars.registerHelper("localize", lookup);
    const html = handlebars.compile(await readFile(path.join(foundryRoot, "templates/ui/scene-controls-tools.hbs"), "utf8"))(context);
    assert.match(html, /<button[^>]*class="[^"]*fws-icon fws-off/);
    assert.match(html, /Spielwelt auf Discord als ONLINE melden/);
    SceneControls.DEFAULT_OPTIONS.actions.tool.call(controls, {target: {dataset: {tool: TOOL_ID}}});
    // Core does not await button onChange; drain the asynchronous click.
    for (let n = 0; n < 20; n++) await Promise.resolve();
    assert.equal(calls.length, 1); assert.equal(stored.get("online"), true);
    assert.equal(controls.tool.name, "select");
    clock += 1000;
    SceneControls.DEFAULT_OPTIONS.actions.tool.call(controls, {target: {dataset: {tool: TOOL_ID}}});
    for (let n = 0; n < 20; n++) await Promise.resolve();
    assert.equal(calls.length, 2); assert.equal(stored.get("online"), false);
    assert.equal(controls.tool.name, "select");
  } finally { delete Array.prototype.filterJoin; }
});

function prepareShutdown({auto = true, sendOffline = true, online = true, confirm = true} = {}) {
  const result = {native: [], setup: [], dialogs: []};
  globalThis.game = {...game, users: [], shutDown: async function (...args) {result.native.push({receiver: this, args});}};
  stored.set("online", online);
  storeConfig({...goodConfig(), autoOfflineOnShutdown: auto, sendOffline});
  foundry.applications.api.DialogV2 = {confirm: async options => {result.dialogs.push(options); return confirm;}};
  foundry.utils = {...foundry.utils, getRoute: route => `/prefix/${route}`, fetchWithTimeout: async (url, options) => {
    assert.equal(stored.get("online"), false, "OFF must be persisted before shutdown POST");
    result.setup.push({url, options}); return response();
  }};
  installShutdownHandler(main.refreshControls);
  return result;
}

test("automatic shutdown setting defaults to false and fills missing configuration fields without enabling it", () => {
  assert.equal(DEFAULTS.autoOfflineOnShutdown, false);
  const old = goodConfig(); delete old.autoOfflineOnShutdown; storeConfig(old);
  assert.equal(readConfig().autoOfflineOnShutdown, false);
  assert.equal(normalizeConfig(old).autoOfflineOnShutdown, false);
});

test("disabled auto option, disabled offline messages and already-OFF delegate without sending", async () => {
  for (const options of [{auto:false}, {sendOffline:false}, {online:false}]) {
    clock += 1000;
    const result = prepareShutdown(options); await game.shutDown("argument");
    assert.equal(calls.length, 0); assert.equal(result.setup.length, 0); assert.equal(result.native.length, 1);
    assert.equal(result.native[0].receiver, game); assert.deepEqual(result.native[0].args, ["argument"]);
  }
});

test("shutdown auto-announces OFFLINE, persists OFF, then posts to the route-prefixed setup endpoint", async () => {
  const result = prepareShutdown();
  await game.shutDown();
  assert.equal(calls.length, 1); assert.equal(stored.get("online"), false);
  assert.equal(JSON.parse(calls[0][1].body.get("payload_json")).embeds[0].title, DEFAULTS.offlineTitle);
  assert.deepEqual(JSON.parse(calls[0][1].body.get("payload_json")).allowed_mentions.roles, []);
  assert.equal(result.native.length, 0); assert.equal(result.setup.length, 1);
  assert.equal(result.setup[0].url, "/prefix/setup");
  assert.equal(result.setup[0].options.method, "POST");
  assert.deepEqual(JSON.parse(result.setup[0].options.body), {shutdown:true});
  assert.equal(result.setup[0].options.redirect, "manual");
  clock += 1000; await game.shutDown();
  assert.equal(result.setup.length, 1); assert.equal(calls.length, 1);
});

test("canceling the connected-user shutdown warning sends nothing and keeps the world online", async () => {
  const result = prepareShutdown({confirm:false}); game.users = [{active:true, isSelf:false}];
  await game.shutDown();
  assert.equal(result.dialogs.length, 1); assert.match(result.dialogs[0].content, /1 andere Benutzer/);
  assert.equal(calls.length, 0); assert.equal(result.setup.length, 0); assert.equal(stored.get("online"), true);
});

test("accepting the shutdown warning sends once without showing a second confirmation", async () => {
  const result = prepareShutdown(); game.users = [{active:true, isSelf:false}, {active:true, isSelf:true}];
  await game.shutDown();
  assert.equal(result.dialogs.length, 1); assert.equal(calls.length, 1); assert.equal(result.setup.length, 1);
});

test("shutdown waits for Discord and concurrent clicks cannot duplicate the announcement", async () => {
  const result = prepareShutdown();
  let release; setFetch(() => new Promise(resolve => {release = resolve;}));
  const pending = game.shutDown();
  assert.equal(result.setup.length, 0); assert.equal(stored.get("online"), true);
  await game.shutDown(); await main.toggleAnnouncement();
  assert.equal(calls.length, 1); assert.equal(result.setup.length, 0);
  release(response()); await pending;
  assert.equal(result.setup.length, 1); assert.equal(stored.get("online"), false);
});

test("shutdown during another Discord action is stopped with useful feedback", async () => {
  const result = prepareShutdown();
  let release; const pending = runExclusive(() => new Promise(resolve => {release = resolve;}));
  await game.shutDown();
  assert.equal(calls.length, 0); assert.equal(result.setup.length, 0);
  assert.equal(notifications.at(-1).message, lookup("FWS.shutdownBusy"));
  release(); await pending;
});

test("Discord errors during automatic OFFLINE leave the world open and status ON", async () => {
  for (const status of [400, 401, 403, 404, 429, 500]) {
    clock += 100000;
    const result = prepareShutdown(); setFetch(() => response(status, {retry_after:1}));
    await game.shutDown();
    assert.equal(result.setup.length, 0); assert.equal(result.native.length, 0);
    assert.equal(stored.get("online"), true); assert.equal(isBusy(), false);
    assert.equal(notifications.at(-1).message, lookup("FWS.shutdownStopped"));
  }
});

test("empty webhook prevents automatic shutdown without an uncaught exception", async () => {
  const result = prepareShutdown(); storeConfig({...readConfig(), webhookUrl: ""});
  await game.shutDown(); assert.equal(calls.length, 0); assert.equal(result.setup.length, 0);
  assert.equal(stored.get("online"), true);
});

test("pending credential migration stops setup shutdown with safe feedback", async () => {
  const result = prepareShutdown();
  stored.set("configuration", {...goodConfig(), autoOfflineOnShutdown: true});
  await game.shutDown();
  assert.equal(calls.length, 0); assert.equal(result.setup.length, 0);
  assert.ok(notifications.some(n => n.message === lookup("FWS.errors.migrationRequired")));
});

test("status storage failure after automatic OFFLINE stops shutdown without automatic resend", async () => {
  const result = prepareShutdown(); failWrite = true;
  await game.shutDown();
  assert.equal(calls.length, 1); assert.equal(result.setup.length, 0); assert.equal(stored.get("online"), true);
  assert.ok(notifications.some(n => n.message === lookup("FWS.errors.stateAfterSend")));
});

test("shutdown POST failure retains truthful OFF announcement and gives a specific error", async () => {
  prepareShutdown(); foundry.utils.fetchWithTimeout = async () => {throw new Error("server failure");};
  await game.shutDown();
  assert.equal(calls.length, 1); assert.equal(stored.get("online"), false);
  assert.ok(notifications.some(n => n.message === lookup("FWS.errors.shutdownRequest")));
  assert.equal(isBusy(), false);
});

test("manual redirect response is a successful shutdown response in V14", async () => {
  prepareShutdown(); foundry.utils.fetchWithTimeout = async () => ({ok:false, status:0, type:"opaqueredirect"});
  await game.shutDown();
  assert.equal(stored.get("online"), false); assert.equal(notifications.some(n => n.level === "error"), false);
});

test("wrapper is installed once and never sends for a demoted user", async () => {
  const result = prepareShutdown(); const wrapped = game.shutDown;
  installShutdownHandler(); assert.equal(game.shutDown, wrapped);
  game.user.isGM = false; await game.shutDown();
  assert.equal(calls.length, 0); assert.equal(result.native.length, 1); assert.equal(result.setup.length, 0);
});

test("changed options or another GM's OFF status during confirmation do not cause duplicate sending", async () => {
  let result = prepareShutdown(); game.users = [{active:true, isSelf:false}];
  foundry.applications.api.DialogV2.confirm = async () => {stored.get("configuration").autoOfflineOnShutdown = false; return true;};
  await game.shutDown(); assert.equal(calls.length, 0); assert.equal(result.native.length, 1);
  clock += 1000;
  result = prepareShutdown(); game.users = [{active:true, isSelf:false}];
  foundry.applications.api.DialogV2.confirm = async () => {stored.set("online", false); return true;};
  await game.shutDown(); assert.equal(calls.length, 0); assert.equal(result.setup.length, 1);
});

test("disabled branch executes the actual 14.368 Game.shutDown implementation", async t => {
  const core = process.env.FOUNDRY_APP_PATH;
  if (!core) {t.skip("FOUNDRY_APP_PATH required"); return;}
  const source = await readFile(path.join(core, "client/game.mjs"), "utf8");
  const start = source.indexOf("  async shutDown() {");
  const end = source.indexOf("\n  }", start) + 4;
  assert.ok(start > 0 && end > start);
  const method = source.slice(start, end).replace("async shutDown()", "async function shutDown()");
  const result = prepareShutdown({auto:false, online:false});
  const original = new Function("utils", "getRoute", "_loc", `return (${method});`)(foundry.utils, foundry.utils.getRoute, (key, data) => game.i18n.format(key, data));
  globalThis.game = {...game, data:{isAdmin:false}, shutDown:original};
  installShutdownHandler(); await game.shutDown();
  assert.equal(result.setup.length, 1); assert.equal(calls.length, 0);
});


test("GM logout retains ON and sends nothing even with shutdown automation enabled", async () => {
  let nativeCalls = 0;
  const original = () => {nativeCalls++;};
  globalThis.game = {...game, logOut: original};
  stored.set("online", true);
  storeConfig({...goodConfig(), autoOfflineOnShutdown: true});
  await hookCallbacks.get("ready")();
  assert.equal(game.logOut, original);
  await game.logOut();
  assert.equal(nativeCalls, 1); assert.equal(stored.get("online"), true);
  assert.equal(calls.length, 0); assert.equal(writes.length, 0);
});

test("native 14.368 logout navigates without announcing OFFLINE", async t => {
  const core = process.env.FOUNDRY_APP_PATH;
  if (!core) {t.skip("FOUNDRY_APP_PATH required"); return;}
  const source = await readFile(path.join(core, "client/game.mjs"), "utf8");
  const start = source.indexOf("  logOut() {"), end = source.indexOf("\n  }", start) + 4;
  assert.ok(start > 0 && end > start);
  const method = source.slice(start, end).replace("logOut()", "function logOut()");
  const target = {location: {href: ""}};
  const original = new Function("window", "getRoute", "return (" + method + ");")(target, route => "/prefix/" + route);
  globalThis.game = {...game, logOut: original};
  stored.set("online", true);
  await hookCallbacks.get("ready")();
  game.logOut();
  assert.equal(target.location.href, "/prefix/join");
  assert.equal(stored.get("online"), true); assert.equal(calls.length, 0);
});
for (const [name, input, expected] of [
  ["present", "Zur Spielwelt", "🔗 [Zur Spielwelt](https://foundry.example.org/)"],
  ["empty", "", "🔗 https://foundry.example.org/"],
  ["whitespace", " \t\n ", "🔗 https://foundry.example.org/"],
  ["brackets", "Spiel [heute]", "🔗 [Spiel \\[heute\\]](https://foundry.example.org/)"],
  ["parentheses", "Zur (Spielwelt)", "🔗 [Zur \\(Spielwelt\\)](https://foundry.example.org/)"],
  ["formatting", "A\\B *C* _D_ |F|", "🔗 [A\\\\B \\*C\\* \\_D\\_ \\|F\\|](https://foundry.example.org/)"]
]) test("optional link text: " + name, () => {
  const config = normalizeConfig({...goodConfig(), serverUrl: "https://foundry.example.org", onlineLinkText: input});
  assert.doesNotThrow(() => validateConfig(config));
  const embed = buildPayload(config, true).embeds[0];
  assert.equal(embed.url, "https://foundry.example.org/");
  assert.equal(embed.description, config.onlineDescription + "\n\n" + expected);
  assert.equal(embed.fields, undefined);
});

test("URL parentheses cannot terminate the Markdown destination", () => {
  const config = {...goodConfig(), serverUrl: "https://foundry.example.org/game(test)?x=(today)", onlineLinkText: "Play"};
  const embed = buildPayload(config, true).embeds[0];
  assert.equal(embed.url, config.serverUrl);
  assert.ok(embed.description.endsWith("🔗 [Play](https://foundry.example.org/game%28test%29?x=%28today%29)"));
});

test("empty link text survives save and reopen; only a missing value gets the default", async () => {
  const app = new WorldStatusSettings(); app.element = {querySelector: () => ({})};
  for (const onlineLinkText of ["", " \t "]) {
    await WorldStatusSettings.save.call(app, {}, {}, {object: {...goodConfig(), onlineLinkText}});
    assert.equal(readConfig().onlineLinkText, "");
    const fields = (await app._prepareContext({})).groups.flatMap(group => group.fields);
    const field = fields.find(field => field.key === "onlineLinkText");
    assert.equal(field.value, ""); assert.equal(field.required, false);
    assert.equal(notifications.at(-1).level, "info");
  }
  const saved = stored.get("configuration"); delete saved.onlineLinkText;
  assert.equal(readConfig().onlineLinkText, "Zur Spielwelt");
});

test("ONLINE description limit includes separators, escaped label and URL encoding", () => {
  const config = {...goodConfig(), onlineDescription: "", onlineLinkText: "Spiel [heute]", serverUrl: "https://foundry.example.org/(game)"};
  const linkLength = buildPayload(config, true).embeds[0].description.length;
  config.onlineDescription = "x".repeat(4096 - linkLength - 2);
  assert.equal(buildPayload(config, true).embeds[0].description.length, 4096);
  config.onlineDescription += "x";
  assert.throws(() => buildPayload(config, true), {code: "onlineDescriptionLength"});
});

test("aggregate embed boundary counts exactly generated content with and without label", () => {
  for (const onlineLinkText of ["", "Spiel [heute] (jetzt)"]) {
    const config = {...goodConfig(), onlineTitle: "x".repeat(256), onlineDescription: "", onlineFooter: "x".repeat(2048), onlineLinkText};
    const linkLength = buildPayload(config, true).embeds[0].description.length;
    config.onlineDescription = "x".repeat(6000 - 256 - 2048 - linkLength - 2);
    const embed = buildPayload(config, true).embeds[0];
    assert.equal(embed.title.length + embed.description.length + embed.footer.text.length, 6000);
    config.onlineDescription += "x";
    assert.throws(() => buildPayload(config, true), {code: "embedLength"});
  }
});

test("preview uses safe link text or validated raw URL and removes unsafe href", () => {
  const nodes = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {style: {}, removeAttribute(key) {delete this[key];}});
    return nodes.get(selector);
  };
  const app = new WorldStatusSettings();
  app.element = {querySelector: () => ({querySelector: node})};
  for (const onlineLinkText of ["Zur Spielwelt", "", " \t ", "<img src=x onerror=alert(1)>"]) {
    app.currentValues = () => normalizeConfig({...goodConfig(), serverUrl: "https://foundry.example.org", onlineLinkText});
    app.updatePreview();
    const link = node(".fws-preview-link");
    assert.equal(link.href, "https://foundry.example.org/");
    assert.equal(link.textContent, onlineLinkText.trim() || "https://foundry.example.org/");
    assert.equal(link.innerHTML, undefined);
  }
  app.currentValues = () => ({...goodConfig(), serverUrl: "javascript:alert(1)", onlineLinkText: ""});
  app.updatePreview();
  assert.equal(node(".fws-preview-link").href, undefined);
});

test("partial settings save reports no success and succeeds on retry", async () => {
  const originalSet = game.settings.set;
  const app = new WorldStatusSettings(); app.element = {querySelector: () => ({})};
  game.settings.set = async (...args) => {
    if (args[1] === "configuration") throw new Error(fakeWebhook);
    return originalSet(...args);
  };
  const config = {...goodConfig(), onlineTitle: "Retry title", webhookUrl: fakeWebhook.replace("discord.com", "canary.discord.com")};
  try {
    await WorldStatusSettings.save.call(app, {}, {}, {object: config});
    assert.equal(readConfig().webhookUrl, config.webhookUrl);
    assert.notEqual(readConfig().onlineTitle, config.onlineTitle);
    assert.equal(notifications.some(n => n.level === "info"), false);
    assert.equal(notifications.at(-1).message, lookup("FWS.errors.settingsSave"));
    assert.equal(JSON.stringify({logs, notifications}).includes(fakeWebhook), false);
  } finally { game.settings.set = originalSet; }
  await WorldStatusSettings.save.call(app, {}, {}, {object: config});
  assert.equal(readConfig().onlineTitle, config.onlineTitle);
  assert.equal(notifications.at(-1).level, "info");
});
