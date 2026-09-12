# GitHub-Actions-Einrichtung – 1.1.0

Referenz: öffentlicher main **92cb76898d866821e84f6a5bfb123867fb0d30b1**. Die 14 öffentlichen Dateien entsprachen dem lokalen Kandidaten nach Normalisierung der Zeilenenden. Laufzeitfunktionen und Version 1.1.0 bleiben unverändert. Die bisher nur lokalen Entwicklungsdateien wurden in einen echten Git-Checkout übernommen und konsolidiert.

## Workflows

| Workflow | Start | Aufgabe |
| --- | --- | --- |
| CI | push/PR auf main, manuell | Quellen prüfen, Tests, Build, tatsächliche ZIP-Artefakte prüfen |
| Release | ausschließlich manuell auf main | dieselben Prüfungen erneut, Commit-/Tag-Prüfung, neuer Tag, Release und zwei Assets |
| CodeQL | push/PR auf main, manuell | separate JavaScript-Analyse |

Künftiger Release: **GitHub → Actions → Release → Run workflow → main**. Version wird aus module.json gelesen, v<version> daraus abgeleitet. Keine manuelle Versionseingabe, Tag-Erstellung oder Uploads. [Kurzanleitung](PUBLISHING.md).

## Schutz und Rechte

CI benötigt contents: read; Release erhält ausdrücklich contents: write. Das automatische GITHUB_TOKEN genügt. Keine zusätzlichen persönlichen/Foundry-Tokens und keine pauschale Änderung der Repository-Standardrechte erforderlich. Actions muss erlaubt sein; Organisationseinschränkungen könnten zusätzlich greifen, wurden aber nicht festgestellt oder geändert.

Release wird nur bei erfolgreicher eigener Test-/Build-/Artefaktprüfung ausgeführt. Nicht-main-Starts, ein abweichender oder inzwischen überholter Commit, vorhandene Tags/Releases und API-Fehler stoppen den Ablauf. Atomare Tag-Erstellung verhindert Überschreiben bei einem konkurrierend angelegten Tag. Concurrency lässt nur einen Release-Vorgang gleichzeitig laufen. Nach Teilfehlern werden vorhandene Tags/Entwürfe nicht stillschweigend ersetzt.

Historischer Tag v.1.0.0 bleibt unverändert. release/ bleibt durch .gitignore ausgeschlossen und wird nicht committed.

## Offizielle Actions und Pins

Am 12. September 2026 gegen die offiziellen Tags verifiziert:

- actions/checkout **v7.0.1**: 3d3c42e5aac5ba805825da76410c181273ba90b1
- actions/setup-node **v7.0.0**: 820762786026740c76f36085b0efc47a31fe5020
- github/codeql-action **v4.38.0**: b96794f015dfd88f77b49b1c93e0fa7110f94c63

CodeQLs allgemeiner „latest release“ verweist auf ein Bundle; für die Action wurde deshalb der tatsächliche v4.38.0-Tag bis zum Commit aufgelöst. Alle uses verwenden volle SHAs mit Versionskommentar. Release-Erstellung nutzt die auf GitHub-Ubuntu-Runnern vorhandene gh-CLI statt einer weiteren Action. [Offizielle CLI-Syntax](https://cli.github.com/manual/gh_release_create).

Node 24 bleibt die feste Major-Version. Lokal ausgeführt mit Node 24.19.0 und temporärem npm 12.0.2; keine Projektdependencies ergänzt.

## Testergebnisse

- npm test ohne Core: **105 Tests, 101 bestanden, 0 Fehler, 4 erwartete Core-Skips**.
- npm test mit lokalem Core 14.367: **105 Tests, 105 bestanden, 0 Fehler, 0 Skips**.
- npm test führt die Vorprüfung automatisch aus: 15 JS/MJS-Dateien, 3 Quell-JSON-Dateien, Metadaten und bekannte Secret-Muster.
- npm run build:release und npm run test:release: bestanden; 14 Dateien, Root-Manifest, separate Manifest-Kopie identisch.
- Zwei Builds bytegleich; Node prüft Verzeichnis, CRC32 und Inhalte gegen Quellen.
- Drei Workflow-Dateien mit actionlint 1.7.12: bestanden, ohne separates ShellCheck.
- Neue Tests simulieren falschen Branch/Commit, vorhandenen Tag/Release, fehlende API-Rechte, veränderten main, Tag-Rennen und ungültige Artefakte ohne echte Veröffentlichung.
- Workflow-Reihenfolge und die normale Erfolgsvoraussetzung für den Publish-Schritt sind geprüft; keine continue-on-error-/always-Ausnahme. Ein echter fehlgeschlagener GitHub-Lauf wurde nicht ausgelöst.

Die bisherigen Runtime-Regressionstests bestätigen optionalen Linktext, Escaping, Vorschau, dauerhaft leere Werte, clientlokalen Webhook, Migration, neutrale Speicherfehler und Logout/Setup. Browserprogramme bleiben verfügbar; in diesem Durchlauf nicht erneut ausgeführt, da die Laufzeitdateien gegenüber dem zuvor geprüften Kandidaten unverändert sind.

## Stand vor dem ersten Push

Die GitHub-Anmeldung für Ginkgo85 und die Git-Anbindung sind eingerichtet. Der Remote zeigt auf Ginkgo85/foundry-world-status, der Branch ist main und der Arbeitsstand enthält keine fremden Änderungen. Der vorhandene lokale Commit bleibt unverändert. Nach dem Push werden CI und CodeQL für den exakten GitHub-Commit kontrolliert. Der Release-Workflow wird dabei nicht gestartet.

Zu diesem Zeitpunkt noch nicht geprüft: tatsächliche GitHub-Ausführung, echte Discord-Zustellung/Produktivwelt und Rechte möglicher Organisationsrichtlinien. Für den Maintainer-Test siehe [VALIDIERUNG.md](VALIDIERUNG.md).

**Release erzeugt: Nein**
