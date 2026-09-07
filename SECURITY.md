# Security

Use the latest published version of LaunchPad with a current stable Chrome. This extension replaces the new-tab page and makes the source requests described in [PRIVACY.md](PRIVACY.md).

## Reporting a vulnerability

Do not post credentials, personal browsing data or a working exploit against another person's installation in a public issue. Use GitHub's private vulnerability reporting feature if it is enabled for this repository. Otherwise open an issue requesting a private contact channel without including sensitive details.

Include the affected version, browser/OS, the relevant component and a minimal reproduction using test data. No response-time or supported-old-version guarantee is implied.

## Boundaries

- Remote content is parsed as data; script elements are not executed or inserted into the live page.
- The background worker validates request type, source URL and extension sender. Preview requests additionally require the chosen origin's permission.
- Preview redirects are rejected, credentials are omitted and request bodies are limited while streaming. Feed redirects must resolve to their allowed source policies.
- User-entered launch targets accept HTTP(S) without embedded username/password credentials. Other schemes are not opened as shortcuts.
- No runtime code is fetched from a CDN; the release archive uses a runtime file allowlist.

A source can be unavailable, change its markup or return inaccurate content. Source availability, keyword matching and ranking scores are not security or research-quality guarantees.
