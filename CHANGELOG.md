# Changelog

## 1.2.1

Vorbereitet für die Veröffentlichung als v1.2.1; geprüft mit Foundry VTT 14.368.

### Geändert

- Deutsche und englische Anleitung stehen in einer gemeinsamen README mit Sprunglinks; die separate englische Datei entfällt auch im Paket.
- Die manuelle Modulsprache wird ausschließlich GMs angezeigt.
- Spieler verwenden die automatische Lokalisierung und bleiben von der Sprachwahl eines GMs unbeeinflusst. Frühere lokale Spieler-Präferenzen bleiben gespeichert, werden aber nicht angewendet.

## 1.2.0

Vorbereitet für die Veröffentlichung als v1.2.0; geprüft mit Foundry VTT 14.368.

### Neu

- Deutsche und englische README mit direkter Sprachauswahl; beide Fassungen sind im Modul-ZIP enthalten.
- Vollständige englische Übersetzung der Moduloberfläche zusätzlich zu Deutsch.
- Automatische Sprachwahl anhand der aktiven Foundry-Oberflächensprache.
- Native lokale Sprachwahl zwischen Automatisch, Deutsch und English, getrennt nach Benutzer, Welt und Browser; ohne Einfluss auf andere GMs oder Spieler.
- Aktualisierung geöffneter Modulfenster mit Erhalt ungespeicherter Eingaben.
- Sprachabhängige Standardtexte für noch nicht gespeicherte Werte. Gespeicherte Discord-Inhalte, Webhook und Status bleiben beim Sprachwechsel unverändert.

## 1.1.1

Vorbereitet für die Veröffentlichung als v1.1.1.

- Kompatibilitätsprüfung auf Foundry VTT 14.368 aktualisiert; Mindestversion bleibt 14.367.
- Anleitung zum Weiterarbeiten auf einem neuen PC und Vorschaubilder im README ergänzt.
- Copyright-Anzeige im README auf Ginkgo85 angepasst.
- Keine Änderungen an den Modul-Funktionen.


## 1.1.0

Version 1.1.0 wird über den manuell gestarteten GitHub-Workflow Release veröffentlicht; Tag: v1.1.0.

### Neu und korrigiert

- GitHub Actions prüft Änderungen auf main und Pull Requests. Ein separat gestarteter Release-Workflow prüft erneut und erzeugt Tag, Release und Assets ohne manuelle Uploads.
- Version wird aus module.json abgeleitet; vorhandene Tags und Releases werden nicht ersetzt.
- Release-Wiederholung nach Teilfehler: Ein vorhandener Tag auf demselben geprüften Commit wird ohne Änderung wiederverwendet, sofern noch kein Release existiert. Abweichende Tags und vorhandene Releases einschließlich Entwürfen führen zum Abbruch.

- ONLINE-Linktext ist optional. Mit Text erscheint ein Markdown-Link; ohne Text die Server-URL. Bewusst leere Werte bleiben gespeichert.
- Sonderzeichen im Linktext werden maskiert, URL-Klammern im Markdown-Ziel kodiert. Embed-Titel und Serverlink zeigen auf dieselbe Welt.
- Vorschau und Feldhinweise angepasst. Beschreibung einschließlich Serverlink wird gegen 4096 Zeichen, das gesamte Embed gegen 6000 Zeichen geprüft.
- Falsche englische Sprachdeklaration entfernt; tatsächlich vorhanden ist Deutsch.
- Fehler beim Speichern der Welteinstellungen werden bereits in saveConfig in einen neutralen Fehler umgewandelt. Teilweise Speicherung und erneuter Versuch sind getestet.
- Lokale Node-Tests, Browserprüfungen, reproduzierbarer ZIP-Build und Entwicklungsdokumentation für die Übernahme ins Repository konsolidiert.
- Release-Metadaten auf 1.1.0 abgestimmt. Der feste Manifest-Link bleibt der Updatekanal; die Download-Adresse erwartet den zukünftigen Tag v1.1.0.

### Beibehaltener Stand

Browserlokale Webhook-Speicherung nach Welt und GM, geprüfte Migration, GM-only Bedienung, unveränderte Discord-Icons und manuelle Statusankündigungen bleiben erhalten. GM-Logout sendet nichts; die optionale OFFLINE-Ankündigung gilt nur vor „Zurück zum Setup“. Diese Laufzeitkorrekturen waren bereits im geprüften öffentlichen Ausgangsstand enthalten.

## 1.0.0 – historischer Release v.1.0.0

Erster manueller Release der Identität Foundry World Status. Der Tag `v.1.0.0` bleibt unverändert. Nachfolgende Repository-Korrekturen an README und Manifest befinden sich auf `main`; Tag und heutiger Hauptzweig sind deshalb nicht identisch.

Ab v1.1.0 prüft der manuell gestartete Release-Workflow Quellstand, Version, Tag, separates Manifest und ZIP gemeinsam vor der Veröffentlichung. Historische Release-Dateien werden dafür nicht ersetzt.

Die ältere Modul-ID `foundry-discord-announcer` wird nicht automatisch übernommen. Beim Wechsel Einstellungen und Webhook manuell als GM übertragen.
