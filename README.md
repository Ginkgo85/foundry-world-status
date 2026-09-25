# Foundry World Status

[Deutsch](#deutsch) | [English](#english)

<a id="deutsch"></a>

## Deutsche Anleitung

Version **1.2.1** · Foundry VTT **14.368** · Nur für GMs · Keine Modulabhängigkeiten

**Status: Community Release / In Development**

Dieses Modul wird über GitHub verteilt und ist nicht im offiziellen Foundry-VTT-Paketverzeichnis gelistet. Veröffentlichte Pakete findest du auf der GitHub-Releases-Seite.

Kündige deine Spielrunde mit einem Klick auf Discord als **ONLINE** oder **OFFLINE** an – mit anpassbarer Nachricht und direktem Link zu deiner Foundry-Spielwelt.

[Auf einem neuen PC weiterarbeiten](#auf-einem-neuen-pc-weiterarbeiten) – einfache Anleitung zum Weiterentwickeln mit Codex.

### Funktionen

- Discord-Button in der linken Foundry-Werkzeugleiste, sichtbar nur für GMs.
- Anpassbare Discord-Embeds mit Texten, Farben, Bildern und Serverlink.
- Optionaler Rollenping bei ONLINE und integrierter Verbindungstest.
- Optional automatisch OFFLINE vor dem Zurückkehren zum Setup.
- Einstellungen und Ankündigungsstatus werden pro Welt gespeichert; der Webhook bleibt im jeweiligen Browser.
- Deutsche und englische Oberfläche mit optionaler lokaler Sprachwahl ausschließlich für GMs.

**ONLINE wird bewusst per GM-Klick angekündigt.** Es gibt keine automatische Erreichbarkeitsprüfung und keine Nachricht beim Starten der Welt. ON/OFF zeigt den gespeicherten Ankündigungsstatus an.

### Installation

Der feste Manifest-Link installiert den jeweils veröffentlichten neuesten Release. Eine neue Version wird darüber erst nach ihrer Veröffentlichung verfügbar.

1. In Foundrys Setup **Add-on-Module → Modul installieren** öffnen.
2. Den folgenden Manifest-Link kopieren, einfügen und installieren:

   ```text
   https://github.com/Ginkgo85/foundry-world-status/releases/latest/download/module.json
   ```

3. Die Welt öffnen und unter **Einstellungen → Module verwalten** das Modul aktivieren. Anschließend die Welt neu laden.

Alternativ: [ZIP für v1.2.1](https://github.com/Ginkgo85/foundry-world-status/releases/download/v1.2.1/foundry-world-status.zip) (erst nach Veröffentlichung verfügbar) und in `Data/modules/foundry-world-status/` entpacken. `module.json` liegt direkt im ZIP-Root und muss anschließend direkt im Modulordner liegen. Foundry danach neu starten beziehungsweise die Module neu laden.

Bei einem manuellen Update den bisherigen Modulordner sichern und durch den neuen ZIP-Inhalt ersetzen. **Keine World-Daten löschen.**

### Sprache

Die Moduloberfläche unterstützt **Deutsch und Englisch**. Standardmäßig folgt **Automatisch** der aktiven Foundry-Oberflächensprache. Andere Foundry-Sprachen verwenden Foundrys englischen Fallback.

In Foundrys normalen Moduleinstellungen unter **Foundry World Status → Sprache / Language** kannst du als GM **Automatisch**, **Deutsch** oder **English** auswählen und die Einstellungen speichern. Die Wahl gilt nur für deinen Benutzer, in dieser Welt und diesem Browser. Andere GMs und Spieler bleiben unbeeinflusst – auch wenn sie denselben PC mit einem anderen Foundry-Benutzer verwenden. In einem anderen Browser beginnt die Auswahl wieder mit Automatisch.

Geöffnete Modulfenster und der Button-Tooltip werden aktualisiert, ohne die Welt neu zu laden. Nicht gespeicherte Eingaben bleiben erhalten. Während Speichern oder Verbindungstest läuft, gilt die neue Fensterbeschriftung spätestens beim nächsten Öffnen.

**Deine gespeicherten Discord-Texte werden niemals übersetzt oder überschrieben.** Nur noch nicht gespeicherte Standardtexte können der gewählten Sprache folgen. Ein Sprachwechsel sendet keine Discord-Nachricht und verändert weder Webhook noch ON/OFF-Status. Spieler sehen keine manuelle Sprachauswahl und folgen immer Foundrys aktiver UI-Sprache. Frühere lokale Spieler-Sprachwerte werden nicht gelöscht, aber nicht angewendet; die Discord-Bedienung bleibt ausschließlich für GMs sichtbar.

### In wenigen Schritten startklar

1. In Discord im gewünschten Textkanal **Kanal bearbeiten → Integrationen → Webhooks → Neuer Webhook** öffnen und die Webhook-URL kopieren.
2. In Foundrys Moduleinstellungen **Foundry World Status → Weltstatus für Discord konfigurieren** öffnen.
3. **Discord Webhook URL** und die für deine Spieler erreichbare **Foundry Server URL / Wunschdomain** eintragen.
   Mit dem Augen-Button lässt sich die Webhook-URL vorübergehend einblenden; beim erneuten Öffnen ist sie wieder verdeckt.
4. Nachricht nach Wunsch gestalten. Der ONLINE-Linktext ist optional: Mit Text wird dieser anklickbar, ohne Text erscheint die Server-URL. Ein bewusst leer gespeichertes Feld bleibt leer. **Discord-Verbindung testen** sendet eine echte Testnachricht, ohne den ON/OFF-Status zu ändern.
5. **Einstellungen speichern** und den Discord-Button in der linken Werkzeugleiste verwenden.

Für einen Rollenping die numerische Discord-Rollen-ID eintragen. Nur diese Rolle darf bei ONLINE erwähnt werden; `@everyone`, `@here` und Benutzer-Pings sind gesperrt. Discord-Berechtigungen gelten zusätzlich.

### Einblick in die Einstellungen

![Vorschau der Moduleinstellungen](https://raw.githubusercontent.com/Ginkgo85/foundry-world-status/main/docs/images/settings-connection.png)

<details>
<summary>Weitere Vorschau anzeigen</summary>

![Weitere Vorschau der Moduleinstellungen](https://raw.githubusercontent.com/Ginkgo85/foundry-world-status/main/docs/images/settings-offline.png)

</details>

*Die Bilder dienen als Vorschau und können von der aktuellen Version abweichen.*

### Der ON/OFF-Button

Das Discord-Logo bleibt immer weiß und unverzerrt. Nur der separate Schriftzug und der Rahmen zeigen die Statusfarbe.

| Anzeige | Ein Klick darauf |
| --- | --- |
| <img src="icons/discord-off.svg" width="40" height="40" alt="Weißes Discord-Logo, roter OFF-Status"> **OFF** | Sendet die ONLINE-Nachricht und wechselt nach Bestätigung und Speicherung auf ON. |
| <img src="icons/discord-on.svg" width="40" height="40" alt="Weißes Discord-Logo, grüner ON-Status"> **ON** | Sendet die OFFLINE-Nachricht und wechselt auf OFF. |

Ist der OFFLINE-Versand deaktiviert, setzt ein Klick auf ON nur den Status auf OFF. Der Button steht am Ende der aktuellen Werkzeuggruppe; dafür muss eine Szene aktiv und die Werkzeugleiste geöffnet sein.

Bei mehreren GMs sollte eine Person die Ankündigungen übernehmen: Die Versandsperre gilt pro Browser und verhindert keine gleichzeitigen Nachrichten aus mehreren GM-Sitzungen.

### Automatisch OFFLINE ankündigen

Unter **OFFLINE Nachricht** beide Optionen aktivieren und speichern:

- **Offline-Nachricht an Discord senden**
- **Vor „Zurück zum Setup“ OFFLINE ankündigen**

Bei gespeichertem Status ON wird die Nachricht vor dem Schließversuch über **„Zurück zum Setup“** gesendet. Die Automatik ist standardmäßig ausgeschaltet. Bei einem Versand- oder Speicherfehler bleibt der Vorgang angehalten.

**Abmelden verändert den gemeinsamen Status nicht. Browser-/Tab-Schließen, Abstürze und das Stoppen des Servers werden nicht erfasst.** Scheitert das Schließen der Welt nach der Ankündigung, kann sie trotz OFF weiterlaufen. Die Option bestätigt keine tatsächliche Serverabschaltung; manuelles OFF vor dem Weltende bleibt die einfachste Alternative.

### Sicherheit und Hilfe

Webhook-URLs geheim halten und niemals auf GitHub veröffentlichen. Der Webhook wird **nur im jeweiligen Browser**, getrennt nach Welt und GM, gespeichert. Andere Browser oder Geräte müssen separat eingerichtet werden. Das Löschen der Browserdaten entfernt auch den lokalen Webhook.

Client Storage ist kein Secret Vault. Das Passwortfeld verdeckt die URL, verschlüsselt sie aber nicht. Skripte, Erweiterungen oder Personen mit Zugriff auf dasselbe Browserprofil können lokalen Speicher auslesen. Für GM und Spieler getrennte Browserprofile verwenden.

<details>
<summary>Vorhandene Einstellungen übernehmen</summary>

Die Modul-ID bleibt `foundry-world-status`; Nachrichtentexte und Weltstatus bleiben erhalten. Einen bisher gemeinsam gespeicherten Webhook kopiert das Modul beim GM-Start beziehungsweise Öffnen der Einstellungen lokal und prüft die Kopie, bevor es den gemeinsamen Wert entfernt. Dafür möglichst nur einen GM anmelden. Andere GM-Browser müssen anschließend separat eingerichtet werden.

Bei Speicherfehlern bleibt die bisherige Kopie erhalten; nach Beheben des Fehlers die Einstellungen erneut öffnen. Bei widersprüchlichen lokalen und gemeinsamen Webhooks wird nichts überschrieben: Mit einem frischen Browserprofil als derselbe GM anmelden und die Einstellungen öffnen, um den gemeinsamen Wert dort zu übernehmen. Der erste Browser behält seinen abweichenden Wert. Vorher keine Browserdaten löschen.

Die ältere Installation `foundry-discord-announcer` wird nicht automatisch migriert oder verändert. Beim Wechsel das neue Modul separat installieren, das alte in der Welt deaktivieren und Einstellungen sowie Webhook als GM manuell übertragen. Nicht beide Module gleichzeitig verwenden.

Bereits verteilte Webhooks und Backups lassen sich durch die Übernahme nicht zurückholen. Einen zuvor offengelegten Webhook in Discord ersetzen.

</details>

- [Änderungen](CHANGELOG.md) · Prüfbericht und Entwicklungsanleitung liegen im Projekt unter `VALIDIERUNG.md` und `CONTRIBUTING.md`.
- [Fehler melden](https://github.com/Ginkgo85/foundry-world-status/issues) – bitte ohne Webhook-URLs oder private World-Daten.

Bei **CORS-/Netzwerkfehlern** sendet der GM-Browser direkt an Discord, auch bei Docker-Hosting. Der Formularversand vermeidet eine zusätzliche JSON-OPTIONS-Vorabprüfung; die Antwort muss weiterhin per CORS lesbar sein. Browser-Erweiterungen, DNS, TLS oder eine Content-Security-Policy können die Verbindung blockieren. Ein zweiter Browser hilft beim Eingrenzen. Vor erneutem Senden im Discord-Kanal nachsehen, um doppelte Nachrichten zu vermeiden.

Bei teilweise fehlgeschlagenem Speichern kann der lokale Webhook bereits geändert sein. Foundry-Verbindung prüfen und erneut speichern.

### Auf einem neuen PC weiterarbeiten

Das Projekt mit allen Programmdateien, Tests und Anleitungen liegt vollständig auf [GitHub](https://github.com/Ginkgo85/foundry-world-status). Du brauchst dafür keine Kenntnisse über Git.

1. Öffne Codex auf dem neuen Windows-PC. Du benötigst **Git für Windows** und **GitHub CLI**. Codex kann dir bei der Einrichtung helfen.
2. Melde dich einmal über den Browser bei GitHub als **Ginkgo85** an. Codex führt dich durch die Anmeldung.
3. Lass Codex das vollständige Projekt auf den PC holen. Dafür kannst du diesen Auftrag kopieren:

   ```text
   Hole das Projekt Ginkgo85/foundry-world-status von GitHub auf diesen PC.
   Prüfe zuerst, ob Git und GitHub CLI eingerichtet sind, und hilf mir
   bei Bedarf bei der Installation und der einmaligen GitHub-Anmeldung.
   Lies im Projekt zuerst AGENTS.md und die weiteren Projektanweisungen.
   Richte die Werkzeuge für die Tests nach diesen Anweisungen ein.
   Ändere noch keine Projektdateien und veröffentliche nichts.
   ```

4. Öffne den heruntergeladenen Ordner **foundry-world-status** als Projekt in Codex. Danach beschreibst du einfach, was du ändern möchtest. Codex erledigt Tests, das Speichern der Änderungen als Commits und das Übertragen auf GitHub (Push) nach den Projektregeln und prüft die automatischen GitHub-Prüfungen.

**Später eine Version veröffentlichen:** Lass Codex zuerst die gewünschte neue Version vorbereiten und alle Prüfungen abschließen. Teste das Modul wie in `PUBLISHING.md` beschrieben. Danach startest du auf GitHub nur noch **Actions → Release → Run workflow** und wählst **main**. GitHub erstellt das fertige Paket automatisch.

### Lizenz und Autor

[MIT-Lizenz](LICENSE) · Copyright (c) 2026 Ginkgo85 · [Ginkgo85 / Projektseite](https://github.com/Ginkgo85/foundry-world-status)

Discord und das Discord-Logo sind Marken von Discord Inc. Dieses Modul ist weder offiziell mit Discord Inc. verbunden noch von ihr unterstützt. Foundry Virtual Tabletop und zugehörige Marken gehören Foundry Gaming LLC; dieses Modul ist kein offizielles Foundry-Gaming-Produkt.

[English ↓](#english) · [Nach oben ↑](#foundry-world-status)

---

<a id="english"></a>

## English Guide

Version **1.2.1** · Foundry VTT **14.368** · GM-only controls · No module dependencies

**Status: Community Release / In Development**

This module is distributed via GitHub and is not listed in the official Foundry VTT package directory. Published packages are available on the GitHub Releases page.

Announce your game session as **ONLINE** or **OFFLINE** on Discord with one click, using a customizable message and a direct link to your Foundry game world.

[Continue working on a new PC](#continue-working-on-a-new-pc) – a simple guide to working on this project with Codex.

### Features

- Discord button in Foundry's left toolbar, visible only to GMs.
- Customizable Discord embeds with text, colors, images and a server link.
- Optional role mention for ONLINE announcements and a built-in connection test.
- Optional automatic OFFLINE announcement before returning to Setup.
- Settings and announcement status are stored per world; the webhook stays in the current browser.
- German and English interface with an optional local language preference for GMs only.

**ONLINE is announced manually by a GM.** There is no automatic availability check or message when the world starts. ON/OFF shows the saved announcement status.

### Installation

The permanent manifest link installs the latest published release. A new version becomes available through this link only after it is published.

1. In Foundry Setup, open **Add-on Modules → Install Module**.
2. Copy and paste this manifest link, then install:

   ```text
   https://github.com/Ginkgo85/foundry-world-status/releases/latest/download/module.json
   ```

3. Open your world and enable the module under **Settings → Manage Modules**, then reload the world.

Alternatively, download the [ZIP for v1.2.1](https://github.com/Ginkgo85/foundry-world-status/releases/download/v1.2.1/foundry-world-status.zip) (available after publication) and extract it into `Data/modules/foundry-world-status/`. `module.json` is at the ZIP root and must end up directly inside the module folder. Restart Foundry or reload its modules afterward.

For a manual update, back up the existing module folder and replace it with the new ZIP contents. **Do not delete world data.**

### Language

The module interface supports **German and English**. By default, **Automatic** follows Foundry's active interface language. Other Foundry languages use Foundry's English fallback.

As a GM, in Foundry's standard module settings, choose **Foundry World Status → Language / Sprache**, select **Automatic**, **Deutsch** or **English**, and save. This preference applies only to your user in this world and browser. Other GMs and players are unaffected, even when they use another Foundry user on the same PC. A different browser starts with Automatic again.

Open module windows and the button tooltip update without reloading the world. Unsaved input is preserved. If saving or a connection test is in progress, window labels update the next time you open it at the latest.

**Your saved Discord texts are never translated or overwritten.** Only defaults that have not yet been saved may follow the selected language. Changing language sends no Discord message and changes neither the webhook nor the ON/OFF status. Players see no manual language selector and always follow Foundry's active UI language. Previously saved player language preferences are kept but not applied; Discord controls remain GM-only.

### Quick start

1. In Discord, open **Edit Channel → Integrations → Webhooks → New Webhook** in the desired text channel and copy the webhook URL.
2. In Foundry's module settings, open **Foundry World Status → Configure World Status for Discord**.
3. Enter the **Discord Webhook URL** and the **Foundry Server URL / Custom Domain** that your players can reach.
   The eye button temporarily reveals the webhook URL; it is hidden again when you reopen the window.
4. Customize the message. The ONLINE link display text is optional: with text, that text becomes the link; without it, the server URL is displayed. An explicitly saved empty field stays empty. **Test Discord Connection** sends a real test message without changing ON/OFF status.
5. Click **Save Settings** and use the Discord button in the left toolbar.

For a role mention, enter the numeric Discord role ID. Only that role may be mentioned in ONLINE announcements; `@everyone`, `@here` and user mentions are blocked. Discord permissions still apply.

### Settings preview

![Preview of the module settings](https://raw.githubusercontent.com/Ginkgo85/foundry-world-status/main/docs/images/settings-connection.png)

<details>
<summary>Show another preview</summary>

![Another preview of the module settings](https://raw.githubusercontent.com/Ginkgo85/foundry-world-status/main/docs/images/settings-offline.png)

</details>

*These images are previews and may differ from the current version. The screenshots show the German interface.*

### The ON/OFF button

The Discord logo always stays white and keeps its original proportions. Only the separate status text and border use status colors.

| Display | Clicking it |
| --- | --- |
| <img src="icons/discord-off.svg" width="40" height="40" alt="White Discord logo with red OFF status"> **OFF** | Sends the ONLINE message and changes to ON after confirmation and saving. |
| <img src="icons/discord-on.svg" width="40" height="40" alt="White Discord logo with green ON status"> **ON** | Sends the OFFLINE message and changes to OFF. |

If OFFLINE sending is disabled, clicking ON only resets the status to OFF. The button appears at the end of the current tool group; a scene must be active and the toolbar must be open.

With multiple GMs, one person should handle announcements. The send lock applies per browser and does not prevent simultaneous messages from different GM sessions.

### Automatic OFFLINE announcements

Under **OFFLINE Message**, enable both options and save:

- **Send an OFFLINE Message to Discord**
- **Announce OFFLINE before Return to Setup**

When the saved status is ON, the message is sent before the attempt to close the world through **Return to Setup**. This feature is off by default. A sending or storage error stops the operation.

**Logging out does not change the shared status. Closing the browser or tab, crashes and stopping the server are not detected.** If closing the world fails after the announcement, the world may still be running despite OFF. This option does not confirm an actual server shutdown; manually announcing OFF before ending the world remains the simplest alternative.

### Security and help

Keep webhook URLs secret and never publish them on GitHub. The webhook is stored **only in the current browser**, separately for each world and GM. Other browsers or devices need their own setup. Clearing browser data also removes the local webhook.

Client storage is not a secret vault. The password field masks the URL but does not encrypt it. Scripts, extensions or people with access to the same browser profile can read local storage. Use separate browser profiles for GMs and players.

<details>
<summary>Keep existing settings</summary>

The module ID remains `foundry-world-status`; message texts and world status are preserved. A previously shared webhook is copied to local storage when a GM starts the world or opens the settings. The copy is checked before the shared value is removed. Ideally, only one GM should be logged in during this step. Other GM browsers must then be configured separately.

If storage fails, the previous copy is kept; reopen the settings after fixing the problem. If the local and shared webhooks differ, nothing is overwritten. Sign in as the same GM using a fresh browser profile and open the settings to copy the shared value there. The first browser keeps its different value. Do not clear browser data beforehand.

The older `foundry-discord-announcer` installation is not automatically migrated or modified. When switching, install the new module separately, disable the old one in the world, and manually transfer settings and the webhook as GM. Do not run both modules at the same time.

Migration cannot retract webhooks already shared or stored in backups. Replace a previously exposed webhook in Discord.

</details>

- [Changelog](CHANGELOG.md) · The project includes a validation report and development instructions in `VALIDIERUNG.md` and `CONTRIBUTING.md` (German).
- [Report a bug](https://github.com/Ginkgo85/foundry-world-status/issues) – do not include webhook URLs or private world data.

For **CORS/network errors**, remember that the GM's browser sends directly to Discord, even when Foundry runs in Docker. Sending form data avoids an additional JSON OPTIONS preflight; the response must still be readable through CORS. Browser extensions, DNS, TLS or a Content Security Policy can block the connection. Try another browser to narrow down the cause. Before sending again, check the Discord channel to avoid duplicate messages.

After a partial save failure, the local webhook may already have changed. Check the Foundry connection and save again.

### Continue working on a new PC

The complete project, including program files, tests and instructions, is on [GitHub](https://github.com/Ginkgo85/foundry-world-status). You do not need to know Git.

1. Open Codex on your new Windows PC. You need **Git for Windows** and **GitHub CLI**. Codex can help set them up.
2. Sign in to GitHub once through your browser as **Ginkgo85**, or use your own account when working on your own copy. Codex can guide you.
3. Ask Codex to download the complete project. You can copy this request:

   ```text
   Download Ginkgo85/foundry-world-status from GitHub onto this PC.
   First check whether Git and GitHub CLI are set up, and help me
   install them and sign in to GitHub if needed.
   Read AGENTS.md and the other project instructions first.
   Set up the testing tools according to those instructions.
   Do not change project files or publish anything yet.
   ```

4. Open the downloaded **foundry-world-status** folder as a project in Codex. Then simply describe what you want to change. Codex handles tests, saving changes as commits, uploading them to GitHub (pushing), and checking GitHub's automatic checks according to the project rules.

**Publishing a version later:** First ask Codex to prepare the new version and finish the checks. Test the module as described in `PUBLISHING.md`. Then, on GitHub, select **Actions → Release → Run workflow** and choose **main**. GitHub creates the package automatically.

### License and author

[MIT License](LICENSE) · Copyright (c) 2026 Ginkgo85 · [Ginkgo85 / Project page](https://github.com/Ginkgo85/foundry-world-status)

Discord and the Discord logo are trademarks of Discord Inc. This module is not affiliated with or endorsed by Discord Inc. Foundry Virtual Tabletop and its associated trademarks belong to Foundry Gaming LLC; this module is not an official Foundry Gaming product.

[Deutsch ↑](#deutsch) · [Back to top ↑](#foundry-world-status)
