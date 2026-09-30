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

## WordPress

- Plugin-Header `Version` und bei externem Anbieter `Update URI` korrekt setzen. Die WordPress-Update-Information muss zum exakten Plugin-Basename und Slug passen.
- Bei öffentlichen Plugins können WordPress-Filter oder ein gepflegter Update-Checker GitHub-Releases integrieren. Bei privaten Plugins muss derselbe Mechanismus Metadaten **und** Paket authentifiziert abrufen. Ein Token nur für die Versionsprüfung ist unzureichend.
- Der installierbare ZIP-Hauptordner muss stabil bleiben, zum Beispiel `fragebogen/`. Der Update-Checker darf nicht auf Tag-/Branch-Archive zurückfallen, wenn das freigegebene Release-Asset fehlt.
- Die eigentliche Installation soll WordPress über „Plugins“ oder „Dashboard → Aktualisierungen“ durchführen. WordPress-Auto-Updates nur nach ausdrücklicher Produktentscheidung aktivieren.
- Besonders kritisch: Daten, die fälschlich innerhalb des Plugin-Verzeichnisses liegen, können beim Ersetzen des Ordners verloren gehen. Vor dem ersten Update migrieren und sichern.

## Shopware 6

- Composer-/Plugin-Version, Tag und ZIP-Paket synchronisieren; Shopware-kompatible Ordnerstruktur prüfen.
- Ein Shopware-Plugin kann GitHub-Releases prüfen und ein neues Paket **vorbereiten**. Die Anwendung des Pakets soll durch Shopwares native Plugin-Verwaltung und deren Update-/Migrationsablauf erfolgen. Ein Dateikopieren direkt über die laufende Installation ist kein sicheres Backend-Update.
- Paket nur aus stabilem Release, mit fester Asset-Bezeichnung, Integritätsprüfung und atomarer Staging-Ablage akzeptieren. Anschließend Plugin-Refresh, Update und Cache-/Theme-Kompilierung nach Shopware-Verfahren testen.
- „Jede Stunde prüfen“ bedeutet nur Erkennung nach Cache-/Cron-Lauf, nicht GitHub-Push-Benachrichtigung und nicht automatisches Installieren. Einen manuellen „Jetzt prüfen“-Knopf für Administratoren anbieten.

## JTL Shop 5

- Die `info.xml`-Version und das JTL-Plugin-ZIP müssen exakt zusammenpassen. Der Hauptordner im ZIP ist entscheidend.
- GitHub-Release-Prüfung kann im JTL-Backend eine neue Version und einen Download anzeigen. **Das ist noch kein Ein-Klick-Update aus GitHub.** Der bisherige MGD-Weg lädt das ZIP herunter, lädt es in die JTL-Pluginverwaltung und führt das Update dort aus.
- Für einen echten „Update“-Knopf ohne manuellen ZIP-Upload muss das neue Paket kontrolliert serverseitig in die erwartete Plugin-Ablage gelangen und der JTL-Pluginmanager es als neue Version erkennen. Dies nur gegen die konkret eingesetzte JTL-Version und mit Backup testen; kein direktes Überschreiben aktiver PHP-Dateien.
- Cache-Häufigkeit und Backend-„Jetzt prüfen“ sind getrennte Einstellungen. Frontend-Requests dürfen GitHub nicht synchron belasten.

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
