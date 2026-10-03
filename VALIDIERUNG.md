# Validierung – Release-Vorbereitung 1.3.2

Stand: 3. Oktober 2026. Version 1.3.2 für Foundry 14.368 zur Veröffentlichung vorbereitet. module.json, package.json, Download-Adresse, README und Changelog sind konsistent. Der Benutzer hat Commit/Push und vollständige Prüfungen mit dem Release-Vorbereitungsauftrag autorisiert; der Release-Workflow wird nicht gestartet. Dieser Bericht ist maßgeblich; alle darunterstehenden Berichte sind historisch.

## Ergänzung: ONLINE-Titel ohne Verlinkung

Ausgangspunkt: sauberer main 842e5918a785d61c68469aacc7111c280c2875fd, identisch mit origin/main; weiterhin kein Release 1.3.2. Der Benutzer bestätigt den passenden OFFLINE-Haken und wünscht eine unverlinkte Überschrift. Aus buildPayload wurde ausschließlich embed.url entfernt. Die URL-Validierung und der separate Markdown-Serverlink bleiben unverändert; die Vorschau verwendet bereits eine unverlinkte Überschrift. Bestehende Discord-Nachrichten werden nicht nachträglich geändert.

Acht angepasste bestehende Payload-/Linktext-Prüfungen schlugen vor der Änderung erwartungsgemäß fehl. Danach bestanden erneut alle 178 Tests mit Core sowie 169 Tests ohne Core (9 erwartete Skips). Chrome-Browser/CORS bestanden. Der erste Firefox-Lauf meldete einen NetworkError in der Sprachprüfung; die Ursache wurde nicht eindeutig bestimmt. Der unveränderte isolierte Wiederholungslauf einschließlich CORS bestand vollständig. Keine Tests abgeschwächt, kein realer Discord-Versand. Build und ZIP-Prüfung wurden für diesen Stand erneut erfolgreich ausgeführt. Workflow-Dateien unverändert; die unten dokumentierte actionlint-Prüfung stammt aus der vorherigen Ergänzung desselben Tages.

## Änderung und Prüfung vor der Umsetzung

Ausgangspunkt dieser Ergänzung: main baba88b08e06fc11cfdba330c200cd698cba9212, sauberer Checkout, origin Ginkgo85/foundry-world-status, kein Abstand zu origin/main. Der Benutzer wünscht einen gemeinsamen OFFLINE-Haken. Vor der Umsetzung scheiterten drei neue Regressionen wie erwartet: zwei widersprüchliche Kombinationen von altem Setup-Haken und sendOffline sowie die Prüfung auf nur ein sichtbares Feld.

Der historische Tag v1.3.0 wurde zusätzlich geprüft: bereits zwei OFFLINE-Felder; automatisches Setup-OFFLINE erforderte beide. Abmelden war dort nicht angebunden. Der neue gemeinsame Haken übernimmt keine alte Shutdown-Implementierung.

Entfernt: autoOfflineOnLogout aus Defaults und GROUPS; logoutWithAnnouncement, shouldAnnounceOnLogout, installLogoutHandler, Selektoren, Dokument-Listener, WeakSet und Logout-Imports; deutsche/englische Felder, Hints und die ausschließlichen Fehler-/Hinweisschlüssel logoutRequest, logoutBusy, logoutStopped. Keine entsprechenden Laufzeitreferenzen bleiben in scripts, lang oder templates.

Alte gespeicherte Logout-Werte werden nicht mehr ausgewertet, erzeugen kein Feld und lösen nichts aus. Die vorhandene Normalisierung entfernt unbekannte Felder beim nächsten regulären Speichern. Keine neue Startmigration und keine ungefragte Änderung bestehender World-Daten.

## Verhalten

- Abmelden: normales Foundry-Verhalten, kein Modul-Listener, kein Discord-Versand und keine Änderung des gespeicherten Status.
- Ein gemeinsamer Haken sendOffline steuert manuellen OFFLINE-Versand und automatisches OFFLINE vor „Zurück zum Setup“. Standard true bleibt unverändert. GM und gespeichertes ON bleiben Voraussetzung. Erst bestätigter Discord-Versand, dann OFF speichern, anschließend Foundrys V14-Shutdown-Anfrage (action=worldShutdown, Route-Präfix und redirect:manual).
- Beide Prüfstellen im Shutdown-Pfad werten sendOffline aus, auch nach dem Bestätigungsdialog. Ohne Haken delegiert das Modul an Foundry; manueller OFFLINE-Wechsel bleibt ohne Nachricht.
- autoOfflineOnShutdown entfällt aus Defaults, GROUPS und beiden Sprachdateien. Der vorhandene erste Wert bleibt erhalten; der alte zweite Wert hat keine Wirkung und entfällt beim nächsten regulären Speichern. Keine neue Migration oder Start-Schreibzugriffe.
- autoOnlineOnStartup und der manuelle Toggle-Code sind unverändert. Startup-, Sprach-, Webhook- und Transporttests bleiben erfolgreich.

## Sicherheits- und Nebenläufigkeitsprüfung

