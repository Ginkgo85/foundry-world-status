import {test, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {readFile, readdir} from "node:fs/promises";
import path from "node:path";
import {languagePreference, languageSettingKey, prepareLanguage, registerLanguage, t} from "../scripts/localization.js";
import {DEFAULTS, LOCALIZED_DEFAULTS, MODULE_ID, readConfig, saveConfig, reportError, WorldStatusError} from "../scripts/config.js";

const dictionaries = Object.fromEntries(await Promise.all(["de", "en"].map(async language => [
  language, JSON.parse(await readFile("lang/" + language + ".json", "utf8"))
])));
const property = (object, key) => key.split(".").reduce((value, part) => value?.[part], object);
class LocalizationMock {
  constructor(language) {this.lang = language; this.translations = {}; this._fallback = dictionaries.en;}
  localize(key, data) {
    const text = property(this.translations, key) ?? property(this._fallback, key) ?? key;
    return data ? text.replace(/{([^}]+)}/g, (_, key) => data[key]) : text;
  }
  format(key, data) {return this.localize(key, data);}
}
const apps = new Set();
class AppMock {
  constructor() {apps.add(this);}
  static instances() {return apps.values();}
  async _prepareContext() {return {};}
  async render() {this.context = await this._prepareContext({}); return this;}
}
let values, registrations, writes, notices, requests;
function selectFoundry(language) {
  game.i18n = new LocalizationMock(language);
  game.i18n.translations = dictionaries[language] ?? {};
}
function changeUser(id, isGM) {game.user = {id, isGM}; game.userId = id;}
function setup() {
  values = new Map(); registrations = new Map(); writes = []; notices = []; requests = []; apps.clear();
  globalThis.CONFIG = {debug: {i18n: false}};
  globalThis.foundry = {
    helpers: {Localization: LocalizationMock},
    utils: {getProperty: property},
    applications: {api: {ApplicationV2: AppMock, HandlebarsApplicationMixin: cls => cls}},
    data: {fields: {BooleanField: class {}}}
  };
  globalThis.game = {ready: true, world: {id: "world-a"}, userId: "gm-a", user: {id: "gm-a", isGM: true}, settings: {
    register: (_module, key, config) => {registrations.set(key, config); if (!values.has(key)) values.set(key, structuredClone(config.default));},
    registerMenu: (_module, key, config) => registrations.set("menu", config),
    get: (_module, key) => structuredClone(values.get(key)),
    set: async (_module, key, value) => {
      writes.push({key, value: structuredClone(value)});
      values.set(key, structuredClone(value)); registrations.get(key)?.onChange?.(value);
    }
  }};
  selectFoundry("de");
  globalThis.ui = {notifications: Object.fromEntries(["info", "warn", "error"].map(level => [level, message => notices.push({level, message})]))};
  globalThis.fetch = async url => {
    const name = new URL(url).pathname.split("/").at(-1).replace(".json", "");
    requests.push(String(url));
    assert.ok(["de", "en"].includes(name), "language changes may fetch only module dictionaries");
    return {ok: true, json: async () => structuredClone(dictionaries[name])};
  };
}
setup();
const {registerSettings, WorldStatusSettings, refreshLanguage} = await import("../scripts/settings.js");
beforeEach(() => {setup(); registerSettings(() => {});});
async function choose(value) {await game.settings.set(MODULE_ID, languageSettingKey(), value); await refreshLanguage();}

