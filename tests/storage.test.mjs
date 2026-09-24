import {test, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import path from "node:path";
import {DEFAULTS, MODULE_ID, migrateWebhook, readConfig, readLocalWebhook, saveConfig, reportError} from "../scripts/config.js";

// Artificial values are assembled at runtime. No real credential is used.
const secret = ["synthetic", "credential"].join("-");
let shared, local, writes, failLocal, failWorld, corruptLocal, logs;
beforeEach(() => {
  shared = {...DEFAULTS, webhookUrl: secret, onlineTitle: "Keep this title"};
  local = {}; writes = []; logs = []; failLocal = failWorld = corruptLocal = false;
  globalThis.game = {
    world: {id: "world-a"}, user: {id: "gm-a", isGM: true},
    i18n: {localize: key => key, format: key => key},
    settings: {
      get: (namespace, key) => {
        assert.equal(namespace, MODULE_ID);
        return structuredClone(key === "configuration" ? shared : local);
      },
      set: async (namespace, key, value) => {
        assert.equal(namespace, MODULE_ID);
        if ((key === "webhooks" && failLocal) || (key === "configuration" && failWorld)) throw new Error(secret);
        writes.push({key, value: structuredClone(value)});
        if (key === "configuration") shared = structuredClone(value);
        else if (!corruptLocal) local = structuredClone(value);
      }
    }
  };
  globalThis.ui = {notifications: {error: value => logs.push(value)}};
});

test("migration copies and verifies before clearing the shared secret and preserves message settings", async () => {
  await migrateWebhook();
  assert.equal(readLocalWebhook(), secret);
  assert.equal(shared.webhookUrl, undefined);
  assert.equal(shared.onlineTitle, "Keep this title");
  assert.deepEqual(writes.map(w => w.key), ["webhooks", "configuration"]);
  assert.equal(JSON.stringify(writes[1]).includes(secret), false);
});

test("repeated and concurrent migration is idempotent in one browser", async () => {
  await Promise.all([migrateWebhook(), migrateWebhook()]);
  await migrateWebhook();
  assert.equal(writes.length, 2);
});

test("local storage failure retains the shared credential", async () => {
  failLocal = true;
  await assert.rejects(migrateWebhook(), {code: "localStorage"});
  assert.equal(shared.webhookUrl, secret); assert.deepEqual(writes, []);
});

test("failed local readback never clears the shared credential", async () => {
  corruptLocal = true;
  await assert.rejects(migrateWebhook(), {code: "localStorage"});
  assert.equal(shared.webhookUrl, secret);
  assert.equal(writes.some(w => w.key === "configuration"), false);
});

test("world cleanup failure keeps both copies and can be retried", async () => {
  failWorld = true;
  await assert.rejects(migrateWebhook(), {code: "migrationFailed"});
  assert.equal(shared.webhookUrl, secret); assert.equal(readLocalWebhook(), secret);
  failWorld = false;
  await migrateWebhook();
  assert.equal(shared.webhookUrl, undefined); assert.equal(readLocalWebhook(), secret);
});

test("a conflicting local credential is neither overwritten nor removed", async () => {
  local[JSON.stringify(["world-a", "gm-a"])] = "different-synthetic-value";
  await assert.rejects(migrateWebhook(), {code: "migrationConflict"});
  assert.equal(shared.webhookUrl, secret); assert.equal(readLocalWebhook(), "different-synthetic-value");
  assert.deepEqual(writes, []);
});

test("world or GM switching never selects another entry and new browsers start empty", async () => {
  await migrateWebhook();
  game.world.id = "world-b"; assert.equal(readLocalWebhook(), "");
  game.world.id = "world-a"; game.user.id = "gm-b"; assert.equal(readLocalWebhook(), "");
  game.user.id = "gm-a"; assert.equal(readLocalWebhook(), secret);
  local = {}; assert.equal(readLocalWebhook(), "");
});

test("new saves keep the credential out of world settings and allow local deletion", async () => {
  shared = {...DEFAULTS, webhookUrl: ""};
  await saveConfig({...DEFAULTS, webhookUrl: secret});
  assert.equal(readConfig().webhookUrl, secret); assert.equal(shared.webhookUrl, undefined);
  assert.equal(writes.filter(w => w.key === "configuration").some(w => JSON.stringify(w).includes(secret)), false);
  await saveConfig({...DEFAULTS, webhookUrl: ""});
  assert.equal(readLocalWebhook(), ""); assert.deepEqual(local, {});
});

test("failed shared configuration save preserves its old values and the verified local copy", async () => {
  delete shared.webhookUrl; failWorld = true;
  await assert.rejects(saveConfig({...DEFAULTS, webhookUrl: secret, onlineTitle: "New title"}), error => {
    assert.equal(error.code, "settingsSave");
    assert.equal(error.message.includes(secret), false);
    assert.equal(JSON.stringify(error).includes(secret), false);
    return true;
  });
  assert.equal(readLocalWebhook(), secret);
  assert.equal(shared.onlineTitle, "Keep this title");
  failWorld = false;
  await saveConfig({...DEFAULTS, webhookUrl: secret, onlineTitle: "New title"});
  assert.equal(readConfig().onlineTitle, "New title");
  assert.equal(readLocalWebhook(), secret);
});

test("players cannot read, save or migrate the credential", async () => {
  game.user.isGM = false;
  assert.throws(readLocalWebhook, {code: "gmOnly"});
  await assert.rejects(migrateWebhook(), {code: "gmOnly"});
  await assert.rejects(saveConfig(DEFAULTS), {code: "gmOnly"});
  assert.deepEqual(writes, []);
});

test("missing world/user identity never writes a shared local entry", async () => {
  game.world = null;
  await assert.rejects(migrateWebhook(), {code: "localStorage"});
  assert.deepEqual(writes, []); assert.equal(shared.webhookUrl, secret);
});

test("migration errors never expose credentials in logs or notifications", async () => {
  failWorld = true;
  const originalError = console.error;
  console.error = (...args) => logs.push(args);
  try { await migrateWebhook().catch(reportError); }
  finally { console.error = originalError; }
  assert.equal(JSON.stringify(logs).includes(secret), false);
});

test("a shared credential changed during copy is not overwritten by cleanup", async () => {
  const originalSet = game.settings.set;
  game.settings.set = async (...args) => {
    await originalSet(...args);
    if (args[1] === "webhooks") shared.webhookUrl = "new-synthetic-value";
  };
  await assert.rejects(migrateWebhook(), {code: "migrationConflict"});
  assert.equal(shared.webhookUrl, "new-synthetic-value");
  assert.equal(readLocalWebhook(), secret);
});

test("another GM completing cleanup does not turn a verified copy into a conflict", async () => {
  const originalSet = game.settings.set;
  game.settings.set = async (...args) => {
    await originalSet(...args);
    if (args[1] === "webhooks") delete shared.webhookUrl;
  };
  await migrateWebhook();
  assert.equal(readLocalWebhook(), secret);
  assert.equal(writes.filter(w => w.key === "configuration").length, 0);
});

test("Foundry 14.368 client settings use browser storage without a world write", async t => {
  const core = process.env.FOUNDRY_APP_PATH;
  if (!core) {t.skip("FOUNDRY_APP_PATH required"); return;}
  const source = await readFile(path.join(core, "client/helpers/client-settings.mjs"), "utf8");
  const start = source.indexOf("  #setClient("), end = source.indexOf("\n  }", start) + 4;
  assert.ok(start > 0 && end > start);
  const method = source.slice(start, end).replace("#setClient(", "setClient(").replaceAll("this.#cleanJSON", "this.cleanJSON");
  const localStorage = new Map();
  const storage = {getItem: key => localStorage.get(key), setItem: (key, value) => localStorage.set(key, value)};
  class SettingMock {constructor(data) {Object.assign(this, data);}}
  const container = new Function("Setting", "Hooks", "return ({" + method + "});")(SettingMock, {callAll: () => {}});
  container.storage = new Map([["client", storage]]);
  container.cleanJSON = (_setting, value) => JSON.stringify(value);
  container.setClient({id: "foundry-world-status.webhooks"}, {test: secret}, {});
  assert.equal(localStorage.get("foundry-world-status.webhooks"), JSON.stringify({test: secret}));
  assert.deepEqual(writes, []);
});