Die vorhandene runExclusive-Sperre bleibt unverändert. Paralleler manueller Versand, Doppelklicks, Änderungen während der Bestätigung, bereits OFF, abgebrochene Bestätigung, demotierter GM, HTTP-/Rate-Limit-/Netzwerk-/Timeout-/Bestätigungs-/Speicherfehler sowie fehlgeschlagene Shutdown-Anfrage sind geprüft. Unbestätigter Versand verändert den Status nicht; Speicherfehler verhindern den Shutdown. Erfolgreiches OFF mit anschließend fehlgeschlagenem Shutdown erzeugt keine automatische ONLINE-Gegenmeldung.

Keine neuen Rennen durch den gemeinsamen Schalter gefunden. Die Sperre bleibt browserlokal: simultane Aktionen verschiedener GM-Sitzungen können weiterhin doppelte Nachrichten verursachen. Ebenso kann bei verlorener Versandbestätigung oder fehlgeschlagener Statusspeicherung ein manueller Wiederholungsversuch eine bereits zugestellte Nachricht wiederholen. Keine absolute Einmalgarantie hinzugefügt oder behauptet. Token-Schutz, GM-Prüfung, Timeout und Rate-Limit-Behandlung unverändert.

## Ausgeführte Prüfungen

Alle folgenden Prüfungen wurden für den endgültigen 1.3.2-Kandidaten im Release-Vorbereitungsauftrag erneut ausgeführt.

Node 24.19.0, npm 12.0.2; lizenzierter Foundry-Core 14.368. Ausschließlich künstliche Webhooks und simulierte Discord-Antworten; kein realer Versand.

| Prüfung | Ergebnis |
| --- | --- |
| npm test mit Core | 178 bestanden, 0 Fehler, 0 Skips |
| npm test ohne Core | 169 bestanden, 0 Fehler, 9 erwartete Core-Skips |
| Chrome 154.0.8037.93: Browser und CORS | Bestanden |
| Firefox 153.0: Browser und CORS | Bestanden |
| npm run build:release | Bestanden, 16 Dateien, Root-Manifest |
| npm run test:release | Bestanden, Quellenvergleich/CRC32/Manifest/Secret-Muster |
| actionlint für CI, Release und CodeQL | Bestanden; kein separates ShellCheck |
| Imports, Exports, entfernte Laufzeit-Komponenten, Diff | Geprüft |

Browser-Regressionen verwenden die eigenen lizenzierten Core-Templates und Action-Handler für Sidebar, Popout und Esc-Menü: auch ein gespeicherter alter Logout-Haken sendet nichts, der Status bleibt ON. Der gemeinsame OFFLINE-Haken wurde beim Speichern und Wiederöffnen sowie beim Setup-Schließen geprüft; der zweite Haken ist nicht mehr vorhanden. Die Darstellung wurde zusätzlich anhand des Chrome-Screenshots geprüft. Die Node-Tests prüfen beide Werte des gemeinsamen Hakens gegen beide alten Setup-Werte sowie Änderungen während der Bestätigung. Startup-ONLINE, Wiederladen ohne zweite Nachricht, GM-/Spielertrennung und Sprachumschaltung sind weiterhin erfolgreich. Lizenzierte Core-Dateien werden nicht eingecheckt oder ins ZIP übernommen.

## Veröffentlichung und noch offener Praxistest

Der Benutzer hat ausdrücklich bestätigt, dass der Praxistest dieser Vereinfachung noch nicht durchgeführt wurde. Vor Veröffentlichung in einer echten Testwelt prüfen: Abmelden sendet keine Nachricht und behält den Status; Setup-OFFLINE funktioniert bei ON mit sendOffline=true; mit sendOffline=false senden weder manueller OFFLINE-Wechsel noch Setup-Schließen; automatisches ONLINE und der manuelle Button funktionieren weiterhin. Die frühere Bestätigung zu 1.3.1 ersetzt diesen Test nicht.

Nach erfolgreichen lokalen Prüfungen wird dieser Stand committed und nach origin/main gepusht. CI und CodeQL werden für den genauen neuen Commit bis zum Abschluss geprüft; deren endgültiges Ergebnis und der Commit stehen im Abschlussbericht und auf GitHub. Für 1.3.2 wurden bei der Vorprüfung weder ein vorhandener Tag noch ein Release gefunden. Keine neuen Tags, Releases oder Uploads durch diesen Auftrag.

Das lokale Testpaket release/foundry-world-status.zip enthält Version 1.3.2 mit module.json direkt im Root. Es wird nicht hochgeladen; bestehende Releases bleiben unangetastet. Die installierte Foundry-Kopie wurde nicht automatisch ersetzt. Nach dem Praxistest und grünen GitHub-Prüfungen genügt Actions → Release → Run workflow → main. PUBLISHING.md beschreibt die Schritte.

---

## Historische Prüfberichte – nicht der aktuelle Funktionsumfang

# Validierung – Shutdown-Korrektur und Abmelden 1.3.1

Stand: 3. Oktober 2026. **Korrekturstand für die bereits veröffentlichte 1.3.0; noch kein Release 1.3.1.** Dieser Bericht gilt für den aktuellen Stand; ältere Angaben unten sind historisch.

## Nachprüfung: Abmelden

Der Benutzer meldet, dass Zurück-zum-Setup funktioniert, Abmelden aber weiterhin nichts sendet: lokale Foundry-Anwendung, installierte 1.3.1, separate Abmeldeoption eingeschaltet und Status ON. Die installierten main.js/shutdown.js-Dateien entsprachen dem bisherigen Repository-Stand. Die laufende Electron-Sitzung konnte nicht direkt geprüft werden; die konkrete Ursache dieses Live-Falls ist deshalb noch nicht bestätigt.

