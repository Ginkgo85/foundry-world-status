# Foundry World Status

Version **1.0.0** · Foundry VTT **14.367** · Nur für GMs · Keine Modulabhängigkeiten

**Status: In Development / Unreleased**

Das Modul wird privat beziehungsweise manuell als ZIP oder über GitHub weitergegeben. Die aktuellen Änderungen sind noch nicht als neuer Release veröffentlicht.

Kündige deine Spielrunde mit einem Klick auf Discord als **ONLINE** oder **OFFLINE** an – mit anpassbarer Nachricht und direktem Link zu deiner Foundry-Spielwelt.

## Funktionen

- Discord-Button in der linken Foundry-Werkzeugleiste, sichtbar nur für GMs.
- Anpassbare Discord-Embeds mit Texten, Farben, Bildern und Serverlink.
- Optionaler Rollenping bei ONLINE und integrierter Verbindungstest.
- Optional automatisch OFFLINE vor dem Zurückkehren zum Setup.
- Einstellungen und Ankündigungsstatus werden pro Welt gespeichert; der Webhook bleibt im jeweiligen Browser.

**ONLINE wird bewusst per GM-Klick angekündigt.** Es gibt keine automatische Erreichbarkeitsprüfung und keine Nachricht beim Starten der Welt. ON/OFF zeigt den gespeicherten Ankündigungsstatus an.

## Installation

1. Die bereitgestellte **foundry-world-status.zip** herunterladen.
2. In `Data/modules/foundry-world-status/` entpacken. `module.json` liegt direkt im ZIP-Root und muss anschließend direkt im Modulordner liegen.
3. Foundry neu starten beziehungsweise die Module neu laden.
4. Die Welt öffnen und unter **Einstellungen → Module verwalten** das Modul aktivieren. Anschließend die Welt neu laden.

Bei einem Update den bisherigen Modulordner sichern und durch den neuen ZIP-Inhalt ersetzen. **Keine World-Daten löschen.** Diese Fassung wird manuell installiert und enthält keine automatische Manifest-/Download-URL.

## In wenigen Schritten startklar

1. In Discord im gewünschten Textkanal **Kanal bearbeiten → Integrationen → Webhooks → Neuer Webhook** öffnen und die Webhook-URL kopieren.
2. In Foundrys Moduleinstellungen **Foundry World Status → Weltstatus für Discord konfigurieren** öffnen.
3. **Discord Webhook URL** und die für deine Spieler erreichbare **Foundry Server URL / Wunschdomain** eintragen.
   Mit dem Augen-Button lässt sich die Webhook-URL vorübergehend einblenden; beim erneuten Öffnen ist sie wieder verdeckt.
4. Nachricht nach Wunsch gestalten. **Discord-Verbindung testen** sendet eine echte Testnachricht, ohne den ON/OFF-Status zu ändern.
5. **Einstellungen speichern** und den Discord-Button in der linken Werkzeugleiste verwenden.

Für einen Rollenping die numerische Discord-Rollen-ID eintragen. Nur diese Rolle darf bei ONLINE erwähnt werden; `@everyone`, `@here` und Benutzer-Pings sind gesperrt. Discord-Berechtigungen gelten zusätzlich.

## Der ON/OFF-Button

Das Discord-Logo bleibt immer weiß und unverzerrt. Nur der separate Schriftzug und der Rahmen zeigen die Statusfarbe.

| Anzeige | Ein Klick darauf |
| --- | --- |
| <img src="icons/discord-off.svg" width="40" height="40" alt="Weißes Discord-Logo, roter OFF-Status"> **OFF** | Sendet die ONLINE-Nachricht und wechselt nach Bestätigung und Speicherung auf ON. |
| <img src="icons/discord-on.svg" width="40" height="40" alt="Weißes Discord-Logo, grüner ON-Status"> **ON** | Sendet die OFFLINE-Nachricht und wechselt auf OFF. |

Ist der OFFLINE-Versand deaktiviert, setzt ein Klick auf ON nur den Status auf OFF. Der Button steht am Ende der aktuellen Werkzeuggruppe; dafür muss eine Szene aktiv und die Werkzeugleiste geöffnet sein.

Bei mehreren GMs sollte eine Person die Ankündigungen übernehmen: Die Versandsperre gilt pro Browser und verhindert keine gleichzeitigen Nachrichten aus mehreren GM-Sitzungen.

## Automatisch OFFLINE ankündigen

Unter **OFFLINE Nachricht** beide Optionen aktivieren und speichern:

