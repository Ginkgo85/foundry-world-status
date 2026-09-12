import {WorldStatusError, assertGM, httpUrl, validateConfig, webhookUrl} from "./config.js";

let busy = false;
let nextClickAt = 0;
let rateLimitedUntil = 0;
export const isBusy = () => busy;

/** Shared lock for settings tests and announcements; acquired before the first await. */
export async function runExclusive(job, onBusyChange = () => {}) {
  assertGM();
  if (busy || Date.now() < nextClickAt) return false;
  busy = true;
  try {
    onBusyChange();
    await job();
    return true;
  } finally {
    busy = false;
    nextClickAt = Date.now() + 800;
    onBusyChange();
  }
}

export function buildPayload(config, online) {
  validateConfig(config);
  const prefix = online ? "online" : "offline";
  const embed = {
    title: config[`${prefix}Title`],
    color: Number.parseInt(config[`${prefix}Color`].slice(1), 16)
  };
  if (config[`${prefix}Description`]) embed.description = config[`${prefix}Description`];
  if (config[`${prefix}Footer`]) embed.footer = {text: config[`${prefix}Footer`]};
  if (online) {
    const url = httpUrl(config.serverUrl, "server");
    if (url.length > 1024) throw new WorldStatusError("server");
    embed.url = url;
    embed.fields = [{name: `🔗 ${config.onlineLinkText}`, value: url, inline: false}];
    if (config.onlineThumbnail) embed.thumbnail = {url: httpUrl(config.onlineThumbnail)};
    if (config.onlineImage) embed.image = {url: httpUrl(config.onlineImage)};
  }
  // Role notifications and pre-embed text deliberately apply only to ONLINE announcements.
  const payload = {
    username: config.username,
    embeds: [embed],
    allowed_mentions: {parse: [], users: [], roles: online && config.roleId ? [config.roleId] : [], replied_user: false}
  };
  if (config.avatarUrl) payload.avatar_url = httpUrl(config.avatarUrl);
  if (online) {
    const content = [config.roleId ? `<@&${config.roleId}>` : "", config.content].filter(Boolean).join(" ");
    if (content) payload.content = content;
  }
  return payload;
}

/** Raw fetch errors and Discord response bodies must never be logged: they may contain the token. */
export async function sendWebhook(value, payload) {
  assertGM();
  const url = webhookUrl(value);
  if (Date.now() < rateLimitedUntil) {
    throw new WorldStatusError("rateLimit", {status: 429, seconds: Math.ceil((rateLimitedUntil - Date.now()) / 1000)});
  }
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 15000);
  try {
    // Discord accepts payload_json as multipart form data. Let the browser set
    // Content-Type and its boundary to avoid an unnecessary CORS preflight.
    // Keep normal CORS enforcement and wait=true: an opaque response is not proof of delivery.
    const body = new FormData();
    body.set("payload_json", JSON.stringify(payload));
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      body,
      signal: abort.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error"
    });
    if (response.status === 429) {
      let seconds = Number(response.headers.get("Retry-After"));
      try {
        const data = await response.json();
        if (Number.isFinite(Number(data.retry_after))) seconds = Number(data.retry_after);
      } catch { /* A missing or invalid error body still yields a useful safe error. */ }
      seconds = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 5;
      rateLimitedUntil = Date.now() + seconds * 1000;
      throw new WorldStatusError("rateLimit", {status: 429, seconds});
    }
    if (!response.ok) {
      const code = ({400: "badRequest", 401: "unauthorized", 403: "forbidden", 404: "notFound"})[response.status] ?? "http";
      throw new WorldStatusError(code, {status: response.status});
    }
    // wait=true returns the saved message. Do not mark ONLINE on an unexpected empty response.
    let message;
    try { message = await response.json(); }
    catch { throw new WorldStatusError(abort.signal.aborted ? "timeout" : "confirmation"); }
    if (!message || !/^\d+$/.test(String(message.id ?? ""))) throw new WorldStatusError("confirmation");
  } catch (error) {
    if (error instanceof WorldStatusError) throw error;
    throw new WorldStatusError(abort.signal.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
}