function flatten(object, prefix = "") {
  return Object.entries(object).flatMap(([key, value]) => typeof value === "string" ? [[prefix + key, value]] : flatten(value, prefix + key + "."));
}
test("German and English JSON have exactly the same nonempty keys and formatting placeholders", () => {
  const de = new Map(flatten(dictionaries.de)), en = new Map(flatten(dictionaries.en));
  assert.deepEqual([...de.keys()].sort(), [...en.keys()].sort());
  for (const [key, value] of de) {
    assert.ok(en.get(key).trim(), key);
    assert.deepEqual(value.match(/{[^}]+}/g)?.sort() ?? [], en.get(key).match(/{[^}]+}/g)?.sort() ?? [], key);
  }
});
test("every field, hint, default, group and literal UI/error key exists in both languages", async () => {
  const {GROUPS} = await import("../scripts/config.js");
  const keys = ["confirmYes", "confirmNo", "testMessage"];
  for (const key of Object.keys(DEFAULTS)) keys.push("fields." + key, "hints." + key);
  for (const key of LOCALIZED_DEFAULTS) keys.push("defaults." + key);
  for (const group of GROUPS) keys.push("groups." + group.id);
  for (const file of await readdir("scripts")) {
    const source = await readFile("scripts/" + file, "utf8");
    for (const match of source.matchAll(/\bt\("([^"]+)"/g)) keys.push(match[1]);
    for (const match of source.matchAll(/new WorldStatusError\("([^"]+)"/g)) keys.push("errors." + match[1]);
  }
  const template = await readFile("templates/settings.hbs", "utf8");
  for (const match of template.matchAll(/@root\.i18n\.([A-Za-z]+)/g)) keys.push(match[1]);
  for (const language of ["de", "en"]) for (const key of keys) assert.equal(typeof property(dictionaries[language], "FWS." + key), "string", language + ": " + key);
});
for (const [foundryLanguage, override, expected] of [
  ["de", "auto", "de"], ["en", "auto", "en"], ["en", "de", "de"], ["de", "en", "en"],
  ["fr", "auto", "en"], ["de", "invalid", "de"], ["en", null, "en"], ["de", "", "de"]
]) {
  test("Foundry " + foundryLanguage + " / preference " + override + " resolves to " + expected, async () => {
    selectFoundry(foundryLanguage); await choose(override);
    assert.equal(t("save"), dictionaries[expected].FWS.save);
    assert.equal(t("errors.length", {field: "test", limit: 8}), dictionaries[expected].FWS.errors.length.replace("{field}", "test").replace("{limit}", "8"));
    assert.equal(game.i18n.lang, foundryLanguage);
  });
}
test("existing installations and missing user identity safely use Automatic", () => {
  values.delete(languageSettingKey());
  assert.equal(languagePreference(), "auto");
  changeUser(null, false);
  assert.equal(languageSettingKey(), null); assert.equal(languagePreference(), "auto");
});
test("native GM language setting stays client-only, defaults to Automatic and needs no reload", () => {
  const config = registrations.get(languageSettingKey());
  assert.equal(config.scope, "client"); assert.equal(config.config, true);
  assert.equal(config.default, "auto"); assert.equal(config.requiresReload, false);
  assert.deepEqual(Object.keys(config.choices), ["auto", "de", "en"]);
  assert.equal(config.restricted, undefined);
  assert.deepEqual(Object.keys(registrations.get("configuration").default).filter(key => LOCALIZED_DEFAULTS.includes(key)), []);
});
for (const [first, second, firstGM, secondGM] of [
  ["gm-a", "gm-b", true, true], ["gm-a", "player-b", true, false], ["player-a", "gm-b", false, true]
]) {
  test(first + " language changes never affect " + second + " in the same browser", async () => {
    changeUser(first, firstGM); registerLanguage(() => {}); const firstKey = languageSettingKey();
    await choose("en"); assert.equal(t("save"), dictionaries[firstGM ? "en" : "de"].FWS.save);
    changeUser(second, secondGM); registerLanguage(() => {});
    const secondKey = languageSettingKey();
    assert.notEqual(firstKey, secondKey); assert.equal(languagePreference(), "auto");
    assert.equal(t("save"), dictionaries.de.FWS.save);
    await choose("de");
    changeUser(first, firstGM); assert.equal(languagePreference(), firstGM ? "en" : "auto"); assert.equal(t("save"), dictionaries[firstGM ? "en" : "de"].FWS.save);
    assert.equal(values.get(firstKey), "en");
    assert.ok(writes.every(write => [firstKey, secondKey].includes(write.key)));
  });
}
test("preferences are isolated across worlds and another browser starts on Automatic", async () => {
  await choose("en"); game.world.id = "world-b"; registerLanguage(() => {});
  assert.equal(languagePreference(), "auto");
  game.world.id = "world-a"; assert.equal(languagePreference(), "en");
  values.delete(languageSettingKey()); assert.equal(languagePreference(), "auto");
});
test("all saved configuration values, explicit empty fields, webhook and status survive language changes", async () => {
  const config = {...DEFAULTS, onlineTitle: "Die Spielrunde beginnt!", onlineDescription: "", onlineLinkText: "",
    offlineTitle: "Individuell", onlineFooter: "Mein Footer", offlineDescription: "Custom offline",
    offlineFooter: "", content: "Freier Text", username: "Custom", serverUrl: "https://example.invalid",
    onlineThumbnail: "https://example.invalid/a.png", onlineImage: "https://example.invalid/b.png",
    avatarUrl: "https://example.invalid/c.png", roleId: "123456789012345678"};
  values.set("configuration", config);
  values.set("webhooks", {[JSON.stringify([game.world.id, game.user.id])]: "synthetic-credential"});
  values.set("online", true);
  const before = readConfig(), serialized = JSON.stringify(config);
  for (const language of ["en", "de", "auto"]) {
    await choose(language);
    assert.deepEqual(readConfig(), before);
    assert.equal(JSON.stringify(values.get("configuration")), serialized);
    assert.equal(values.get("online"), true);
  }
  assert.ok(writes.every(write => write.key === languageSettingKey()));
});
test("unsaved defaults follow the module language; once saved even former defaults and empty strings stay unchanged", async () => {
  assert.equal(readConfig().onlineTitle, dictionaries.de.FWS.defaults.onlineTitle);
  await choose("en");
  assert.equal(readConfig().onlineTitle, dictionaries.en.FWS.defaults.onlineTitle);
  const config = {...readConfig(), onlineLinkText: ""};
  await saveConfig(config);
  await choose("de");
  assert.deepEqual(readConfig(), config);
});
test("open module windows preserve draft text and rerender through the public API", async () => {
  const app = new WorldStatusSettings(); app.rendered = true;
  const draft = {...readConfig(), onlineTitle: "  Unsaved [draft]  ", onlineLinkText: ""};
  app.formValues = () => structuredClone(draft);
  await choose("en");
  assert.equal(app.context.i18n.save, dictionaries.en.FWS.save);
  assert.equal(app.context.groups.flatMap(g => g.fields).find(f => f.key === "onlineTitle").value, draft.onlineTitle);
  assert.equal(values.get("configuration").onlineTitle, undefined);
  assert.equal(app.title, dictionaries.en.FWS.menuName);
});
test("players cannot open the GM configuration even with a legacy language override", async () => {
  changeUser("player", false); registerLanguage(() => {}); await choose("en");
  await assert.rejects(new WorldStatusSettings()._prepareContext({}), {code: "gmOnly"});
});
test("language changes do not send Discord messages, change status, or modify global dictionaries", async () => {
  const before = JSON.stringify(game.i18n.translations); values.set("online", true);
  for (const value of ["en", "de", "auto"]) await choose(value);
  assert.equal(JSON.stringify(game.i18n.translations), before); assert.equal(game.i18n.lang, "de");
  assert.equal(values.get("online"), true);
  assert.ok(requests.every(url => /lang\/(de|en)\.json$/.test(url)));
  assert.ok(writes.every(write => write.key === languageSettingKey()));
});
test("notifications, field labels, tooltips and preview chrome use the selected language", async () => {
  await choose("en");
  const context = await new WorldStatusSettings()._prepareContext({});
  assert.equal(context.i18n.preview, dictionaries.en.FWS.preview);
  assert.equal(context.i18n.test, dictionaries.en.FWS.test);
  for (const field of context.groups.flatMap(group => group.fields)) {
    assert.equal(field.label, dictionaries.en.FWS.fields[field.key]);
    assert.equal(field.hint, dictionaries.en.FWS.hints[field.key]);
  }
  assert.equal(t("tooltipOn"), dictionaries.en.FWS.tooltipOn);
  assert.equal(t("tooltipOff"), dictionaries.en.FWS.tooltipOff);
  const original = console.error; console.error = () => {};
  try { reportError(new WorldStatusError("webhook")); } finally {console.error = original;}
  assert.equal(notices.at(-1).message, dictionaries.en.FWS.errors.webhook);
});
test("runtime and template have no hard-coded German interface strings or global language mutations", async () => {
  for (const file of [...(await readdir("scripts")).map(name => "scripts/" + name), "templates/settings.hbs"]) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, /Spielwelt|Verbindung erfolgreich|Einstellungen speichern|Nachricht senden|Spielleiter|Welt schließen/);
    assert.doesNotMatch(source, /game\.i18n\s*=|game\.i18n\.(lang|translations)\s*=|\.setLanguage\(|\.socket\./);
  }
});
test("actual Foundry 14.368 Localization translates isolated dictionaries without altering global language", async context => {
  const core = process.env.FOUNDRY_APP_PATH;
  if (!core) {context.skip("FOUNDRY_APP_PATH required"); return;}
  const metadata = JSON.parse(await readFile(path.join(core, "package.json"), "utf8"));
  assert.equal(metadata.release.build, 368);
  let source = await readFile(path.join(core, "client/helpers/localization.mjs"), "utf8");
  source = source.replace(/^import .*;\r?$/gm, "");
  const {default: NativeLocalization} = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
  for (const language of ["de", "en"]) {
    const translator = new NativeLocalization(language); translator.translations = dictionaries[language];
    assert.equal(translator.localize("FWS.save"), dictionaries[language].FWS.save);
    assert.equal(translator.format("FWS.errors.required", {field: "Test"}), dictionaries[language].FWS.errors.required.replace("{field}", "Test"));
  }
  assert.equal(game.i18n.lang, "de");
});
test("actual client storage separates language keys without any server or world write", async context => {
  const core = process.env.FOUNDRY_APP_PATH;
  if (!core) {context.skip("FOUNDRY_APP_PATH required"); return;}
  const source = await readFile(path.join(core, "client/helpers/client-settings.mjs"), "utf8");
  const start = source.indexOf("  #setClient("), end = source.indexOf("\n  }", start) + 4;
  assert.ok(start > 0 && end > start);
  const method = source.slice(start, end).replace("#setClient(", "setClient(").replaceAll("this.#cleanJSON", "this.cleanJSON");
  const entries = new Map();
  class Setting {constructor(data) {Object.assign(this, data);}}
  const api = new Function("Setting", "Hooks", "return ({" + method + "});")(Setting, {callAll: () => {}});
  api.storage = new Map([["client", {getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value)}]]);
  api.cleanJSON = (_setting, value) => JSON.stringify(value);
  const a = MODULE_ID + "." + languageSettingKey();
  changeUser("player-b", false);
  const b = MODULE_ID + "." + languageSettingKey();
  api.setClient({id: a}, "en", {}); api.setClient({id: b}, "de", {});
  assert.equal(entries.get(a), '"en"'); assert.equal(entries.get(b), '"de"');
  assert.deepEqual(writes, []);
});

