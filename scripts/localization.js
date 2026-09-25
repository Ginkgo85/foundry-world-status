const MODULE_ID = "foundry-world-status";
const translations = new Map();

/** Client settings are browser-wide. Include world and user to isolate shared browsers too. */
export function languageSettingKey() {
  const user = game.userId ?? game.user?.id;
  if (!game.world?.id || !user) return null;
  return "language-" + encodeURIComponent(JSON.stringify([game.world.id, user])).replaceAll(".", "%2E");
}

export function languagePreference() {
  if (!globalThis.game) return "auto";
  const key = languageSettingKey();
  if (!key) return "auto";
  try {
    const value = game.settings.get(MODULE_ID, key);
    return ["de", "en"].includes(value) ? value : "auto";
  } catch { return "auto"; } // Includes existing installations without a registered preference.
}

/** Use Foundry's own translator; never replace game.i18n or change its language/dictionaries. */
export function t(key, data) {
  const preference = languagePreference();
  const i18n = preference === "auto" ? globalThis.game?.i18n : translations.get(preference) ?? globalThis.game?.i18n;
  if (!i18n) return "FWS." + key;
  return data ? i18n.format("FWS." + key, data) : i18n.localize("FWS." + key);
}

const loading = new Map();
export async function prepareLanguage() {
  const language = languagePreference();
  if (language === "auto" || translations.has(language)) return;
  if (!loading.has(language)) {
    loading.set(language, (async () => {
      const response = await fetch(new URL("../lang/" + language + ".json", import.meta.url));
      if (!response.ok) throw new Error("languageLoad");
      const dictionary = await response.json();
      const i18n = new foundry.helpers.Localization(language);
      i18n.translations = dictionary;
      translations.set(language, i18n);
    })().finally(() => loading.delete(language)));
  }
  await loading.get(language);
}

export function registerLanguage(onChange) {
  const key = languageSettingKey();
  if (!key) return;
  game.settings.register(MODULE_ID, key, {
    get name() { return t("language.name"); },
    get hint() { return t("language.hint"); },
    scope: "client", config: true, type: String, default: "auto",
    get choices() { return {auto: t("language.auto"), de: t("language.de"), en: t("language.en")}; },
    requiresReload: false,
    onChange
  });
}
