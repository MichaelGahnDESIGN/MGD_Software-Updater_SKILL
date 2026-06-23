# MGD Software Updater Skill Assistent

**Ein KI-Assistent, der Update-Systeme plant UND implementiert.**

Der Skill begleitet dich in 2 Phasen:
1. **Phase 1 — Planung** (10 Schritte): Anforderungen, Sicherheit, Architektur analysieren
2. **Phase 2 — Umsetzung** (Agent-Mode): Claude Code/Codex/Cursor schreibt Code, testet, debuggt zusammen mit dir

Für Desktop-Apps (Flutter, Electron, Tauri, Swift), Mobile Apps, Web-Apps, SaaS und Backend-Systeme.

---

## Was ist dieser Skill?

Der **MGD Software Updater Skill Assistent** ist ein strukturiertes System, um professionelle Update-Mechanismen zu bauen. Update-Systeme sind kritisch für User-Experience, Sicherheit und Vertrauen — aber oft werden sie improvisiert.

Dieser Skill bietet:
- **10 Planungsschritte** zur Analyse deines Projekts (Plattform, Technologie, Sicherheit, Datenmodell)
- **Maturity-Level 1–5** um realistisch zu starten und schrittweise zu professionalisieren
- **Agent-Integration** zum Implementieren, Testen und Debuggen zusammen mit Claude Code/Codex/Cursor
- **Vorlagen & Checklisten** für häufige Update-Szenarien

Der Skill ist **technologie-neutral**: Electron, Flutter, React Native, Tauri, Swift, Node.js, PHP, Go — egal.

---

## Für wen?

- **Einzelne Entwickler** mit einer App und "wie baue ich Updates?"
- **Startup-Teams** die von "Nutzer prüft selbst" zu automatischen Updates wechseln
- **Enterprise-Teams** die Rollout-Strategien, Lizenzierung, und Compliance brauchen
- **KI-Agenten** (Claude Code, Codex, Cursor, Windsurf) zum Automatisieren von Implementierung & Testing

---

## Die zwei Phasen

### Phase 1 — Planung (du + Skill)

Du durchlaufst 10 strukturierte Schritte:

1. **Projekt-Typ** analysieren (Desktop, Mobile, Web, Game, Backend)
2. **Update-Anforderungen** klären (automatisch? wie oft? Rollback?)
3. **Sicherheit** prüfen (Signing, Checksums, TLS, Hacker-Szenarien)
4. **DSGVO/Datenschutz** — welche Telemetrie, Nutzer-Opt-out?
5. **Update-Quelle** planen (GitHub Releases, CDN, eigener Server, App Stores)
6. **Update-Workflow** zeichnen (Dialog, Download-Fortschritt, Installation, Rollback)
7. **Datenmodell** (JSON-Struktur für Manifest, Version-Format, Changelog)
8. **Backend-Infrastruktur** (Server notwendig? Admin-Panel? Logging?)
9. **Testing-Strategie** (lokal, Staging, Rollout-Prozess, Rollback)
10. **Release-Planung** (Automation, Version-Tagging, Release-Notes)

Das Ergebnis: Ein klarer Plan ohne Code-Chaos.

### Phase 2 — Umsetzung (du + Agent)

Mit dem Plan startest du einen KI-Agent:

```
/software-updater implement
```

Der Agent:
- Generiert boilerplate Code für deine Plattform
- Integriert Update-Logik in deine App
- Schreibt Unit & Integration Tests
- Testet lokal (Simulator, Emulator, oder real device)
- Testet auf Staging-Server
- Debuggt mit dir Fehler
- Erstellt GitHub Release
- Schreibt Release-Notes und User-Docs

---

## Maturity-Level

Die meisten Projekte starten auf Level 1 oder 2. Mit der Zeit professionalisieren sie sich.

| Level | Name | Beschreibung |
|-------|------|-------------|
| **1** | Manual Notice | Nutzer prüft selbst auf Updates oder wird benachrichtigt. Keine Automation. |
| **2** | Guided | App zeigt Update an mit Dialog. Nutzer lädt herunter, installiert manuell. |
| **3** | Automatic | App lädt & installiert automatisch. Nutzer bestätigt Neustart. |
| **4** | Secure | Mit Code-Signing, Checksums, TLS, Rollback-Funktion. Enterprise-ready. |
| **5** | Enterprise | Lizenzierung, Channels (Beta/Stable), Staged Rollout, Admin Dashboard. |

**Wann welcher Level?**
- Level 1–2: Indie Apps, Early Stage
- Level 3: Reife Apps, viele Nutzer
- Level 4: Sicherheit-sensitiv (Banking, Health, Productivity)
- Level 5: Große Teams, Unternehmen, viele Update-Kanäle

---

## Unterstützte Technologien