test("English shutdown confirmation localizes title and both buttons without sending when canceled", async () => {
  await choose("en");
  values.set("configuration", {...DEFAULTS, autoOfflineOnShutdown: true});
  values.set("online", true); game.users = [{active: true, isSelf: false}]; game.shutDown = async () => {};
  let dialogs = 0;
  foundry.applications.api.DialogV2 = {confirm: async options => {
    dialogs++;
    assert.equal(options.window.title, dictionaries.en.FWS.shutdownTitle);
    assert.equal(options.yes.label, "Yes"); assert.equal(options.no.label, "No");
    assert.ok(options.content.includes("1 other users"));
    return false;
  }};
  const {installShutdownHandler} = await import("../scripts/shutdown.js");
  installShutdownHandler(); await game.shutDown();
  assert.equal(dialogs, 1); assert.equal(values.get("online"), true);
  assert.ok(requests.every(url => /lang\/(de|en)\.json$/.test(url)));
});
test("English connection test uses translated text and keeps status and mention restrictions", async () => {
  await choose("en");
  const before = values.get("online"); let payload;
  globalThis.fetch = async (_url, options) => {
    payload = JSON.parse(options.body.get("payload_json"));
    return {ok: true, status: 200, json: async () => ({id: "123456789012345678"})};
  };
  const previousNow = Date.now; Date.now = () => previousNow() + 5000;
  try {
    await WorldStatusSettings.testConnection.call({currentValues: () => ({
      webhookUrl: "https://discord.com/api/webhooks/" + "1".repeat(18) + "/" + "synthetic_".repeat(5)
    })}, {}, {});
  } finally {Date.now = previousNow;}
  assert.equal(payload.content, dictionaries.en.FWS.testMessage);
  assert.deepEqual(payload.allowed_mentions, {parse: [], users: [], roles: [], replied_user: false});
  assert.equal(values.get("online"), before);
  assert.equal(notices.at(-1).message, dictionaries.en.FWS.testSuccess);
});
test("failed dictionary loading falls back safely and permits a later retry", async () => {
  const isolated = await import("../scripts/localization.js?failed-load-test");
  values.set(languageSettingKey(), "en");
  globalThis.fetch = async () => ({ok: false});
  await assert.rejects(isolated.prepareLanguage(), /languageLoad/);
  assert.equal(isolated.t("save"), dictionaries.de.FWS.save);
  globalThis.fetch = async () => ({ok: true, json: async () => dictionaries.en});
  await isolated.prepareLanguage();
  assert.equal(isolated.t("save"), dictionaries.en.FWS.save);
  assert.deepEqual(writes, []);
});

