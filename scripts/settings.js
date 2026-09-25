import {MODULE_ID, DEFAULTS, GROUPS, LIMITS, WorldStatusError, assertGM, httpUrl, normalizeConfig, readConfig, reportError, t, validateConfig, migrateWebhook, saveConfig} from "./config.js";
import {runExclusive, sendWebhook} from "./discord.js";
import {prepareLanguage, registerLanguage} from "./localization.js";
import {LOCALIZED_DEFAULTS} from "./config.js";

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

export function registerSettings(onStatusChange) {
  registerLanguage(() => { void refreshLanguage(onStatusChange); });
  game.settings.register(MODULE_ID, "webhooks", {
    scope: "client", config: false, type: Object, default: {}
  });
  // Leave translated defaults absent until explicitly saved; existing stored values always win.
  const sharedDefaults = Object.fromEntries(Object.entries(DEFAULTS).filter(([key]) => key !== "webhookUrl" && !LOCALIZED_DEFAULTS.includes(key)));
  game.settings.register(MODULE_ID, "configuration", {
    name: "FWS.menuName", scope: "world", config: false, type: Object, default: sharedDefaults
  });
  game.settings.register(MODULE_ID, "online", {
    name: "FWS.status", scope: "world", config: false,
    type: new foundry.data.fields.BooleanField({initial: false, nullable: false}),
    default: false, onChange: onStatusChange
  });
  game.settings.registerMenu(MODULE_ID, "settings", {
    get name() { return t("menuName"); }, get label() { return t("menuLabel"); }, get hint() { return t("menuHint"); },
    icon: "fa-brands fa-discord", type: WorldStatusSettings, restricted: true
  });
}

/** Re-render only this module's open applications, preserving unsaved form values. */
export async function refreshLanguage(onControlsChange = () => {}) {
  try {
    await prepareLanguage();
    onControlsChange();
    for (const app of ApplicationV2.instances()) {
      if (!(app instanceof WorldStatusSettings) || !app.rendered || app._saving || app._testing) continue;
      app._languageDraft = app.formValues();
      try { await app.render({force: true}); }
      finally { delete app._languageDraft; }
    }
  } catch {
    reportError(new WorldStatusError("languageLoad"));
  }
}

export class WorldStatusSettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "foundry-world-status-settings",
    tag: "form",
    classes: ["fws-settings"],
    window: {title: "FWS.menuName", resizable: true},
    position: {width: 800, height: 760},
    form: {handler: WorldStatusSettings.save, closeOnSubmit: false},
    actions: {test: WorldStatusSettings.testConnection, toggleWebhook: WorldStatusSettings.toggleWebhookVisibility}
  };

  static PARTS = {
    content: {template: `modules/${MODULE_ID}/templates/settings.hbs`, scrollable: [".fws-fields"]}
  };

  get title() { return t("menuName"); }

  _saving = false;
  _testing = false;

  _canRender(options) {
    assertGM();
    return super._canRender(options);
  }

  async _prepareContext(options) {
    assertGM();
    const context = await super._prepareContext(options);
    try { await prepareLanguage(); }
    catch { reportError(new WorldStatusError("languageLoad")); }
    if (!this._languageDraft) await migrateWebhook();
    const config = this._languageDraft ?? readConfig();
    context.i18n = Object.fromEntries(["intro", "securityHint", "showWebhook", "preview", "previewHint", "test", "save", "testHint"].map(key => [key, t(key)]));
    context.groups = GROUPS.map(group => ({
      title: t(`groups.${group.id}`),
      fields: group.keys.map(key => ({
        key, value: config[key], label: t(`fields.${key}`), hint: t(`hints.${key}`),
        checkbox: typeof DEFAULTS[key] === "boolean",
        secret: key === "webhookUrl",
        textarea: ["onlineDescription", "offlineDescription", "content"].includes(key),
        type: key === "webhookUrl" ? "password" : key.endsWith("Color") ? "color"
          : ["serverUrl", "avatarUrl", "onlineThumbnail", "onlineImage"].includes(key) ? "url" : "text",
        maxLength: LIMITS[key],
        required: ["onlineTitle", "offlineTitle", "username"].includes(key)
      }))
    }));
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelector(".fws-fields").addEventListener("input", () => this.updatePreview());
    this.updatePreview();
    delete this._languageDraft;
  }

  currentValues() {
    return normalizeConfig(this.formValues());
  }

  formValues() {
    assertGM();
    const form = this.element;
    return Object.fromEntries(Object.keys(DEFAULTS).map(key => {
      const input = form.querySelector(`[name="${key}"]`);
      return [key, typeof DEFAULTS[key] === "boolean" ? input.checked : input.value];
    }));
  }

  static toggleWebhookVisibility(_event, target) {
    assertGM();
    const input = this.element.querySelector('[name="webhookUrl"]');
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    target.setAttribute("aria-pressed", String(visible));
    const label = t(visible ? "hideWebhook" : "showWebhook");
    target.setAttribute("aria-label", label);
    target.title = label;
    target.querySelector("i").className = `fa-solid ${visible ? "fa-eye-slash" : "fa-eye"}`;
  }

  updatePreview() {
    const values = this.currentValues();
    const preview = this.element.querySelector(".fws-preview");
    // Plain text assignments prevent configured HTML from executing in the GM's browser.
    for (const [selector, key] of Object.entries({
      ".fws-preview-user": "username", ".fws-preview-title": "onlineTitle",
      ".fws-preview-description": "onlineDescription", ".fws-preview-footer": "onlineFooter"
    })) preview.querySelector(selector).textContent = values[key];
    preview.querySelector(".fws-preview-content").textContent =
      [values.roleId ? `<@&${values.roleId}>` : "", values.content].filter(Boolean).join(" ");
    preview.querySelector(".fws-embed").style.borderColor = /^#[0-9a-f]{6}$/i.test(values.onlineColor) ? values.onlineColor : "#2ecc71";
    const link = preview.querySelector(".fws-preview-link");
    link.textContent = values.onlineLinkText || values.serverUrl;
    try {
      link.href = httpUrl(values.serverUrl);
      if (!values.onlineLinkText) link.textContent = link.href;
    } catch { link.removeAttribute("href"); }
  }

  static async save(_event, _form, formData) {
    if (this._saving) return;
    this._saving = true;
    const button = this.element.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    try {
      assertGM();
      const config = validateConfig(normalizeConfig(formData.object));
      try { await saveConfig(config); }
      catch { throw new WorldStatusError("settingsSave"); }
      ui.notifications.info(t("saved"));
    } catch (error) {
      reportError(error);
    } finally {
      this._saving = false;
      if (button) button.disabled = false;
    }
  }

  static async testConnection(_event, target) {
    if (this._testing) return;
    this._testing = true;
    target.disabled = true;
    try {
      assertGM();
      const values = this.currentValues();
      await runExclusive(async () => {
        await sendWebhook(values.webhookUrl, {
          content: t("testMessage"),
          allowed_mentions: {parse: [], users: [], roles: [], replied_user: false}
        });
        ui.notifications.info(t("testSuccess"));
      });
    } catch (error) {
      reportError(error, {test: true});
    } finally {
      this._testing = false;
      target.disabled = false;
    }
  }
}