Zwei Lücken wurden in lokalen Browser-Fixtures belegt: Das echte Esc-Menü war überhaupt nicht angebunden. Später eingefügte/ersetzte Sidebar-Buttons ohne erneute renderSettings-Bindung wurden ebenfalls nicht abgefangen. Beide neuen Regressionen schlugen vor der Korrektur fehl. Dies belegt die Schwäche der bisherigen Anbindung, aber nicht, dass genau dieser Render-Ablauf in der Benutzerwelt auftrat.

Die Klick-Erfassung wird jetzt einmal im ready-Hook am Dokument registriert und auf die konkreten Core-Abmelden-Controls unter #settings, #settings-popout und #menu begrenzt. Sie erkennt auch Klicks auf Unterelemente. Damit hängt sie nicht mehr von einzelnen Button-Instanzen oder renderSettings ab. Weiterhin nur GM, aktivierte Abmeldeoption, aktivierter OFFLINE-Versand und ON; Game.logOut bleibt unverändert.

Erneut bestanden: 180 Tests mit Core; Browser- und CORS-Suiten in Chrome 154.0.8037.93 und Firefox 153.0, jeweils mit simuliertem Discord. Die Sidebar-Fixture nutzt nun das echte Core-Template und den nativen Action-Handler statt eines nachgebauten Buttons. Geprüft: Erzeugung nach ready, Austausch der Buttons ohne Render-Hook, Fehler hält die Sitzung an, Popout, Tastatur, Esc-Label, wieder geöffnetes Menü und ähnlich beschrifteter fremder Button ohne Abfangen. Keine echten Discord-Nachrichten versendet.

**Noch offen:** Benutzer-Praxistest des korrigierten Pakets in der betroffenen lokalen Welt. Der erfolgreiche Setup-Weg wurde vom Benutzer bestätigt; Abmelden wird hier noch nicht als live behoben ausgewiesen.

## Nachgewiesener Fehler und Korrektur

Der gemeldete Fehler tritt nach erfolgreicher OFFLINE-Ankündigung beim Anfordern des Welt-Shutdowns auf. Der Modulcode sendete JSON mit shutdown=true. Der tatsächlich installierte Core 14.368 sendet an dieselbe Setup-Route dagegen URLSearchParams mit action=worldShutdown. Ein neuer Test vergleicht den aktiven Modulpfad mit der aus der eigenen lizenzierten Installation geladenen Game.shutDown-Methode: vor der Korrektur nachweislich fehlgeschlagen, danach bestanden.

Die bisherigen Test-Doubles akzeptierten jedes Anfrageformat; der damalige Core-Test prüfte nur den deaktivierten Modulpfad. Diese Prüflücke ist geschlossen. Das Modul sendet jetzt das Core-Formularformat ohne manuell gesetzten JSON-Header. Route-Präfix, Bestätigung bei anderen verbundenen Benutzern, Statusspeicherung vor Shutdown, opaque Weiterleitung und Behandlung echter HTTP-/Netzwerkfehler bleiben erhalten. Der Fehlerhinweis wird nicht einfach unterdrückt.

## Abmelden

Separate Option autoOfflineOnLogout, Standard false, unter OFFLINE Nachricht, auf Deutsch und Englisch. Sie erfordert aktivierten OFFLINE-Versand und gespeicherten Status ON.

Nur ein expliziter GM-Klick auf einen der oben genannten Abmelden-Controls wird abgefangen. Nach bestätigtem Versand wird OFF gespeichert und dann die unveränderte Game.logOut-Methode aufgerufen. Fehler stoppen das Verlassen der Seite. Die bestehende lokale Versandsperre schützt auch diesen Ablauf vor Doppelklicks und parallelem Versand. Spieler, deaktivierte Optionen und bereits gespeichertes OFF verwenden den normalen Abmeldeweg.

Der ready-Hook installiert einmal pro Dokument einen Capture-Listener mit eng begrenzten Selektoren für die drei genannten Core-Oberflächen. Später erzeugte oder ersetzte Buttons benötigen keine erneute Bindung. Game.logOut wird nicht überschrieben: erzwungene Abmeldungen durch Core/Socket bleiben unverändert. Keyboard-Aktivierung des Buttons ist mitgeprüft. Der tatsächliche V14-Settings-Action-Handler und die Render-Hook-/Event-Anbindung im installierten Core wurden gelesen.

**Abmelden beendet ausschließlich die Sitzung, nicht die Welt.** Andere Benutzer können bei angekündigtem OFF weiterspielen. Bei eingeschaltetem automatischem ONLINE kann eine spätere GM-Anmeldung erneut ONLINE auslösen. Browser-Schließen wird nicht erkannt. Die Versandsperre ist weiterhin browserlokal; bei gleichzeitigem Handeln unterschiedlicher GMs ist kein einmaliger Versand über alle Clients garantiert.

## Ausgeführte Prüfungen

Node 24.19.0, npm 12.0.2; lizenzierter Core 14.368. Keine echten Discord-Webhooks verwendet, keine Core-Dateien ins Repository kopiert.

