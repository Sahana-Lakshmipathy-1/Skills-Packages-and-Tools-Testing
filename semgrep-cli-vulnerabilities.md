# Semgrep CLI: How It Works & Vulnerability Coverage

Reference based on Semgrep 1.186.0 and a local `semgrep ci` run against this repo (244 git-tracked files).

---

## What Semgrep is

Semgrep is a **static** security scanner: it analyzes source and dependency metadata **without executing your code**. From the CLI it can run three product areas (what actually runs depends on your Semgrep org entitlements and flags):

| Product | Type | What it looks at |
| --- | --- | --- |
| **Semgrep Code** | SAST | First-party source (patterns, taint, cross-file/function with Pro) |
| **Semgrep Supply Chain** | SCA | Lockfiles / manifests + optional reachability in your code |
| **Semgrep Secrets** | Secrets | Hardcoded credentials, API keys, tokens (if enabled) |

Rules are YAML (or Registry rulesets). A rule encodes a semantic pattern, severity, message, and often a fix or upgrade hint. Same code + same rules → same findings (deterministic).

---

## How the CLI works

### Main commands

| Command | Role |
| --- | --- |
| `semgrep scan` | Local / ad-hoc scans. Pick configs yourself (`--config p/default`, custom YAML). Good for rule authoring. |
| `semgrep ci` | Org / CI mode. Pulls **policies & rules** from Semgrep AppSec Platform when logged in; uploads findings; can fail CI on **blocking** findings. |
| `semgrep login` / `logout` | Store credentials for `semgrep.dev`. |
| `semgrep install-semgrep-pro` | Install Pro engine (cross-file / interprocedural analysis). |
| `semgrep lsp` | Language server for IDE integrations. |

Useful product filters for CI:

```bash
semgrep ci                 # all enabled products for the org
semgrep ci --code          # SAST only
semgrep ci --supply-chain  # SCA only
semgrep ci --secrets       # Secrets only
```

### What happens during `semgrep ci` (from this run)

Rough pipeline matching the terminal output:

1. **Connect** — Talks to your deployment (`deployment=sahana-l-1cloudhub-com`), creates a `scan_id`, loads enabled products (here: **Supply Chain** + **Code**).
2. **Engine** — May download/install **Semgrep Pro Engine** once; then loads rules (Pro + Community).
3. **Target selection** — By default scans **git-tracked** files only; respects `.semgrepignore` / exclude patterns.
4. **Language routing** — Detects languages and only runs matching rules (e.g. TS, Python, JSON, HTML, multilang).
5. **Code analysis** — Pattern / taint matching against source.
6. **Supply Chain analysis** — Parses lockfiles (here `package-lock.json`), resolves npm dependency graph, matches CVE/GHSA advisories; optionally checks **reachability** (does your code call the vulnerable API?).
7. **Upload & policy** — Sends results to Semgrep Cloud; applies org **blocking vs non-blocking** policy; exit code 0 if no blocking findings.

### Scan stats from this repo’s run

| Metric | Value |
| --- | --- |
| Semgrep version | 1.186.0 (Python 3.12.3) |
| Files scanned | 244 (git-tracked) |
| Code rules | ~2,972 (Pro ~1,897 + Community ~1,075) |
| Supply Chain rules | ~94,934 |
| Dependencies (npm via lockfile) | 152 |
| Findings | 4 total, **0 blocking** → exit 0 |
| Skipped | `.semgrepignore` + exclude patterns |

---

## Finding types Semgrep reports

### 1. Code findings (SAST)

Matches insecure **patterns in your source**. Severity and whether they **block CI** come from rule metadata + org policy.

Common categories (OWASP / CWE-aligned; Semgrep Registry + Pro rulesets):

| Category | Examples of what rules look for |
| --- | --- |
| **SQL injection** | String-built / tainted queries into DB APIs |
| **Command injection** | User input into `exec`, `spawn`, shells |
| **Code / eval injection** | `eval`, dynamic `Function`, unsafe templates |
| **LDAP / NoSQL / XPath injection** | Unescaped input in directory or query filters |
| **XSS** | Unsanitized data into HTML / DOM sinks |
| **SSRF** | User-controlled URLs into server-side HTTP clients |
| **Path traversal** | User paths into `fs` / file APIs without normalization |
| **Open redirect** | User-controlled redirect targets |
| **Insecure deserialization** | Unsafe `pickle`, `yaml.load`, unserialize of untrusted data |
| **XXE / XML issues** | Parsers that resolve external entities |
| **IDOR / broken authz** | (Pro / AI-assisted coverage) missing object-level checks |
| **Crypto / secrets misuse** | Weak algorithms, hardcoded crypto keys, insecure TLS |
| **Dangerous APIs** | Unsafe React `dangerouslySetInnerHTML`, debug endpoints left on |
| **Prototype pollution / ReDoS patterns** | Risky merges, catastrophic regex |

Rulesets people commonly use with `semgrep scan`:

- `p/owasp-top-ten`
- `p/cwe-top-25`
- `p/sql-injection`, XSS / framework-specific rulesets
- Org policy packs (what `semgrep ci` uses when logged in)