test("language visibility is resolved after init when the user document becomes available", () => {
  const user = game.user; delete game.user;
  registerLanguage(() => {});
  const setting = registrations.get(languageSettingKey());
  assert.equal(setting.config, false);
  game.user = user; assert.equal(setting.config, true);
  game.user.isGM = false; assert.equal(setting.config, false);
  assert.equal(setting.scope, "client"); assert.deepEqual(writes, []);
});

test("language UI requires an explicit true GM flag", () => {
  const setting = registrations.get(languageSettingKey());
  for (const value of [false, undefined, null, 0, 1, "true"]) {
    game.user.isGM = value; assert.equal(setting.config, false);
    assert.equal(languagePreference(), "auto");
  }
  game.user.isGM = true; assert.equal(setting.config, true);
});

for (const language of ["de", "en"]) test("player uses Foundry " + language + " without erasing an old override", async () => {
  changeUser("player-old", false); selectFoundry(language); registerLanguage(() => {});
  const key = languageSettingKey(), stored = language === "de" ? "en" : "de";
  values.set(key, stored); const before = JSON.stringify([...values]);
  await prepareLanguage();
  assert.equal(languagePreference(), "auto");
  assert.equal(t("save"), dictionaries[language].FWS.save);
  assert.equal(registrations.get(key).config, false);
  assert.equal(JSON.stringify([...values]), before);
  assert.deepEqual(writes, []); assert.deepEqual(requests, []);
  game.user.isGM = true; await prepareLanguage();
  assert.equal(languagePreference(), stored);
  assert.equal(registrations.get(key).config, true);
  assert.equal(t("save"), dictionaries[stored].FWS.save);
});

