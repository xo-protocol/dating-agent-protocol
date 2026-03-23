# Contributing to the Dating Agent Protocol

Thank you for your interest in DAP. This document covers how to contribute, propose changes, and report security issues.

---

## How to Contribute

- **Bug reports and feedback**: Open a [GitHub Issue](../../issues)
- **Spec changes**: Submit a Pull Request (see Proposal Process below)
- **Design questions and discussion**: Use [GitHub Discussions](../../discussions)
- **Security vulnerabilities**: See Security Disclosure below (do NOT open public issues)

All contributions are welcome: typo fixes, clarifications, new signal types, implementation guides, SDK improvements, and test cases.

---

## Proposal Process

Spec changes follow a structured process to ensure quality and consensus.

### Minor Changes (typos, clarifications, examples)

1. Open a PR with the fix
2. One maintainer review required
3. Merge

### Spec Changes (new fields, behavior changes, new sections)

1. Open an issue with the **"DAP Proposal"** label
2. Describe the problem, proposed solution, and alternatives considered
3. Community discussion on the issue (minimum 3 business days)
4. Submit a PR referencing the issue
5. Two maintainer reviews required
6. Merge

### Breaking Changes (removing fields, changing semantics, new required behaviors)

1. Open an issue with the **"DAP Proposal"** and **"Breaking Change"** labels
2. Include a formal **RFC** document in the PR under `rfcs/`
3. **2-week comment period** — no merge before the period ends
4. Migration guide required in the RFC
5. Two maintainer approvals + no unresolved objections
6. Merge into the next major version branch

---

## Versioning

DAP uses [Semantic Versioning](https://semver.org/):

- **MAJOR** (v1, v2): Breaking changes to required fields or behaviors
- **MINOR** (v1.1, v1.2): New optional fields, new signal types, new endpoints
- **PATCH** (v1.1.1): Typo fixes, clarifications, non-normative changes

### Current Phase

- **v0.x** = Draft specification. Breaking changes are expected. Implementers should pin to a specific minor version.
- **v1.0** = Stable release. Backward compatibility guaranteed within the major version.

### Schema Versions

All DAP messages include a `schema` field (e.g., `"dap:flow:connection-request:v1"`). The version suffix in the schema field tracks the message format independently of the overall spec version.

---

## Compatibility Policy

| Requirement | Level |
|-------------|-------|
| Support current spec version | **MUST** |
| Support previous minor version | **SHOULD** |
| Adding optional fields to existing messages | Non-breaking |
| Adding new optional endpoints | Non-breaking |
| Adding new enum values to existing enums | Non-breaking |
| Removing or renaming required fields | **Breaking** |
| Changing the semantics of existing fields | **Breaking** |
| Adding new required fields to existing messages | **Breaking** |

Providers implementing DAP **MUST** support the current version and **SHOULD** support one previous minor version to allow consumers time to upgrade.

---

## Security Disclosure

If you discover a security vulnerability in the DAP specification, reference implementation, or SDK:

1. **Email**: [security@xoxo.space](mailto:security@xoxo.space)
2. **Do NOT** open a public GitHub issue
3. Include: description, reproduction steps, potential impact
4. We will acknowledge receipt within 48 hours
5. **90-day disclosure timeline**: We aim to publish a fix within 90 days. After 90 days, the reporter may disclose publicly.

Examples of security issues: authentication bypass in reference implementation, privacy leaks in the consent flow, state machine vulnerabilities allowing gate bypass.

---

## Code of Conduct

This project follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

In short: be respectful, be constructive, be inclusive. DAP is a protocol for human connection — our community should reflect those values.

Report violations to [conduct@xoxo.space](mailto:conduct@xoxo.space).

---

## License

All contributions to DAP are made under the [Apache License 2.0](./LICENSE).

By submitting a pull request, you agree that your contributions will be licensed under Apache 2.0.

---

## Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b proposal/my-change`)
3. Make your changes
4. Run validation if available (`npm test` in `sdk/` or `mock-server/`)
5. Submit a PR following the process above

Questions? Open a Discussion or reach out to the maintainers.
