# Validierung – README und Release 1.2.0

## Nachtrag: gemeinsame README (25. September 2026)

Deutsch steht jetzt oben und Englisch darunter in derselben README.md. Die Sprachwahl oben und die Rücksprunglinks verwenden lokale Anker. README.en.md entfällt; die ursprünglichen Inhalte bleiben erhalten. Die vorhandenen Linkprüfungen prüfen beide Sprachabschnitte einschließlich ihrer Sprungziele.

Version und Laufzeitcode sind unverändert. v1.2.0 ist inzwischen auf GitHub veröffentlicht; das vorhandene Release, sein Tag und seine Assets werden durch diese Dokumentationsänderung nicht ersetzt. Der aktuelle lokale Build enthält 16 Dateien statt 17, einschließlich der gemeinsamen README.

Für diesen Nachtrag erneut ausgeführt: npm test ohne Core (141 Tests, 135 bestanden, 6 erwartete Skips), npm test mit Core 14.368 (141 bestanden, keine Skips), npm run build:release, npm run test:release und git diff --check. Browserprüfungen wurden für diese reine Dokumentationsänderung nicht erneut ausgeführt; die Ergebnisse für den unveränderten Laufzeitcode stehen im ursprünglichen Bericht unten. CI/CodeQL werden für den neuen Commit nach dem Push kontrolliert.

## Ursprünglicher Bericht vor Veröffentlichung von 1.2.0

Die folgenden Angaben dokumentieren den damaligen Vorbereitungsstand einschließlich der damals getrennten README-Dateien und ersetzen nicht den Nachtrag oben.

Prüfdatum: 25. September 2026. Kandidat **1.2.0** für Foundry **14.368**. GitHub veröffentlicht weiterhin 1.1.1; 1.2.0 wurde nicht veröffentlicht. Die ursprünglich genannte 14.687 wurde nach Rückfrage vom Benutzer auf 14.368 korrigiert.

## Ausgangszustand und gelesene Anweisungen

- Echtes Repository: `Ginkgo85/foundry-world-status`, Remote `https://github.com/Ginkgo85/foundry-world-status.git`, Branch `main`.
- Die Sprachfunktion stammt aus dem vorherigen lokalen Auftrag. Die bereits bekannten Änderungen wurden übernommen, keine fremden Änderungen überschrieben. Remote erneut geholt: `main` und `origin/main` sind identisch; letzter veröffentlichter Release ist v1.1.1. GitHub-Anmeldung als Ginkgo85 bestätigt.
- Ausgangscommit: `e02a75c586d9c1ff8a1936b665a421a710a52297`.
- Vollständig gelesen: AGENTS.md, README.md, CONTRIBUTING.md, vorherige VALIDIERUNG.md und PUBLISHING.md. Keine weiteren AGENTS.md in Unterordnern gefunden.
- Manifest, bisherige deutsche Übersetzung, Laufzeitcode, Template, Styles, vorhandene Tests und Build untersucht. Bisher gab es nur Deutsch; einzelne Standardtexte, Testmeldung und Dialogtitel standen direkt im Code.
- Der neue Auftrag erlaubt die Vorbereitung einer neuen Version. Nach Abschluss der lokalen Prüfungen hat der Benutzer Commit und Push ausdrücklich freigegeben. Diese Vorbereitung startet keinen Release. Vor Veröffentlichung: manuellen Test abschließen und erfolgreiche CI-/CodeQL-Läufe auf dem veröffentlichten main prüfen.

## Dateien und Übersetzungen

Neue Dateien:

- `README.en.md`: vollständige englische README; beide Fassungen verlinken oben aufeinander.
- `lang/en.json`: vollständige englische Übersetzung.
- `scripts/localization.js`: Anbindung an Foundrys Übersetzer und Registrierung der lokalen Sprachwahl.
- `tests/localization.test.mjs`: 28 zusätzliche automatisierte Tests.

Geänderte Dateien:

