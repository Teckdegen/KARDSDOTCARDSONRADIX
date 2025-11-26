## Radix Internal Wallet Flow (Legacy)  

This document explains the **old Radix flow** where the backend created and controlled a Radix wallet for each user.  
You can use this as a spec if you ever want to **switch back** or let an agent build a script / service that handles everything automatically (no external wallet connect).  

> **Important:** This whole flow is **not active** in the current codebase.  
> Right now the app uses **Radix Wallet + Radix dApp Toolkit** (`@radixdlt/radix-dapp-toolkit`) and does **not** generate or store private keys.

---

### 1. Libraries used

- **`@radixdlt/radix-engine-toolkit`**  
  - `PrivateKey`, `PublicKey`  
  - `address()` helper to derive account address from public key  
  - Manifest building helpers (in `radix-engine.ts`)
- **`bech32`**  
  - Used to convert the raw hex address from RETK into a proper `account_rdx...` address (Radix account format)
- **`crypto-js`**  
  - AES encryption for storing private keys encrypted in the database

These were glued together in:

- `src/lib/radix-wallet.ts` – wallet generation & address formatting  
- `src/lib/radix-engine.ts` – manifest building, signing, and submitting  
- `src/lib/radix-rpc.ts` – talking to Radix Gateway / node (balances, submit tx, etc.)

---

### 2. Generating a Radix wallet on the server

**Goal:** For each user, generate a **new Radix account**, keep the **private key server-side**, and store it encrypted in Supabase.

High‑level algorithm for `generateRadixWallet()`:

1. **Generate a private key**
   - Use RETK:
     - `const privateKey = PrivateKey.fromRandom()` (or similar helper)
2. **Derive public key**
   - `const publicKey = privateKey.publicKey()`
3. **Get raw address (hash) from RETK**
   - `const accountAddressObj = address(publicKey.toString())`
   - This returned an object like: `{ kind: 'Static', value: '<hex-hash>' }`
4. **Convert to Radix `account_rdx` format using `bech32`**
   - Extract hex value: `const hashHex = accountAddressObj.value`
   - `const hashBytes = Buffer.from(hashHex, 'hex')`
   - `const words = bech32.toWords(hashBytes)`
   - Prepend version byte for accounts: `const wordsWithVersion = [0x01, ...words]`
   - Encode:  
     `const accountAddress = bech32.encode('account_rdx', wordsWithVersion)`
5. **Return wallet object**
   - Example:
     - `address: accountAddress` (e.g. `account_rdx1q...`)  
     - `privateKey: privateKey.toString()` (hex or standard RETK representation)  
     - `publicKey: publicKey.toString()`

> An agent can literally implement this as a Node/TS function using RETK + `bech32`.

---

### 3. Storing the wallet (Supabase `wallets` table)

- On **user registration**, the flow was:
  1. Call `generateRadixWallet()` on the server.
  2. Encrypt the private key with AES:
     - `CryptoJS.AES.encrypt(privateKey, ENCRYPTION_KEY).toString()`
  3. Insert into `wallets` table:
     - `user_id`
     - `radix_wallet_address` (string, `account_rdx...`)
     - `radix_private_key` (encrypted string)

> If you want an agent script: it can call Supabase Admin API, generate the wallet, encrypt the private key, and insert.

---

### 4. Building and signing manifests (server‑side)

**File:** `src/lib/radix-engine.ts`

Conceptually, there were three core steps:

1. **Build a manifest**
   - Use RETK **ManifestBuilder** helpers to create transaction manifests, e.g.:
     - Withdraw USDC from user account  
     - Take from worktop  
     - Deposit to target (insurance wallet, bridge component, etc.)
2. **Sign the manifest**
   - Parse private key:
     - Normalize formats (strip `0x`, support hex strings, etc.)
   - Use RETK signing helpers:
     - Build intent  
     - Sign with private key  
     - Notarize (self‑notarized)
3. **Submit**
   - Submit to Radix node via RPC (see next section).

This let the backend **fully control** sending USDC/XRD from the user’s Radix account without any user wallet extension.

---

