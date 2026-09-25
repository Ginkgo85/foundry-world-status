# Entwicklung und Beiträge

Öffentliche Referenz: [Ginkgo85/foundry-world-status](https://github.com/Ginkgo85/foundry-world-status). Im echten Git-Checkout arbeiten; vor Änderungen Status, Remotes und aktuellen main prüfen. Fremde Änderungen nicht überschreiben.

## Lokal prüfen

Node.js 24 mit npm. Reguläre Tests und Build benötigen keine Paketinstallation:

    npm test
    npm run build:release
    npm run test:release

npm test führt zuerst Syntax-/JSON-/Metadaten-/Secret-Prüfungen und dann alle Node-Testdateien aus. test:release prüft die tatsächlichen erzeugten Dateien unter release/ und veröffentlicht nichts. Ohne npm lassen sich die entsprechenden Node-Skripte direkt ausführen.

Optionale lizenzierte Core- und Browserprüfungen stehen in [VALIDIERUNG.md](VALIDIERUNG.md). Keine Foundry-Core-Dateien oder echten Webhooks einchecken.

## Git und Commits

Bei beauftragten Entwicklungsänderungen: zuerst lokale Prüfungen, dann zusammengehörige Änderungen committen und auf GitHub pushen, sofern der Auftrag dies nicht ausschließt. Bei fehlender Anmeldung lokal fertigstellen und den blockierten Push ausdrücklich melden. Keine Veröffentlichung durch Start des Release-Workflows ohne gesonderte Freigabe.

Conventional Commits: `type(scope): imperative summary`.

Typen: feat, fix, security, refactor, docs, test, build, ci, chore. Imperativ, kein Schlusspunkt, möglichst unter 50 und höchstens ungefähr 72 Zeichen. Bei Bedarf nach einer Leerzeile das Was und Warum erklären; Body bei ungefähr 72 Zeichen umbrechen. Keine Secrets und keine AI-Co-Autoren.

Beispiel:

    ci(release): automate tested GitHub releases

    Run source and artifact checks before creating a new tag.
    Keep historical tags and release assets unchanged.

Keine generischen Nachrichten wie „Add files via upload“, „Update files“ oder „fix stuff“. Die Regeln gelten ab jetzt; alte Historie nicht umschreiben. Die Vorlage liegt in .gitmessage.

## Versionen

module.json ist maßgeblich. Codex passt bei einer Versionsänderung package.json, Download-URL, README und Changelog gemeinsam an. Der Maintainer gibt beim Start nichts zusätzlich ein. Die Prüfung lehnt Widersprüche ab und korrigiert nichts stillschweigend.

Der Workflow veröffentlicht reguläre SemVer-Versionen X.Y.Z ohne führende Nullen. Prerelease-/Build-Suffixe werden bewusst abgelehnt, da dieser einfache Prozess reguläre Releases veröffentlicht. Der Tag wird ausschließlich als v<version> abgeleitet; es gibt kein zusätzlich gepflegtes releaseTag-Feld.

Historischer Tag v.1.0.0 bleibt unangetastet. Korrekturen eines veröffentlichten Pakets erhalten eine neue PATCH-Version.

## CI und Release

- ci.yml: push und Pull Request auf main sowie manueller Start; nur contents: read.
- release.yml: ausschließlich workflow_dispatch auf main; contents: write; eine Release-Ausführung gleichzeitig.
- codeql-analysis.yml: separate CodeQL-Prüfung, kein Teil des Release-Builds.

Beide Hauptworkflows nutzen Node 24, npm test, denselben Build und dieselbe Artefaktprüfung. Es werden keine lizenzierten Foundry-Dateien heruntergeladen.

release.mjs prüft den ausgecheckten Commit gegen GITHUB_SHA und den aktuellen öffentlichen main. Existierende Releases (einschließlich Entwürfen), abweichende Tag-Ziele und unklare API-Antworten stoppen den Vorgang. Fehlt der Tag, wird er atomar am geprüften SHA angelegt. Ein bereits vorhandener Tag wird nur wiederverwendet, wenn er direkt auf den geprüften GITHUB_SHA zeigt und kein Release existiert. Annotierte oder nicht eindeutig geprüfte Tag-Ziele werden abgelehnt. gh release create verwendet --verify-tag und lädt genau zwei Dateien hoch. Kein Force, kein Überschreiben, kein --clobber.

Bei einem Fehler nach Tag-Erstellung kann derselbe Workflow auf demselben, weiterhin aktuellen main-Commit erneut laufen, sofern noch kein Release existiert. Der passende Tag bleibt unverändert. Ein vorhandener Release-Entwurf blockiert ebenso wie ein veröffentlichter Release. Schlägt die atomare Tag-Erstellung durch ein Rennen fehl, bricht dieser Lauf ohne Release-Erstellung ab; erst ein neuer Lauf prüft den Zustand erneut. Niemals Tags verschieben, löschen oder force-update durchführen.

Der direkte Aufruf von release.mjs ohne --publish prüft nur die Remote-Voraussetzungen innerhalb von GitHub Actions. Der lokale Dry-Run besteht aus den drei npm-Befehlen oben und benötigt keinen Token.

## Build und Dateien

tools/build-release.mjs ist die einzige Build-Implementierung. release/ ist ignorierte Ausgabe mit genau module.json und foundry-world-status.zip. Standard-ZIP mit STORE und festen Zeitstempeln; 16 explizite Laufzeit-/Endbenutzerdateien einschließlich beider Sprachdateien, der gemeinsamen zweisprachigen README und der Lokalisierungsanbindung, Root-Manifest, keine Entwicklungsdateien.

tools/verify-release.mjs prüft echte ZIP-Einträge, CRC32, Quellenvergleich, Manifest-Kopie und Secret-Muster. tools/check-project.mjs prüft die Quellen. Die bekannte Secret-Musterprüfung ersetzt keine allgemeine Sicherheitsanalyse.

Workflows und Werkzeuge sind Teil des Quellrepositories. release/, validation/, node_modules und private Daten werden nicht committed.

## Offizielle Grundlagen

- [GitHub CLI: Release erstellen](https://cli.github.com/manual/gh_release_create)
- [Workflow-Berechtigungen](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions)
- [Node.js](https://nodejs.org/en/download)

Die Action-Pins wurden gegen die tatsächlichen offiziellen Git-Tags aufgelöst. Änderungen an Pins erneut verifizieren. Erfolgreiches actionlint ersetzt keine erfolgreiche GitHub-Ausführung.
