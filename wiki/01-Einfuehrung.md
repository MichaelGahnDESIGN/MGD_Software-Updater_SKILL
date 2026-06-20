# 01 — Einführung ins Software-Updater System

**Willkommen!** Diese Wiki führt dich durch den MGD Software Updater Skill Assistent.

---

## Was ist ein Update-System?

Ein **Update-System** ist der Mechanismus, über den Nutzer die neueste Version deiner App bekommen:

- Desktop-App: "Neue Version 1.5.0 verfügbar → [Download] → Installation"
- Mobile-App: "Update bereit → [Play Store/App Store] → Auto-Install"
- Web-App: "Browser lädt neue Version nach"
- Backend: "Server updated ohne Downtime"

Ohne Update-System:
- Nutzer muss manuell neu installieren
- Sicherheits-Patches erreichen Nutzer nicht
- Bugs werden nicht behoben
- Neue Features dauern ewig

Mit Update-System:
- Nutzer bekommt Updates automatisch
- Kritische Sicherheits-Patches schnell
- Feedback-Loop schneller

---

## Warum strukturiert planen?

Update-Systeme sind **kritisch aber oft improvisiert**:

- Falsches Design → monatelang Refactoring
- Sicherheitslücken → Malware-Verbreitung
- Keine Rollback → Nutzer verliert App
- Schlechte UX → Nutzer deaktiviert Updates

**Mit Plan:**
- 1-2 Tage Umsetzung
- Sicher & stabil
- Skalierbar für Wachstum

**Ohne Plan:**
- 1-2 Wochen Improvisieren
- Bugs & Sicherheitslücken
- Später Refactoring = Zeit verschwenden

---

## Die 2 Phasen

### Phase 1 — Planung (dieses Wiki)

Du beantwortest 10 Fragen:

1. Projekt-Typ (Desktop, Mobile, Web?)
2. Update-Anforderungen (Automatisch? Wie oft?)
3. Sicherheit (Signing? Checksums?)
4. Datenschutz (DSGVO? Telemetrie?)
5. Update-Quelle (GitHub? CDN? Eigenem Server?)
6. Workflow (Was sieht Nutzer?)
7. Datenmodell (JSON-Format?)
8. Backend (Server notwendig?)
9. Testing (Wie testen?)
10. Release (Automatisierung?)

**Ergebnis:** Eine PLAN.md mit allen Entscheidungen.

### Phase 2 — Umsetzung (mit Agent)

Agent liest deine PLAN.md und:
- Schreibt Update-Code
- Integriert in deine App
- Testet lokal & Staging
- Bereitet Release vor

---

## Maturity-Level

**Nicht alle Projekte brauchen Enterprise-Features.**

Wähle dein Level:

| Level | Name | Für wen | Kosten |
|-------|------|--------|--------|
| 1 | Manual Notice | Indie/Hobby | Gratis |
| 2 | Guided | Indie/Startup | ~$1-10/mo |
| 3 | Automatic | Wachsende App | ~$10-50/mo |
| 4 | Secure | Enterprise/kritisch | ~$50-200/mo |
| 5 | Enterprise | Große Teams | ~$200+/mo |

**Tipps:**
- Starten fast alle auf Level 1 oder 2
- Mit Wachstum zu Level 3 oder 4 upgraden
- Level 5 nur wenn 10.000+ Nutzer oder Compliance-Anforderungen

---

## Quick Start

1. Öffne `skill/SKILL.md`
2. Folge den 10 Schritten
3. Dokumentiere deine Antworten in `examples/[dein-projekt]/PLAN.md`
4. Checke mit Agent: `/software-updater checklist`
5. Agent startet Phase 2: `/software-updater implement`

---

## Nächste Schritte

- **[02 — Update-Typen](02-Update-Typen.md)** — Desktop vs. Mobile vs. Web
- **[03 — Sicherheit](03-Sicherheit.md)** — Code-Signing, Checksums, TLS
- **[04 — Datenschutz & DSGVO](04-Datenschutz-DSGVO.md)** — Privacy Rules
- **[skill/SKILL.md](../skill/SKILL.md)** — Die 10 Planungsschritte

---

**Fragen?** Schreib `Anfrage@Michael-Gahn.de` oder öffne ein GitHub Issue.
