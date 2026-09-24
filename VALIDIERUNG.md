# Validierung – GitHub Actions und Modul 1.1.1

Prüfdatum: 24. September 2026. Version 1.1.1 vorbereitet; in diesem Durchlauf kein Release erzeugt.

## Ergebnisse dieses Durchlaufs

- Node 24.19.0 / npm 12.0.2 ohne Core: **112 Tests, 108 bestanden, 0 Fehler, 4 erwartete Skips**.
- Mit lokalem Foundry-Core 14.368: **112 Tests, 112 bestanden, 0 Fehler, 0 Skips**.
- npm-Vorprüfung: JavaScript-Syntax, JSON, Release-Metadaten und bekannte Secret-Muster bestanden.
- npm run build:release und npm run test:release bestanden: 14 ZIP-Dateien, Root-Manifest und separate Manifest-Kopie.
- Zweimaliger Build bytegleich; ZIP-Einträge, CRC32 und Quellenvergleich bestanden.
- CI, Release und CodeQL mit actionlint 1.7.12 bestanden; kein separates ShellCheck.

Die 20 Release-Tests prüfen zusätzlich den sicheren Wiederholungsfall mit passendem Tag ohne Release, den kompletten simulierten Teilfehler mit anschließendem Wiederholungsversuch, abweichende oder unklare Tag-Ziele und vorhandene Releases einschließlich Entwürfen. Weiterhin geprüft sind Branch/Commit, API-Unsicherheit, main-Änderung, konkurrierende Tag-Erstellung, Artefaktfehler, Versionsableitung, Secret-Muster und Workflow-Reihenfolge. Alle Remote-Zugriffe und Veröffentlichungen sind simuliert.

Die 92 bestehenden Tests bleiben enthalten: optionaler Linktext, Sonderzeichen, leere gespeicherte Werte, Vorschau, clientlokaler Speicher, Migration, Teilfehler und erneutes Speichern, Versand, Status, Logout und Setup sowie Build-/Pfadprüfungen.

## Lokal und in CI

    npm test
    npm run build:release
    npm run test:release

npm test führt über pretest automatisch tools/check-project.mjs aus. Danach laufen alle tests/*.test.mjs. Der zusätzliche test:release-Aufruf prüft die tatsächlich erzeugten Build-Artefakte und veröffentlicht nichts.

Core-Tests sind optional: FOUNDRY_APP_PATH auf resources/app einer eigenen lizenzierten 14.368-Installation setzen. Vier Tests werden ohne Core ausdrücklich übersprungen; zusätzlich meldet der Handlebars-Teil seine Nichtausführung. CI lädt keine Foundry-Dateien.

## Browserprüfungen für Entwickler

Vorhandene Programme:

    node tests/browser-check.mjs
    node tests/cors-browser-check.mjs

NODE_DEPENDENCIES muss auf einen vorhandenen Playwright-Ordner zeigen. UI benötigt FOUNDRY_APP_PATH. TEST_BROWSER ist chrome oder firefox; Firefox verwendet bei Bedarf PLAYWRIGHT_BROWSERS_PATH.

Diese Programme verwenden lokale Fixtures, echte Core-Styles/FormDataExtended und simuliertes Discord beziehungsweise zwei lokale CORS-Ursprünge. Screenshots bleiben unter dem ignorierten validation/.

Chrome 153.0.8010.53 und Firefox 153.0: UI- und CORS-Prüfungen erneut erfolgreich gegen die lokale Foundry-14.368-Installation. Geprüft wurden Formularauswertung, Vorschau, Speichern, Webhook-Auge, Icons, automatisches OFFLINE vor Setup und unveränderter Status beim Abmelden. Alle Discord-Aufrufe wurden simuliert; es lief keine echte Spielwelt.

## Kurzer manueller Foundry-/Discord-Test

Vor einer Veröffentlichung in einer gesicherten Testwelt und einem privaten Discord-Kanal:

1. Mit vorhandenem gemeinsamem Webhook als GM anmelden und Einstellungen öffnen. Übernahme prüfen, Verbindung testen, Browser neu starten und erneut testen. Danach darf das World Setting keinen Webhook mehr enthalten; ein zweites Browserprofil darf keinen automatisch übernommenen Webhook besitzen.
2. ONLINE mit Linktext „Zur Spielwelt“ senden; Linkziel und Titel-Link prüfen.
3. Linktext leeren, speichern, neu öffnen: Feld bleibt leer, Vorschau und Discord zeigen die anklickbare Serveradresse. Auch Leerzeichen testen.
4. Linktext „Spiel [heute] (jetzt)“ und eine Adresse mit Klammern prüfen.
5. Als GM bei ON abmelden: keine OFFLINE-Nachricht, Status unverändert.
6. Bei aktivierter Setup-Option „Zurück zum Setup“ wählen: OFFLINE vor dem Schließversuch. Abbruch des Warnungsdialogs sendet nichts; Versandfehler halten das Schließen an.

Keine Zugangsdaten in Berichte, Screenshots oder Git aufnehmen. Client Storage ist kein Secret Vault; mehrere GMs können gleichzeitig senden.

## Nicht geprüft

Echte Discord-Zustellung in einer laufenden Spielwelt unter Foundry 14.368 und die konkrete Docker-/Proxy-/TLS-Umgebung. Der manuelle Test oben steht vor der Veröffentlichung noch aus. Die neue Version wurde nicht veröffentlicht. CI und CodeQL werden nach dem Push für den vorbereiteten Commit geprüft; ihre Ergebnisse stehen unter GitHub Actions. Die Tests ersetzen keinen echten Versandtest.

[Einrichtungsbericht](REVIEW.md) · [Release-Kurzanleitung](PUBLISHING.md)