| Prüfung | Ergebnis |
| --- | --- |
| Gezielte Core-Regression vor/nach Korrektur | Fehler reproduziert; korrigierter Pfad bestanden |
| npm test mit Core | 180 bestanden, 0 Fehler, 0 Skips |
| npm test ohne Core | 171 bestanden, 0 Fehler, 9 erwartete Core-Skips |
| npm run build:release | Erfolgreich, 16 Dateien; module.json im ZIP-Root |
| npm run test:release | Erfolgreich; CRC32, Quellenvergleich, Manifest-Kopie, Secret-Muster |
| Browser + CORS in Chrome 154.0.8037.93 | Erfolgreich |
| Browser + CORS in Firefox 153.0 | Erfolgreich |
| actionlint -shellcheck= für alle drei Workflows | Erfolgreich; kein separates ShellCheck |
| Diff und git diff --check | Geprüft, keine Whitespace-Fehler |

15 zusätzliche Tests decken den Core-Vergleich sowie Logout-Opt-in, Speichern, bestätigten Versand vor Navigation, Spielernutzung, deaktivierte Optionen, OFF, konkurrierende Aktionen, Netz-/Bestätigungs-/Rate-Limit-/Speicher-/Migrationsfehler, nativen Logout-Fehler, erneutes Prüfen des Zustands und idempotente Button-Anbindung ab. Frühere Tests zur unveränderten Game.logOut-Methode bleiben bestehen und sind weiterhin korrekt; nur explizite Button-Klicks mit aktivierter neuer Option lösen OFFLINE aus.

Browserprüfungen nutzen jetzt den tatsächlichen Core-fetchWithTimeout und den tatsächlichen Settings-Action-Handler. Ein lokaler Test-Endpunkt nimmt ausschließlich das erwartete Formularformat entgegen. Das ersetzt keinen echten Foundry-Server, verhindert aber das bisher unbemerkte alte JSON-Format. Der Abmelden-Test prüft Speichern/Wiederöffnen, einen blockierenden Discord-Fehler und danach erfolgreiche Tastatur-Aktivierung mit OFF vor Navigation, ohne Shutdown-Anfrage. Die neue Option wurde anhand eines Screenshots visuell geprüft. CORS-, Sprach-, Startup- und übrige UI-Regressionen bestehen ebenfalls.

## Noch erforderlich

- Praxistest der **neuen 1.3.1** in einer echten 14.368-Welt mit Discord: Setup-Schließen ohne die gemeldete Fehlermeldung; Abmelden mit neuer Option an/aus; keine zweite Nachricht bei OFF; Welt bleibt beim Abmelden geöffnet. Die frühere Benutzerbestätigung zu 1.3.0 ersetzt diesen erneuten Test nicht.
- CI und CodeQL nach dem Push für den genauen neuen main-Commit prüfen. Der Abschluss wird anschließend im Arbeitsbericht gemeldet.
- Konkrete Docker-/Proxy-Umgebungen und mehrere gleichzeitig handelnde echte GMs wurden nicht live geprüft.

## Veröffentlichung

Version, Download-Adresse, package.json, README und Changelog sind auf 1.3.1 abgestimmt. Modul-ID, fester Manifest-Link und Foundry-Kompatibilität bleiben unverändert. Nach lokalen Prüfungen Commit und Push gemäß Projektregeln; keine Historie umschreiben und bestehende Releases nicht verändern. Kein Release-Workflow gestartet, kein Tag erstellt, keine Release-Artefakte hochgeladen und keine Foundry-Publikation durchgeführt.

Nach erfolgreichem Praxistest sowie CI/CodeQL kann der Maintainer **Actions → Release → Run workflow → main** starten. Anleitung: [PUBLISHING.md](PUBLISHING.md).

---

## Frühere Prüfberichte (historisch)

# Validierung – optionale Startankündigung 1.3.0

Stand: 2. Oktober 2026. **Version 1.3.0 zur Veröffentlichung vorbereitet; Release noch nicht gestartet.** Dieser Bericht ist maßgeblich; ältere Berichte unten sind historisch.

## Nachtrag zur Release-Vorbereitung

Der Maintainer hat im anschließenden Release-Auftrag den erfolgreichen Praxistest in einer echten Foundry-Welt mit Discord bestätigt: automatisches ONLINE, Neuladen ohne zweite Nachricht und OFFLINE beim Zurück-zum-Setup funktionieren. Dies ist eine Benutzerbestätigung, keine vom Agenten beobachtete Live-Prüfung.

Erneut ausgeführt: npm test mit Core 14.368 (165 bestanden, keine Fehler/Skips), npm run build:release, npm run test:release und actionlint. Die Browserprüfungen des unveränderten Funktionsstands wurden im vorangehenden Entwicklungsauftrag ausgeführt, wie unten dokumentiert.

Repository Ginkgo85/foundry-world-status, Branch main und Anmeldung Ginkgo85 geprüft; keine fremden Änderungen. Bei der Vorprüfung existieren weder Tag noch Release v1.3.0. Die Übertragung des geprüften Stands nach main erfolgt in diesem Auftrag. CI und CodeQL werden anschließend für den genauen Commit bis zum Abschluss kontrolliert; maßgeblich sind dessen GitHub-Actions-Ergebnisse. Der Release-Workflow bleibt dem Maintainer vorbehalten.

