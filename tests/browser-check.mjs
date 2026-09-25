import {createServer} from "node:http";
import {readFile, mkdir} from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import {createRequire} from "node:module";

const core = process.env.FOUNDRY_APP_PATH;
const runtime = process.env.NODE_DEPENDENCIES;
if (!core || !runtime) throw new Error("FOUNDRY_APP_PATH and NODE_DEPENDENCIES are required.");
const require = createRequire(path.join(runtime, "package.json"));
const {chromium, firefox} = require("playwright");
const browserName = process.env.TEST_BROWSER ?? "chrome";
if (!["chrome", "firefox"].includes(browserName)) throw new Error("TEST_BROWSER must be chrome or firefox.");
const root = path.resolve(".");
const out = path.resolve("validation", browserName); await mkdir(out, {recursive: true});
const types = {".html":"text/html", ".mjs":"text/javascript", ".js":"text/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".woff2":"font/woff2"};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let filename;
    if (url.pathname === "/logout-complete") {
      res.writeHead(200, {"Content-Type":"text/html; charset=utf-8"});
      res.end("<!doctype html><html lang='de'><title>Abmeldung geprüft</title><body><p>Abgemeldet</p></body></html>");
      return;
    }
    if (url.pathname === "/") filename = path.resolve("tests/browser-fixture.html");
    else if (url.pathname === "/handlebars.js") filename = path.join(core, "node_modules/handlebars/dist/handlebars.js");
    else if (url.pathname === "/localization.mjs") {
      const source = (await readFile(path.join(core, "client/helpers/localization.mjs"), "utf8")).replace(/^import .*;\r?$/gm, "");
      res.writeHead(200, {"Content-Type": "text/javascript"}); res.end(source); return;
    }
    else if (url.pathname === "/form-data-extended.mjs") filename = path.join(core, "client/applications/ux/form-data-extended.mjs");
    else if (url.pathname === "/scene-controls-tools.hbs") filename = path.join(core, "templates/ui/scene-controls-tools.hbs");
    else {
      const isModule = url.pathname.startsWith("/modules/foundry-world-status/");
      const base = isModule ? root : path.join(core, "public");
      const relative = isModule ? url.pathname.slice("/modules/foundry-world-status/".length)
        : url.pathname.startsWith("/core/") ? url.pathname.slice(6) : null;
      if (!relative) throw 0;
      filename = path.resolve(base, relative);
      if (!filename.startsWith(path.resolve(base) + path.sep)) throw 0;
    }
    const body = await readFile(filename);
    res.writeHead(200, {"Content-Type": types[path.extname(filename)] ?? "application/octet-stream"}); res.end(body);
  } catch {res.writeHead(404); res.end();}
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = browserName === "firefox" ? await firefox.launch({headless: true, timeout: 30000})
    : await chromium.launch({channel: "chrome", headless: true, args: ["--no-proxy-server"]});
  const page = await browser.newPage({viewport: {width: 1040, height: 920}});
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", error => {errors.push(error.message); console.error("Browser exception:", error.message);});
  let sends = 0;
  // Fixture resources are local. Do not fetch third-party fonts, images or styles during verification.
  await page.route("**/*", route => new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort());
  await page.route("https://**/api/webhooks/**", async route => {
    sends++;
    await route.fulfill({status:200, contentType:"application/json", body: JSON.stringify({id:"123456789012345678"})});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: "domcontentloaded"});
  await page.waitForFunction(() => !!window.fixture);
  const controlStyles = await page.evaluate(() => {
    const other = document.querySelector('#scene-controls button[data-tool="select"]');
    const stylesheet = document.querySelector('link[href*="foundry-world-status/styles/"]');
    const read = () => {
      const css = getComputedStyle(other);
      return Object.fromEntries(["width", "height", "color", "backgroundColor", "backgroundImage", "border", "opacity", "display", "fontFamily", "fontSize", "padding"].map(key => [key, css[key]]));
    };
    const withModule = read(); stylesheet.disabled = true;
    const withoutModule = read(); stylesheet.disabled = false;
    return {withModule, withoutModule};
  });
  assert.deepEqual(controlStyles.withModule, controlStyles.withoutModule);
  assert.equal(await page.locator('input[type="password"]').count(), 1);
  assert.equal(await page.locator('[name="autoOfflineOnShutdown"]').isChecked(), false);
  await page.locator('[name="serverUrl"]').fill("https://foundry.example.invalid");
  await page.locator('[name="onlineTitle"]').fill("🎲 Unsere Spielrunde ist ONLINE");
  await page.locator('[name="onlineDescription"]').fill("Die nächste Runde beginnt.\nWir sehen uns am Spieltisch!");
  assert.equal(await page.locator(".fws-preview-title").innerText(), "🎲 Unsere Spielrunde ist ONLINE");
  assert.equal(await page.locator(".fws-preview-link").getAttribute("href"), "https://foundry.example.invalid/");
  assert.equal(await page.locator('[name="onlineLinkText"]').evaluate(el => el.required), false);
  assert.equal(await page.locator(".fws-preview-link").innerText(), "Zur Spielwelt");
  await page.locator('[name="onlineLinkText"]').fill("Spiel [heute] (jetzt)");
  assert.equal(await page.locator(".fws-preview-link").innerText(), "Spiel [heute] (jetzt)");
  await page.locator('[name="onlineLinkText"]').fill("<img src=x onerror=alert(1)>");
  assert.equal(await page.locator(".fws-preview-link img").count(), 0);
  await page.locator('[name="onlineLinkText"]').fill("   ");
  assert.equal(await page.locator(".fws-preview-link").innerText(), "https://foundry.example.invalid/");
  await page.locator('[name="onlineLinkText"]').fill("");
  await page.locator('[name="onlineTitle"]').fill('<img src=x onerror="window.previewXss=true">');
  assert.equal(await page.locator(".fws-preview-title img").count(), 0);
  await page.locator('[name="onlineTitle"]').fill("🎲 Unsere Spielrunde ist ONLINE");
  await page.locator('[name="onlineColor"]').fill("#3498db");
  assert.equal(await page.locator(".fws-embed").evaluate(el => getComputedStyle(el).borderLeftColor), "rgb(52, 152, 219)");
  const fakeWebhook = `https://discord.com/api/webhooks/${"1".repeat(18)}/${"test_token_".repeat(7)}`;
  await page.locator('[name="webhookUrl"]').fill(fakeWebhook);
  const eye = page.locator('[data-action="toggleWebhook"]');
  const savedBeforeReveal = await page.evaluate(() => fixture.values.get("configuration").webhookUrl);
  await eye.click();
  assert.equal(await page.locator('[name="webhookUrl"]').getAttribute("type"), "text");
  assert.equal(await eye.getAttribute("aria-pressed"), "true");
  assert.equal(await eye.getAttribute("aria-label"), "Webhook-URL verbergen");
  assert.equal(await page.locator('[name="webhookUrl"]').inputValue(), fakeWebhook);
  assert.equal(await page.evaluate(() => fixture.values.get("configuration").webhookUrl), savedBeforeReveal);
  assert.equal(sends, 0);
  await eye.press("Enter");
  assert.equal(await page.locator('[name="webhookUrl"]').getAttribute("type"), "password");
  assert.equal(await eye.getAttribute("aria-pressed"), "false");
  await page.locator('[data-action="test"]').click();
  await page.getByRole("status").filter({hasText:"Discord-Webhook funktioniert."}).waitFor();
  assert.equal(sends, 1);
  assert.equal(await page.evaluate(() => fixture.values.get("online")), false);
  await page.locator('[name="sendOffline"]').uncheck();
  await page.locator('button[type="submit"]').click();
  await page.getByRole("status").filter({hasText:"Einstellungen wurden gespeichert."}).waitFor();
  assert.equal(await page.evaluate(() => fixture.values.get("configuration").sendOffline), false);
  assert.equal(await page.evaluate(() => fixture.values.get("configuration").webhookUrl), undefined);
  assert.equal(await page.evaluate(() => fixture.values.get("webhooks")[JSON.stringify(["test-world", "test-gm"])]), fakeWebhook);
  await eye.click();
  assert.equal(await page.locator('[name="webhookUrl"]').getAttribute("type"), "text");
  await page.evaluate(() => fixture.renderSettings());
  assert.equal(await page.locator('[name="webhookUrl"]').getAttribute("type"), "password");
  assert.equal(await page.locator('[data-action="toggleWebhook"]').getAttribute("aria-pressed"), "false");
  assert.equal(await page.locator('[name="webhookUrl"]').inputValue(), fakeWebhook);
  assert.equal(await page.locator('[name="sendOffline"]').isChecked(), false);
  assert.equal(await page.locator('[name="onlineLinkText"]').inputValue(), "");
  assert.equal(await page.locator(".fws-preview-link").innerText(), "https://foundry.example.invalid/");
  assert.equal(await page.locator('[name="onlineTitle"]').inputValue(), "🎲 Unsere Spielrunde ist ONLINE");
  // Realistic spacing between deliberate test and status actions, beyond the anti-double-click interval.
  await page.waitForTimeout(850);
  await page.locator('button[data-tool="foundry-world-status"]').click();
  await page.locator("#scene-controls button.fws-on").waitFor();
  assert.equal(sends, 2);
  const image = await page.locator("#scene-controls button.fws-on").evaluate(el => getComputedStyle(el).backgroundImage);
  assert.match(image, /discord-on.svg/);
  const svgResponse = await page.request.get(new URL("/modules/foundry-world-status/icons/discord-on.svg", page.url()).href);
  assert.equal(svgResponse.status(), 200);
  await page.locator(".fws-fields").evaluate(el => {el.scrollTop = 0;});
  await page.screenshot({path: path.join(out, "einstellungen.png")});
  await page.waitForTimeout(850);
  await page.locator('button[data-tool="foundry-world-status"]').click();
  await page.locator("#scene-controls button.fws-off").waitFor();
  assert.equal(sends, 2); // Silent OFF sends nothing.
  assert.equal(await page.evaluate(() => fixture.values.get("online")), false);
  assert.equal(await page.locator("#fixture-form").evaluate(el => el.scrollWidth <= el.clientWidth), true);
  await page.locator('[name="sendOffline"]').check();
  await page.locator('[name="autoOfflineOnShutdown"]').check();
  await page.locator('button[type="submit"]').click();
  await page.getByRole("status").filter({hasText:"Einstellungen wurden gespeichert."}).waitFor();
  assert.equal(await page.evaluate(() => fixture.values.get("configuration").autoOfflineOnShutdown), true);
  await page.evaluate(() => fixture.renderSettings());
  assert.equal(await page.locator('[name="autoOfflineOnShutdown"]').isChecked(), true);
  await page.locator('[name="autoOfflineOnShutdown"]').scrollIntoViewIfNeeded();
  await page.screenshot({path: path.join(out, "automatisch-offline.png")});
  await page.setViewportSize({width: 640, height: 920});
  await page.locator("#fixture-form").evaluate(el => {el.style.left = "48px"; el.style.width = "576px";});
  await page.locator('[name="webhookUrl"]').scrollIntoViewIfNeeded();
  assert.equal(await page.locator("#fixture-form").evaluate(el => el.scrollWidth <= el.clientWidth), true);
  assert.equal(await page.locator(".fws-secret-field").evaluate(el => el.scrollWidth <= el.clientWidth), true);
  await page.locator('[data-action="toggleWebhook"]').click();
  assert.equal(await page.locator('[name="webhookUrl"]').getAttribute("type"), "text");
  await page.locator('[data-action="toggleWebhook"]').press("Space");
  assert.equal(await page.locator('[name="webhookUrl"]').getAttribute("type"), "password");
  await page.screenshot({path: path.join(out, "schmales-fenster.png")});
  await page.setViewportSize({width: 1040, height: 920});
  await page.locator("#fixture-form").evaluate(el => {el.style.left = "80px"; el.style.width = "800px";});
  await page.waitForTimeout(850);
  await page.evaluate(async () => {
    await game.settings.set("foundry-world-status", "online", true);
    await game.shutDown();
  });
  assert.equal(sends, 3);
  assert.equal(await page.evaluate(() => fixture.values.get("online")), false);
  assert.equal(await page.evaluate(() => fixture.shutdownRequests.length), 1);
  assert.equal(await page.evaluate(() => fixture.shutdownRequests[0].url), "/prefix/setup");
  await page.waitForTimeout(850);
  await page.evaluate(() => game.settings.set("foundry-world-status", "online", true));
  await page.locator("#fixture-logout").click();
  await page.waitForURL("**/logout-complete");
  assert.equal(sends, 3);
  const logoutResult = await page.evaluate(() => JSON.parse(sessionStorage.getItem("logout-check")));
  assert.equal(logoutResult.online, true);
  assert.equal(logoutResult.shutdownRequests, 1); // Only the earlier shutdown test; logout did not stop the world.
  assert.deepEqual(errors, []);
  console.log(`${browserName} ${browser.version()}: Browser checks passed: native FormDataExtended, preview, settings, eye button, icons, automatic OFF before world shutdown; logout preserves ON; no browser exceptions. All Discord requests simulated.`);

  // Separate tabs share browser storage, exercising per-user isolation on one PC.
  const languageContext = await browser.newContext({viewport: {width: 1040, height: 920}});
  let languageSends = 0;
  await languageContext.route("**/*", route => {
    if (new URL(route.request().url()).hostname === "127.0.0.1") return route.continue();
    languageSends++; return route.abort();
  });
  const openUser = async (user, language, role = "gm") => {
    const tab = await languageContext.newPage();
    tab.on("pageerror", error => errors.push(error.message));
    await tab.goto(`http://127.0.0.1:${server.address().port}/?user=${user}&lang=${language}&role=${role}`);
    await tab.waitForFunction(() => !!window.fixture);
    return tab;
  };
  const a = await openUser("gm-a", "de");
  const player = await openUser("player-b", "de", "player");
  const otherGM = await openUser("gm-b", "de");
  assert.equal(await a.locator('[type="submit"]').innerText(), "Einstellungen speichern");
  await a.locator("#fixture-language").selectOption("en");
  await a.getByRole("button", {name: "Save Settings", exact: true}).waitFor();
  assert.equal(await a.evaluate(() => game.i18n.lang), "de");
  assert.equal(await a.locator('[data-action="test"]').innerText(), "Test Discord Connection");
  assert.equal(await a.locator('[data-action="toggleWebhook"]').getAttribute("aria-label"), "Show Webhook URL");
  assert.equal(await a.locator(".fws-preview h3").innerText(), "Discord Preview");
  assert.equal(await a.locator('button[data-tool="foundry-world-status"]').getAttribute("aria-label"), "Announce the game world as ONLINE on Discord");
  await a.evaluate(() => fixture.renderSettings());
  assert.equal(await a.locator('[name="onlineTitle"]').inputValue(), "🎲 Game World is ONLINE");
  await a.locator('[name="onlineTitle"]').fill("Die Spielrunde beginnt!");
  await a.locator('[name="onlineLinkText"]').fill("");
  await a.locator('[name="serverUrl"]').fill("https://foundry.example.invalid/game");
  await a.locator('[type="submit"]').click();
  await a.getByRole("status").filter({hasText: "Settings saved."}).waitFor();
  const saved = await a.evaluate(() => JSON.stringify([...fixture.values]));
  await a.locator('[name="onlineDescription"]').fill("  Noch nicht gespeichert!  ");
  await a.locator("#fixture-language").selectOption("de");
  await a.getByRole("button", {name: "Einstellungen speichern", exact: true}).waitFor();
  assert.equal(await a.locator('[name="onlineDescription"]').inputValue(), "  Noch nicht gespeichert!  ");
  assert.equal(await a.evaluate(() => JSON.stringify([...fixture.values])), saved);
  await a.evaluate(() => fixture.renderSettings());
  assert.equal(await a.locator('[name="onlineTitle"]').inputValue(), "Die Spielrunde beginnt!");
  assert.equal(await a.locator('[name="onlineLinkText"]').inputValue(), "");
  assert.equal(await a.locator(".fws-preview-title").innerText(), "Die Spielrunde beginnt!");
  assert.equal(await player.evaluate(() => fixture.locale.languagePreference()), "auto");
  assert.equal(await player.evaluate(() => fixture.locale.t("save")), "Einstellungen speichern");
  assert.equal(await player.locator('button[data-tool="foundry-world-status"]').count(), 0);
  assert.equal(await otherGM.locator('[type="submit"]').innerText(), "Einstellungen speichern");
  await player.locator("#fixture-language").selectOption("en");
  await player.waitForFunction(() => fixture.locale.t("save") === "Save Settings");
  assert.equal(await a.locator('[type="submit"]').innerText(), "Einstellungen speichern");
  assert.equal(await otherGM.evaluate(() => fixture.locale.languagePreference()), "auto");
  await a.locator("#fixture-language").selectOption("auto");
  await a.waitForFunction(() => fixture.locale.languagePreference() === "auto");
  await a.locator("#fixture-language").selectOption("en");
  await a.getByRole("button", {name: "Save Settings", exact: true}).waitFor();
  await a.evaluate(() => fixture.renderSettings());
  await a.locator('[data-action="toggleWebhook"]').click();
  assert.equal(await a.locator('[data-action="toggleWebhook"]').getAttribute("aria-label"), "Hide Webhook URL");
  await a.evaluate(() => fixture.renderSettings());
  assert.equal(await a.locator('[name="webhookUrl"]').getAttribute("type"), "password");
  await a.locator(".fws-fields").evaluate(el => {el.scrollTop = 0;});
  await a.screenshot({path: path.join(out, "language-en.png")});
  const reloadedA = await openUser("gm-a", "de");
  assert.equal(await reloadedA.locator('[type="submit"]').innerText(), "Save Settings");
  const automaticEnglish = await openUser("gm-english", "en");
  assert.equal(await automaticEnglish.locator('[type="submit"]').innerText(), "Save Settings");
  await automaticEnglish.locator("#fixture-language").selectOption("de");
  await automaticEnglish.getByRole("button", {name: "Einstellungen speichern", exact: true}).waitFor();
  assert.equal(await automaticEnglish.evaluate(() => game.i18n.lang), "en");
  await automaticEnglish.screenshot({path: path.join(out, "language-de.png")});
  const unsupported = await openUser("gm-fallback", "fr");
  assert.equal(await unsupported.locator('[type="submit"]').innerText(), "Save Settings");
  assert.equal(languageSends, 0);
  assert.deepEqual(errors, []);
  await languageContext.close();
  console.log(`${browserName}: language checks passed: DE/EN, auto, both overrides, fallback, same-browser GM/player isolation, persisted preference, preserved saved and draft values, tooltips, buttons, preview and eye. No Discord traffic.`);
} finally {
  await browser?.close(); await new Promise(resolve => server.close(resolve));
}
