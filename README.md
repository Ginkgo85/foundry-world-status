# Foundry World Status

Foundry World Status ermöglicht Spielleitern, die aktive Spielwelt manuell über einen Discord-Webhook als ONLINE oder OFFLINE anzukündigen.

Lokale Basisversion **1.0.0**, Änderungen unter **Unreleased** · Foundry VTT **14.367** · Autor **Ginkgo85**

Das Modul wird privat beziehungsweise manuell als ZIP oder über GitHub weitergegeben. Es ist ein kleines Werkzeug für Ankündigungen, kein Servermonitor. ONLINE wird bewusst per GM-Klick gesendet; es gibt keine automatische Erreichbarkeitsprüfung.

## Manuelle Installation

1. Die vom Maintainer bereitgestellte **foundry-world-status.zip** herunterladen.
2. Nach `Data/modules/foundry-world-status/` entpacken.
3. Prüfen, dass `module.json` direkt unter `foundry-world-status/` liegt.
4. Foundry neu starten beziehungsweise die Module neu laden.
5. In der gewünschten Welt **Foundry World Status** unter **Module verwalten** aktivieren.

Die module.json liegt im ZIP-Root, ohne zusätzlichen übergeordneten Ordner. Ein bestehendes Modulverzeichnis vor einem Update sichern und durch den neuen ZIP-Inhalt ersetzen, damit entfernte Dateien nicht liegenbleiben. World-Daten niemals löschen.

Es sind keine Node-Pakete für die Nutzung nötig. Die lokale Entwicklungsfassung enthält bewusst keine automatischen Manifest-/Download-Adressen: Im bestehenden GitHub-Repository liegt bisher eine andere Modulidentität. Ein Update-Link dorthin wäre derzeit irreführend.

## Einrichtung

Als GM **Einstellungen → Moduleinstellungen → Foundry World Status → Weltstatus für Discord konfigurieren** öffnen.

- **Webhook:** In Discord beim gewünschten Textkanal **Kanal bearbeiten → Integrationen → Webhooks** einen Webhook erstellen und seine URL eintragen. Das Auge zeigt oder verdeckt sie; beim erneuten Öffnen ist sie wieder verdeckt.
- **Foundry Server URL / Wunschdomain:** Die für Mitspieler erreichbare HTTP-/HTTPS-Adresse eintragen, beispielsweise `https://foundry.example.invalid/game` (Platzhalter ersetzen). ONLINE benötigt diese Adresse. `localhost` funktioniert nicht als öffentliche Mitspieleradresse.
- **Nachrichten:** Titel, Beschreibung, Farbe und Footer für ONLINE/OFFLINE bearbeiten. ONLINE bietet außerdem Linktext, Thumbnail und Bild. Anzeigename und Avatar sind konfigurierbar. Die Vorschau zeigt Text näherungsweise, lädt keine externen Bilder und rendert kein Discord-Markdown.
- **Rollen-Ping:** Optional eine Rollen-ID mit 17–20 Ziffern eintragen. Discords Entwicklermodus ermöglicht das Kopieren der ID. Nur diese Rolle darf bei ONLINE erwähnt werden; `@everyone`, `@here`, Benutzer und weitere Rollen sind im Versand gesperrt. Discord-Kanalberechtigungen gelten zusätzlich.
- **Test:** „Discord-Verbindung testen“ sendet eine echte kleine Nachricht mit der aktuell eingetragenen URL, auch vor dem Speichern. Der Ankündigungsstatus bleibt dabei erhalten.
- **Speichern:** Nachrichten gelten für die Welt; der Webhook wird nur in diesem Browser gespeichert.

## ON/OFF-Button

Der Button erscheint ausschließlich für GMs in den linken Scene Controls. Das weiße Discord-Symbol bleibt unverändert; ON/OFF und der Rahmen tragen die Statusfarbe.

| Anzeige | Nächster Klick |
| --- | --- |
| OFF | ONLINE senden, nach Discord-Bestätigung ON speichern |
| ON | OFFLINE senden, danach OFF speichern |
| ON und OFFLINE-Versand deaktiviert | Nur den gespeicherten Status auf OFF setzen |

ON bedeutet „als ONLINE angekündigt“, nicht „erreichbar geprüft“. Nach einem Serverneustart kann weiterhin ON gespeichert sein. Versandfehler ändern den Status nicht. Wenn die Nachricht ankam, aber die Statusspeicherung scheiterte, meldet das Modul dies gesondert.

