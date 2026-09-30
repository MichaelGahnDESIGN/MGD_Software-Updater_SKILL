# 17 — Plugins in WordPress, Shopware und JTL Shop aktualisieren

Stand: 30.09.2026. Diese Anleitung unterscheidet bewusst **Update erkennen**, **Paket bereitstellen**, **Installation im Backend** und **live geprüft**. Ein GitHub-Release allein löst in keinem der drei Systeme magisch ein Update aus.

## Gemeinsamer Release-Vertrag

1. Eine versionierte Plugin-Datei, ein Tag `vX.Y.Z` und der installierbare ZIP-Inhalt müssen dieselbe Version tragen. Teste diese Gleichheit im Release-Workflow.
2. Veröffentliche einen **fest benannten** Paket-Asset. GitHubs automatisch erzeugte „Source code“-ZIPs sind keine verlässlichen Installationspakete.
3. Baue das ZIP reproduzierbar mit exakt dem erwarteten Plugin-Hauptordner; schließe `.env`, Zugangsdaten, Tests und Build-Verzeichnisse aus. Prüfe Dateiliste, ZIP-Integrität, Größe und nach Möglichkeit SHA-256 sowie gefährliche Pfade/Symlinks.
4. Prüfe neue Versionen mit Cache, manueller Aktualisierungsmöglichkeit und eindeutigem Fehlerstatus. Zeige keine Beta-Version als Stable-Update.
5. Installiere erst nach Staging-Update, Backup, Rollback-Plan und realem Backend-Test. Ein grüner CI-Lauf beweist keine funktionierende Kundeninstallation.
6. Dokumentiere die Zustände getrennt: Code vorbereitet → PR geprüft → Release veröffentlicht → Backend erkennt → Backend installiert → Storefront und Admin geprüft.

## Öffentliche und private Repositories

Bei öffentlichen Repositories kann das CMS Release-Metadaten und Paket ohne Schlüssel laden. Bei **privaten** Repositories bleibt auch das ZIP privat. Jede Kundeninstallation bekommt einen eigenen, auf genau das Repository beschränkten Read-only-Token im Server-Secret-Store oder in einer nicht versionierten Konfigurationsdatei. Nie im Plugin, Client, Log oder Support-Screenshot. Bei einem GitHub-Asset-Aufruf geht `Authorization` nur an die passende GitHub-API; bei der Weiterleitung zum Download-Host muss der Header entfernt werden. Ohne gültigen Token **kein** öffentlicher Fallback. Tokenrotation und Entzug pro Kunde vorsehen.

Ein öffentliches Release-Repository wie bei MGD Academy legt seine Binärpakete offen. Dieses Muster eignet sich **nicht** für privaten Plugin-Code, wenn das ZIP den PHP-Quellcode enthält.

### Privater Release ohne Terminalarbeit für Shop-Betreiber

Der Betreiber muss weder Befehle ausführen noch GitHub Actions bezahlen. Eine
beauftragte Wartungsperson kann Quellcode, Tests, festen ZIP-Build, Prüfsumme,
Git-Commit und privates GitHub-Release selbst übernehmen. Ein Release-**Entwurf**
ist dafür ein sicherer Zwischenstand: Er ist noch kein reguläres Update und
erscheint nicht unter `releases/latest`. Erst nach Paketprüfung, Backup,
Staging und Freigabe wird veröffentlicht. Anschließend erfolgt die Installation
im jeweiligen CMS-Backend; die Wartungsperson kann auch diesen Schritt mit
autorisiertem Backend-Zugang übernehmen.

GitHub Actions ist ein **optionaler** Build-Helfer, keine Voraussetzung für
GitHub-Releases. Private Repositories haben für GitHub-gehostete Runner ein
planabhängiges Freikontingent; wenn ein Job wegen Konto-/Budgeteinstellungen
nicht startet, beweist dies keinen Codefehler. Lokal ausgeführte Tests und
Paketprüfung müssen dann ausdrücklich protokolliert werden. Ein selbst
betriebener Runner verbraucht laut GitHub keine GitHub-Actions-Minuten, erfordert
aber Betrieb und Pflege des eigenen Rechners. Das Repository nur zur Umgehung
einer solchen Grenze vorübergehend öffentlich zu machen, ist keine sichere
Alternative: Code und Historie wären sichtbar; öffentliche Forks bleiben beim
Zurückstellen auf privat unter Umständen öffentlich.

