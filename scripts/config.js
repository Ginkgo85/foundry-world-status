export const MODULE_ID = "foundry-world-status";
export const TOOL_ID = "foundry-world-status";
export const t = (key, data) => data
  ? game.i18n.format(`FWS.${key}`, data) : game.i18n.localize(`FWS.${key}`);

// Message configuration and status are shared; webhook credentials stay in this browser.
export const DEFAULTS = Object.freeze({
  webhookUrl: "",
  serverUrl: "",
  sendOffline: true,
  autoOfflineOnShutdown: false,
  onlineTitle: "🎲 Spielwelt ist ONLINE",
  onlineDescription: "Die Spielwelt ist geöffnet. Ihr könnt euch jetzt verbinden.",
  onlineLinkText: "Zur Spielwelt",
  onlineColor: "#2ecc71",
  onlineFooter: "Foundry Virtual Tabletop",
  onlineThumbnail: "",
  onlineImage: "",
  username: "Foundry VTT",
  avatarUrl: "",
  offlineTitle: "🔴 Spielwelt ist OFFLINE",
  offlineDescription: "Die Spielrunde ist beendet. Die Spielwelt wurde als OFFLINE angekündigt.",
  offlineColor: "#e74c3c",
  offlineFooter: "Foundry Virtual Tabletop",
  content: "",
  roleId: ""
});

export const GROUPS = [
  {id: "connection", keys: ["webhookUrl", "serverUrl", "username", "avatarUrl"]},
  {id: "online", keys: ["onlineTitle", "onlineDescription", "onlineLinkText", "onlineColor", "onlineFooter", "onlineThumbnail", "onlineImage"]},
  {id: "offline", keys: ["sendOffline", "autoOfflineOnShutdown", "offlineTitle", "offlineDescription", "offlineColor", "offlineFooter"]},
  {id: "mentions", keys: ["content", "roleId"]}
];

export const LIMITS = Object.freeze({
  webhookUrl: 512, serverUrl: 1024, username: 80, avatarUrl: 2048,
  onlineTitle: 256, onlineDescription: 4096, onlineLinkText: 254,
  onlineFooter: 2048, onlineThumbnail: 2048, onlineImage: 2048,
  offlineTitle: 256, offlineDescription: 4096, offlineFooter: 2048,
  content: 2000, roleId: 20, onlineColor: 7, offlineColor: 7
});

export function assertGM() {
  if (game.user?.isGM !== true) throw new WorldStatusError("gmOnly");
}

export class WorldStatusError extends Error {
  constructor(code, details = {}) {
    // Error messages contain only controlled codes, never user input or webhook tokens.
    super(code);
    this.name = "WorldStatusError";
    this.code = code;
    this.details = details;
  }
}

export function reportError(error, {test = false} = {}) {
  const safe = error instanceof WorldStatusError ? error : new WorldStatusError("unexpected");
  console.error(`${MODULE_ID} | ${safe.code}`, {
    status: Number(safe.details.status) || undefined,
    seconds: Number(safe.details.seconds) || undefined
  });
  const message = t(`errors.${safe.code}`, safe.details);
  ui.notifications.error(test ? `${t("testFailed")} ${message}` : message);
}

export function readConfig() {
  assertGM();
  const shared = game.settings.get(MODULE_ID, "configuration");
  if (shared?.webhookUrl) throw new WorldStatusError("migrationRequired");
  return {...DEFAULTS, ...shared, webhookUrl: readLocalWebhook()};
}

function localWebhookKey() {
  if (!game.world?.id || !game.user?.id) throw new WorldStatusError("localStorage");
  return JSON.stringify([game.world.id, game.user.id]);
}

export function readLocalWebhook() {
  assertGM();
  try { return game.settings.get(MODULE_ID, "webhooks")[localWebhookKey()] ?? ""; }
  catch { throw new WorldStatusError("localStorage"); }
}

async function writeLocalWebhook(value) {
  assertGM();
  try {
    const entries = {...game.settings.get(MODULE_ID, "webhooks")};
    const key = localWebhookKey();
    if (value) entries[key] = value;
    else delete entries[key];
    await game.settings.set(MODULE_ID, "webhooks", entries);
    if (readLocalWebhook() !== value) throw new Error("writeNotConfirmed");
  } catch { throw new WorldStatusError("localStorage"); }
}

