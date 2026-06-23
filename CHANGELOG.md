# Changelog

All notable changes to the MGD Software Updater Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-06-23

### Added
- HTTPS URL validation for manifest and download URLs
- `validateManifestUrl()` method to enforce secure transport
- `package.json.example` for project setup
- `CHANGELOG.md` for version tracking
- `SECURITY.md` with vulnerability disclosure policy
- `tsconfig.json` for TypeScript compilation settings
- `.github/workflows/lint.yml` for CI/CD linting
- JSDoc comments for improved code documentation
- Exponential backoff retry logic for downloads
- Automatic cleanup on download failures

### Changed
- Updated email contact references to website links (michael-gahn.de)
- Enhanced security documentation in Wiki
- Improved error handling in update client

### Fixed
- Email address exposure in public repositories
- Missing protocol validation for URLs
- Incomplete TypeScript configuration

### Security
- Enforce HTTPS-only manifest and download URLs
- Validate all external resource URLs before use
- Improved error messages for security violations

---

## [1.0.0] - 2024-06-20

### Added
- Initial release of MGD Software Updater Skill Assistent
- 10-step planning methodology for update systems
- 5 Maturity Levels (Manual to Enterprise)
- Comprehensive Wiki with platform-specific guides
- Examples for Electron, Flutter, React Native, Swift, Tauri, and more
- TypeScript update client template
- JSON manifest format specification
- Checklists for planning and security audits
- Support for Desktop, Mobile, Web, Backend, and Game platforms

### Features
- Technology-agnostic approach
- Two-phase workflow (Plan → Implement)
- Security-focused best practices
- DSGVO/GDPR compliance guidance
- Testing and deployment strategies

---

## Note on Versions

- **v1.0.0**: Foundation release with complete planning framework
- **v1.1.0**: Security audit and hardening release

For detailed implementation guides, see the [Wiki](wiki/) directory.
For security concerns, see [SECURITY.md](SECURITY.md).
