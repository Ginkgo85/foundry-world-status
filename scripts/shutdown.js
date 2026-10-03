import {MODULE_ID, WorldStatusError, assertGM, readConfig, reportError, t} from "./config.js";
import {buildPayload, runExclusive, sendWebhook} from "./discord.js";

const installed = new WeakSet();

/**
 * V14.368 has no awaitable pre-shutdown hook. Its shutdown socket event is too late:
 * the world is already stopping and core navigates away after one second.
 * Wrap only this Game instance's public shutdown entry point. Game.logOut itself stays untouched.
 * The OFFLINE-enabled branch uses the same setup route and shutdown POST as Game.shutDown.
 */
export function installShutdownHandler(onBusyChange = () => {}) {
  if (game.user?.isGM !== true || typeof game.shutDown !== "function" || installed.has(game)) return;
  const original = game.shutDown;
  let shutdownRequested = false;
  game.shutDown = async function (...args) {
    // Preserve normal Foundry/other-module behavior when this feature is not applicable.
    if (this.user?.isGM !== true) return original.apply(this, args);
    if (shutdownRequested) return;

    try {
      const config = readConfig();
      if (!config.sendOffline) return original.apply(this, args);
      const ran = await runExclusive(async () => {
        assertGM();
        if (this.settings.get(MODULE_ID, "online") !== true) {
          await original.apply(this, args);
          return;
        }

        // Confirm before sending, so canceling the normal connected-user warning sends nothing.
        const others = this.users.filter(user => user.active && !user.isSelf).length;
        if (others > 0) {
          const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {title: t("shutdownTitle")},
            yes: {label: t("confirmYes")}, no: {label: t("confirmNo")},
            content: `<p>${t("shutdownConfirm", {number: others})}</p>`
          });
          if (!confirmed) return;
        }

        assertGM();
        // Another GM may have announced OFF while the confirmation was open.
        if (this.settings.get(MODULE_ID, "online") === true) {
          const latest = readConfig();
          // Respect settings changed while the dialog was open. Re-enter native behavior if disabled.
          if (!latest.sendOffline) {
            await original.apply(this, args);
            return;
          }
          await announceOffline(latest, this);
        }

        // Save the status while the world's database is still available, then request shutdown.
        try {
          assertGM();
          const response = await foundry.utils.fetchWithTimeout(foundry.utils.getRoute("setup"), {
            method: "POST",
            body: new URLSearchParams({action: "worldShutdown"}),
            redirect: "manual"
          });
          // A manual browser redirect is opaque (status 0); core uses redirect:manual as well.
          if (!response.ok && response.type !== "opaqueredirect") throw new Error("shutdownRejected");
          shutdownRequested = true;
        } catch { throw new WorldStatusError("shutdownRequest"); }
      }, onBusyChange);
      if (!ran) ui.notifications.warn(t("shutdownBusy"));
    } catch (error) {
      reportError(error);
      ui.notifications.warn(t("shutdownStopped"));
    }
  };
  installed.add(game);
}

async function announceOffline(config, context) {
  await sendWebhook(config.webhookUrl, buildPayload(config, false));
  try {
    assertGM();
    await context.settings.set(MODULE_ID, "online", false);
  } catch { throw new WorldStatusError("stateAfterSend"); }
  ui.notifications.info(t("offlineSent"));
}
