# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the MGD Software Updater Skill or its templates, please report it responsibly.

### Reporting Process

1. **Do NOT open a public GitHub issue** for security vulnerabilities
2. Send an email to the contact listed in [IMPRESSUM.md](IMPRESSUM.md) with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if applicable)

3. Allow **7-14 days** for a response and patch development
4. Credit will be given upon public disclosure (with your permission)

### Response Timeline

- **Day 1**: Acknowledgment of report
- **Day 3-5**: Initial assessment and triage
- **Day 7-14**: Fix development and testing
- **Day 14+**: Public disclosure and release of patched version

---

## Security Best Practices

### For Users of This Skill

When implementing update systems based on this Skill:

1. **Always use HTTPS** for manifest and download URLs (enforced in v1.1.0+)
2. **Validate checksums** before installation (SHA256 minimum)
3. **Sign your releases** (Code-signing for Level 4+ maturity)
4. **Test thoroughly** on staging before production rollout
5. **Monitor downloads** and crash rates post-release
6. **Keep backups** of previous versions for rollback
7. **Audit logs** for update transactions
8. **Encrypt sensitive data** in transit and at rest

### For this Repository

- All external URLs enforce HTTPS protocol validation
- Manifest JSON structure is validated before processing
- Checksums are verified against expected hashes
- No sensitive credentials are stored in templates
- Code examples follow security best practices

---

## Known Limitations

### v1.1.0

- URL validation checks protocol only (not DNS rebinding attacks)
- Checksum verification uses SHA256 (SHA-512 recommended for Level 5)
- Certificate pinning not yet implemented (recommended for Level 4+)
- No automatic rollback on failure (manual intervention required)

### Roadmap (Future Versions)

- [ ] Certificate pinning support
- [ ] Automatic rollback decision logic
- [ ] Multi-signature support
- [ ] Update encryption
- [ ] Rate limiting and DDoS protection
- [ ] Audit log encryption

---

## Compliance

This Skill addresses requirements for:

- **OWASP**: Secure coding practices
- **DSGVO/GDPR**: Data protection guidelines (see `wiki/08-DSGVO-Datenschutz.md`)
- **BSI**: German security standards
- **PCI DSS**: If handling payment-related updates

For specific compliance needs, consult the relevant documentation in `/wiki`.

---

## Version History

| Version | Security Updates |
|---------|------------------|
| v1.0.0  | Initial release, baseline security |
| v1.1.0  | HTTPS validation, error handling, documentation |

---

## Contact

For security questions or vulnerabilities, see [IMPRESSUM.md](IMPRESSUM.md).

**Last Updated:** 2026-06-23  
**License:** MIT