- `module.json`: Englisch und zweisprachige Beschreibung; Version 1.2.0 mit passender zukünftiger Download-Adresse.
- `package.json`: passende Version 1.2.0.
- `lang/de.json`: zusätzliche Schlüssel.
- `scripts/config.js`: Übersetzungsanbindung und sprachabhängige, noch nicht gespeicherte Standardwerte.
- `scripts/main.js`: gewählte Sprache beim Start laden.
- `scripts/settings.js`: native Sprachwahl, lokalisierte Beschriftungen/Testmeldung und gezieltes erneutes Rendern.
- `scripts/shutdown.js`: ausschließlich Dialogtitel und Ja-/Nein-Beschriftung lokalisieren.
- `templates/settings.hbs`: durch Foundry übersetzte Modultexte aus dem Render-Kontext ausgeben.
- `tools/build-release.mjs`: beide neuen Laufzeitdateien und README.en.md in die explizite ZIP-Liste aufnehmen.
- `tests/release.test.mjs`: exakte Erwartungen für zwei Sprachdateien, zweisprachige Beschreibung und 17 ZIP-Dateien; Links beider README-Fassungen müssen im Repository und ZIP auflösbar sein.
- `tests/browser-check.mjs`, `tests/browser-fixture.html`: zusätzliche Sprach- und Benutzerprüfungen.
- `tests/cors-browser-check.mjs`: neue importierte Lokalisierungsdatei lokal bereitstellen; Transportprüfungen unverändert.
- README.md, CHANGELOG.md, CONTRIBUTING.md, PUBLISHING.md und diese VALIDIERUNG.md.

Deutsch und Englisch enthalten jeweils **111 nicht leere Textschlüssel**, mit identischer Struktur unter `FWS` und identischen Formatplatzhaltern. Die bestehenden Bereiche für Felder, Hinweise, Gruppen, Fehler und allgemeine UI-Texte bleiben bestehen.

**14 zusätzliche Schlüssel gegenüber dem Ausgangszustand:**

- `FWS.language.name`, `hint`, `auto`, `de`, `en`
- `FWS.defaults.onlineTitle`, `onlineDescription`, `onlineLinkText`, `offlineTitle`, `offlineDescription`
- `FWS.testMessage`, `FWS.confirmYes`, `FWS.confirmNo`
- `FWS.errors.languageLoad`

Die verkürzten Namen innerhalb jeder Zeile gehören zum dort genannten Präfix. Historische Changelog-Einträge wurden nicht verändert; der bisherige Unreleased-Abschnitt ist jetzt der vorbereitete Eintrag **1.2.0**. Keine neue Dependency.

## Foundry-API und lokale Speicherung