- **Offline-Nachricht an Discord senden**
- **Vor „Zurück zum Setup“ OFFLINE ankündigen**

Bei gespeichertem Status ON wird die Nachricht vor dem Schließversuch über **„Zurück zum Setup“** gesendet. Die Automatik ist standardmäßig ausgeschaltet. Bei einem Versand- oder Speicherfehler bleibt der Vorgang angehalten.

**Abmelden verändert den gemeinsamen Status nicht. Browser-/Tab-Schließen, Abstürze und das Stoppen des Servers werden nicht erfasst.** Scheitert das Schließen der Welt nach der Ankündigung, kann sie trotz OFF weiterlaufen. Die Option bestätigt keine tatsächliche Serverabschaltung; manuelles OFF vor dem Weltende bleibt die einfachste Alternative.

## Sicherheit und Hilfe

Webhook-URLs geheim halten und niemals auf GitHub veröffentlichen. Der Webhook wird **nur im jeweiligen Browser**, getrennt nach Welt und GM, gespeichert. Andere Browser oder Geräte müssen separat eingerichtet werden. Das Löschen der Browserdaten entfernt auch den lokalen Webhook.

Das Passwortfeld verdeckt die URL, verschlüsselt sie aber nicht. Skripte, Erweiterungen oder Personen mit Zugriff auf dasselbe Browserprofil können lokalen Speicher auslesen. Für GM und Spieler getrennte Browserprofile verwenden.

<details>
<summary>Vorhandene Einstellungen übernehmen</summary>

Die Modul-ID bleibt `foundry-world-status`; Nachrichtentexte und Weltstatus bleiben erhalten. Einen bisher gemeinsam gespeicherten Webhook kopiert das Modul beim GM-Start beziehungsweise Öffnen der Einstellungen lokal und prüft die Kopie, bevor es den gemeinsamen Wert entfernt. Dafür möglichst nur einen GM anmelden. Andere GM-Browser müssen anschließend separat eingerichtet werden.

Bei Speicherfehlern bleibt die bisherige Kopie erhalten; nach Beheben des Fehlers die Einstellungen erneut öffnen. Bei widersprüchlichen lokalen und gemeinsamen Webhooks wird nichts überschrieben: Mit einem frischen Browserprofil als derselbe GM anmelden und die Einstellungen öffnen, um den gemeinsamen Wert dort zu übernehmen. Der erste Browser behält seinen abweichenden Wert. Vorher keine Browserdaten löschen.

Die ältere Installation `foundry-discord-announcer` wird nicht automatisch migriert oder verändert. Beim Wechsel das neue Modul separat installieren, das alte in der Welt deaktivieren und Einstellungen sowie Webhook als GM manuell übertragen. Nicht beide Module gleichzeitig verwenden.

Bereits verteilte Webhooks und Backups lassen sich durch die Übernahme nicht zurückholen. Einen zuvor offengelegten Webhook in Discord ersetzen.

</details>

- [Änderungen](CHANGELOG.md) · Prüfbericht und Entwicklungsanleitung liegen im Projekt unter `VALIDIERUNG.md` und `CONTRIBUTING.md`.
- [Fehler melden](https://github.com/Ginkgo85/foundry-discord-announcer/issues) – bitte ohne Webhook-URLs oder private World-Daten.

Bei **CORS-/Netzwerkfehlern** sendet der GM-Browser direkt an Discord, auch bei Docker-Hosting. Der Formularversand vermeidet eine zusätzliche JSON-OPTIONS-Vorabprüfung; die Antwort muss weiterhin per CORS lesbar sein. Browser-Erweiterungen, DNS, TLS oder eine Content-Security-Policy können die Verbindung blockieren. Ein zweiter Browser hilft beim Eingrenzen. Vor erneutem Senden im Discord-Kanal nachsehen, um doppelte Nachrichten zu vermeiden.

Bei teilweise fehlgeschlagenem Speichern kann der lokale Webhook bereits geändert sein. Foundry-Verbindung prüfen und erneut speichern.

## Lizenz und Autor

[MIT-Lizenz](LICENSE) · Copyright (c) 2026 Frank · [Ginkgo85 / Projektseite](https://github.com/Ginkgo85/foundry-discord-announcer)

Das GitHub-Repository trägt vorerst noch den früheren Namen.

Discord und das Discord-Logo sind Marken von Discord Inc. Dieses Modul ist weder offiziell mit Discord Inc. verbunden noch von ihr unterstützt. Foundry Virtual Tabletop und zugehörige Marken gehören Foundry Gaming LLC; dieses Modul ist kein offizielles Foundry-Gaming-Produkt.
