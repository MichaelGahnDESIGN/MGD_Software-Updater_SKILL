# 18 — MGD Academy: In-App-Updates über separates Release-Repository

Stand: 30.09.2026. Diese Anleitung beschreibt die **im Quellcode vorhandene** macOS-Strecke und ihre Grenzen, nicht eine allgemeine Update-Garantie für jede Plattform.

## Architektur

Der Quellcode der Flutter-App liegt getrennt vom öffentlichen [`MGD-Academy-Releases`](https://github.com/MichaelGahnDESIGN/MGD-Academy-Releases). Ein macOS-Release-Workflow im privaten Quellrepository baut die `.app`, ein Installations-DMG und ein besonderes In-App-ZIP. Er veröffentlicht die Artefakte als GitHub-Release im privaten Quellrepository **und** im öffentlichen Release-Repository. Das öffentliche Repository enthält die installierbaren Dateien, nicht automatisch den privaten Quellcode. Ein Token gehört nicht in die App.

Die installierte App fragt `https://api.github.com/repos/MichaelGahnDESIGN/MGD-Academy-Releases/releases/latest` ab, vergleicht den Tag mit der installierten Version und wählt unter den Assets `MGD-Academy-*-macOS-update.zip`. Nutzer sehen Version, Hinweise und einen Installationsweg. Die App lädt das ZIP in ein temporäres Verzeichnis und vergleicht SHA-256 mit dem `digest` des GitHub-Assets. Fehlt der Digest oder stimmt er nicht, wird abgebrochen. **SHA-256 schützt hier gegen beschädigte/abweichende Downloads; da Digest und Paket aus demselben Release-Konto stammen, ersetzt dies keine unabhängige Signatur oder Apple-Notarisierung.**

## macOS-Installation

Der Installer verweigert den automatischen Austausch, wenn die App direkt aus einem DMG unter `/Volumes/` läuft. Ansonsten wartet ein losgelöstes Hilfsskript auf das Ende der laufenden App, entpackt das ZIP, kopiert die neue `.app` zunächst als `APP.new`, verschiebt die alte nach `APP.old` und startet die neue App. Schlägt der Start fehl, stellt es `APP.old` zurück und versucht den alten Start. Persönliche SQLite-Daten liegen getrennt im Application-Support-Verzeichnis und sollen nicht Teil des App-Bundles sein.

Wichtig: Der gezeigte Skript-Rollback prüft einen erfolgreichen `open`-Aufruf und kurze Wartezeit, **keine** vollständige Funktionsprüfung der neuen Version. Signierung, Hardened Runtime und Apple-Notarisierung müssen für eine belastbare externe macOS-Verteilung gesondert überprüft werden. Im öffentlich sichtbaren Release-README wird fehlende Notarisierung genannt. Die Windows-Strecke im Update-Service erkennt zwar einen Setup-Assetnamen, der automatische Installer ist dort noch nicht freigeschaltet.

## Release- und Abnahmeregeln

1. Versionsdatei, Flutter-Paketversion, Tag und Dateinamen abgleichen; Artefakte aus genau einem getesteten Commit bauen.
2. Build- und Inhaltstests durchführen. DMG und Update-ZIP getrennt bauen; SHA-256 für beide veröffentlichen.
3. Public-Release erst nach erfolgreichem privaten Build und Signier-/Paketprüfung veröffentlichen. Keine zweite manuelle Veröffentlichung parallel zum CI-Workflow starten.
4. Mit einer **installierten älteren Version** den echten Ablauf testen: Hinweis → Download → Hashprüfung → Austausch → Neustart → Versionsanzeige → lokale Daten erhalten. Ein GitHub-Release oder grüner Build allein reicht nicht.
5. Auch Abbruchfälle prüfen: offline, 404, fehlender Asset/Digest, falscher Hash, Startfehler, fehlende Schreibrechte und Start direkt vom DMG.

## Relevante Quellorte

- Im privaten `MGD-Academy`-Quellrepository: `lib/services/update_service.dart`, `lib/ui/screens/update_install_screen.dart`, `.github/workflows/release.yml`, `docs/UPDATES.md`.
- Im öffentlichen [`MGD-Academy-Releases`](https://github.com/MichaelGahnDESIGN/MGD-Academy-Releases): Release-Historie und herunterladbare Pakete. Zum Prüfzeitpunkt war `v0.11.0` mit macOS-DMG, Update-ZIP und Prüfsummen vorhanden.

## Nicht auf private CMS-Plugins übertragen

Bei Academy darf das öffentliche ZIP die verteilbare Binär-App enthalten. Ein WordPress-, Shopware- oder JTL-ZIP enthält in der Regel lesbaren PHP-Code. Falls der Plugin-Code privat bleiben soll, muss auch der Downloadkanal geschützt sein: per-installation Read-only-Zugang am Server oder eigener authentifizierter Update-Dienst, niemals ein eingebetteter gemeinsamer Token.