let migration;

/** Verify the local copy before removing the shared secret; failed cleanup is safe to retry. */
export async function migrateWebhook() {
  assertGM();
  if (migration) return migration;
  migration = (async () => {
    const shared = game.settings.get(MODULE_ID, "configuration") ?? {};
    if (!shared.webhookUrl) return;
    const local = readLocalWebhook();
    if (local && local !== shared.webhookUrl) throw new WorldStatusError("migrationConflict");
    await writeLocalWebhook(shared.webhookUrl);
    const latest = game.settings.get(MODULE_ID, "configuration");
    if (!latest?.webhookUrl) return; // Another GM already completed cleanup.
    // Preserve changes another GM made while the local copy was being written.
    if (latest.webhookUrl !== shared.webhookUrl) throw new WorldStatusError("migrationConflict");
    const {webhookUrl: _secret, ...publicConfig} = latest;
    assertGM();
    await game.settings.set(MODULE_ID, "configuration", publicConfig);
  })().catch(error => {
    if (error instanceof WorldStatusError) throw error;
    throw new WorldStatusError("migrationFailed");
  }).finally(() => { migration = undefined; });
  return migration;
}

export async function saveConfig(config) {
  assertGM();
  await migrateWebhook();
  const {webhookUrl: secret, ...publicConfig} = config;
  await writeLocalWebhook(secret);
  assertGM();
  await game.settings.set(MODULE_ID, "configuration", publicConfig);
}

export function normalizeConfig(values) {
  return Object.fromEntries(Object.keys(DEFAULTS).map(key => [key,
    typeof DEFAULTS[key] === "boolean" ? values[key] === true : String(values[key] ?? "").trim()
  ]));
}

export function httpUrl(value, code = "url") {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) throw 0;
    return url.href;
  } catch {
    throw new WorldStatusError(code);
  }
}

export function webhookUrl(value) {
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash
      || !["discord.com", "canary.discord.com", "ptb.discord.com", "discordapp.com"].includes(url.hostname)
      || !/^\/api\/(?:v10\/)?webhooks\/\d{17,20}\/[A-Za-z0-9_-]{20,}\/?$/.test(url.pathname)) throw 0;
    // Only the supported thread parameter is retained. Always request server confirmation.
    const thread = url.searchParams.get("thread_id");
    if (thread && !/^\d{17,20}$/.test(thread)) throw 0;
    url.search = "";
    url.searchParams.set("wait", "true");
    if (thread) url.searchParams.set("thread_id", thread);
    return url.href;
  } catch {
    throw new WorldStatusError("webhook");
  }
}

export function validateConfig(config) {
  // Empty connection values may be saved while setting up or when removing a secret.
  if (config.webhookUrl) webhookUrl(config.webhookUrl);
  if (config.serverUrl) httpUrl(config.serverUrl, "server");
  for (const key of ["avatarUrl", "onlineThumbnail", "onlineImage"]) {
    if (config[key]) httpUrl(config[key]);
  }
  for (const [key, limit] of Object.entries(LIMITS)) {
    if (config[key].length > limit) throw new WorldStatusError("length", {field: t(`fields.${key}`), limit});
  }
  for (const key of ["onlineColor", "offlineColor"]) {
    if (!/^#[0-9a-f]{6}$/i.test(config[key])) throw new WorldStatusError("color");
  }
  for (const key of ["onlineTitle", "offlineTitle", "onlineLinkText", "username"]) {
    if (!config[key]) throw new WorldStatusError("required", {field: t(`fields.${key}`)});
  }
  if (config.roleId && !/^\d{17,20}$/.test(config.roleId)) throw new WorldStatusError("role");
  const content = [config.roleId ? `<@&${config.roleId}>` : "", config.content].filter(Boolean).join(" ");
  if (content.length > 2000) throw new WorldStatusError("contentLength");
  const onlineLength = config.onlineTitle.length + config.onlineDescription.length + config.onlineFooter.length
    + 3 + config.onlineLinkText.length + (config.serverUrl ? httpUrl(config.serverUrl).length : 0);
  const offlineLength = config.offlineTitle.length + config.offlineDescription.length + config.offlineFooter.length;
  if (onlineLength > 6000 || offlineLength > 6000) throw new WorldStatusError("embedLength");
  return config;
}