**Note on false positives:** Rules are pattern-based. Example from this scan: `re.search(rf"...")` in `validate_data.py` was flagged as **LDAP injection** — same “string interpolation into a filter-like pattern” heuristic, not necessarily real LDAP usage. Triage in the platform or with `nosemgrep` comments when intentional.

### 2. Supply Chain findings (SCA)

From lockfiles / manifests (npm, pip, etc.):

| Finding style | Meaning |
| --- | --- |
| **Reachable** | Vulnerable package version **and** code pattern suggests the vulnerable path is used |
| **Unreachable** | Vulnerable version present, but vulnerable API/path not used (still often worth upgrading) |
| **Undetermined / no reachability analysis** | Known CVE/GHSA on the version; Semgrep has no (or incomplete) reachability rule |
| **Malicious package** | Known malicious / typosquat-style dependency signals |
| **License** | (When enabled) license policy violations |

Typical issue classes in SCA:

- Memory safety in native/transitive libs (e.g. Brotli OOB write)
- ReDoS / inefficient regex in JS libs
- Prototype pollution, XSS helpers, path traversal in popular packages
- Auth/crypto bugs in frameworks once a fixed version exists

Upgrade guidance is usually “fixed at version X” in the finding.

### 3. Secrets findings (if enabled)

Not present in this particular run (Secrets product was not listed under Enabled products), but Semgrep Secrets typically covers:

- Cloud API keys (AWS, GCP, Azure)
- GitHub / GitLab / Slack / Stripe tokens
- Private keys / certificates
- Generic high-entropy secrets with validators

---

## Findings from this repo’s `semgrep ci` (concrete examples)

### Supply Chain

1. **`playwright-core` — GHSA-cust-0000-0034 (HIGH, Reachable)**  
   Bundled/native Brotli decoder OOB write; decoding attacker-controlled Brotli data can lead to DoS / disclosure / RCE. Fix: upgrade `playwright-core` to the version Semgrep reports as fixed.

2. **`picomatch` — CVE-2026-112366 (HIGH, Undetermined)**  
   Inefficient regex complexity (ReDoS-class). Present via lockfile; reachability not fully determined. Fix: upgrade `picomatch` to the fixed version.

### Code (non-blocking)

3–4. **LDAP injection rule** on duplicated skill scripts:  
   - `.agents/skills/ui-ux-pro-max/scripts/validate_data.py:866`  
   - `.cursor/skills/ui-ux-pro-max/scripts/validate_data.py:866`  

   Pattern: `re.search(rf"\b{re.escape(header)}\b", ...)`. Likely a **false positive** for LDAP (regex, not LDAP filter), but shows how Code rules fire on string-built “filter” style constructions.

---

## Blocking vs non-blocking

- Org **policies** mark rules as Block / Monitor / Comment / Disabled.
- `semgrep ci` **fails the process** when there are **blocking** findings (this run: 0 blocking → exit 0).
- Supply Chain and Code findings can both be blocking depending on severity thresholds you configure in the AppSec Platform.

Dashboard links from this scan:

- Code: [Findings](https://semgrep.dev/orgs/sahana-l-1cloudhub-com/findings?repo=local_scan/code%20best%20patterns&ref=main)
- SCA: [Supply Chain](https://semgrep.dev/orgs/sahana-l-1cloudhub-com/supply-chain/vulnerabilities?repo=local_scan/code%20best%20patterns&ref=main)

---

## Practical mental model

```
Your repo (git-tracked files + lockfiles)
        │
        ▼
   Semgrep CLI (scan | ci)
        │
        ├── Code rules ──────► SAST findings (injection, XSS, SSRF, …)
        ├── SCA rules ───────► CVE/GHSA on deps (+ reachability)
        └── Secrets rules ───► leaked credentials (if enabled)
        │
        ▼
   Local report + (ci) upload to Semgrep Cloud
        │
        ▼
   Policy: blocking? → CI fail / pass
```

**Bottom line:** Semgrep CLI is a rule-driven static analyzer. **Code** finds insecure coding patterns in your source; **Supply Chain** finds known-vulnerable (and sometimes malicious) dependencies and whether you reach them; **Secrets** finds leaked credentials. Coverage grows with the rulesets and Pro engine your account enables—not with a single fixed checklist.

---

## Quick commands

```bash
# Org policy scan (what you ran)
semgrep ci

# Local default rules without org upload
semgrep scan --config auto

# Focused local rulesets
semgrep scan --config "p/owasp-top-ten"
semgrep scan --config "p/sql-injection"

# Export
semgrep ci --json --json-output=semgrep.json
semgrep ci --sarif --sarif-output=semgrep.sarif
```

Further reading: [Introduction](https://docs.semgrep.dev/introduction) · [CLI reference](https://docs.semgrep.dev/cli-reference) · [Supply Chain overview](https://docs.semgrep.dev/semgrep-supply-chain/overview) · [Vulnerability categories](https://docs.semgrep.dev/learn/vulnerabilities/overview)