### 5. Radix RPC (balances + submit)

**File:** `src/lib/radix-rpc.ts`

Main responsibilities:

- **Balance checks**
  - Query gateway / node to:
    - Find USDC vault(s) on an account
    - Sum balances (for minimum USDC checks)
    - Check XRD balance (for gas / bridge fees)
- **Transaction submission**
  - Take signed/notarized transaction
  - Send via gateway RPC POST
  - Return transaction hash

An agent can:

- Re‑create small helper functions:
  - `getUSDCBalance(accountAddress)`
  - `getXRDBalance(accountAddress)`
  - `submitTransaction(signedNotarizedTx)`

---

### 6. Old card creation flow (server‑controlled wallet)

In the **legacy** flow, when a user created a card:

1. Backend **looked up** user’s stored Radix wallet:
   - `radix_wallet_address`
   - `radix_private_key` (decrypt with AES)
2. Checked **USDC** + **XRD** balances for:
   - $10 **insurance fee**
   - `initialAmount` to fund the card
   - Enough XRD (~410) for bridge & gas
3. **Insurance transaction** (USDC on Radix)
   - Build manifest: send $10 USDC from user Radix account to team insurance wallet
   - Sign & submit
   - Store `insurance` transaction in `transactions` table
4. **Bridge transaction** (Radix → Ethereum USDC)
   - Ask bridge API for quote → get Radix manifest
   - Sign & submit manifest using user’s Radix private key
   - Store bridge tx as `pending` in `transactions`
5. Create card record (Supabase `cards` table)
   - `status: 'processing'`
   - `card_wallet_address`: ETH deposit address from Cashwyre

Everything happened **without** the user needing Radix Wallet extension.

---

### 7. Swapping tokens / bridging with internal wallet

Because the backend controls the Radix private key, an agent or script can:

1. **Pull wallet + private key** from Supabase (`wallets`).
2. **Decrypt** the private key with `ENCRYPTION_KEY`.
3. Use RETK manifest helpers to:
   - Swap or move tokens (USDC/XRD) inside the Radix account.
   - Or call the bridge component to move funds to Ethereum.
4. **Sign + submit** using the same logic as card creation.

This is the part you meant by **“swapping the tokens easily”** – the backend can do it programmatically for the user.

---

### 8. How to switch back (high‑level)

If in the future you want to **switch from Radix Wallet Connect back to internal wallets**, an agent can:

1. **Re‑enable `radix-wallet.ts` and `radix-engine.ts`**
   - Restore the files (or re‑implement from this spec).
2. **Turn registration back on for internal wallets**
   - On `/api/auth/register`, after user creation:
     - Call `generateRadixWallet()`
     - Encrypt and store in `wallets` table
3. **Update card creation & top‑up APIs**
   - Instead of using `walletAddress` from frontend + `sendTransaction` via dApp Toolkit:
     - Load user wallet from DB
     - Build manifests, sign, submit on server
4. **Disable external connect UI**
   - Remove Radix connect button / dApp Toolkit usage from:
     - `cards/create` page
     - `cards/[cardCode]/topup` page

This gives you a clean **toggle path**:

- **Current:** Official Radix Wallet Connect (`@radixdlt/radix-dapp-toolkit`) – user signs everything themselves.  
- **Legacy (this doc):** Backend‑owned Radix wallet – server signs and submits all Radix transactions.

---

### 9. What an “agent” needs to implement

To fully rebuild the old behavior, an AI agent or backend dev would:

1. Install:
   - `@radixdlt/radix-engine-toolkit`
   - `bech32`
   - `crypto-js`
2. Implement:
   - **Wallet generation** (`generateRadixWallet()` as above)
   - **Private key encryption** & Supabase storage
   - **Manifest builder helpers** for:
     - Insurance fee transfer
     - Bridge calls
     - Simple token transfers
   - **RPC helpers** for:
     - Balances (USDC, XRD)
     - Submitting transactions
3. Wire these into:
   - Registration endpoint
   - Card creation endpoint
   - Top‑up / bridge endpoints

With this document, they don’t need the original code – just follow the structure and rebuild the same flow.