## Umfang und Verhalten

- Neue Option `autoOnlineOnStartup`, strikt Boolean, Standard false, im Bereich ONLINE Nachricht; deutsche und englische Beschriftung und Hinweise.
- Eigene `announceOnline()`-Funktion nach erfolgreicher Webhook-Migration im ready-Hook. Nur `game.user.isGM === true` und `game.user.isActiveGM === true`, explizit eingeschaltete Option und gespeicherter Status false erlauben den Versand.
- Erneute Prüfung innerhalb der bestehenden lokalen Versandsperre; kein Aufruf von toggleAnnouncement. Gleicher Payload und Transport wie beim manuellen ONLINE. Status erst nach bestätigtem Versand ON; Controls werden über die bestehende Sperre aktualisiert.
- Fehlende/ungültige Konfiguration, Migration, Netzwerk, Timeout, HTTP, Rate Limit und fehlende Bestätigung führen nicht zu ON. Ein Fehler beim anschließenden Speichern meldet ausdrücklich die bereits zugestellte Nachricht. Keine automatischen Wiederholungen, keine ungefilterten Fehler oder Webhook-Tokens im Log.
- Manuelle Toggle-Funktion, discord.js, shutdown.js, settings.js, localization.js, CSS, Icons, Templates und GitHub-Workflows unverändert. Die vorhandene Formularerzeugung übernimmt das neue Feld.
- module.json, package.json, Download-Adresse, README und Changelog auf 1.3.0 abgestimmt. Kompatibilität unverändert: minimum 14.367, verified 14.368, maximum 14. Fester Manifest-Link unverändert.

## API- und Race-Prüfung

