# RefugeeID Platform

A decentralized identity infrastructure for refugees and displaced persons using W3C Verifiable Credentials. Four completely separate portals — Holder Wallet, Issuer Portal, Verifier Console, Admin Panel — each with its own login, UX, and color system, all sharing a Supabase backend.

## Run & Operate

- `pnpm --filter @workspace/refugeeid run dev` — run the frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + wouter (routing) + Tailwind CSS + shadcn/ui
- Backend: Supabase (auth, database, RPC functions) + Express 5 (health check)
- Animations: framer-motion
- QR codes: qrcode.react

## Where things live

- `artifacts/refugeeid/src/lib/supabase.ts` — Supabase client (reads VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- `artifacts/refugeeid/src/lib/auth.tsx` — AuthProvider + useAuth hook with role-based routing
- `artifacts/refugeeid/src/lib/types.ts` — TypeScript types matching the Supabase DB schema
- `artifacts/refugeeid/src/pages/PortalSelector.tsx` — Landing page (/)
- `artifacts/refugeeid/src/pages/AuthPage.tsx` — Shared auth page for all portals (/auth)
- `artifacts/refugeeid/src/pages/wallet/` — Holder Wallet portal (/wallet)
- `artifacts/refugeeid/src/pages/issuer/` — Issuer Portal (/issuer)
- `artifacts/refugeeid/src/pages/verifier/` — Verifier Console (/verifier)
- `artifacts/refugeeid/src/pages/admin/` — Admin Panel (/admin)
- `artifacts/refugeeid/src/components/RoleGate.tsx` — Role-based access guard
- `artifacts/refugeeid/src/components/PortalLayout.tsx` — Shared desktop sidebar layout
- `artifacts/refugeeid/src/components/WalletLayout.tsx` — Mobile-first wallet shell

## Architecture decisions

- **Supabase-direct frontend**: All data access goes through Supabase (no custom Express routes needed for the frontend). The Express API server is retained for future backend-specific needs.
- **4 isolated portals, 1 artifact**: Each portal (/wallet, /issuer, /verifier, /admin) is a completely separate UX experience within one React app — different layout, color system, and navigation — sharing only auth context and the Supabase client.
- **Role-based access**: Supabase RLS + user_roles table controls access. `<RoleGate role="...">` guard component redirects unauthorized users.
- **Anon key only**: The frontend uses the Supabase anon key (public, safe for browsers). Admin operations (grant/revoke roles) go through Supabase RPC functions with server-side RLS checks.
- **Holder signup auto-grants holder role**: Regular sign-up always creates a holder. Issuer/verifier/admin roles must be explicitly granted by an admin through the Admin Panel.

## Product

- **Holder Wallet** (`/wallet`): Mobile-first wallet for displaced persons. Claim credentials via 8-char code from issuer, view credentials, share via QR code.
- **Issuer Portal** (`/issuer`): Desktop console for UNHCR/NGO staff. Multi-step credential issuance form, view issued credentials, revoke credentials.
- **Verifier Console** (`/verifier`): Desktop console for banks/schools/border control. Verify credentials via QR/code/NFC simulation, view verification history.
- **Admin Panel** (`/admin`): User management and role provisioning. Grant/revoke issuer, verifier, admin roles.

## Demo Credentials (seeded in Supabase)

| Role | Email | Password |
|------|-------|----------|
| Holder | holder@refugeeid.test | Holder!2026 |
| Issuer | issuer@refugeeid.test | Issuer!2026 |
| Verifier | verifier@refugeeid.test | Verifier!2026 |
| Admin | admin@refugeeid.test | Admin!2026 |

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The Supabase anon key is public (safe for frontend) — stored as `VITE_SUPABASE_ANON_KEY` env var
- `admin_list_users()` RPC requires the caller to have the 'admin' role (enforced by Supabase RLS)
- `claim_credential(_code)` marks the credential as claimed and links it to the calling user
- Self-signup never escalates beyond 'holder' — privileged roles require admin grant

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Supabase project: hwvmqxyufqijjvnpnpue.supabase.co
