# Repository Structure

**MGD Software Updater Skill Assistent** — Complete File & Folder Reference

---

## Root Level Files

| File | Purpose |
|------|---------|
| **README.md** | Main entry point — What is this project? |
| **skill/SKILL.md** | Core skill definition — 10 planning steps + agent rules |
| **LICENSE** | MIT License |
| **IMPRESSUM.md** | Legal / Contact info |
| **.gitignore** | Git ignore rules |
| **STRUCTURE.md** | This file |

---

## `/skill` — Skill Definition

Contains the complete skill specification for KI agents.

| File | Purpose |
|------|---------|
| **SKILL.md** | 10 planning steps, maturity levels, agent rules, security guidelines |

This is the **core document** that defines how the skill works.

---

## `/wiki` — Documentation & Guides

Educational content for learning about update systems.

| File | Purpose |
|------|---------|
| **01-Einfuehrung.md** | Start here — Introduction to update systems |
| **02-Maturity-Levels.md** | Deep dive into Levels 1–5 |
| **03-Desktop-Updates.md** | Desktop-specific (Electron, Tauri, Flutter) |
| **04-Mobile-Updates.md** | Mobile-specific (iOS, Android, Flutter Mobile) |
| **05-Web-Updates.md** | Web-specific (React, Vue, SPA) |
| **06-Backend-Updates.md** | Backend-specific (Node.js, Python, Go, Docker) |
| **07-Sicherheit.md** | Security deep-dive (Code-Signing, Checksums, TLS) |
| **08-DSGVO-Datenschutz.md** | Privacy & compliance (GDPR, CCPA) |

**Reading order:**
1. README.md (overview)
2. wiki/01-Einfuehrung.md (intro)
3. skill/SKILL.md (planning steps)
4. Wiki articles for your tech stack

---

## `/examples` — Project Templates

Real-world examples for different platforms.

| File | Purpose |
|------|---------|
| **electron-app.md** | Electron desktop app update plan |
| **flutter-desktop-macos.md** | Flutter macOS app |
| **flutter-desktop-windows.md** | Flutter Windows app |
| **flutter-mobile.md** | Flutter iOS + Android |
| **swift-macos.md** | Native Swift macOS |
| **swift-ios.md** | Native Swift iOS (App Store) |
| **kotlin-android.md** | Kotlin Android (Google Play) |
| **tauri-app.md** | Tauri desktop app |
| **react-spa.md** | React Single Page App |
| **vue-ssr.md** | Vue SSR application |

**How to use:**
1. Find your tech stack (e.g., `electron-app.md`)
2. Copy to `examples/my-project/PLAN.md`
3. Customize the 10 planning steps
4. Agent reads your PLAN.md for Phase 2

---

## `/templates` — Code Templates

Ready-to-use code snippets & configurations.

| File | Purpose |
|------|---------|
| **update-manifest.json** | JSON schema for update info |
| **update-client-typescript.ts** | TypeScript/JS update client |
| (more templates coming) | Other languages & frameworks |

**How to use:**
1. Copy template file
2. Customize for your project
3. Integrate into your app
4. Use with agent implementation

---

## `/checklists` — Verification Lists

Checklists to verify planning & security.

| File | Purpose |
|------|---------|
| **planning-checklist.md** | Verify all 10 planning steps |
| **security-checklist.md** | Security audit before release |

**How to use:**
1. After Phase 1: Use `planning-checklist.md`
2. Before release: Use `security-checklist.md`
3. Check off each item
4. Get approval before Phase 2

---

## Workflow — From Planning to Implementation

```
START
  │
  ├─→ Read: README.md
  ├─→ Read: wiki/01-Einfuehrung.md
  │
  └─→ PHASE 1: PLANNING
      │
      ├─→ Find your tech: examples/[your-stack].md
      ├─→ Copy to: examples/my-project/PLAN.md
      ├─→ Follow: skill/SKILL.md (10 steps)
      ├─→ Verify: checklists/planning-checklist.md
      │
      └─→ Agent: /software-updater checklist
          │
          └─→ PHASE 2: IMPLEMENTATION
              │
              ├─→ Agent reads: examples/my-project/PLAN.md
              ├─→ Agent uses: templates/* (code templates)
              ├─→ Agent generates code
              ├─→ Agent tests locally
              ├─→ Agent tests on staging
              │
              └─→ Before Release
                  │
                  ├─→ Verify: checklists/security-checklist.md
                  ├─→ Agent creates: GitHub Release
                  ├─→ Agent deploys: to CDN/Server
                  │
                  └─→ RELEASE LIVE
                      │
                      └─→ Monitor & Support
```

---

## File Size Reference

| Category | Files | Total |
|----------|-------|-------|
| Documentation | README, SKILL, Wiki (8) | ~25 KB |
| Examples | 10 project templates | ~5 KB |
| Templates | Code snippets | ~15 KB |
| Checklists | Planning, Security | ~10 KB |
| Other | License, Impressum, .gitignore | ~5 KB |
| **Total** | **~30 files** | **~60 KB** |

---

## How to Navigate

**If you want to...**

- **Understand what this is:** → `README.md`
- **Learn about update systems:** → `wiki/01-Einfuehrung.md`
- **See 10 planning steps:** → `skill/SKILL.md`
- **Find your tech stack:** → `examples/[your-stack].md`
- **Copy planning template:** → `examples/[your-stack].md` → `examples/my-project/PLAN.md`
- **Verify planning:** → `checklists/planning-checklist.md`
- **Get code templates:** → `templates/` (update-manifest.json, update-client-typescript.ts)
- **Audit security:** → `checklists/security-checklist.md` + `wiki/07-Sicherheit.md`
- **Start implementation:** → `Agent: /software-updater implement`

---

## Git Commits

```
7b7569a v1.0: MGD Software Updater Skill Assistent — Initial Setup
         - README, SKILL.md, templates, examples, wiki, checklists
         - 30 files, ~60 KB total
         
6be3e3b Add security checklist and TypeScript update client template
         - security-checklist.md
         - update-client-typescript.ts
         - Additional wiki & examples
```

---

## Contributing

To add your own update template:

1. Create `examples/my-project/PLAN.md`
2. Follow the 10 planning steps from `skill/SKILL.md`
3. Document your architecture
4. Share your experience

---

**Version:** 1.0  
**Last Updated:** 2024-06-20  
**License:** MIT  

For questions: `Anfrage@Michael-Gahn.de`