Die öffentlichen APIs wurden anhand der lokal installierten, lizenzierten **Foundry-Version 14.368** geprüft. Ergänzend gelesen: [Localization](https://foundryvtt.com/api/classes/foundry.helpers.Localization.html) und [ClientSettings](https://foundryvtt.com/api/classes/foundry.helpers.ClientSettings.html). Die Online-Referenz zeigte beim Abruf 14.365; maßgeblich für die Implementierungsprüfung war der installierte Core 14.368.

- **Automatisch:** direkt `game.i18n.localize` beziehungsweise `game.i18n.format`. Maßgeblich ist Foundrys aktive Oberfläche, nicht Betriebssystem, Browser oder Spielsystem. Nicht unterstützte Sprachen nutzen Foundrys englischen Fallback.
- **Deutsch/English:** eine getrennte Instanz der öffentlichen Klasse `foundry.helpers.Localization` erhält über ihr öffentliches Feld `translations` die gewählte mitgelieferte Sprachdatei. Übersetzen und Formatieren übernimmt weiterhin Foundry. Keine eigene Übersetzungs-Engine.
- Weder `game.i18n` noch dessen Sprache/Wörterbuch werden verändert. `setLanguage` wird nicht aufgerufen, da dies auch die Sprache des globalen HTML-Dokuments beeinflussen würde.
- **Speicherung:** `game.settings.register/get/set`, `scope: "client"`, `config: true`, Standard `auto`, Auswahl `auto/de/en`, ohne erforderlichen Reload.
- Foundrys Client-Speicher gehört zum Browser-Ursprung und ist allein noch nicht benutzerspezifisch. Deshalb enthält der Setting-Schlüssel zusätzlich die Welt-ID und Benutzer-ID, eindeutig kodiert und ohne zusätzliche Punkte für Formularpfade. So bleiben auch verschiedene Benutzer im selben Browser getrennt.
- Kein World Setting und keine Socket-Synchronisierung für die Sprachpräferenz. Foundrys servergestützter User-Scope wird nicht verwendet. Keine selbst entwickelte Speicherverwaltung.
- Registrierung ist auch für Spieler verfügbar; die Discord-Bedienung und das Modulfenster bleiben GM-only.
- Bestehende Benutzer ohne Sprachpräferenz starten mit Automatisch. Ungültige Werte fallen ebenfalls auf Automatisch zurück. Ein anderer Browser beziehungsweise gelöschter Browserspeicher beginnt wieder mit Automatisch.

Geöffnete Modulfenster werden gezielt über die öffentliche `ApplicationV2.instances()`-Aufzählung und `render({force: true})` aktualisiert. Ungespeicherte Formularwerte einschließlich Leerzeichen bleiben erhalten. Während eines laufenden Speichervorgangs oder Verbindungstests wird dieses Fenster ausgelassen; spätestens beim nächsten Öffnen gilt die neue Beschriftung. Kein Welt-Reload und keine Manipulation fremder Fenster. Allgemeine Foundry-Oberflächen bleiben in Foundrys eigener Sprache.

Die Handlebars-Vorlage gibt bereits mit Foundrys API übersetzte Texte weiterhin escaped aus. Der globale Handlebars-Lokalisierungshelfer wird nicht ersetzt. Statische Manifest-Metadaten sind zweisprachig; Modulname und technische ID bleiben gleich.

## Bestehende Daten und Verhalten

- Gespeicherte Discord-Inhalte werden unverändert gelesen, einschließlich bewusst leer gespeicherter Werte und bisheriger deutscher Standardtexte.
- Nur noch nicht gespeicherte Werte für ONLINE-/OFFLINE-Titel, Beschreibungen und ONLINE-Linktext bekommen sprachabhängige Defaults. Gemeinsame Settings persistieren diese Defaults erst beim ausdrücklichen Speichern.
- Bereits im geöffneten Formular stehende Inhalte werden beim Sprachwechsel als Entwurf bewahrt, auch wenn sie ursprünglich aus Defaults stammen.
- Webhook-Speicherung, Migration, Status und Benutzertexte werden durch die Sprachwahl nicht geschrieben.
- Der Sprachwechsel startet keinen ONLINE-/OFFLINE-Versand und keinen Verbindungstest.
- `scripts/discord.js`, Styles, Icons und Workflows wurden nicht verändert. Shutdown-Änderungen betreffen ausschließlich übersetzte Dialogbeschriftungen.
- Bestehende Regeln für Payload, Rollen, allowed_mentions, Rate Limit, Timeout, Busy-Schutz, Logout und Setup bleiben erhalten.

## Ausgeführte Prüfungen

Umgebung: Node **24.19.0**, npm **12.0.2**, lizenzierter Foundry-Core **14.368**.

| Prüfung | Ergebnis |
| --- | --- |
| `npm test` ohne FOUNDRY_APP_PATH | 141 Tests: **135 bestanden, 0 Fehler, 6 erwartete Skips** |
| `npm test` mit FOUNDRY_APP_PATH auf Core 14.368 | 141 Tests: **141 bestanden, 0 Fehler, 0 Skips** |
| Automatisches `pretest`: `node tools/check-project.mjs` | JavaScript-Syntax, JSON, Metadaten und bekannte Secret-Muster bestanden |
| `npm run build:release` | Erfolgreich, **17 Dateien**, module.json direkt im ZIP-Root |
| `npm run test:release` | Erfolgreich: ZIP-Einträge, CRC32, exakter Quellenvergleich, Manifest-Kopie und Secret-Muster |
| Reproduzierbarer Build innerhalb der Tests | Zwei Builds bytegleich |
| `node tests/browser-check.mjs`, TEST_BROWSER=chrome | Erfolgreich, Chrome **153.0.8010.54** |
| `node tests/cors-browser-check.mjs`, TEST_BROWSER=chrome | Erfolgreich |
| `node tests/browser-check.mjs`, TEST_BROWSER=firefox | Erfolgreich, Firefox **153.0** |
| `node tests/cors-browser-check.mjs`, TEST_BROWSER=firefox | Erfolgreich |
| `actionlint -shellcheck= .github/workflows/ci.yml .github/workflows/release.yml .github/workflows/codeql-analysis.yml` | Erfolgreich; kein separates ShellCheck |
| Vollständiger Diff und `git diff --check` | Geprüft; keine Whitespace-Fehler |

Die sechs Core-Skips ohne Installation sind ausdrücklich vorgesehen: vier bestehende Core-Prüfungen sowie zwei neue Prüfungen für Localization und den Client-Speicher. Mit vorhandener Installation wurden alle ausgeführt. Die bisherigen **112 Tests** bleiben enthalten; ergänzt wurden **28 Sprachtests** und eine zusätzliche Ausführung der vorhandenen README-Linkprüfung für die englische Fassung.

### Neue Sprachprüfungen

Geprüft sind JSON, identische Schlüssel/Platzhalter, benötigte UI-/Fehlerschlüssel, Automatik DE/EN, beide manuellen Overrides, ungültige Werte, fehlende alte Präferenz und englischer Fallback. Dazu kommen native Registrierung, Trennung nach Benutzer/Welt/Browser, GM→GM, GM→Spieler und Spieler→GM, Erhalt aller gespeicherten Inhalte/Leerwerte, sprachabhängige neue Defaults, Entwürfe einschließlich Leerzeichen, Fensterbeschriftungen, Vorschau, Tooltips, Fehlermeldungen, GM-only und ausbleibender Versand.

Die englische Shutdown-Bestätigung prüft Titel, beide Buttons und Abbruch ohne Versand. Der englische Verbindungstest prüft übersetzten Text, unveränderten Status und unveränderte Erwähnungsbeschränkungen. Ein fehlgeschlagenes Laden der Sprachdatei fällt sicher auf Foundrys Sprache zurück und kann erneut versucht werden.

Die beiden neuen Core-Prüfungen verwenden die tatsächlich installierte Localization-Klasse und den Client-Schreibpfad mit begrenzten Test-Doubles für die umgebende Anwendung. Core-Dateien werden ausschließlich gelesen und nicht ins Projekt kopiert.

### Bestehende Regressionen

Alle bisherigen Prüfungen bleiben bestehen: optionaler Linktext, Sonderzeichen, gespeicherte Leerwerte, Vorschau, clientlokaler Webhook, Migration, Speichern/Teilfehler/Wiederholung, Discord-Payload, Status, GM-only, Logout, Setup/Shutdown, Rate Limit, Timeout, Rollen-Erwähnungen, Schutz vor unerwünschten Erwähnungen und Busy-Lock.

Auch die bestehenden Release-Tests bleiben erhalten: passender Tag ohne Release, simulierter Teilfehler und Wiederholung, falsches oder unklares Tag-Ziel, vorhandene Releases/Entwürfe, konkurrierende Tag-Erstellung, Branch/Commit, Remote-Unsicherheit, main-Änderung, Artefakte, Versionsableitung und Workflow-Reihenfolge. Remote-Zugriffe und Veröffentlichungen sind dabei simuliert.

### Browserumfang und Grenzen

Die Browserprüfungen verwenden lokale Fixtures mit echten Core-Styles, FormDataExtended, Controls-Template und Localization aus 14.368. Die umgebende Foundry-Anwendung und Application-Lebenszyklen werden teilweise simuliert. Die Sprachwahl im Browser-Fixture wird aus der registrierten nativen Setting-Definition erzeugt; dies ersetzt keine komplette Prüfung des originalen Foundry-Settings-Fensters in einer laufenden Welt.

Mehrere Tabs im selben Browserkontext prüfen GM-A, GM-B und Spieler mit gemeinsamem Browserspeicher, jedoch getrennten Präferenzen. Geprüft wurden beide Sprachen, Automatik/Fallback, Overrides, erneut geöffnetes Fenster, gespeicherte Präferenz nach neuem Seitenaufruf, Speichern, Entwürfe, Vorschau, Buttons, Tooltips und Webhook-Auge. Keine Browserfehler; keine Discord-Anfragen beim Sprachwechsel.

Die CORS-Prüfungen reproduzieren einen blockierten JSON-Preflight an zwei lokalen Ursprüngen und prüfen den bisherigen Multipart-Versand ohne OPTIONS, unveränderten Payload, fehlende Antwortfreigabe, fehlende Bestätigung, Rate Limits und GM-Berechtigung.

Screenshots liegen ausschließlich im ignorierten `validation/chrome/` beziehungsweise `validation/firefox/`, einschließlich `language-en.png` und `language-de.png`. Englische und deutsche Screenshots wurden visuell geprüft: Beschriftungen, Vorschau und Formularlayout sind lesbar. Keine echten Webhooks verwendet, kein echter Discord-Versand.

### Bereinigte lokale Build-Ausgabe

Die erste Artefaktprüfung stoppte korrekt, weil im Ausgabeordner zusätzlich ein zuvor entpackter 1.1.1-Modulordner lag. Dieser Ordner wurde unverändert außerhalb des Quellrepositories unter dem bisherigen Arbeitsordner Server on/backups/fws-extracted-1.1.1-7c0b4007e66343ea9289a5d18ec5d4ae gesichert. Anschließend bestand die unveränderte Artefaktprüfung. Es wurden keine Prüfregeln abgeschwächt und keine Dateien gelöscht.

## Kommandos zum Wiederholen

Standardprüfungen benötigen keine Foundry-Installation und keine Paketinstallation:

```powershell
npm test
npm run build:release
npm run test:release
```

Für Core-Prüfungen vorher `FOUNDRY_APP_PATH` auf `resources/app` einer eigenen lizenzierten 14.368-Installation setzen und `npm test` erneut ausführen. Kein automatischer Core-Download.

Für Browserprüfungen `NODE_DEPENDENCIES` auf den vorhandenen Ordner mit Playwright setzen; `FOUNDRY_APP_PATH` bleibt erforderlich. Falls nötig zusätzlich `PLAYWRIGHT_BROWSERS_PATH` auf die vorhandenen Testbrowser setzen.

```powershell
$env:TEST_BROWSER = "chrome"
node tests/browser-check.mjs
node tests/cors-browser-check.mjs
$env:TEST_BROWSER = "firefox"
node tests/browser-check.mjs
node tests/cors-browser-check.mjs
```

Der Build ist ausschließlich lokale Prüfausgabe unter `release/`: `module.json` und `foundry-world-status.zip`. Version und Download-Adresse zeigen auf den Kandidaten 1.2.0. Der feste Manifest-Link bleibt gleich und liefert bis zur Veröffentlichung weiterhin den neuesten veröffentlichten Release. Beide README-Fassungen sind im ZIP enthalten.

## Manueller Testplan in einer echten Testwelt

Dieser ergänzende Test ist **noch nicht ausgeführt**:

1. In einer gesicherten Foundry-14.368-Testwelt als GM A mit Foundry Deutsch und Modul Automatisch anmelden: Oberfläche Deutsch. In Foundrys Moduleinstellungen auf English stellen: Modul Englisch, Foundry selbst bleibt Deutsch.
2. Als GM B und Spieler B mit eigenen Benutzern anmelden, auch nacheinander im selben Browser testen. Automatisch/Deutsch bleibt Deutsch. GM A wechselt seine Sprache mehrfach; die anderen Benutzer behalten ihre Einstellung. Spieler B darf seine eigene Sprache ändern, ohne GM A zu beeinflussen; Discord-Bedienung bleibt für Spieler verborgen.
3. Mit Foundry Englisch Automatisch prüfen: Modul Englisch. Manuell Deutsch wählen: nur das Modul wird Deutsch. Auf Automatisch zurückstellen.
4. „Die Spielrunde beginnt!“ als Discord-Titel und einen bewusst leeren Linktext speichern. Sprache wechseln, Fenster schließen und öffnen: Texte bleiben exakt erhalten. Auch Footer, freie Nachricht und weitere eigene Inhalte prüfen.
5. Im offenen Modulfenster einen Text mit führenden/abschließenden Leerzeichen bearbeiten, ohne zu speichern. Sprache in den nativen Einstellungen wechseln: Entwurf bleibt bestehen, Beschriftungen wechseln.
6. Webhook und ON/OFF-Status vor/nach Sprachwechsel vergleichen, ohne Zugangsdaten zu protokollieren. Kein Sprachwechsel darf eine Discord-Nachricht oder einen Testversand auslösen.
7. Als derselbe Benutzer Seite neu öffnen: Präferenz bleibt erhalten. In einem anderen Browser beginnt sie mit Automatisch. Bei einer neuen, noch nicht konfigurierten Welt folgen ungespeicherte Standardtexte der Modulsprache.
8. In einem privaten Testkanal einen ausdrücklich ausgelösten Verbindungstest und ONLINE/OFFLINE prüfen. Optionalen/leeren Linktext und Sonderzeichen prüfen. Bei aktivierter Option Setup-Schließen testen; Abbruch sendet nichts, Fehler halten das Schließen an. Abmelden beendet weiterhin nur die Sitzung und sendet kein automatisches OFFLINE.

## Diff-Prüfung und Nicht geprüft

Der vollständige Diff einschließlich neuer Dateien wurde geprüft. Die exakten alten Erwartungen für einsprachige Metadaten und 14 Build-Dateien wurden auf die neue explizite Struktur erweitert; keine Tests entfernt oder Transport-/Sicherheitsprüfungen abgeschwächt.

Version in module.json und package.json sowie Download-Adresse und aktuelle Dokumentation sind auf **1.2.0** abgestimmt. Modul-ID, Titel, fester Manifest-Link, Kompatibilität (minimum 14.367, verified 14.368, maximum 14), Git-Remote und historische Changelog-Einträge bleiben unverändert. Die geprüften Änderungen werden nach ausdrücklicher Freigabe committed und auf main gepusht.

**Nicht geprüft:**

- Vollständige echte Foundry-Welt mit originalem Settings-Fenster und mehreren tatsächlich verbundenen Benutzern; dafür steht der manuelle Plan oben.
- Echte Discord-Zustellung sowie konkrete Docker-/Proxy-/TLS-Umgebungen.
- GitHub CI und CodeQL zum Zeitpunkt dieses lokalen Berichts: Die Läufe entstehen erst nach dem Push dieses Commits. Ihr Abschluss wird anschließend auf GitHub geprüft und im Abschlussbericht mitgeteilt. Lokal wurde die Workflow-Syntax mit actionlint geprüft.
- Vollständige Sicherheitsanalyse; die vorhandenen Secret-Musterprüfungen sind begrenzt.

## Veröffentlichungsstatus

- Lokal vorbereitete Version **1.2.0**; veröffentlichte Version weiterhin **1.1.1**.
- **Commit und Push sind ausdrücklich freigegeben; Tag und Release bleiben ausstehend.**
- **Release-Workflow nicht gestartet.**
- **Foundry-Package-Eintrag nicht verändert; keine Package Release API aufgerufen.**
- **Package Release Token nicht verwendet.**
- Keine Artefakte hochgeladen und keine veröffentlichte Version ersetzt.

Noch erforderlich: manuellen Test oben durchführen und nach dem freigegebenen Push erfolgreiche CI-/CodeQL-Läufe auf main abwarten. Erst dann **Actions → Release → Run workflow → main** starten. Keine Dateien oder Tags manuell hochladen/anlegen.

Die lokalen Vorbereitungen für **1.2.0** sind abgeschlossen. Den Release erst nach erfolgreichem Push, erfolgreicher CI-/CodeQL-Prüfung und manuellem Test starten.

[Einrichtungsbericht](REVIEW.md) · [Release-Kurzanleitung](PUBLISHING.md)