Die Sperre gegen Doppelklicks gilt nur in einem Browser. Zwei GMs können gleichzeitig senden oder Einstellungen überschreiben. Bitte einen GM mit den Ankündigungen betrauen; es gibt keine verteilte Sperre.

## Abmelden, Welt schließen und Serverende

| Aktion | Verhalten |
| --- | --- |
| GM meldet sich ab | Keine Nachricht, gemeinsamer Status bleibt unverändert |
| Zurück zum Setup | Optional OFFLINE **vor dem Schließversuch** |
| Browser/Tab schließen, Absturz, Verbindung verlieren | Keine automatische Nachricht |
| Docker/Serverprozess stoppen oder Server herunterfahren | Keine zuverlässige Erkennung, keine automatische Nachricht |

**Vor „Zurück zum Setup“ OFFLINE ankündigen** ist standardmäßig aus. Die vorhandene Option gilt nur bei ON und aktiviertem OFFLINE-Versand. Sie wartet auf Discord-Bestätigung und Statusspeicherung, bevor sie den Schließversuch auslöst. Bei Versand-/Speicherfehlern hält sie an.

Das ist eine Ankündigung vor einem beabsichtigten Weltende, keine Bestätigung eines abgeschlossenen Shutdowns. Scheitert Foundrys Schließen danach, kann die Welt noch laufen, obwohl OFF gespeichert wurde. Das Modul sendet dann kein automatisches ONLINE. Die einfachste Bedienung bleibt: manuell OFF anklicken und anschließend die Welt schließen.

Für die optionale Setup-Funktion wird weiterhin ein kleiner Wrapper um `game.shutDown` verwendet: Im geprüften 14.367-Ablauf gibt es keinen wartenden Hook vor dem Shutdown. Der Wrapper benötigt keine Dependency; er kann mit anderen Modulen kollidieren, die denselben Ablauf ändern. `game.logOut` wird nicht mehr ersetzt.

## Webhook-Speicherung und Übernahme

Die technische Modul-ID lautet weiterhin **foundry-world-status**. Konfiguration und Ankündigungsstatus bleiben im bisherigen Namespace erhalten; es findet in dieser Änderung kein ID-Wechsel statt.

Der Webhook wird als Foundry-Client-Setting `foundry-world-status.webhooks` in diesem Browser gespeichert. Ein Eintrag ist nach Welt-ID und GM-ID getrennt. Er wird nicht als neue World-/User-Einstellung an andere Clients verteilt.

Bei einer bereits vorhandenen `foundry-world-status.configuration.webhookUrl`:

1. Beim GM-Start beziehungsweise Öffnen der Einstellungen die URL lokal kopieren.
2. Den lokalen Wert zurücklesen und vergleichen.
3. Erst danach das Webhook-Feld aus der gemeinsamen Konfiguration entfernen; andere Werte bleiben erhalten.

Bei Speicherfehlern bleibt die bisherige Kopie erhalten. Fehlgeschlagene Bereinigung lässt sich durch erneutes Öffnen wiederholen. Es wird dabei keine Discord-Nachricht gesendet. Für diese einmalige Übernahme möglichst nur einen GM anmelden.

Der erste erfolgreiche GM-Browser übernimmt den früher gemeinsamen Webhook. Andere Browser, Geräte oder GMs müssen die URL danach separat erhalten und eintragen. Das Löschen von Browserdaten löscht auch den lokalen Webhook; Weltstatus und Nachrichtentexte bleiben bestehen.

**Bei widersprüchlichen lokalen und gemeinsamen Werten:** Nichts wird überschrieben. Mit einem zweiten, frischen Browserprofil als derselbe GM anmelden und die Einstellungen öffnen. Dort kann der gemeinsame Wert gesichert und bereinigt werden. Der erste Browser behält seinen abweichenden Wert. Anschließend die gewünschte URL in den jeweiligen Browsern festlegen. Vorher keine Browserdaten löschen.

### Installationen unter dem früheren Modulnamen

`foundry-discord-announcer` ist eine andere Installationsidentität. Die Trennung wurde bereits vor diesem Review vorgenommen. Dieses Update liest oder verändert dessen Settings nicht automatisch.

Eine bestehende alte Installation bleibt erhalten. Für einen Wechsel die neue ZIP parallel installieren, das alte Modul in der Welt deaktivieren und die gewünschten Einstellungen sowie den Webhook als GM manuell übertragen. Der neue Status startet unabhängig auf OFF, sofern in diesem neuen Namespace noch kein Status gespeichert war. Nicht beide Module gleichzeitig aktiv verwenden. Keine World-Daten oder alten Einstellungen für den Wechsel löschen.

