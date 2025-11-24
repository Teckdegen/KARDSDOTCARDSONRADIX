# KARDSDOTCARDSONRADIX

# KARDS - Crypto Debit Card Platform

A full-stack crypto debit card platform built with Next.js, Vercel serverless functions, Supabase, and Radix blockchain integration.

## Features

- 🔐 Email-based authentication (no passwords)
- 💳 Crypto debit card management (create, top-up, freeze/unfreeze)
- 💰 Radix wallet integration (send, receive, balance)
- 🌉 Bridge integration (Radix → Ethereum via Hyperlane)
- 🎁 Referral system with weekly leaderboard
- 💵 Cashback claims
- 📱 Glassmorphism UI (iPhone transparent style)
- 📊 Real-time transaction tracking

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Vercel serverless functions
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Blockchain**: Radix SDK, Radix Engine Toolkit
- **Bridge**: Astrolescent Bridge API
- **Card Provider**: Cashwyre API
- **Support**: Telegram Bot

---

## 🎨 UI Design Overview

### Visual Style
- **Glassmorphism Design**: iPhone transparent/frosted glass aesthetic throughout
- **Color Scheme**:
  - Background: Dark blue (#0A0E27) with subtle radial gradients
  - Primary Accent: Cream/beige (#F5F5DC) for highlights and important elements
  - Text: White with opacity variations (100%, 70%, 60%, 40%)
  - Cards: Transparent glass (8-12% white opacity) with 30px backdrop blur
- **Typography**: SF Pro Display style (Apple system fonts)
- **Animations**: Smooth iOS-style transitions (cubic-bezier easing)
- **Logo**: Custom logo image displayed throughout the app

### Page Layouts

#### 1. **Splash Screen** (`/`)
- Shows logo image (centered)
- "Loading..." text with pulse animation
- Full-screen dark blue background
- Fades out after 2 seconds

#### 2. **Login Page** (`/login`)
- Centered glass card
- Logo at top (80x80px, rounded)
- "Welcome back" heading
- Email input field (glass style)
- iPhone-style 6-box code input (when code sent)
- Smooth transitions between email/code steps
- Link to register

#### 3. **Register Page** (`/register`)
- Centered glass card
- Logo at top
- "Create Account" heading
- Form fields: First name, Last name, Email, Referral code
- iPhone-style 6-box code input (for verification)
- Link to login

#### 4. **Dashboard** (`/dashboard`)
- Logo + "KARDS" header (top left)
- Large balance card with wallet icon
- Balance displayed in gradient text (cream) - Shows USDC balance
- Cashback card (if earnings available)
- Two action cards: Send (red accent) and Receive (green accent)
- Wallet address display (in glass container)
- Recent transactions list with colored icons
- Bottom navigation bar

#### 5. **Cards List** (`/cards`)
- Logo + "My Cards" header
- "Create Card" button (top right)
- Grid/list of user's cards (max 4)
- Each card shows: Name, Brand, Last 4, Balance, Status
- Status badges (green/yellow/blue)
- Click card → Card details

#### 6. **Card Details** (`/cards/[cardCode]`)
- Back button + "Card Details" header
- Large card display with icon
- Balance prominently shown
- Card info (number, expiry)
- Action buttons: Top Up (primary), Freeze/Unfreeze (secondary)
- Transaction list below

#### 7. **Create Card** (`/cards/create`)
- Back button + "Create Card" header
- Full form with all required fields
- Payment breakdown card ($10 insurance + user amount)
- "Create Card" button
- Processing state display

#### 8. **Top-up** (`/cards/[cardCode]/topup`)
- Back button + "Top Up Card" header
- Amount input (min $6)
- Payment breakdown (shows $2.5 fee, card amount)
- "Confirm Top Up" button

#### 9. **Referrals** (`/referrals`)
- Logo + "Referrals" header
- Large referral code display with copy/share buttons
- Stats grid: Weekly earnings, All-time earnings, Referral count
- "Claim Earnings" button (when available)
- Weekly leaderboard with rankings
- Referral history

#### 10. **Support** (`/support`)
- Logo + "Support" header
- Contact form (glass card) - Sends to Telegram
- FAQ section with common questions
- Message: "We'll respond via email"

#### 11. **Settings** (`/settings`)
- Logo + "Settings" header
- Profile info card
- Preferences section
- "Sign Out" button (iPhone power-off style modal)

### Bottom Navigation
- Fixed at bottom (frosted glass)
- 5 items: Dashboard, Cards, Referrals, Support, Settings
- Active state: Cream color + indicator dot
- Smooth hover effects
- iOS-style rounded icons

---

## 🔐 Authentication System

### How Codes Are Created

**1. Code Generation** (`src/lib/utils.ts`):
```typescript
function generateAuthCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```
- Generates random 6-digit number (100000-999999)
- Pure JavaScript random (no database needed for generation)
- Generated on-the-fly when user requests a code

**2. Code Storage** (`src/app/api/auth/send-code/route.ts`):
- **Supabase stores the code** in `auth_codes` table
- Code expires in 10 minutes
- Marked as `used: false` initially
- Linked to user's email
- Supabase handles code verification and expiry checking

**Summary:**
- **Code Generation**: JavaScript function (no Supabase needed)
- **Code Storage & Verification**: Supabase database (stores code, checks expiry, marks as used)

**3. Code Sending** (`src/lib/resend.ts`):
- Sends email via Resend API
- HTML email with large code display
- Includes expiration notice

**4. Code Verification** (`src/app/api/auth/verify-code/route.ts`):
- Checks code exists, not expired, not used
- Marks code as used
- Generates JWT token
- Returns token to user

### Authentication Flow
1. User enters email → System generates 6-digit code
2. Code stored in database (10 min expiry)
3. Email sent via Resend
4. User enters code in iPhone-style boxes
5. System verifies code → Returns JWT token
6. Token stored in localStorage
7. Token sent in Authorization header for all API calls

---

## 💰 USDC Implementation

### All Transactions Use USDC

**USDC Resource Address on Radix:**
- `resource_rdx1thxj9m87sn5cc9ehgp9qxp6vzeqxtce90xm5cp33373tclyp4et4gv`

**Key Points:**
1. **All transactions use USDC** - No more XRD transfers (sending, receiving, bridging all use USDC)
2. **XRD is only for gas** - Users must maintain XRD for gas fees:
   - Regular transactions: $2+ XRD
   - Bridge transactions: ~410 XRD (for Ethereum tx cost and bridge fee)
3. **Balance shows USDC** - Dashboard displays USDC balance
4. **Gas fees paid in XRD** - System checks XRD before every transaction
5. **Insurance fee** - $10 USDC automatically sent to team wallet on card creation
6. **Bridge format** - Uses `XRD.USDC-resource_rdx1...` format for input token
7. **Bridge fees** - Displayed in `route.fees.total` (in USD)
8. **Route expiration** - Routes valid until `route.expiration` time

### Transaction Flows

**Card Creation:**
```
1. User has: $50 USDC + 450 XRD
2. User creates card with $15 initial amount
3. System checks:
   - USDC: $50 >= $25 (✅ $10 insurance + $15 card)
   - XRD: 450 >= 410 (✅ for bridge)
4. Transaction 1: Send $10 USDC → Insurance wallet
5. Transaction 2: Bridge $15 USDC → Card ETH wallet
```

**Top-Up:**
```
1. User has: $20 USDC + 450 XRD
2. User tops up $10
3. System checks:
   - USDC: $20 >= $10 (✅)
   - XRD: 450 >= 410 (✅)
4. Bridge $10 USDC → Card ETH wallet
5. Card receives: $7.5 USDC (after $2.5 fee)
```

**Send USDC:**
```
1. User has: $100 USDC + $3 XRD
2. User sends $50 USDC
3. System checks:
   - USDC: $100 >= $50 (✅)
   - XRD: $3 >= $2 (✅)
4. Transfer $50 USDC → Recipient
```

---

## 🌉 Bridge Transaction Flow

### Complete Bridge Execution

The code **CAN run the whole bridge** transaction from start to finish.

**Important:** Bridge fees are **100% hidden from users** - all bridge operations happen in the backend. Users never see bridge fees, transaction costs, or any of the technical details.

### Step-by-Step Flow

**1. Get Bridge Quote:**
```typescript
const bridgeQuote = await getBridgeQuote(
  inputAmount,        // e.g., 15 (USDC)
  fromAddress,        // User's Radix wallet
  toAddress          // Card's ETH wallet
);
```

**API Call:**
```json
POST https://bridge.astrolescent.com/quote
{
  "inputAmount": 15,
  "inputToken": "XRD.USDC-resource_rdx1thxj9m87sn5cc9ehgp9qxp6vzeqxtce90xm5cp33373tclyp4et4gv",
  "outputToken": "ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "fromAddress": "account_rdx169duxdjryze9kj0007pwm80fdfazd7732n8p4cqkhccwksd6zh47nr",
  "toAddress": "0x1fc528472f36341fb8384bba5d38ccdda52dc95a",
  "slippage": 300,
  "includeStreaming": false,
  "includeTx": true
}
```

**Response:**
```json
{
  "route": {
    "tx": {
      "manifest": "CALL_METHOD... (transaction manifest)"
    },
    "fees": {
      "total": 0.5  // Fee in USD
    },
    "expiration": "2025-01-15T10:30:00Z"
  }
}
```

**2. Extract Manifest:**
```typescript
const manifest = bridgeQuote.route.tx.manifest;
// This is the ready-to-sign transaction manifest from the bridge
```

**3. Sign Manifest:**
```typescript
const signedHex = await signTransactionManifest(manifest, privateKey);
```

**4. Submit Transaction:**
```typescript
const txId = await submitTransaction(signedHex);
```

**5. Complete Flow:**
```typescript
// Card creation example
const bridgeQuote = await getBridgeQuote(amount, fromAddress, toAddress);
const manifest = bridgeQuote.route.tx.manifest;
const bridgeHash = await signAndSubmitManifest(manifest, privateKey);
// ✅ Transaction submitted! Bridge will process it.
```

### Requirements Check

Before bridge execution, code checks:

1. **USDC Balance** ✅
   ```typescript
   const usdcBalance = await getUSDCBalance(walletAddress);
   if (usdcBalance < amount) throw error;
   ```

2. **XRD Balance** ✅ (~410 XRD required)
   ```typescript
   const xrdCheck = await checkXRDForBridge(walletAddress);
   if (!xrdCheck.hasEnough) throw error; // Needs ~410 XRD
   ```

3. **Bridge Quote** ✅
   - Gets manifest from `route.tx.manifest`
   - Gets fee from `route.fees.total` (USD)
   - Gets expiration from `route.expiration`

4. **Sign & Submit** ✅
   - Signs manifest with private key
   - Submits to Radix network
   - Returns transaction ID

### What Happens After Submission

1. **Transaction Submitted** → Radix network processes it
2. **Bridge Detects** → Bridge service sees the transaction
3. **Bridge Executes** → Transfers USDC from Radix → Ethereum
4. **Webhook Received** → When USDC arrives on ETH, webhook fires
5. **Card Funded** → Cashwyre receives USDC, card is funded

**Note:** Bridge fees are automatically deducted during the bridge process but are **never shown to users**. The entire bridge operation is invisible to the end user.

---

## 💳 Card System

### How Card Codes Work

Each card has a **unique `card_code`** (like `VCARD2024121622195100121`) that serves as the primary identifier.

### Database Structure

**Cards Table in Supabase:**
```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY,                    -- Internal database ID
  user_id UUID NOT NULL,                  -- Links card to user
  card_code VARCHAR(255) UNIQUE,          -- Cashwyre's unique card identifier ⭐
  customer_code VARCHAR(255),             -- Cashwyre customer code
  card_wallet_address VARCHAR(255),       -- ETH address for card funding
  card_name VARCHAR(100),                 -- Name on card
  balance DECIMAL(10, 2) DEFAULT 0,      -- Cached balance (updated from Cashwyre)
  status VARCHAR(50),                     -- active, frozen, processing
  -- ... other fields
);
```

### Key Fields

- **`card_code`**: Unique identifier from Cashwyre (e.g., `VCARD2024121622195100121`)
  - Used in URLs: `/cards/VCARD2024121622195100121`
  - Used in API calls to Cashwyre
  - **UNIQUE** constraint ensures no duplicates

- **`user_id`**: Links card to the user who owns it
  - Security: Every operation verifies user owns the card

- **`card_wallet_address`**: ETH address where funds are bridged
  - Used for top-ups and initial funding

### Card Creation Process - Complete Flow

The card creation process is a multi-step asynchronous flow that involves blockchain transactions, bridge operations, and webhook handlers.

#### Step-by-Step Process:

**1. User Initiates Card Creation** (`POST /api/cards/create`)
```
User fills form with:
- Personal info (name, phone, DOB, address)
- Card preferences (name, type, brand)
- Initial amount (minimum $15 USDC)
- Optional referral code
```

**2. Validation & Checks**
```
✅ Validate all form fields
✅ Check user has less than 4 cards
✅ Check USDC balance: Must have ($10 insurance + initialAmount)
✅ Check XRD balance: Must have ~410 XRD for bridge transaction
```

**3. Create ETH Deposit Address** (if doesn't exist)
```
Call Cashwyre API: /CustomerCryptoAddress/createCryptoAddress
→ Returns ETH address for card funding
→ Stored in users.eth_deposit_address
```

**4. Send Insurance Fee**
```
Transaction 1: Send $10 USDC to insurance wallet
- Build transfer manifest
- Sign with user's private key
- Submit to Radix network
- Status: 'success' immediately
- Record stored in transactions table
```

**5. Create Pending Card Record**
```
Insert into cards table:
- user_id
- card_wallet_address (ETH address)
- card_name, card_type, card_brand
- status: 'processing'
- form_data: JSON (stored for webhook use)
- card_code: NULL (will be set later)
```

**6. Bridge Funds to ETH Wallet**
```
Transaction 2: Bridge initialAmount USDC from Radix → Ethereum
- Get bridge quote from Astrolescent Bridge API
- Extract transaction manifest
- Sign manifest with user's private key
- Submit to Radix network
- Status: 'pending' (waits for bridge completion)
- Record stored in transactions table
```

**7. Process Referral** (if code provided)
```
- Find referrer by referral code
- Create referral record (status: 'pending')
- Update referrer's weekly_earnings (+$0.5)
- Update referrer's total_earnings (+$0.5)
```

**8. Return Response to User**
```
Response: "Card creation initiated. Processing..."
User sees: Card appears in list with status "Processing"
```

**9. Bridge Completes** (Automatic - Backend)
```
Hyperlane bridge processes:
- Burns USDC on Radix
- Releases USDC on Ethereum
- Funds arrive at ETH wallet address
```

**10. Payment Webhook Received** (`POST /api/webhooks/cashwyre-payment`)
```
Event: stablecoin.usdc.received.success
Data: { address, amount }

System:
- Finds pending card by ETH address
- Retrieves stored form_data
- Calls Cashwyre API: /CustomerCard/createCard
  → Creates card in Cashwyre system
  → Uses stored form data
```

**11. Card Creation Webhook Received** (`POST /api/webhooks/cashwyre-card-created`)
```
Event: virtualcard.created.success
Data: { cardCode, CustomerEmail, CustomerId, CardBalance, Last4, ExpiryOn }

System:
- Finds user by email
- Finds pending card by ETH address
- Updates card record:
  ✅ card_code = "VCARD2024121622195100121"
  ✅ customer_code = CustomerId
  ✅ status = 'active'
  ✅ balance = CardBalance
  ✅ last4 = Last4
  ✅ expiry_on = ExpiryOn
- Updates bridge transaction status: 'success'
```

**12. Card Ready**
```
Card now appears in user's account:
- Status: 'active'
- Has card_code
- Has balance
- Ready to use
```

#### Visual Flow Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│  USER ACTION: Fill form & click "Create Card"              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  VALIDATION                                                 │
│  ✅ Form fields ✅ Card limit ✅ USDC balance ✅ XRD balance│
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  CREATE ETH ADDRESS (if needed)                             │
│  Cashwyre API: /CustomerCryptoAddress/createCryptoAddress  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  TRANSACTION 1: Send $10 USDC → Insurance Wallet           │
│  ✅ Signed ✅ Submitted ✅ Success                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  CREATE PENDING CARD RECORD                                 │
│  Status: 'processing', card_code: NULL                      │
│  Store form_data for webhook                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  TRANSACTION 2: Bridge USDC → ETH Wallet                    │
│  ✅ Get quote ✅ Sign ✅ Submit                              │
│  Status: 'pending' (waits for bridge)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  RETURN: "Card creation initiated. Processing..."          │
│  User sees card in list with "Processing" status            │
└─────────────────────────────────────────────────────────────┘
                       │
                       │ (Async - Backend)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  BRIDGE COMPLETES                                           │
│  USDC arrives at ETH wallet address                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  WEBHOOK 1: Payment Received                                │
│  Event: stablecoin.usdc.received.success                    │
│  → Finds pending card                                       │
│  → Calls Cashwyre: /CustomerCard/createCard                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  WEBHOOK 2: Card Created                                    │
│  Event: virtualcard.created.success                         │
│  → Updates card with card_code                             │
│  → Status: 'active'                                         │
│  → Updates balance, last4, expiry                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  CARD READY ✅                                               │
│  User sees active card with balance                          │
└─────────────────────────────────────────────────────────────┘
```

#### Key Points:

1. **Two Transactions:**
   - Insurance fee ($10 USDC) → Sent immediately, status: 'success'
   - Card funding (initialAmount) → Bridged, status: 'pending' then 'success'

2. **Form Data Storage:**
   - Form data stored in `cards.form_data` JSON field
   - Used by webhook to call Cashwyre createCard API
   - Ensures data is available when payment arrives

3. **Asynchronous Flow:**
   - User gets immediate response: "Processing..."
   - Card creation happens in background via webhooks
   - Card appears as "active" when webhook completes

4. **Webhook Sequence:**
   - **Payment webhook** → Calls createCard API
   - **Card creation webhook** → Updates card with card_code

5. **Error Handling:**
   - If bridge fails, transaction status remains 'pending'
   - If webhook fails, card remains in 'processing' status
   - Can be retried or manually processed

6. **Referral Processing:**
   - Tracked immediately when card is created
   - Earnings updated even if card is still processing
   - Finalized when card becomes active

### Viewing Card Balance

**Route:** `GET /api/cards/[cardCode]`

**Process:**
```typescript
// 1. Extract cardCode from URL
const { cardCode } = params; // e.g., "VCARD2024121622195100121"

// 2. Verify user owns the card
const card = await supabaseAdmin
  .from('cards')
  .select('*')
  .eq('user_id', user.userId)      // Security check
  .eq('card_code', cardCode)        // Find by card_code
  .single();

// 3. Get real-time balance from Cashwyre
const cashwyreData = await callCashwyreAPI('/CustomerCard/getCard', {
  requestId: generateRequestId(),
  cardCode,  // Use card_code to query Cashwyre
});

// 4. Return combined data
return {
  ...card,              // From Supabase (cached data)
  ...cashwyreData.data // From Cashwyre (real-time balance)
};
```

**Why both?**
- **Supabase**: Fast lookup, stores card metadata
- **Cashwyre**: Real-time balance, always accurate

### Top-Up Flow

**Route:** `POST /api/cards/[cardCode]/topup`

**Process:**
```typescript
// 1. Extract cardCode from URL
const { cardCode } = params;

// 2. Verify user owns the card
const card = await supabaseAdmin
  .from('cards')
  .select('*')
  .eq('user_id', user.userId)      // Security: user must own card
  .eq('card_code', cardCode)        // Find specific card
  .single();

// 3. Get card's ETH wallet address
const ethAddress = card.card_wallet_address;

// 4. Bridge funds from Radix to ETH
const bridgeQuote = await getBridgeQuote(
  amount,
  userRadixAddress,
  ethAddress  // Card's ETH address
);

// 5. After bridge completes, webhook updates balance
```

### Security: User Ownership Verification

**Every operation checks:**
```typescript
.eq('user_id', user.userId)  // User must own the card
.eq('card_code', cardCode)   // Card must match
```

**This prevents:**
- ❌ Users accessing other users' cards
- ❌ Using wrong card_code
- ❌ Unauthorized operations

### Multiple Cards Per User

A user can have **up to 4 cards**. Each has a unique `card_code`:

```
User ID: user-123
├── Card 1: card_code = "VCARD2024121622195100121"
├── Card 2: card_code = "VCARD2025011515370600257"
├── Card 3: card_code = "VCARD2025012012000000123"
└── Card 4: card_code = "VCARD2025012518000000456"
```

**Query to get all user's cards:**
```sql
SELECT * FROM cards 
WHERE user_id = 'user-123'
ORDER BY created_at DESC;
```

**Query to get specific card:**
```sql
SELECT * FROM cards 
WHERE user_id = 'user-123' 
  AND card_code = 'VCARD2024121622195100121';
```

### Card Balance Storage

**Supabase stores balance (cached):**
- Balance is stored in `cards.balance` field
- Updated via webhooks when transactions occur
- Used for fast card list display

**Cashwyre provides real-time balance:**
- When viewing card details, balance is fetched from Cashwyre API
- Always accurate, includes recent transactions
- Combined with Supabase data for complete card info

**Summary:**
- Card list: Shows Supabase balance (cached, fast)
- Card details: Shows Cashwyre balance (real-time, accurate)
- Supabase balance updated via webhooks

---

## 💵 Payment Flows

### Card Creation
- User pays: $10 (insurance) + initialAmount (to card)
- Insurance ($10 USDC) → Insurance wallet (team wallet)
- Initial amount → Bridged to card wallet
- Total: $10 + initialAmount
- User needs: ~410 XRD for bridge transaction

### Top-up
- User pays: amount (min $6 USDC)
- Processing fee: $2.5
- Card receives: amount - $2.5
- Example: User pays $10 → Card gets $7.50
- User needs: ~410 XRD for bridge transaction

---

## 🎁 Referral System

### How It Works
1. User chooses referral code at signup (username-style, unique)
2. Code stored in database
3. When someone creates card with code:
   - $0.5 earned per card (in USDC)
   - Tracked in `referrals` table
   - Weekly earnings updated
   - All-time earnings updated
4. Weekly leaderboard rankings
5. End of week → User can claim earnings
6. System sends USDC from cashback wallet → user's wallet

### Referral Features
- User-chosen codes (must be unique)
- $0.5 per card created with code
- Weekly earnings tracking
- All-time earnings tracking
- Referral count display
- Weekly leaderboard (top 10)
- Claim earnings (weekly) - Paid in USDC
- Referral history

---

## 📊 Database Structure

### 8 Tables

1. **users**
   - User accounts
   - Referral codes
   - Earnings tracking (weekly + total)
   - ETH deposit addresses

2. **wallets**
   - Radix wallet addresses
   - Encrypted private keys
   - One per user

3. **cards**
   - Card details
   - Wallet addresses (ETH)
   - Status tracking
   - Form data (temporary)
   - Balance (cached)
   - Up to 4 per user

4. **auth_codes**
   - Email verification codes
   - 10-minute expiry
   - Used flag

5. **transactions**
   - All transaction types
   - Amounts, fees, status
   - References, hashes
   - Types: radix_send, radix_receive, bridge, top_up, card_transaction, insurance_fee

6. **webhook_logs**
   - Webhook event logs
   - Processing status
   - Error tracking

7. **referrals**
   - Referral tracking
   - Earnings per referral ($0.5)
   - Weekly tracking
   - Claim status

8. **cashback_claims**
   - Claim records
   - Amounts, dates
   - Transaction hashes
   - Status tracking

### Database Functions

1. `increment_earnings(user_id, amount)` - Update user earnings
2. `update_card_balance(card_id, amount)` - Update card balance + timestamp

### Database Triggers

Auto-update `updated_at` timestamps:
- Users table
- Cards table
- Wallets table

---

## 🔌 API Endpoints (24 Total)

### Authentication (4)
- `POST /api/auth/send-code` - Generate and send 6-digit code
- `POST /api/auth/verify-code` - Verify code, return JWT
- `POST /api/auth/register` - Create account, generate wallet
- `POST /api/auth/logout` - Logout (client-side)

### Wallet (4)
- `GET /api/wallet/balance` - Get USDC balance (primary) + XRD balance (for gas)
- `GET /api/wallet/address` - Get Radix address
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/send` - Send USDC (checks USDC + XRD balances)

### Cards (7)
- `GET /api/cards` - Get all user's cards
- `GET /api/cards/[cardCode]` - Get card details (Cashwyre API)
- `GET /api/cards/[cardCode]/transactions` - Get transactions (Cashwyre API)
- `POST /api/cards/create` - Create card (sends $10 to insurance, bridges funds)
- `POST /api/cards/[cardCode]/topup` - Top-up card (bridges funds)
- `POST /api/cards/[cardCode]/freeze` - Freeze card
- `POST /api/cards/[cardCode]/unfreeze` - Unfreeze card

### Referrals (5)
- `GET /api/referrals/my-code` - Get user's referral code
- `GET /api/referrals/stats` - Get earnings stats
- `GET /api/referrals/leaderboard` - Get weekly leaderboard
- `POST /api/referrals/claim` - Claim weekly earnings (USDC)
- `GET /api/referrals/history` - Get referral history

### Cashback (1)
- `GET /api/cashback` - Get cashback info and history

### Support (1)
- `POST /api/support/contact` - Contact form (sends to Telegram)

### Webhooks (2)
- `POST /api/webhooks/cashwyre-card-created` - Card creation webhook
- `POST /api/webhooks/cashwyre-payment` - Payment received webhook

---

## 🔄 Webhook Flows

### Card Creation Webhook
1. Cashwyre sends: `virtualcard.created.success`
2. System extracts `cardCode`
3. Links `cardCode` to existing ETH wallet
4. Awards referral if code provided
5. Card status: active

### Payment Webhook
1. Cashwyre sends: `stablecoin.usdt.received.success` or `stablecoin.usdc.received.success`
2. System identifies card by wallet address
3. If card creation: Calls `createCard` API (uses `initialAmount` from `form_data`)
4. If top-up: Calls `topup` API (amount - $2.5)
5. Updates card balance

---

## 📋 Request ID Format for Cashwyre

### How It Works

Cashwyre requires a **unique `requestId`** for every API call. This is used for:
- Request tracking
- Preventing duplicate requests
- Debugging and logging

### Format

```
req-{timestamp}-{random}
```

**Example:** `req-20250115T103045-ABC123`

### Breakdown

1. **Prefix**: `req-` (always)
2. **Timestamp**: ISO format without dashes/colons
   - Format: `YYYYMMDDTHHMMSS`
   - Example: `20250115T103045` = January 15, 2025, 10:30:45 UTC
3. **Random**: 6-character alphanumeric string
   - Example: `ABC123`

### Implementation

The `generateRequestId()` function in `src/lib/utils.ts` automatically creates these:

```typescript
export function generateRequestId(): string {
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0];
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();
  return `req-${timestamp}-${random}`;
}
```

### Usage

Every Cashwyre API call automatically includes a unique requestId:

```typescript
await callCashwyreAPI('/CustomerCard/createCard', {
  requestId: generateRequestId(), // Auto-generated
  // ... other fields
});
```

### Why This Format?

- ✅ **Unique**: Timestamp + random ensures no collisions
- ✅ **Traceable**: Timestamp helps debug issues
- ✅ **Cashwyre Compliant**: Meets their requirements
- ✅ **Automatic**: No manual generation needed

---

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

**Critical (App won't work without these):**
1. **Supabase** - Database and auth
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Cashwyre** - Card operations
   - `CASHWYRE_SECRET_KEY`
   - `CASHWYRE_BUSINESS_CODE`
   - `CASHWYRE_APP_ID`

3. **Radix RPC** - Blockchain interactions
   - `RADIX_RPC_URL` (e.g., `https://mainnet.radixdlt.com/rpc`)
   - `RADIX_NETWORK_ID` (`mainnet` or `stokenet`)

4. **Encryption Key** - Private key security
   - `ENCRYPTION_KEY` (32+ character random string)

5. **JWT Secret** - Authentication
   - `JWT_SECRET` (32+ character random string)

**Important (Features won't work without these):**
6. **Bridge API** - Card funding
   - `BRIDGE_API_URL` (defaults to `https://bridge.astrolescent.com/quote`)
   - `BRIDGE_SLIPPAGE` (defaults to 300)

7. **Cashback Wallet** - Referral payouts and insurance
   - `CASHBACK_WALLET_ADDRESS` - Radix address that holds USDC
   - `CASHBACK_WALLET_PRIVATE_KEY` - Encrypted private key
   - This wallet receives $10 USDC per card creation
   - This wallet sends referral earnings to users

8. **Resend** - Email codes
   - `RESEND_API_KEY`

9. **Telegram** - Support notifications
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

### 3. Supabase Database Setup

1. Create a Supabase project
2. Go to SQL Editor → New Query
3. Copy entire contents of `database/schema.sql`
4. Paste and run
5. Verify all tables, indexes, and functions created

### 4. Run Development Server
```bash
npm run dev
```

---

## 📁 Project Structure

```
KARDSDOTCARDS/
├── src/
│   ├── app/
│   │   ├── api/              # 24 API endpoints
│   │   │   ├── auth/         # Authentication
│   │   │   ├── wallet/       # Wallet operations
│   │   │   ├── cards/        # Card management
│   │   │   ├── referrals/    # Referral system
│   │   │   ├── cashback/     # Cashback info
│   │   │   ├── support/      # Support contact
│   │   │   └── webhooks/     # Webhook handlers
│   │   ├── dashboard/        # Dashboard page
│   │   ├── login/           # Login page
│   │   ├── register/        # Register page
│   │   ├── cards/           # Cards pages
│   │   ├── referrals/       # Referrals page
│   │   ├── support/         # Support page
│   │   ├── settings/        # Settings page
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home (splash)
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── GlassCard.tsx    # Glass card component
│   │   ├── GlassButton.tsx  # Glass button
│   │   ├── GlassInput.tsx   # Glass input
│   │   ├── CodeInput.tsx    # iPhone-style code input
│   │   ├── BottomNav.tsx    # Bottom navigation
│   │   ├── Logo.tsx         # Logo component
│   │   ├── SplashScreen.tsx # Splash screen
│   │   ├── SendModal.tsx    # Send modal
│   │   ├── ReceiveModal.tsx # Receive modal
│   │   └── LogoutModal.tsx  # Logout modal
│   └── lib/
│       ├── supabase.ts      # Database client
│       ├── cashwyre-client.ts # Cashwyre API
│       ├── bridge-client.ts # Bridge API
│       ├── radix-constants.ts # USDC address, XRD requirements
│       ├── radix-wallet.ts  # Wallet generation
│       ├── radix-rpc.ts     # RPC client (USDC/XRD balances)
│       ├── radix-engine.ts  # Transaction signing
│       ├── coingecko.ts     # CoinGecko API for XRD price
│       ├── telegram.ts      # Telegram bot
│       ├── jwt.ts           # JWT tokens
│       ├── resend.ts        # Email sending
│       ├── auth.ts          # Auth middleware
│       └── utils.ts         # Utilities
├── database/
│   └── schema.sql           # Complete database schema
├── .env.example            # Environment variables template
└── package.json            # Dependencies
```

---

## 🔒 Security Features

1. **Private Key Encryption**:
   - AES-256 encryption
   - Stored encrypted in database
   - Decrypted only when needed

2. **JWT Authentication**:
   - Stateless tokens
   - Expires after 7 days
   - Sent in Authorization header

3. **Input Validation**:
   - Email format
   - Referral code uniqueness
   - Amount minimums
   - Form validation

4. **SQL Injection Protection**:
   - Supabase parameterized queries
   - No raw SQL

5. **Environment Variables**:
   - All secrets in `.env.local`
   - Never committed to git

6. **User Ownership Verification**:
   - Every card operation verifies `user_id`
   - Prevents unauthorized access

---

## 🚨 Remaining Tasks

### Critical - Must Complete Before Production

1. **Radix SDK Integration** ⚠️
   - Replace placeholder `generateRadixWallet()` with actual Radix SDK
   - Need to confirm correct Radix SDK package name
   - Currently returns fake addresses/keys

2. **Radix Engine Toolkit Implementation** ⚠️
   - Implement actual manifest building using RETK
   - Implement actual transaction signing
   - Currently using placeholder hex strings
   - Check RETK docs: https://docs.radixdlt.com/docs/radix-engine-toolkit

3. **Radix RPC Balance Fetching** ⚠️
   - Verify actual Radix Gateway API response structure
   - Adjust balance extraction logic if needed
   - Test with real addresses

### Important - Setup & Configuration

4. **Environment Variables Setup**
   - Copy `.env.example` to `.env.local`
   - Fill in all required values

5. **Supabase Database Setup**
   - Run `schema.sql` in Supabase SQL editor
   - Verify all tables created

6. **Radix Network Configuration**
   - Confirm RPC URL (mainnet vs stokenet)
   - Test RPC connection
   - Verify network ID

### Nice to Have - Testing & Polish

7. **Error Handling**
   - Add more specific error messages
   - Better error logging
   - User-friendly error messages

8. **Transaction Status Tracking**
   - Implement polling for transaction status
   - Update UI when transactions complete
   - Handle failed transactions

9. **Testing**
   - Test all API endpoints
   - Test wallet operations
   - Test card creation flow
   - Test bridge transactions
   - Test webhooks
   - End-to-end user flows

---

## 📝 Key Implementation Details

### Bridge is 100% Backend - Users Never See It

**What Users See:**
1. **Card Creation**: User fills form → Clicks "Create Card" → Sees "Card creation initiated. Processing..."
2. **Top-up**: User enters amount → Clicks "Top Up" → Sees "Top-up initiated. Processing..."

**What Happens Behind the Scenes:**
- Backend creates ETH deposit address
- Backend gets bridge quote (invisible)
- Backend signs transaction (invisible)
- Backend submits to Radix network (invisible)
- Hyperlane bridges: Radix USDC → Ethereum USDC (invisible)
- Webhook confirms payment received
- Backend calls Cashwyre API (invisible)
- Card appears in user's account ✅

### Card Storage in Supabase

**Yes! Supabase stores all card codes (up to 4 per user)**

- All card codes stored in `cards` table
- Each linked to `user_id` via foreign key
- `card_code` is unique (enforced by database)
- Maximum 4 cards enforced in code
- Card details fetched from Cashwyre API when needed

---

## 🎯 Complete Feature List

### User Features
✅ Email-based authentication (no passwords)
✅ 6-digit verification codes (iPhone-style input)
✅ User registration with referral code selection
✅ Radix wallet (send USDC, receive USDC, balance)
✅ Card management (create, view, freeze/unfreeze)
✅ Card top-up (min $6 USDC, $2.5 fee)
✅ Referral system ($0.5 per card in USDC)
✅ Weekly leaderboard
✅ Cashback claims (paid in USDC)
✅ Transaction history
✅ QR code generation
✅ Copy-to-clipboard
✅ Real-time balance updates
✅ Support contact (Telegram notifications)

### System Features
✅ JWT authentication
✅ Private key encryption (AES)
✅ Webhook processing
✅ Bridge integration (Radix → Ethereum)
✅ Cashwyre API integration
✅ Database transactions
✅ Error handling
✅ Loading states
✅ Success/error notifications
✅ Insurance fee deduction ($10 USDC to team wallet)
✅ XRD balance checks (for gas fees)

### UI Features
✅ Glassmorphism design
✅ iPhone-style interactions
✅ Smooth animations
✅ Responsive design
✅ Bottom navigation
✅ Modals and overlays
✅ Splash screen
✅ Logo throughout

---

## 🚀 Deployment

### Vercel Deployment

This project is configured for Vercel deployment with the following files:

- **`vercel.json`**: Vercel configuration with function timeouts, headers, and routing
- **`.vercelignore`**: Files to exclude from deployment
- **`next.config.ts`**: Next.js configuration

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   Add all environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `CASHWYRE_SECRET_KEY`
     - `CASHWYRE_BUSINESS_CODE`
     - `CASHWYRE_APP_ID`
     - `RADIX_RPC_URL`
     - `RADIX_NETWORK_ID`
     - `ENCRYPTION_KEY`
     - `JWT_SECRET`
     - `BRIDGE_API_URL`
     - `CASHBACK_WALLET_ADDRESS`
     - `CASHBACK_WALLET_PRIVATE_KEY`
     - `RESEND_API_KEY`
     - `TELEGRAM_BOT_TOKEN`
     - `TELEGRAM_CHAT_ID`
     - `INSURANCE_WALLET_ADDRESS`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - First deployment may take 2-3 minutes

5. **Configure Webhooks** (After deployment)
   - Get your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - Configure Cashwyre webhooks to point to:
     - `https://your-app.vercel.app/api/webhooks/cashwyre-card-created`
     - `https://your-app.vercel.app/api/webhooks/cashwyre-payment`

### Vercel Configuration Details

**Function Timeouts:**
- API routes have 60-second timeout (configured in `vercel.json`)
- Sufficient for bridge transactions and Cashwyre API calls

**Security Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

**Region:**
- Default: `iad1` (US East)
- Can be changed in `vercel.json` if needed

### Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase database schema deployed
- [ ] Webhooks configured in Cashwyre dashboard
- [ ] Test authentication flow
- [ ] Test wallet operations
- [ ] Test card creation
- [ ] Test bridge transactions
- [ ] Verify Telegram bot notifications work

---

## 💳 Cashwyre API Endpoints

The platform uses the following Cashwyre API endpoints for card management:

### Base URL
```
https://businessapi.cashwyre.com/api/v1.0
```

### Authentication
All requests use Bearer token authentication with `CASHWYRE_SECRET_KEY`.

### Endpoints Used

#### 1. **Create Crypto Address** 
**Endpoint:** `POST /CustomerCryptoAddress/createCryptoAddress`  
**Used in:** Card creation flow  
**Purpose:** Creates ETH deposit address for card funding  
**When called:** When user creates first card (if address doesn't exist)  
**Request Body:**
```json
{
  "requestId": "req-20250115T103045-ABC123",
  "FirstName": "John",
  "LastName": "Doe",
  "Email": "user@example.com",
  "AssetType": "ETH",
  "Network": "USDC",
  "Amount": 0.0001
}
```

#### 2. **Create Card**
**Endpoint:** `POST /CustomerCard/createCard`  
**Used in:** Webhook handler (after payment received)  
**Purpose:** Creates virtual card in Cashwyre system  
**When called:** AFTER webhook receives payment confirmation  
**Request Body:**
```json
{
  "requestId": "req-20250115T103045-ABC123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "phoneCode": "+1",
  "phoneNumber": "1234567890",
  "dateOfBirth": "1990-01-01",
  "homeAddressNumber": "123",
  "homeAddress": "Main Street",
  "cardName": "John Doe",
  "cardType": "virtual",
  "cardBrand": "visa",
  "amountInUSD": 15
}
```

#### 3. **Top Up Card**
**Endpoint:** `POST /CustomerCard/topup`  
**Used in:** Webhook handler (after top-up payment received)  
**Purpose:** Adds funds to existing card  
**When called:** AFTER webhook receives top-up payment  
**Request Body:**
```json
{
  "requestId": "req-20250115T103045-ABC123",
  "cardCode": "VCARD2024121622195100121",
  "amountInUSD": 7.5
}
```
**Note:** Amount is already reduced by $2.5 processing fee

#### 4. **Get Card Details**
**Endpoint:** `POST /CustomerCard/getCard`  
**Used in:** Card details API route  
**Purpose:** Fetches real-time card information and balance  
**When called:** When user views card details  
**Request Body:**
```json
{
  "requestId": "req-20250115T103045-ABC123",
  "cardCode": "VCARD2024121622195100121"
}
```

#### 5. **Get Card Transactions**
**Endpoint:** `POST /CustomerCard/getCardTransactions`  
**Used in:** Card transactions API route  
**Purpose:** Fetches card transaction history  
**When called:** When user views card transactions  
**Request Body:**
```json
{
  "requestId": "req-20250115T103045-ABC123",
  "cardCode": "VCARD2024121622195100121"
}
```

#### 6. **Freeze Card**
**Endpoint:** `POST /Customer/freezeCard`  
**Used in:** Freeze card API route  
**Purpose:** Freezes a card to prevent transactions  
**When called:** When user clicks "Freeze Card"  
**Request Body:**
```json
{
  "requestId": "req-20250115T103045-ABC123",
  "cardCode": "VCARD2024121622195100121"
}
```

#### 7. **Unfreeze Card**
**Endpoint:** `POST /Customer/unfreezeCard`  
**Used in:** Unfreeze card API route  
**Purpose:** Unfreezes a previously frozen card  
**When called:** When user clicks "Unfreeze Card"  
**Request Body:**
```json
{
  "requestId": "req-20250115T103045-ABC123",
  "cardCode": "VCARD2024121622195100121"
}
```

### Request ID Format
All requests include a unique `requestId` in the format:
```
req-{timestamp}-{random}
```
Example: `req-20250115T103045-ABC123`

### Auto-Included Fields
The `callCashwyreAPI()` function automatically adds:
- `appId` - From `CASHWYRE_APP_ID` env variable
- `businessCode` - From `CASHWYRE_BUSINESS_CODE` env variable

### Retry Logic
All API calls include automatic retry with exponential backoff (3 attempts).

---

## 📚 Documentation Links

- Radix Engine Toolkit: https://docs.radixdlt.com/docs/radix-engine-toolkit
- Radix Gateway API: https://radix-babylon-gateway-api.redoc.ly/
- Cashwyre API: https://businessapi.cashwyre.com/api/v1.0
- Astrolescent Bridge: https://bridge.astrolescent.com

---

## ⚠️ Important Notes

### Critical Implementation Status
- Radix SDK integration needs to be completed (currently using placeholders)
- Bridge transaction signing needs Radix Engine Toolkit implementation
- Some API endpoints need Cashwyre credentials to be fully functional
- Test on Stokenet (testnet) before mainnet deployment

### Transaction & Currency Rules
- **All transactions use USDC on Radix** - No XRD transfers for payments
- **XRD is only for gas fees** - Users must maintain XRD balance:
  - Regular transactions: $2 USD worth of XRD (dynamically calculated via CoinGecko)
  - Bridge transactions: ~410 XRD (for Ethereum tx cost and bridge fee)
- **Bridge fees are hidden from users** - All bridge operations happen in backend, users never see fees

### Card Creation & Fees
- **Card creation requires:**
  - Minimum $15 USDC initial amount
  - $10 USDC insurance fee (automatically sent to team wallet)
  - ~410 XRD for bridge transaction
- **Card creation API is called AFTER webhook receives payment** - Not during initial request
- **Maximum 4 cards per user** - Enforced in code

### Top-Up Rules
- **Minimum top-up amount: $6 USDC**
- **Processing fee: $2.5** - Automatically deducted, card receives (amount - $2.5)
- **Requires ~410 XRD** for bridge transaction

### Referral System
- **Earnings: $0.5 USDC per card** created with referral code
- **Weekly tracking** - Earnings accumulate Monday-Sunday
- **Claim earnings** - Paid in USDC from cashback wallet
- **Leaderboard** - Top 10 users ranked by weekly earnings

### Support System
- **Support messages sent to Telegram** - Not stored in database
- **Responses via email** - Users receive email responses
- **Telegram bot** - Real-time notifications to team

### Deployment Requirements
- **Vercel deployment ready** - All configuration files included
- **Environment variables required** - See setup section for complete list
- **Webhook configuration critical** - Must configure Cashwyre webhooks after deployment
- **Supabase database schema** - Must run `database/schema.sql` before use
- **CoinGecko API** - No API key required, uses free tier

## 📊 CoinGecko Integration

The platform uses CoinGecko API to dynamically calculate how many XRD equals $2 USD. This ensures accurate balance checks regardless of XRD price fluctuations.

**Implementation:**
- `src/lib/coingecko.ts` - CoinGecko API client
- Fetches real-time XRD price from CoinGecko
- Calculates $2 USD worth of XRD dynamically
- Used in `checkXRDForGas()` function
- Falls back to approximate price (0.05 USD) if API fails

**No API Key Required:** CoinGecko free tier is used (no authentication needed for basic price queries).

**Usage:**
```typescript
import { getXRDForTwoDollars } from '@/lib/coingecko';

// Get how many XRD equals $2
const requiredXRD = await getXRDForTwoDollars();
// Example: If XRD = $0.05, then requiredXRD = 40 XRD
```

---

## License

Private - All rights reserved
#
