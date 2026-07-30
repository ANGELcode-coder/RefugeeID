# RefugeeID — OWASP Top 10 Security Audit

**Date:** July 29, 2026
**Scope:** Web frontend (`artifacts/refugeeid`), API server (`artifacts/api-server`), shared libraries
**Methodology:** Static code analysis against OWASP Top 10 (2021)

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| **HIGH** | 8 | Missing RLS policies; client-side role bypass; direct Supabase writes; biometric data in plaintext; no password policy; no brute-force protection; exposed credentials; rejected face verification in claim flow |
| **MEDIUM** | 11 | `Math.random()` for claim codes; no rate limiting; error message leakage; permissive CORS; no security headers; CDN-loaded models without SRI; account enumeration; no CI/CD; session in localStorage |
| **LOW** | 5 | Vite `allowedHosts: true`; debug plugin in production; XSS potential in `face_image_url`; mismatched face-api versions |

---

## A01: Broken Access Control — HIGH

**1. Missing RLS Policies**
All frontend pages query Supabase directly with the anon key. No RLS policy files were found in the repo. Without RLS, any authenticated user can read/write any row in any table.
→ Fix: Implement RLS on `issued_credentials`, `user_roles`, `profiles`, `verification_logs`.

**2. RoleGate is client-side only**
`RoleGate.tsx` checks roles in React state — trivially bypassable.
→ Fix: Treat RoleGate as UX only; enforce all auth server-side.

**3. Credential claiming bypasses API**
`RecoverID.tsx` updates `issued_credentials` directly from the browser, skipping the API server's face verification check.
→ Fix: Remove client-side claim update; route all claims through API server.

**4. Admin RPCs exposed to client**
Admin operations called directly from browser — if Supabase RPCs don't verify admin role server-side, privilege escalation is possible.
→ Fix: Ensure admin RPCs are `security definer` with role checks.

---

## A02: Cryptographic Failures — HIGH

**1. Credentials in `.env` files committed**
Supabase URL and anon key hardcoded in two `.env` files in the repository.
→ Fix: Add `.env` to `.gitignore`; use deploy-time env vars only.

**2. Biometric data in plaintext**
Face embeddings (128-dim float arrays) stored as JSON strings in `face_embedding` column without encryption.
→ Fix: Encrypt at rest via `pgcrypto` or app-level encryption.

**3. Sessions in localStorage**
JWT tokens persisted in `localStorage` — accessible to any JS on the origin.
→ Fix: Use `httpOnly` cookies or add CSP to mitigate XSS exposure.

**4. `Math.random()` for claim codes**
Claim codes use `Math.random()` — predictable in some JS engines.
→ Fix: Replace with `crypto.getRandomValues()`.

---

## A03: Injection — MEDIUM

**1. Error messages leaked**
All API catch blocks return `err.message` to the client, leaking internals.
→ Fix: Log full error server-side; return generic message.

**2. XSS vector in `face_image_url`**
Rendered in `<img src>` without validation.
→ Fix: Validate URL is HTTPS before rendering; add CSP.

**No SQL injection** — Supabase client + Zod validation prevent this.

---

## A04: Insecure Design — HIGH

**1. No rate limiting**
Claim/verify endpoints have no rate limiting — brute-force of 8-char codes is feasible.
→ Fix: Add `express-rate-limit` on all endpoints.

**2. No proof of code possession**
Claim endpoint accepts code + user_id without proof the requester is the intended recipient.
→ Fix: Add cryptographic challenge or other proof mechanism.

**3. 30-char alphabet, 8-char codes**
~656 billion combinations, but `Math.random()` + no rate limiting weakens this.
→ Fix: Longer codes + `crypto.getRandomValues()` + rate limiting.

---

## A05: Security Misconfiguration — MEDIUM

**1. CORS allows all origins**
`app.use(cors())` with no config — `Access-Control-Allow-Origin: *`.
→ Fix: Restrict to specific origins.

**2. No security headers**
No `helmet` middleware — missing `X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `HSTS`.
→ Fix: Add `helmet` to Express app.

**3. No HTTPS enforcement**
All traffic over plain HTTP.
→ Fix: Terminate TLS at proxy; add HSTS header.

---

## A06: Vulnerable Components — MEDIUM

**1. CDN-loaded ML models without SRI**
Face-api models loaded from `vladmandic.github.io` with no integrity check.
→ Fix: Bundle models locally or verify SHA hashes.

**2. Mismatched face-api versions**
Frontend uses `^1.7.15`, API server uses `^1.1.12`.
→ Fix: Align versions.

**Positive:** pnpm `minimumReleaseAge: 1440` prevents supply-chain attacks from recent malicious packages.

---

## A07: Authentication Failures — HIGH

**1. No password policy**
Sign-up accepts any input; no minimum length/complexity.
→ Fix: Enforce 12+ char minimum with complexity; configure Supabase auth settings.

**2. No brute-force protection**
Unlimited auth attempts via Supabase.
→ Fix: Client-side exponential backoff; enable Supabase CAPTCHA.

**3. Account enumeration**
Sign-up reveals if email is registered.
→ Fix: Return generic message regardless.

---

## A08: Integrity Failures — LOW

**1. No CI/CD pipeline**
No automated security checks (SAST, dependency scanning, secret detection).
→ Fix: Add GitHub Actions with `pnpm audit`, CodeQL, secret scanning.

---

## A09: Logging & Monitoring — MEDIUM

**1. No server-side audit logging**
Sensitive operations (claims, verifications, role changes) not logged server-side.
`verification_logs` table is populated from the frontend — logs can be forged.
→ Fix: Move logging to API server; log with user ID, IP, timestamp.

**2. Frontend errors invisible**
`console.error()` only — no monitoring.
→ Fix: Add Sentry or similar error tracking.

---

## A10: SSRF — LOW

**No SSRF vectors found.** The only external fetch is the hardcoded face-api model URL, which is not user-controllable. Fix by bundling models locally.

---

## Priority Action Items

| # | Action | Severity | Effort |
|---|--------|----------|--------|
| 1 | Implement Supabase RLS policies on all tables | HIGH | 2 days |
| 2 | Block client-side credential claiming; route through API | HIGH | 1 day |
| 3 | Add rate limiting to all API endpoints | HIGH | 0.5 day |
| 4 | Replace `Math.random()` with `crypto.getRandomValues()` | MEDIUM | 0.5 day |
| 5 | Add Helmet + restrict CORS on API server | MEDIUM | 0.5 day |
| 6 | Move sensitive operations behind API server with role checks | HIGH | 3 days |
| 7 | Remove `.env` from git; rotate exposed keys | HIGH | 0.5 day |
| 8 | Add server-side audit logging | MEDIUM | 1 day |
| 9 | Enforce password policy + brute-force protection | HIGH | 1 day |
| 10 | Encrypt face embeddings at rest | HIGH | 1 day |
