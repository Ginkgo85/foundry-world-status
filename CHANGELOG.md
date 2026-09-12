# Changelog

## Unreleased

### Security
- Webhook browserlokal nach Welt und GM speichern.
- Gemeinsamen Webhook erst nach geprüftem Kopieren entfernen; Fehler und Konflikte ohne Secret-Ausgabe behandeln.

### Fixed
- GM-Abmelden verändert den gemeinsamen Ankündigungsstatus nicht mehr.
- Fehler beim Lesen der Konfiguration vor dem Setup-Schließversuch werden abgefangen.

### Changed
- Bestehende automatische OFFLINE-Option auf den Schließversuch über „Zurück zum Setup“ begrenzen.
- Manuelle ZIP-Verteilung dokumentieren und unbestätigte Update-/Download-Adressen entfernen.
- Lokale GitHub-Verweise verwenden das weiterhin vorhandene Repository Ginkgo85/foundry-discord-announcer.
- Node-Build ohne zusätzliche Abhängigkeiten ersetzt den PowerShell-Build; automatischer Release-Upload entfällt.
- Conventional Commits, Editor-Konfiguration und Regeln für zukünftige Arbeiten ergänzen.

### Tests
- Tests für Webhook-Übernahme, Speicherfehler, Konflikte und GM-/Welttrennung ergänzen.
- Logout-Regression und wiederholbaren ZIP-Build prüfen; bestehende Versand- und Browserprüfungen anpassen.

## 1.0.0 – lokale Ausgangsbasis

Diese Version war vor diesem Review im lokalen Projekt eingetragen. Eine Veröffentlichung dieser neuen Identität auf GitHub wird damit nicht behauptet.

- Das zuvor privat entwickelte Foundry Discord Announcer wurde als Foundry World Status mit der neuen technischen Modul-ID foundry-world-status vorbereitet.
- Dadurch entstanden getrennte Settings; keine automatische Übernahme aus foundry-discord-announcer.
- GM-only ON/OFF, Webhook-Test, konfigurierbare Embeds, Rollen-Ping, Statusspeicherung und deutschsprachige Oberfläche für Foundry 14.367.
- Die damalige gemeinsame Automatik vor Abmelden und Setup wurde im aktuellen Unreleased-Stand fachlich getrennt.

Ältere Release-Serien sind lokal nicht durch Git-Historie belegt und werden nicht erfunden.
