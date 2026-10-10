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

GitHub prüft den aktuellen Stand erneut, baut und prüft das Paket, erstellt den neuen Tag und Release und hängt module.json sowie foundry-world-status.zip an. Erst nach erfolgreichem Abschluss dieses Jobs übermittelt der separate Foundry-Job die veröffentlichte Version an das Foundry-Paketverzeichnis. Die Dateien bleiben auf GitHub; Foundry erhält die versionsgebundene Manifest-Adresse, die Release-Notizen und die Kompatibilität.

**Keine Dateien manuell hochladen. Keinen Tag manuell erstellen. Keine lokalen Build-Tools nötig.**

## Falls der Workflow abbricht

- Tag vorhanden, Release fehlt: Ein erneuter Lauf darf den Tag unverändert verwenden, wenn er direkt auf denselben geprüften GITHUB_SHA zeigt. Der Commit muss weiterhin der aktuelle main sein.
- Tag zeigt auf einen anderen Commit: Abbruch. Den Tag niemals verschieben oder löschen; eine neue Version vorbereiten.
- Release bereits vorhanden, auch als Entwurf: Abbruch. Vorhandene Releases und Assets werden niemals aktualisiert oder ersetzt. Für eine Korrektur eine neue Version vorbereiten.
- „main changed“: Den Workflow auf main erneut starten.
- Nur der Foundry-Job fehlgeschlagen: Der GitHub Release bleibt bestehen. Fehler zuerst prüfen und ausschließlich den fehlgeschlagenen Job erneut ausführen („Re-run failed jobs“), nicht den ganzen Release-Workflow neu starten. Bei unklarer Antwort zuerst die Foundry-Paketseite prüfen; eine möglicherweise bereits angelegte Version nicht blind erneut übermitteln.
- Andere Fehler: Den fehlgeschlagenen Lauf von Codex prüfen lassen. Nach einem teilweise fehlgeschlagenen Upload vorhandene Tags oder Entwürfe nicht eigenständig ersetzen.

## Einmalige Einrichtung

Die Workflow-Dateien müssen auf main liegen und GitHub Actions muss für das Repository erlaubt sein. Das normale GITHUB_TOKEN erhält seine nötigen Schreibrechte direkt im Release-Workflow. Für die zusätzliche Übermittlung an Foundry muss das Repository-Secret FOUNDRY_RELEASE_TOKEN den Package Release Token genau dieses Moduls enthalten. Er wird ausschließlich dem Foundry-Schritt übergeben, niemals ins Modul oder ZIP aufgenommen. Keine persönlichen GitHub-Tokens oder pauschale Umstellung aller Workflows auf Schreibrechte erforderlich.

**Version 1.3.2 für Foundry 14.368 ist zur Veröffentlichung vorbereitet.** Vor dem Start noch in einer echten Testwelt prüfen: Abmelden sendet nichts; bei Status ON und aktiviertem Haken **Vor „Zurück zum Setup“ automatisch OFFLINE senden** wird vor „Zurück zum Setup“ eine OFFLINE-Nachricht gesendet. Mit ausgeschaltetem Haken sendet „Zurück zum Setup“ keine Nachricht, der manuelle OFFLINE-Button sendet weiterhin. Anschließend erfolgreiche CI-/CodeQL-Läufe für den aktuellen main prüfen und **Actions → Release → Run workflow → main** starten. Der Button heißt „Run workflow“, nicht „New workflow“. Keine Dateien manuell hochladen.

## Foundry-Verbindung ohne Veröffentlichung testen

Unter Actions den separaten Workflow **Foundry Connection Test → Run workflow → main** starten. Er hat keine Veröffentlichungsauswahl, erstellt weder Tag noch Release und baut kein Paket. Er prüft den bestehenden GitHub Release zur aktuellen Modulversion und sendet ausschließlich die offizielle Foundry-Anfrage mit **dry-run: true**. Damit bereits vorhandene Versionen den Token-Test nicht als Duplikat blockieren, verwendet nur diese Anfrage eine einmalige Kennung im Format 0.0.0-test.<Lauf-ID>.<Versuch>. Sie wird nicht gespeichert und niemals in eine Datei oder einen Tag übernommen. Versionsnummer und Dateien bleiben unverändert.

Nur eine ausdrückliche Dry-run-Erfolgsantwort bestätigt die Verbindung, Token-Berechtigung und Validierung dieser Testanfrage. Das ist kein vollständiger Test einer zukünftigen Veröffentlichung: Die Anfrage verwendet das vorhandene öffentliche Manifest und eine nicht gespeicherte Testkennung. Der normale Release-Pfad verwendet weiterhin ausschließlich die echte Modulversion samt passendem Release und lehnt Testkennungen ab. HTTP-/Token-/Netzwerkfehler bleiben sichtbar, ohne Secret oder rohe Antwortinhalte zu protokollieren; keine automatischen Wiederholungen.

Der normale Release-Workflow bleibt manuell auszulösen. Ein Push allein veröffentlicht nichts. Diese Integration ändert keine Versionsnummer und veröffentlicht keine bestehende Version nachträglich.

Grundlage: [Foundry Package Release API](https://foundryvtt.com/article/package-release-api/).
