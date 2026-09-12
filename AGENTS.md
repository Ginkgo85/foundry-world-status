# Foundry World Status

## Projektidentität

- Kanonischer Projektname: foundry-world-status; sichtbarer Name: Foundry World Status.
- Öffentliches Repository: Ginkgo85/foundry-world-status. foundry-discord-announcer ist nur die historische Modulidentität.
- Die lokale technische Modul-ID und der aktuelle Settings-Namespace lauten bereits foundry-world-status.
- Repository, Git-Remotes und technische Identifier niemals eigenmächtig umbenennen. URLs müssen auf den tatsächlichen Repository-Namen zeigen.
- Jede weitere Änderung der Modul-ID erfordert zuerst eine Analyse von Installationen, Settings und Asset-Pfaden sowie einen getesteten Migrationsplan.
- Keine automatische Übernahme aus anderen Modul-Namespaces ohne ausdrücklichen Auftrag.

## Einstieg auf einem neuen PC

- Zuerst diese AGENTS.md, README.md, CONTRIBUTING.md, VALIDIERUNG.md und PUBLISHING.md lesen; zusätzliche Anweisungen im betroffenen Unterordner beachten. Diese Dateien sind maßgeblich, nicht ein früherer Chat oder ein alter lokaler Pfad.
- Git für Windows, GitHub CLI sowie Node.js 24 mit npm prüfen und fehlende Werkzeuge im Rahmen des Einrichtungsauftrags einrichten. Keine temporären Laufzeitpfade eines früheren PCs voraussetzen. Normale Tests und Build benötigen weder Paketinstallation noch Foundry; optionale Core-/Browserprüfungen stehen in VALIDIERUNG.md.
- GitHub-Anmeldung mit gh auth status prüfen und bei Bedarf den Benutzer durch den Browser-Login führen; anschließend gh auth setup-git ausführen. Keine Zugangsdaten ins Projekt schreiben. Das vollständige Repository mit gh repo clone Ginkgo85/foundry-world-status holen, sofern noch kein Checkout existiert.
- Im Projekt git remote -v, git status und git branch --show-current prüfen. Erwartet sind Ginkgo85/foundry-world-status und main. Den aktuellen Remote-Stand holen; einen sauberen main bei Bedarf nur per git pull --ff-only aktualisieren. Bei fremden Änderungen, abweichendem Repository oder Konflikten nichts überschreiben.
- Vor Commit und Push npm test, npm run build:release und npm run test:release ausführen und den Diff prüfen. Nach dem Push den GitHub-main gegen den lokalen Commit prüfen und CI sowie CodeQL bis zum Abschluss kontrollieren. Fehler konkret melden; keine Historie umschreiben oder Workflows abschwächen. Ein Einrichtungsauftrag allein erlaubt keine Änderung der Version oder Veröffentlichung.

## Arbeitsweise

- Bestehenden Code vor Änderungen vollständig verstehen.
- Vor jeder Änderung Git-Status und aktuellen Remote-Stand prüfen; im echten Checkout arbeiten und keine fremden Änderungen überschreiben.
- Vor jeder Änderung das Problem reproduzieren oder belegen, betroffene Dateien nennen und die kleinste sinnvolle Lösung wählen.
- Kleine, nachvollziehbare Änderungen bevorzugen; keine unnötigen Refactorings, Features, Frameworks oder Dependencies.
- Bestehende APIs nur ändern, wenn der konkrete Auftrag oder ein belegter Fehler es erfordert.
- Nach jeder zusammengehörigen Änderung Syntax, alle vorhandenen Tests und Diff prüfen. Betroffene Dokumentation aktualisieren.
- Nur tatsächlich ausgeführte Tests als bestanden dokumentieren. Nicht ausgeführte Prüfungen ausdrücklich als „Nicht geprüft“ kennzeichnen.
- Keine Foundry-Core-Dateien in dieses Repository kopieren.
- Keine Secrets ausgeben, protokollieren, in Testdateien oder Commit-Messages eintragen. Webhooks nur zur ausdrücklich autorisierten Laufzeitkonfiguration speichern.
- Tests verwenden ausschließlich künstliche Werte und kontaktieren keine echten Discord-Webhooks.

## Verständlichkeit

Kleine Funktionen, sprechende Namen, expliziter Kontrollfluss und wenige Seiteneffekte bevorzugen. Keine unnötigen Generics, Klassenhierarchien, Utility-Abstraktionen oder Dependency Injection. Kommentare erklären ungewöhnliche Entscheidungen, nicht offensichtlichen Code.

Eine dokumentierte Einschränkung ist einer komplexen Lösung vorzuziehen, wenn sie für die private Nutzung akzeptabel ist. Mehrere GMs können konkurrierend senden; keine verteilte Sperre ohne belegten Bedarf.

## Veröffentlichung und Git

- Bei beauftragten Entwicklungsänderungen nach erfolgreichen lokalen Tests sinnvoll committen und pushen, sofern der Auftrag dies nicht ausschließt. Bei fehlender Anmeldung den blockierten Push melden.
- Tags und Releases ausschließlich über den manuell gestarteten Release-Workflow nach gesonderter Freigabe; keine historischen Tags oder Assets verändern.
- Git-Historie nicht umschreiben. Keine Repository-Einstellungen oder Issues ohne Auftrag ändern.
- Conventional Commits: type(scope): imperative summary.
- Erlaubte Typen: feat, fix, security, refactor, docs, test, build, ci, chore.
- Imperativ, kein Schlusspunkt; möglichst unter 50, höchstens ungefähr 72 Zeichen.
- Pro Commit eine zusammengehörige Änderung; bei nichttrivialen Änderungen nach einer Leerzeile das Was und Warum erläutern.
- Keine generischen Nachrichten wie „Add files via upload“, „Update README.md“, „changes“ oder „fix stuff“. Regeln gelten ab jetzt; bisherige Historie bleibt erhalten. Keine AI-Werkzeuge als Co-authored-by eintragen.
- Zukünftige Tags verwenden v1.2.3, niemals v.1.2.3. Bestehende Tags unverändert lassen.
- module.json ist für die Version maßgeblich. package.json, README, Changelog und Download-URL beim Ändern konsistent halten; der Release-Workflow leitet den Tag daraus ab und bricht bei Widersprüchen ab.
- Versionsvorschläge folgen SemVer: PATCH für kompatible Korrekturen, MINOR für kompatible Erweiterungen, MAJOR für inkompatible Änderungen.