| Kategorie | Technologien | Code-Beispiele |
|-----------|-------------|---|
| **Desktop** | Electron, Tauri, Flutter Desktop, WPF (.NET), SwiftUI, Java Swing | ✓ ja |
| **Mobile** | Flutter, React Native, Swift (iOS), Kotlin (Android) | ✓ ja |
| **Web** | React, Vue, Next.js, Nuxt, Svelte, plain HTML/JS | ✓ ja |
| **Backend** | Node.js, Python, Go, Rust, PHP, Java, .NET | ✓ ja |
| **Games** | Unity, Unreal, Godot, HTML5 Games | ✓ ja |
| **SaaS** | Any stack (Update-Server design) | ✓ ja |

Jeder Technologie-Stack hat Template-Code in `examples/` und ein Implementierungs-Template in `templates/`.

---

## Quick Start

### 1. Dieses Repo klonen
```bash
git clone https://github.com/MichaelGahnDESIGN/MGD-Software-Updater-Skill-Assistent.git
cd MGD-Software-Updater-Skill-Assistent
```

### 2. Phase 1 starten
Lese [`wiki/01-Einfuehrung.md`](wiki/01-Einfuehrung.md) und folge den 10 Planungsschritten in [`skill/SKILL.md`](skill/SKILL.md).

```bash
# Checklist ausdrucken
cat checklists/planning-checklist.md
```

### 3. Planung dokumentieren
Speichere deine Planungs-Ergebnisse in:
```
examples/[dein-projekt]/PLAN.md
```

### 4. Agent starten (Phase 2)
```bash
# Mit Claude Code
/software-updater implement

# Mit Cursor/Codex/Windsurf (analog)
```

Der Agent liest deine PLAN.md und schreibt Code.

---

## Wie benutze ich den Skill?

### Mit Claude Code

```
Du: /software-updater analyse

Claude Code:
1. Analysiert dein Projekt
2. Fragt die 10 Planungsschritte
3. Erstellt einen Bericht
4. Sagt: "Bereit für Phase 2?"
```

### Mit Cursor / Windsurf

Analog zu Claude Code — derselbe Skill, same 10 Schritte, andere IDE.

### Als Standalone

Lese `skill/SKILL.md` selbst durch, beantworte die 10 Fragen in einer Datei, und gib sie einem Agent (Claude, ChatGPT mit Codex, Gemini CLI, etc.).

---

## Dateien & Struktur

```
MGD-Software-Updater-Skill-Assistent/
├── README.md                          ← Du liest das gerade
├── LICENSE                             ← MIT
├── IMPRESSUM.md                        ← Kontakt & Datenschutz
├── .gitignore
│
├── skill/
│   └── SKILL.md                        ← Die 10 Planungsschritte + Agent-Regeln
│
├── wiki/
│   ├── 01-Einfuehrung.md               ← Start hier
│   ├── 02-Update-Typen.md
│   ├── 03-Sicherheit.md
│   ├── 04-Datenschutz-DSGVO.md
│   └── ...
│
├── checklists/
│   ├── planning-checklist.md           ← 10 Schritte zum Abhaken
│   ├── security-checklist.md
│   └── release-checklist.md
│
├── examples/
│   ├── flutter-desktop-updater/        ← Flutter Desktop (macOS/Windows/Linux)
│   ├── electron-app-updater/           ← Electron (macOS/Windows/Linux)
│   ├── react-web-updater/              ← Web-App (React)
│   ├── nodejs-backend-updater/         ← Backend (Node.js)
│   └── ...
│
└── templates/
    ├── update-manifest.json            ← JSON-Schema für Update-Info
    ├── update-client.ts                ← TypeScript Update-Client
    ├── update-server.js                ← Node.js Update-Server
    └── ...
```

---

## Verwandte MGD Projekte

| Projekt | Beschreibung | Link |
|---------|-------------|------|
| **MGD Bugreport Skill Assistent** | Strukturiertes Bug-Reporting & Debugging | [github.com/...](https://github.com/MichaelGahnDESIGN) |
| **MGD Testing Skill Assistent** | Test-Strategie & Test-Automatisierung | [github.com/...](https://github.com/MichaelGahnDESIGN) |
| **MGD CI/CD Skill Assistent** | GitHub Actions, GitLab CI, Deployment | [github.com/...](https://github.com/MichaelGahnDESIGN) |
| **MGD Code Review Skill Assistent** | Code-Review Prozesse & Standards | [github.com/...](https://github.com/MichaelGahnDESIGN) |

---

## Lizenz

MIT License. Siehe [`LICENSE`](LICENSE).

---

## Impressum

Angaben gemäß § 5 DDG — Siehe [`IMPRESSUM.md`](IMPRESSUM.md).

---

**Fragen?** Öffne ein Issue auf GitHub oder kontaktiere mich über meine Website [michael-gahn.de](https://michael-gahn.de).