## Sicherheit

Webhook-URLs sind Zugangsschlüssel. Niemals öffentlich teilen, in Screenshots/HAR-Dateien veröffentlichen oder in Git/Issues eintragen. Bei einer zuvor gemeinsam gespeicherten oder offengelegten URL empfiehlt sich nach der Übernahme ein neuer Discord-Webhook: Die Migration kann bereits verteilte Kopien und Backups nicht zurückholen.

Browserlokal bedeutet **nicht verschlüsselt** und ist keine Geheimnisgrenze gegenüber Skripten, Erweiterungen oder Personen mit Zugriff auf dasselbe Browserprofil beziehungsweise denselben Ursprung. Getrennte Browserprofile für GM und Spieler verwenden. Die Trennung nach Welt und GM verhindert versehentliche Auswahl eines anderen Eintrags, nicht das absichtliche Auslesen lokalen Speichers.

`scope: "user"` wurde nicht als Secret-Speicher gewählt: Die geprüfte V14-API beschreibt benutzerbezogene Einstellungen, aber keine zugesicherte Geheimhaltung gegenüber anderen Clients. Die clientlokale Variante vermeidet neue Serverübertragung und braucht keine eigene Verschlüsselung oder zusätzlichen Dienst.

Das Modul gibt Tokens nicht in eigenen Logs oder Fehlermeldungen aus. Netzwerkwerkzeuge des Browsers können angefragte URLs anzeigen. Die konfigurierte Weltadresse und externe Bildadressen werden beim Versand an Discord übergeben.

## Fehlerbehebung

- **Button fehlt:** GM-Anmeldung, Modulaktivierung und aktive Szene mit Scene Controls prüfen.
- **Webhook fehlt nach Browserwechsel:** Im verwendeten Browser neu eintragen.
- **Migration/Browser-Speicher fehlgeschlagen:** Browser-Speicher und Foundry-Verbindung prüfen, Einstellungen erneut öffnen. Keine vorhandenen Daten löschen.
- **HTTP 401/403/404:** Webhook und Kanalberechtigungen prüfen.
- **HTTP 429:** Die genannte Wartezeit einhalten.
- **Netzwerk/CORS/Timeout:** Der GM-Browser sendet, auch bei Docker-Hosting. DNS, TLS, Erweiterungen und Proxy-/CSP-Regeln prüfen. `connect-src` muss den verwendeten Discord-Host zulassen.
- **Nachricht möglicherweise angekommen:** Vor erneutem Senden den Discord-Kanal kontrollieren. Es gibt keine automatische Wiederholung.
- **Einstellungen teilweise gespeichert:** Der lokale Webhook kann bereits geändert sein, obwohl das Speichern der Welttexte scheiterte. Verbindung prüfen und erneut speichern.

Multipart-Versand vermeidet den unnötigen JSON-Preflight; eine regulär lesbare CORS-Antwort bleibt erforderlich. Keine öffentlichen Proxys und kein `no-cors`-Versand.

## Entwicklung, Tests und Verteilung

Tests und lokaler Build: [CONTRIBUTING.md](https://github.com/Ginkgo85/foundry-discord-announcer/blob/main/CONTRIBUTING.md). Die Dateien liegen auch im lokalen Projekt; Online-Inhalte können bis zum manuellen Hochladen älter sein. Der genaue aktuelle Prüfstand steht lokal in VALIDIERUNG.md, der technische Bericht in REVIEW.md.

Das bestehende [GitHub-Repository](https://github.com/Ginkgo85/foundry-discord-announcer) trägt noch den früheren Namen. Repository-Umbenennung, Remotes, Tags und Veröffentlichungen erfolgen ausschließlich manuell.

## Lizenz und Marken

Eigener Modulcode: [MIT-Lizenz](LICENSE), Copyright (c) 2026 Frank. Discord und das Discord-Logo sind Marken von Discord Inc.; dieses Modul ist weder offiziell mit Discord Inc. verbunden noch von ihr unterstützt. Siehe [Discord-Markenhinweise](https://discord.com/branding).

Foundry Virtual Tabletop und zugehörige Marken gehören Foundry Gaming LLC. Dieses Community-Modul ist kein offizielles Foundry-Gaming-Produkt. Siehe [Foundry-Markenrichtlinien](https://foundryvtt.com/article/branding/).
