# RefugeeID — User Guide

> A decentralized identity platform for refugees and displaced persons. Four portals — Holder Wallet, Issuer Portal, Verifier Console, Admin Panel.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Portal 1: Holder Wallet](#portal-1-holder-wallet)
- [Portal 2: Issuer Portal](#portal-2-issuer-portal)
- [Portal 3: Verifier Console](#portal-3-verifier-console)
- [Portal 4: Admin Panel](#portal-4-admin-panel)
- [Mobile Wallet App](#mobile-wallet-app)
- [FAQs](#faqs)

---

## Getting Started

### Accessing the Platform

**Web App:** Open the deployed URL in your browser. You'll see the Portal Selector screen.

**Mobile App:** Install the RefugeeID Wallet app on your Android or iOS device (see [Mobile Wallet App](#mobile-wallet-app) section).

### Creating an Account

1. Click **"Get Started"** or navigate to `/auth`
2. Select the **"Sign Up"** tab
3. Enter your email address and a password (minimum 6 characters)
4. Click **"Create Account"**
5. You are automatically signed in as a **Holder** and redirected to the Wallet

> New accounts always receive the "holder" role. To get issuer, verifier, or admin access, an existing admin must grant it through the Admin Panel.

### Demo Accounts

For testing, use these pre-seeded accounts:

| Role | Email | Password |
|------|-------|----------|
| Holder | `holder@refugeeid.test` | `Holder!2026` |
| Issuer | `issuer@refugeeid.test` | `Issuer!2026` |
| Verifier | `verifier@refugeeid.test` | `Verifier!2026` |
| Admin | `admin@refugeeid.test` | `Admin!2026` |

On the sign-in page, click the one-click fill buttons to auto-fill these credentials.

---

## Portal 1: Holder Wallet

The Holder Wallet is a mobile-first interface for displaced persons to claim, view, and share credentials.

### 1.1 Dashboard

After signing in, you land on your Wallet Home. Here you can:

- **View your credentials** — All claimed credentials are listed as cards. Each card shows the holder's name, status badge (Active/Revoked), and a quick summary.
- **See your DID** — Your decentralized identifier is displayed at the top for reference.
- **Refresh credentials** — Pull down to sync the latest data from the server.

### 1.2 Claiming a Credential

When an issuer gives you an 8-character claim code:

1. Click the **"Claim Credential"** button
2. Enter the 8-character code (case-insensitive)
3. Click **"Claim"**
4. If the credential has face biometrics, a face verification step will appear — position your face in the camera and follow the prompt
5. On success, the credential appears in your wallet

### 1.3 Viewing Credential Details

Tap any credential card to see:

- Full identity details (name, DOB, nationality, case number)
- Issuer information
- Face photo (if enrolled)
- Credential status (Active / Revoked)
- QR code for sharing

### 1.4 Sharing a Credential

From the credential detail screen:

- **QR Code** — A scannable QR code is displayed. Any verifier can scan this to confirm the credential's authenticity.
- **Copy DID** — Copy your decentralized identifier to share via messaging apps.
- **Share via system** — Use your device's native share sheet.

All sharing actions are recorded in your Share History.

### 1.5 Recovering a Credential

If you lose access to your wallet:

1. Go to the **Recover** tab
2. Choose **"Automatic Restore"** to reload credentials from the server, or
3. Enter a claim code provided by your issuer to re-claim a credential

### 1.6 Settings

Access the **Settings** tab to:

| Option | Description |
|--------|-------------|
| Profile | View your DID and email |
| Theme | Toggle between Light, Dark, and System themes |
| Font Size | Choose Small, Normal, or Large |
| Language | Select English, French, Arabic, or Swahili |
| Biometric Lock | Enable Face ID / fingerprint to lock the app |
| PIN Setup | Set a 6-digit PIN as backup for biometrics |
| Share History | View all past sharing actions with timestamps |
| Erase All Data | Clear all local data and cached credentials |
| Sign Out | End your session |

---

## Portal 2: Issuer Portal

The Issuer Portal is a desktop console for UNHCR and NGO staff to create and manage credentials.

### 2.1 Issuing a New Credential

The issuance process has **5 steps**:

#### Step 1: Identity Details

Fill in the beneficiary's information:

| Field | Required |
|-------|----------|
| Given Name | Yes |
| Family Name | Yes |
| Date of Birth | Yes |
| Gender | Yes |
| Nationality | Yes |
| Case Number | Yes |
| Arrival Site | No |

#### Step 2: Review Details

Double-check all entered information. Click **"Back to Edit"** to make changes or **"Next: Capture Face"** to proceed.

#### Step 3: Capture Beneficiary Face

- Position the beneficiary's face in the camera frame
- The system captures a face embedding (biometric template)
- This step is optional — you can skip face capture if biometrics are not needed

#### Step 4: Confirm Face & Issue

- Review the captured face photo alongside the identity details
- Click **"Issue Credential"** to complete the process

#### Step 5: Credential Issued

Success screen showing:

- A green checkmark confirmation
- The **8-character claim code** (displayed prominently)
- A **QR code** containing the claim code
- **"Copy Code"** button to clipboard
- **"Issue Another"** button to start over

> The claim code expires in 30 minutes. Share it with the beneficiary securely (in person, printed, or via QR code).

### 2.2 Viewing Issued Credentials

The **"Credentials Issued"** page shows a table of all credentials you've created, including:

- Name, case number, status
- Claim status (claimed / unclaimed)
- Face verification status
- Issue date

### 2.3 Revoking a Credential

1. Find the credential in the list
2. Click the **"Revoke"** button
3. Confirm the action
4. The credential's status changes to `revoked` immediately

> Revoked credentials cannot be reclaimed. The holder's wallet will show the updated status on next sync.

### 2.4 Trust Registry

Manage trusted issuers and DIDs. This registry determines which issuers' credentials are considered valid by verifiers.

---

## Portal 3: Verifier Console

The Verifier Console is a desktop interface for banks, schools, and border control to verify credentials.

### 3.1 Verifying a Credential

You can verify a credential in three ways:

#### Method 1: Scan QR Code
1. Click **"Scan QR"**
2. Allow camera access when prompted
3. Point the camera at the holder's QR code
4. The credential details appear automatically

#### Method 2: Enter Code
1. Click **"Enter Code"**
2. Type the 8-character claim code manually
3. Click **"Verify"**
4. The credential details appear

#### Method 3: Upload QR Image
1. Click **"Upload QR"**
2. Select an image file containing a QR code
3. The system reads the code and displays the credential

### 3.2 Verification Results

After a successful lookup, you see:

| Field | Description |
|-------|-------------|
| Credential Status | Active or Revoked |
| Holder Name | Given and family name |
| Date of Birth | As recorded in the credential |
| Nationality | Holder's nationality |
| Case Number | Refugee case reference |
| Face Photo | If enrolled and visible |
| Issuer | Organization that issued the credential |
| Issuance Date | When the credential was created |

**Face Verification (optional):**
- If the credential has a stored face embedding
- Click **"Verify Face"** to capture a live photo
- The system compares the live face against the stored embedding
- Result shows **Match** or **No Match** with a confidence score

### 3.3 Verification History

All verification attempts are logged, including:
- Timestamp
- Method used (QR, Code, NFC)
- Result (Valid, Revoked, Unknown)
- Holder alias (if available)

### 3.4 Trust Anchors

View the list of trusted issuers and their DIDs. Credentials from unregistered issuers will show a warning.

---

## Portal 4: Admin Panel

The Admin Panel is for platform administrators to manage users, roles, and monitor the system.

### 4.1 User Management

- **View users** — List of all registered users with email, roles, and sign-up date
- **Search** — Find users by email or name
- **Assign roles** — Grant additional roles (issuer, verifier, admin) to any user
- **Remove roles** — Revoke previously granted roles

> The "holder" role cannot be removed — it is the default role for all users.

### 4.2 Audit Log

View a chronological log of:

- Sign-in events
- Credential issuance
- Credential claiming
- Credential verification
- Role changes

Each entry includes the user who performed the action, the timestamp, and relevant details.

### 4.3 Role Assignment Guide

| Role | Permissions | Grant To |
|------|-------------|----------|
| holder | Claim, view, share own credentials | All new users (auto) |
| issuer | Create, issue, revoke credentials | UNHCR / NGO staff |
| verifier | Verify credentials, view verification history | Bank, school, border control staff |
| admin | Manage users, roles, view audit logs | Platform operators |

---

## Mobile Wallet App

### Installation

**Android:**
1. Open the project in Android Studio
2. Build the debug APK: `Build → Build Bundle(s) / APK(s) → Build APK(s)`
3. Transfer the APK to your device or emulator and install

Or from the command line:
```bash
cd artifacts/mobile-wallet
npx expo run:android
```

**iOS:**
```bash
cd artifacts/mobile-wallet
npx expo run:ios
```

### Mobile-Specific Features

| Feature | Description |
|---------|-------------|
| Biometric Lock | Face ID / fingerprint protection |
| Camera QR Scanning | Real-time QR code scanner |
| Push Notifications | Alerts for new claims, verifications, expiries |
| Haptic Feedback | Vibration on successful actions |
| Offline Mode | View cached credentials without internet |
| Deep Linking | Open claim codes from external apps via `refugeeid://` |

### Mobile Wallet Screens

| Screen | How to Access | What You Can Do |
|--------|--------------|-----------------|
| Wallet Home | App launch (default) | View credentials, claim new ones, see DID |
| Claim Credential | Home → "Claim Credential" button | Enter 8-char code, face verification, claim |
| Credential Detail | Tap a credential card | Full identity, QR code, share, status |
| QR Scanner | Home → "Scan QR" button | Scan issuer's QR code to claim |
| Recover | Bottom tab "Recover" | Restore lost credentials |
| Settings | Bottom tab "Settings" | Theme, language, biometric lock, sign out |

### Web Preview (Development)

The mobile wallet also runs in a browser for development:
```bash
cd artifacts/mobile-wallet
npx expo export --platform web
node server.js
```

Open `http://localhost:3000` in your browser. Note: camera features use web fallbacks.

---

## FAQs

**Q: What happens if my claim code expires?**
A: Claim codes expire 30 minutes after issuance. Ask the issuer to generate a new credential with a fresh code.

**Q: Can I claim a credential on multiple devices?**
A: Once a credential is claimed by one user, it cannot be claimed again. The credential is permanently linked to the first claimant's user ID.

**Q: What if my face verification fails?**
A: If distance ≥ 0.6, the system reports "No Match." You can retry in better lighting or contact the issuer for alternative verification.

**Q: Is my data stored offline?**
A: Yes, the mobile wallet caches credentials locally. You can view them without an internet connection, but actions like claiming and syncing require connectivity.

**Q: How do I recover my wallet if I lose my phone?**
A: Sign in on a new device with the same Supabase account. Go to the Recover tab and use "Automatic Restore" to reload your credentials from the server.

**Q: Can a revoked credential be re-activated?**
A: No. Revocation is permanent. The issuer must issue a new credential if needed.

**Q: How do I get access as an Issuer or Verifier?**
A: Register as a holder first, then ask a platform admin to grant you the appropriate role through the Admin Panel.

**Q: Is my personal data secure?**
A: Yes. All data is encrypted in transit (HTTPS), stored in a Supabase database with Row-Level Security, and auth tokens are stored in encrypted device storage (mobile) or httpOnly localStorage (web).

**Q: What languages are supported?**
A: Currently English, French, Arabic, and Swahili. More languages can be added through the preferences system.

**Q: What is a DID?**
A: A Decentralized Identifier — a globally unique identifier that does not require a centralized registry. It enables self-sovereign identity where you control your own data.

**Q: What is a Verifiable Credential?**
A: A tamper-evident credential with a standardized format (W3C VC) that includes issuer signatures, making it cryptographically verifiable.
