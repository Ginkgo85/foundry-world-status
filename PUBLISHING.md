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

- Tag vorhanden, Release fehlt: Ein erneuter Lauf darf den Tag unverändert verwenden, wenn er direkt auf denselben geprüften GITHUB_SHA zeigt. Der Commit muss weiterhin der aktuelle main sein.
- Tag zeigt auf einen anderen Commit: Abbruch. Den Tag niemals verschieben oder löschen; eine neue Version vorbereiten.
- Release bereits vorhanden, auch als Entwurf: Abbruch. Vorhandene Releases und Assets werden niemals aktualisiert oder ersetzt. Für eine Korrektur eine neue Version vorbereiten.
- „main changed“: Den Workflow auf main erneut starten.
- Andere Fehler: Den fehlgeschlagenen Lauf von Codex prüfen lassen. Nach einem teilweise fehlgeschlagenen Upload vorhandene Tags oder Entwürfe nicht eigenständig ersetzen.

## Einmalige Einrichtung

Die Workflow-Dateien müssen auf main liegen und GitHub Actions muss für das Repository erlaubt sein. Das normale GITHUB_TOKEN erhält seine nötigen Schreibrechte direkt im Release-Workflow. Keine persönlichen Tokens, Foundry-Tokens oder pauschale Umstellung aller Workflows auf Schreibrechte erforderlich.

Jede Veröffentlichung wird separat gestartet. **1.3.1 für Foundry 14.368** wird als Korrektur für die bereits veröffentlichte 1.3.0 vorbereitet. Vor Veröffentlichung die Korrektur in einer echten Testwelt prüfen: Zurück-zum-Setup ohne Fehlermeldung sowie Abmelden mit aktivierter und deaktivierter neuer Option. Danach erfolgreiche CI-/CodeQL-Läufe für den aktuellen main abwarten und **Actions → Release → Run workflow → main** starten. Tag, Manifest und ZIP erstellt der Workflow automatisch.
