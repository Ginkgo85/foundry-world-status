# Release erstellen

## Voraussetzungen

- Gewünschte Änderungen befinden sich auf main.
- Der Workflow **CI** ist erfolgreich.
- Der manuelle Foundry-/Discord-Test wurde durchgeführt.
- Die gewünschte neue Version steht in module.json. Codex hält die zugehörigen Versionsangaben konsistent.

## Release

1. [GitHub öffnen](https://github.com/Ginkgo85/foundry-world-status).
2. **Actions** öffnen.
3. **Release** auswählen.
4. **Run workflow** anklicken.
5. Branch **main** auswählen und starten.

GitHub prüft den aktuellen Stand erneut, baut und prüft das Paket, erstellt den neuen Tag und Release und hängt module.json sowie foundry-world-status.zip an.

**Keine Dateien manuell hochladen. Keinen Tag manuell erstellen. Keine lokalen Build-Tools nötig.**

## Falls der Workflow abbricht

- „Tag/Release bereits vorhanden“: Für eine Korrektur eine neue Version vorbereiten lassen, beispielsweise 1.1.1. Vorhandene Releases bleiben unverändert.
- „main changed“: Den Workflow auf main erneut starten.
- Andere Fehler: Den fehlgeschlagenen Lauf von Codex prüfen lassen. Nach einem teilweise fehlgeschlagenen Upload vorhandene Tags oder Entwürfe nicht eigenständig ersetzen.

## Einmalige Einrichtung

Die Workflow-Dateien müssen auf main liegen und GitHub Actions muss für das Repository erlaubt sein. Das normale GITHUB_TOKEN erhält seine nötigen Schreibrechte direkt im Release-Workflow. Keine persönlichen Tokens, Foundry-Tokens oder pauschale Umstellung aller Workflows auf Schreibrechte erforderlich.

Die erste Veröffentlichung wird separat freigegeben. **In diesem Einrichtungsauftrag wurde kein Release erzeugt.**