test("actual Core settings category omits the complete player language field and hint", async context => {
  const core = process.env.FOUNDRY_APP_PATH;
  if (!core) {context.skip("FOUNDRY_APP_PATH required"); return;}
  const source = (await readFile(path.join(core, "client/applications/settings/config.mjs"), "utf8"))
    .replace(/^import CategoryBrowser .*;\r?$/m, "const CategoryBrowser = class {};");
  const {default: SettingsConfig} = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
  globalThis.CONST = {SETTING_SCOPES: {WORLD: "world"}};
  globalThis._loc = key => game.i18n.localize(key);
  foundry.documents = {BaseSetting: {_ALLOWED_ASSISTANT_KEYS: [], _GAMEMASTER_ONLY_KEYS: []}};
  foundry.data.fields.DataField = class {};
  foundry.data.fields.StringField = class {constructor(options) {Object.assign(this, options);}};
  const setting = registrations.get(languageSettingKey());
  setting.namespace = MODULE_ID; setting.key = languageSettingKey();
  game.settings.settings = new Map([[setting.key, setting]]); game.settings.menus = new Map();
  game.user.can = () => game.user.isGM === true;
  const app = {_categorizeEntry: id => ({id, label: "Foundry World Status"})};
  const render = () => SettingsConfig.prototype._prepareCategoryData.call(app);
  assert.equal(render()[MODULE_ID].entries.length, 1);
  const field = render()[MODULE_ID].entries[0].field;
  assert.equal(field.label, t("language.name")); assert.equal(field.hint, t("language.hint"));
  assert.deepEqual(Object.keys(field.choices), ["auto", "de", "en"]);
  game.user.isGM = false;
  assert.deepEqual(render(), {}); // No category, field, label, hint or placeholder.
  assert.deepEqual(writes, []);
});
