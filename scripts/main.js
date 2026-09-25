import {MODULE_ID, TOOL_ID, WorldStatusError, assertGM, readConfig, reportError, t, webhookUrl, migrateWebhook} from "./config.js";
import {buildPayload, isBusy, runExclusive, sendWebhook} from "./discord.js";
import {registerSettings} from "./settings.js";
import {prepareLanguage} from "./localization.js";
import {installShutdownHandler} from "./shutdown.js";

/** Update the official V14 control model and re-render only its tools part. No DOM replacement. */
export function refreshControls() {
  if (!game.ready || !ui.controls) return;
  const online = game.settings.get(MODULE_ID, "online") === true;
  for (const control of Object.values(ui.controls.controls ?? {})) {
    const tool = control.tools?.[TOOL_ID];
    if (tool) Object.assign(tool, appearance(online));
  }
  // Rendering failures are caught separately so they cannot misreport a successful Discord send.
  try {
    Promise.resolve(ui.controls.render({parts: ["tools"]})).catch(() => {
      console.error(`${MODULE_ID} | controlsRender`);
    });
  } catch {
    console.error(`${MODULE_ID} | controlsRender`);
  }
}

function appearance(online) {
  return {
    icon: `fws-icon fws-${online ? "on" : "off"}${isBusy() ? " fws-busy" : ""}`,
    title: isBusy() ? t("sending") : t(online ? "tooltipOn" : "tooltipOff"),
    visible: game.user?.isGM === true
  };
}

export async function toggleAnnouncement() {
  try {
    assertGM();
    await runExclusive(async () => {
      const online = game.settings.get(MODULE_ID, "online") === true;
      const config = readConfig();
      const shouldSend = !online || config.sendOffline;
      if (shouldSend) {
        webhookUrl(config.webhookUrl);
        await sendWebhook(config.webhookUrl, buildPayload(config, !online));
      }
      // Persist only after the confirmed send, or immediately for a silent OFF action.
      try {
        assertGM();
        await game.settings.set(MODULE_ID, "online", !online);
      } catch {
        throw new WorldStatusError(shouldSend ? "stateAfterSend" : "stateSave");
      }
      ui.notifications.info(t(!online ? "onlineSent" : shouldSend ? "offlineSent" : "offlineLocal"));
    }, refreshControls);
  } catch (error) {
    reportError(error);
  }
}

export function addSceneTools(controls) {
  if (game.user?.isGM !== true) return;
  const online = game.settings.get(MODULE_ID, "online") === true;
  // V14 uses records, not the old arrays. A button does not change the selected canvas tool.
  for (const control of Object.values(controls)) {
    if (control.visible === false || !control.tools || !Object.keys(control.tools).length) continue;
    const orders = Object.values(control.tools).filter(tool => tool.name !== TOOL_ID).map(tool => tool.order ?? 0);
    control.tools[TOOL_ID] = {
      name: TOOL_ID,
      order: Math.max(0, ...orders) + 1,
      button: true,
      ...appearance(online),
      // The button API always supplies active=true for a click, unlike a layer's onChange.
      onChange: (_event, active) => { if (active) void toggleAnnouncement(); }
    };
  }
}

Hooks.once("init", () => registerSettings(refreshControls));
Hooks.on("getSceneControlButtons", addSceneTools);
Hooks.once("ready", async () => {
  try { await prepareLanguage(); } catch { reportError(new WorldStatusError("languageLoad")); }
  refreshControls();
  installShutdownHandler(refreshControls);
  if (game.user?.isGM) {
    try { await migrateWebhook(); } catch (error) { reportError(error); }
  }
});
// No automatic Discord requests at startup, browser unload, socket receipt, or setting changes.