Bei einem **öffentlichen** Repository sind GitHubs Standard-Runner wie
`ubuntu-latest` laut GitHub kostenlos und unbegrenzt. Ein dauerhaft wartender,
nicht vorhandener `self-hosted`-Runner kann dort durch einen Standard-Runner
ersetzt werden; prüfe danach den konkreten Tag-Workflow und das Release-Asset.
Bei einem **privaten** Repository gilt diese unbegrenzte Zusage nicht.

Quellen: [GitHub Actions und Freikontingent](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[selbst betriebene Runner](https://docs.github.com/en/actions/concepts/runners/self-hosted-runners),
[Folgen eines Sichtbarkeitswechsels](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility).

## WordPress

- Plugin-Header `Version` und bei externem Anbieter `Update URI` korrekt setzen. Die WordPress-Update-Information muss zum exakten Plugin-Basename und Slug passen.
- Bei öffentlichen Plugins können WordPress-Filter oder ein gepflegter Update-Checker GitHub-Releases integrieren. Bei privaten Plugins muss derselbe Mechanismus Metadaten **und** Paket authentifiziert abrufen. Ein Token nur für die Versionsprüfung ist unzureichend.
- Der installierbare ZIP-Hauptordner muss stabil bleiben, zum Beispiel `fragebogen/`. Der Update-Checker darf nicht auf Tag-/Branch-Archive zurückfallen, wenn das freigegebene Release-Asset fehlt.
- Die eigentliche Installation soll WordPress über „Plugins“ oder „Dashboard → Aktualisierungen“ durchführen. WordPress-Auto-Updates nur nach ausdrücklicher Produktentscheidung aktivieren.
- Besonders kritisch: Daten, die fälschlich innerhalb des Plugin-Verzeichnisses liegen, können beim Ersetzen des Ordners verloren gehen. Vor dem ersten Update migrieren und sichern.

### Praxistest des nativen Backend-Updates

Für einen belastbaren Test reicht `Plugin_Upgrader::upgrade()` aus der Kommandozeile nicht: Dieser Weg kann ein Plugin deaktiviert lassen, obwohl das normale Backend-Massenupdate es wieder aktiviert. Teste deshalb auch `Plugin_Upgrader::bulk_upgrade()` mit `WP_Ajax_Upgrader_Skin` in einer isolierten WordPress-Installation. Vergleiche danach Version, Aktivierungszustand und einen vor dem Update gesetzten Optionswert. Simuliere bei privaten Paketen sowohl die authentifizierte Release-Abfrage als auch den Download des Assets; prüfe ausdrücklich, dass ein GitHub-Token bei einer CDN-Weiterleitung **nicht** mitgesendet wird.

Hooks müssen mit der benötigten Argumentzahl registriert werden. Beispiel: Wer in `upgrader_process_complete` sowohl den Upgrader als auch die Hook-Daten verwendet, muss `add_action('upgrader_process_complete', $callback, 10, 2)` setzen. Andernfalls kann das Backend-Update erst nach erfolgreichem Entpacken mit einem PHP-Fatal scheitern.

## Shopware 6

- Composer-/Plugin-Version, Tag und ZIP-Paket synchronisieren; Shopware-kompatible Ordnerstruktur prüfen.
- Ein Shopware-Plugin kann GitHub-Releases prüfen und ein neues Paket **vorbereiten**. Die Anwendung des Pakets soll durch Shopwares native Plugin-Verwaltung und deren Update-/Migrationsablauf erfolgen. Ein Dateikopieren direkt über die laufende Installation ist kein sicheres Backend-Update.
- Paket nur aus stabilem Release, mit fester Asset-Bezeichnung, Integritätsprüfung und atomarer Staging-Ablage akzeptieren. Anschließend Plugin-Refresh, Update und Cache-/Theme-Kompilierung nach Shopware-Verfahren testen.
- „Jede Stunde prüfen“ bedeutet nur Erkennung nach Cache-/Cron-Lauf, nicht GitHub-Push-Benachrichtigung und nicht automatisches Installieren. Einen manuellen „Jetzt prüfen“-Knopf für Administratoren anbieten.
- Wenn die Release-Vorbereitung bereits aktive Plugin-Dateien austauscht, muss der Hintergrundjob standardmäßig **aus** sein. Ein globales Opt-in in der Plugin-Konfiguration, private Rückfallsicherung und ein separat ausgelöster nativer Shopware-Update-Schritt sind Mindestschutz. Ein bloßes ZIP-Release oder ein grüner Unit-Test belegt noch keine Update-Schaltfläche im Kundenshop.

## JTL Shop 5

- Die `info.xml`-Version und das JTL-Plugin-ZIP müssen exakt zusammenpassen. Der Hauptordner im ZIP ist entscheidend.
- GitHub-Release-Prüfung kann im JTL-Backend eine neue Version und einen Download anzeigen. **Das ist noch kein Ein-Klick-Update aus GitHub.** Der bisherige MGD-Weg lädt das ZIP herunter, lädt es in die JTL-Pluginverwaltung und führt das Update dort aus.
- Für einen echten „Update“-Knopf ohne manuellen ZIP-Upload muss das neue Paket kontrolliert serverseitig in die erwartete Plugin-Ablage gelangen und der JTL-Pluginmanager es als neue Version erkennen. Dies nur gegen die konkret eingesetzte JTL-Version und mit Backup testen; kein direktes Überschreiben aktiver PHP-Dateien.
- Cache-Häufigkeit und Backend-„Jetzt prüfen“ sind getrennte Einstellungen. Frontend-Requests dürfen GitHub nicht synchron belasten.
- Der offiziell dokumentierte direkte „Update“-Knopf für bezogene Erweiterungen gehört zum **JTL-Extension-Store** (`Plugins → Meine Käufe`). Für selbst gepflegte GitHub-ZIPs ist damit noch kein gleichwertiger Ein-Klick-Kanal belegt. Ein Release-Hinweis mit anschließendem ZIP-Upload im JTL-Pluginmanager ist ein funktionierender Backend-Updateweg, aber nicht derselbe Komfort. Eine private GitHub-zu-JTL-Ein-Klick-Integration erst nach Prüfung der konkret installierten Shop-Version und unterstützten JTL-Schnittstellen zusagen.

## Veröffentlichte Entwürfe und Tag-Workflows

Wird ein geprüfter GitHub-Release-Entwurf veröffentlicht, entsteht der Tag und ein `push tags`-Workflow kann starten. Dieser Workflow darf nicht blind `gh release create` auf denselben Tag ausführen. Er muss ein bereits vorhandenes Release als unveränderlich behandeln und das gebaute Paket mit dessen Asset vergleichen. Bei ZIP-Dateien Dateiliste und entpackte Inhalte vergleichen: Unterschiedliche ZIP-Zeitstempel verändern den Hash der gesamten ZIP-Datei, obwohl die Plugin-Dateien identisch sind. Eine mitgelieferte `.sha256`-Datei jeweils gegen **ihr eigenes** ZIP prüfen. Den veröffentlichten Tag bei einem später entdeckten Workflow-Fehler nicht still verschieben; die Korrektur gilt für das nächste Release.

## Testprotokoll pro Plugin

| Nachweis | Erwartetes Ergebnis |
|---|---|
| Ohne neue Version | Keine falsche Update-Anzeige |
| Stable-Release mit gültigem ZIP | Exakte Version und richtiger Slug im Backend |
| Fehlender/ungültiger Token (privat) | Sichere Fehlermeldung, keine Token-Ausgabe, kein Fallback |
| Beta/Draft oder fehlendes Asset | Nicht als Stable-Update installierbar |
| Manipuliertes/falsches Paket | Abbruch vor Installation |
| Staging-Update | Einstellungen und Kundendaten bleiben erhalten; Funktion im Admin und Frontend |
| Rollback | Vorherige Version und Daten aus Backup wiederherstellbar |

## Quellen und Beispielimplementierungen

- [WordPress-Plugin-Header mit Update URI](https://developer.wordpress.org/plugins/plugin-basics/header-requirements/), [externer Update-Filter](https://developer.wordpress.org/reference/hooks/update_plugins_hostname/) und [Hook vor dem Download](https://developer.wordpress.org/reference/hooks/upgrader_pre_download/).
- [GitHub Release Assets API](https://docs.github.com/en/rest/releases/assets): geschützte Asset-Downloads.
- [Plugin Update Checker](https://github.com/YahnisElsts/plugin-update-checker): `setAuthentication()` für private Repositories; Asset- und Fallback-Verhalten der verwendeten Version prüfen.
- [JTL-Extension-Store-Updates](https://guide.jtl-software.com/jtl-shop/shop-erweitern/extension-store/) und [Upload in JTL Shop 5](https://guide.jtl-software.com/jtl-shop/shop-erweitern/dateisystem/): den Store-Ein-Klick-Weg nicht mit dem Upload selbst gepflegter GitHub-Pakete verwechseln.
- MGD-Referenzen: `MGD_WordPress-MCP` (WordPress, öffentlich), `MGD-AI-Kennzeichnung-Shopware-6` (Shopware, öffentlich), `MGD-AI-Kennzeichnung-JTL-Shop-5` (JTL, Backend-Hinweis). Referenzen sind Muster, **kein** pauschaler Live-Funktionsnachweis.