Die [offizielle V14-API](https://foundryvtt.com/api/classes/foundry.documents.User.html#isActiveGM) und der installierte Core 14.368 wurden gelesen: User.isActiveGM vergleicht den Benutzer mit game.users.activeGM; Users.activeGM bestimmt einen aktiven Spielleiter. Ein optionaler Test führt den tatsächlichen User-Getter aus dem installierten Core aus. Keine Core-Dateien ins Projekt kopiert.

Migration wird vor dem automatischen Versand vollständig abgewartet. Status und GM-Zuständigkeit werden danach und innerhalb der Sperre erneut gelesen. Parallele Aufrufe sowie ein bereits laufender manueller Versand im selben Browser erzeugen keine zusätzliche Startnachricht; eine übersprungene Aktion wird nicht nachträglich eingereiht. Ein gespeichertes ON verhindert erneuten Versand auch nach Neuladen. Der bisherige manuelle ON/OFF-Ablauf bleibt separat bedienbar.

**Grenzen:** ready bedeutet Bereitwerden des GM-Browsers, nicht Start des Serverprozesses. Ohne aktiven GM keine Ankündigung. Bei OFF kann erneutes Anmelden/Neuladen auslösen, bei ON bleibt auch ein Serverneustart ohne erneute Ankündigung. Ein Wechsel zum aktiven GM nach ready löst keinen zusätzlichen Versuch aus.

Foundrys GM-Auswahl und runExclusive sind keine serverseitige atomare Versandsperre: mehrere Tabs desselben GM, unterschiedliche Anwesenheitsstände beim Verbindungsaufbau, ein GM-Wechsel während eines laufenden Requests oder gleichzeitige manuelle Aktionen anderer GMs können doppelte Nachrichten verursachen. Eine verlorene Discord-Antwort oder ein fehlgeschlagener Status-Schreibvorgang kann ebenfalls eine bereits zugestellte Nachricht bei OFF hinterlassen. Vor einem erneuten Versuch den Discord-Kanal prüfen. Diese Grenzen sind in der README beschrieben; keine neue Socket-/Lock-Infrastruktur eingeführt.

## Ausgeführte Prüfungen

Node 24.19.0, npm 12.0.2; lizenzierter Foundry-Core 14.368.

| Prüfung | Ergebnis |
| --- | --- |
| npm test ohne Core | 165 Tests: 157 bestanden, 0 Fehler, 8 erwartete Core-Skips |
| npm test mit Core 14.368 | 165 bestanden, 0 Fehler, 0 Skips |
| npm run build:release | Erfolgreich; 16 Dateien, module.json direkt im ZIP-Root |
| npm run test:release | Erfolgreich; Quellenvergleich, Manifest-Kopie, CRC32 und Secret-Muster |
| Browseroberfläche und Startup in Chrome 154.0.8037.93 | Erfolgreich |
| Browseroberfläche und Startup in Firefox 153.0 | Erfolgreich |
| CORS-Browserprüfungen in Chrome und Firefox | Erfolgreich, alle Anfragen lokal/simuliert |
| actionlint -shellcheck= für CI, Release und CodeQL | Erfolgreich; kein separates ShellCheck |
| Vollständiger Diff und git diff --check | Geprüft, keine Whitespace-Fehler |

Die 146 bisherigen Tests bleiben erhalten; 19 Tests ergänzen Opt-in, Formular/Speicherung, GM-Auswahl, ONLINE-Payload, Bestätigung/Status, wiederholte Aufrufe, Sperre, Migration/Reihenfolge, Zustandswechsel und Fehler einschließlich Timeout. Die bisherige „Start sendet nichts“-Prüfung gilt weiterhin für die Standardeinstellung; sie wartet jetzt den ready-Hook vollständig ab. Die README-Prüfung berücksichtigt den neuen optionalen Startversand.

Browser prüfen die tatsächliche Formularauswertung und Core-Styles, die neue Checkbox samt Speichern/Wiederöffnen, DE/EN-Beschriftungen, drei parallele Testseiten (aktiver GM, anderer GM, Spieler), bestätigtes ON und Seitenneuladen mit erhaltenem Status ohne zweiten Versand. Der Weltstatus/GM-Anwesenheit wird im Fixture simuliert; dies ist kein vollständiger Test von Foundrys Server-Synchronisation. Screenshots der neuen Option unter validation/chrome/ wurden visuell geprüft; beide Sprachen sind lesbar. Diese Dateien sind ignoriert und kein Teil des ZIP.

Im ersten Lauf waren zwei Fehler im neuen Testaufbau enthalten (Gruppentitel statt nicht vorhandener Gruppen-ID und eine nicht freigegebene simulierte Antwort beim Folgeaufruf). Nach Korrektur bestehen sämtliche Tests. Keine Produktionsprüfung abgeschwächt.

## Noch nicht geprüft

- Vollständige Foundry-Testwelt mit mehreren echten verbundenen GMs und tatsächlichen Verbindungsabbrüchen.
- Konkrete Docker-/Proxy-Umgebungen sowie vom Agenten beobachtete echte Discord-Zustellung. Der Maintainer bestätigt den Praxistest; die automatisierten Prüfungen verwenden keine echten Webhooks.
- CI und CodeQL vor dem Push dieses Release-Vorbereitungsstands; Prüfung folgt anschließend auf GitHub.
- Vollständige Sicherheitsanalyse oder garantierter einmaliger Versand über mehrere Clients.

## Manueller Testplan

1. Bestehende 14.368-Testwelt sichern und Kandidat lokal installieren. Bei bisheriger Konfiguration bleibt die Option ausgeschaltet; Laden und Neuladen senden nichts.
2. Als GM eigenen Test-Webhookspeicher und Server-URL einrichten. Unter ONLINE Nachricht Automatik aktivieren und speichern: noch keine Nachricht. Deutsche/englische Oberfläche prüfen.
3. Status auf OFF setzen und als aktiver GM neu laden. Genau eine ONLINE-Nachricht im Testkanal erwarten, anschließend ON. Erneut laden: keine weitere Nachricht.
4. Mit zwei unterschiedlichen GM-Benutzern und einem Spieler prüfen: nur Foundrys aktiver GM sendet. Dessen Browser muss den Webhook eingerichtet haben. Auch schnellen Verbindungsaufbau prüfen; für reguläre Nutzung einen GM und einen Tab für Ankündigungen verwenden.
5. Ungültigen Webhook beziehungsweise blockierten Testzugriff prüfen: Fehlermeldung und OFF, kein automatischer Wiederholungsversuch. Vor manueller Wiederholung auf mögliche bereits eingegangene Nachricht achten.
6. Manuellen ONLINE/OFFLINE-Button, Verbindungstest und bisheriges automatisches OFFLINE beim Zurück-zum-Setup prüfen. Abmelden sendet weiterhin kein automatisches OFFLINE.
7. Ohne angemeldeten GM und mit schon gespeichertem ON nach Serverneustart die beschriebenen Grenzen bestätigen.

## Weiteres Vorgehen

Technisch lokal geprüft; der Maintainer bestätigt den Praxistest (siehe Nachtrag). Die Release-Vorbereitung erlaubt jetzt Commit und Push. Keine Tags, Releases, Release-Artefakt-Uploads, Foundry-API-Aufrufe oder Deployments in diesem Auftrag.

Nach Übertragung des geprüften Stands nach origin/main erfolgreiche CI-/CodeQL-Läufe abwarten und dann **Actions → Release → Run workflow → main** starten. Der Workflow erstellt Tag v1.3.0, Manifest und ZIP. Nicht manuell Tags oder Release-Dateien anlegen. Einzelheiten: [PUBLISHING.md](PUBLISHING.md).

---

## Frühere Prüfberichte (historisch ab 1.2.1)

# Validierung – Release-Vorbereitung 1.2.1

Prüfdatum: 25. September 2026. **Version 1.2.1 für Foundry 14.368 lokal vorbereitet; noch nicht veröffentlicht.**

## Ausgangszustand und Anweisungen

Repository `Ginkgo85/foundry-world-status`, Branch `main`, Ausgangscommit `48d0c373c19ad63d0b4e8019109ccea0543f0e12`. Die bereits geprüften lokalen Änderungen aus dem GM-only-Auftrag wurden übernommen. Nach erneutem Fetch 0 Commits vor/hinter origin/main. Keine fremden Änderungen. Aktuell veröffentlicht ist v1.2.0.

Vollständig gelesen: AGENTS.md, README.md, CONTRIBUTING.md, VALIDIERUNG.md und PUBLISHING.md. Keine weiteren AGENTS.md in Unterordnern vorhanden. Der aktuelle Auftrag erlaubt die Vorbereitung einer neuen Version. Nach Abschluss der lokalen Prüfungen hat der Benutzer Commit und Push ausdrücklich freigegeben. Ein Release wird in diesem Vorbereitungsschritt nicht gestartet.

## Änderung und Dateien

Nur eine Laufzeitdatei geändert: `scripts/localization.js`.

- Registrierung bleibt nativ über `game.settings.register`, mit `scope: "client"` und unverändertem benutzer-/weltspezifischem Schlüssel.
- `config` wird als Getter mit `game.user?.isGM === true` ausgewertet. Foundry erzeugt das Einstellungsfeld nur bei true. Die Entscheidung erfolgt beim Aufbau der Oberfläche, ohne CSS-Verstecken und ohne DOM-Manipulation im Modul.
- Der Getter ist nötig, weil `game.user` bei der bisherigen Registrierung im init-Hook noch fehlen kann. Sobald der Benutzer verfügbar ist, sieht ein GM die Auswahl; ein Spieler nicht.
- `languagePreference()` liefert für Nicht-GMs automatisch `auto`. Dadurch folgen sichtbare Spielertexte der aktiven Foundry-Sprache.
- Frühere Spieler-Präferenzen bleiben unangetastet gespeichert. Sie werden nicht angewendet, solange der Benutzer keine GM-Rechte hat. Nach einer späteren Beförderung zum GM ist der gespeicherte Wert wieder nutzbar.
- Keine neue Berechtigungsschicht: technische Client-Speicherzugriffe werden nicht künstlich gesperrt. Ziel ist ausschließlich die GM-only UI und automatische Spielersprache.

Weitere geänderte Dateien: `tests/localization.test.mjs`, `tests/browser-check.mjs`, `tests/browser-fixture.html`, README.md, CHANGELOG.md und diese VALIDIERUNG.md. Für die Release-Vorbereitung zusätzlich module.json, package.json und PUBLISHING.md auf 1.2.1 abgestimmt; in REVIEW.md ausschließlich den veralteten Versionsbezug im Verweis auf den aktuellen Prüfbericht entfernt. Keine neuen Dateien oder Dependencies. README in beiden Sprachen angepasst; Changelog enthält den vorbereiteten Eintrag 1.2.1; historische Einträge bleiben erhalten.

Unverändert: de.json/en.json, Templates, Styles, Modul-ID, fester Manifest-Link, Foundry-Kompatibilität, Workflows und übriger Laufzeitcode. GM-only Discord-Button, Webhook-Konfiguration, Versand/Payload, Migration, Status, Setup/Shutdown und Logout bleiben unverändert.

## API-Prüfung und Benutzertrennung

Die [öffentliche SettingConfig-API](https://foundryvtt.com/api/interfaces/foundry.types.SettingConfig.html) dokumentiert `config` als Steuerung der Sichtbarkeit in Foundrys Einstellungsfenster. Im lokal installierten Core **14.368** wurde zusätzlich geprüft:

- ClientSettings.register bewahrt die Konfiguration einschließlich Getter.
- SettingsConfig überspringt Einträge mit falschem `config`, bevor es Kategorie, Feld, Beschriftung oder Hilfetext erzeugt.
- `restricted` ist hier keine zusätzliche Lösung für einzelne Client-Felder; die bereits vorhandene GM-Beschränkung des Modul-Untermenüs bleibt unverändert.

Der native Category-Aufbau wird zusätzlich direkt aus dem installierten Core getestet. Für Spieler ist sein Ergebnis für dieses Setting leer; für GMs enthält es Auswahl, Titel und Hinweis. Core-Dateien werden nur gelesen, nicht ins Repository kopiert.

Die Sprachwahl von GM A wirkt weder auf GM B noch auf Spieler, auch bei verschiedenen Benutzern im selben Browser. Scope, Schlüssel und Speicherverfahren sind unverändert. Keine Socket-Verteilung, kein World Setting für die Sprachwahl.

## Tests und tatsächliche Ergebnisse

Node 24.19.0, npm 12.0.2; lizenzierter Core 14.368 vorhanden.

| Ausgeführter Befehl | Ergebnis |
| --- | --- |
| `node --test tests/localization.test.mjs` mit Core | 33 bestanden, 0 Fehler, 0 Skips |
| `npm test` ohne Core | **146 Tests: 139 bestanden, 0 Fehler, 7 erwartete Core-Skips** |
| `npm test` mit Core 14.368 | **146 Tests: 146 bestanden, 0 Fehler, 0 Skips** |
| `npm run build:release` | Erfolgreich; 16 Dateien, module.json direkt im ZIP-Root |
| `npm run test:release` | Erfolgreich; CRC32, Quellenvergleich, Manifest-Kopie und Secret-Muster |
| `node tests/browser-check.mjs`, TEST_BROWSER=chrome | Erfolgreich, Chrome 153.0.8010.54 |
| `node tests/cors-browser-check.mjs`, TEST_BROWSER=chrome | Erfolgreich |
| `node tests/browser-check.mjs`, TEST_BROWSER=firefox | Erfolgreich, Firefox 153.0 |
| `node tests/cors-browser-check.mjs`, TEST_BROWSER=firefox | Erfolgreich |
| `actionlint -shellcheck= .github/workflows/ci.yml .github/workflows/release.yml .github/workflows/codeql-analysis.yml` | Erfolgreich; kein separates ShellCheck |
| Vollständiger Diff und `git diff --check` | Geprüft, keine Whitespace-Fehler |

`npm test` führt weiterhin die bestehende Quellenprüfung als pretest aus. Reproduzierbarkeit des Builds und alle bisherigen Versand-, Speicher-, Release- und Sprachregressionen bleiben geprüft.

**Fünf zusätzliche Tests:** späte Benutzerverfügbarkeit nach init, strikt boolesche GM-Prüfung, automatische Spielersprache Deutsch beziehungsweise Englisch mit Erhalt alter Werte und Wiederverwendung nach Beförderung, sowie der tatsächliche Core-Settings-Aufbau ohne Spielerfeld/-hinweis.

Bestehende Tests wurden nicht entfernt. Erwartungen, die bisher einen manuellen Spieler-Override voraussetzten, wurden auf das ausdrücklich gewünschte neue Verhalten geändert; Speichererhalt und Benutzertrennung werden weiter geprüft. GM-Automatik, beide Overrides, gespeicherte Texte/Leerwerte, Entwürfe, Status und ausbleibender Versand bleiben abgedeckt.

## Browserprüfung und Grenzen

Das Fixture verwendet jetzt zusätzlich den echten SettingsConfig-Category-Aufbau aus Core 14.368. Umgebende Anwendung, DataFields und äußeres Fenster bleiben Test-Doubles; die daraus erzeugte Test-UI ist keine vollständige produktive Foundry-Welt.

In Chrome und Firefox geprüft:

- GM sieht Sprachblock samt Auswahl und Hilfetext; auto/de/en funktionieren.
- Spieler in deutscher und englischer Foundry-Oberfläche erhalten keinen Block, keine Beschriftung, keinen Select und keinen Hinweis – auch nach erneutem Öffnen/Seitenaufruf.
- Frühere gegensätzliche Spieler-Präferenzen bleiben gespeichert, beeinflussen aber nicht mehr die automatische Spielersprache.
- GM-Speichern, erneutes Öffnen, lokale Persistenz, GM-A/GM-B/Spieler-Trennung, gespeicherte Inhalte, Vorschau, Tooltips und Webhook-Auge.
- Keine Discord-Anfrage durch Sprachänderung; bestehende ON/OFF-/Shutdown-/Logout- und CORS-Prüfungen bestanden.

Screenshots unter dem ignorierten `validation/chrome/` und `validation/firefox/`: `language-en.png`, `language-de.png`, `player-language-de.png`, `player-language-en.png`. GM-/Spieler-Screenshots wurden visuell geprüft. Die Spieleraufnahme enthält keinen Sprachblock; die GM-Auswahl bleibt vorhanden. Keine echten Discord-Webhooks verwendet.

**Nicht geprüft:** vollständiges natives Settings-Fenster in einer echten laufenden Foundry-Welt mit mehreren verbundenen Benutzern; echte Discord-Zustellung; konkrete Docker-/Proxy-Umgebungen. CI und CodeQL werden erst nach dem freigegebenen Push gestartet und anschließend geprüft. Keine vollständige Sicherheitsanalyse.

## Manueller Testplan vor einer späteren Veröffentlichung

1. In einer gesicherten 14.368-Testwelt als GM Foundrys normale Moduleinstellungen öffnen. Sprache/Language, alle drei Optionen und Hilfetext sind vorhanden. Speichern und neu öffnen; Präferenz bleibt erhalten.
2. Als normaler Spieler dieselben Einstellungen öffnen und nach dem Modul suchen. Keine Sprachauswahl, kein Hinweis, kein leerer/deaktivierter Block. Auch das GM-Konfigurationsfenster bleibt unzugänglich.
3. Foundry Deutsch und Englisch jeweils testen: Spielertexte folgen automatisch der aktiven UI-Sprache. Ein vorhandener älterer Sprachwert darf im Browser gespeichert bleiben.
4. GM A auf English stellen; GM B und Spieler bleiben unverändert. Danach GM A Deutsch und Automatisch testen.
5. Eigene Discord-Texte einschließlich Leerwerten, Webhook und ON/OFF vor/nach Sprachwechsel vergleichen. Keine Nachricht darf allein durch Sprachwechsel versandt werden.

Die bestehenden Befehle und Umgebungsvariablen zum Wiederholen stehen im historischen Bericht unten.

## Veröffentlichungsstatus

**Version 1.2.1 ist vorbereitet; Commit und Push sind ausdrücklich freigegeben. Tag und Release bleiben ausstehend.** Release-Workflow nicht gestartet. Foundry Package Management nicht verändert; Package Release API und Package Release Token nicht verwendet. Der lokale Build dient nur der Prüfung und wurde nicht hochgeladen.

Vor Veröffentlichung erforderlich: manuellen Test oben durchführen und nach dem freigegebenen Push erfolgreiche CI-/CodeQL-Läufe auf dem neuen main abwarten. Danach **Actions → Release → Run workflow → main** starten. Der Workflow erstellt den Tag v1.2.1 sowie module.json und foundry-world-status.zip. Keine manuellen Uploads oder Tag-Anlagen nötig.

---

## Frühere Prüfberichte (historisch)

Die folgenden Angaben beschreiben frühere Aufträge und frühere UI-Regeln. Für die aktuelle GM-only-Änderung gilt der Bericht oben.

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
