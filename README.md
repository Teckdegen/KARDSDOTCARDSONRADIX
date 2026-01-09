# KARDS - Crypto Debit Card Platform

A full-stack crypto debit card platform built with Next.js, Vercel serverless functions, Supabase, and Cashwyre API integration.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema (Supabase)](#database-schema-supabase)
- [API Endpoints](#api-endpoints)
- [External Services](#external-services)
- [Authentication Flow](#authentication-flow)
- [Card Creation Flow](#card-creation-flow)
- [Top-up Flow](#top-up-flow)
- [Referral System](#referral-system)
- [Webhooks](#webhooks)
- [Data Storage](#data-storage)
- [Environment Variables](#environment-variables)

---

## 🎯 Overview

KARDS is a platform that allows users to:
- Create and manage crypto debit cards
- Top up cards with cryptocurrency
- Freeze/unfreeze cards
- Track transactions
- Earn referral rewards
- Claim cashback

The platform uses **Supabase** as the database, **Cashwyre API** for card management, **Resend** for email delivery, and **Telegram Bot** for support notifications.

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js App   │ (Frontend + API Routes)
│   (Vercel)      │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │        │              │              │
┌───▼───┐ ┌─▼────────┐ ┌──▼────────┐ ┌───▼──────┐
│Supabase│ │Cashwyre  │ │  Resend   │ │ Telegram │
│(Postgres)│ │   API    │ │   Email   │ │   Bot    │
└────────┘ └──────────┘ └───────────┘ └──────────┘
```

**Key Components:**
- **Frontend**: Next.js 16 with React 19, TypeScript, Tailwind CSS
- **Backend**: Vercel serverless functions (API routes)
- **Database**: Supabase (PostgreSQL)
- **Card Provider**: Cashwyre API
- **Email Service**: Resend
- **Support**: Telegram Bot API

---

## 🗄️ Database Schema (Supabase)

### Tables

#### `users`
Stores user account information.

**Columns:**
- `id` (uuid, primary key)
- `first_name` (text)
- `last_name` (text)
- `email` (text, unique)
- `referral_code` (text, unique) - User's unique referral code
- `total_earnings` (numeric) - Total cashback earned
- `weekly_earnings` (numeric) - Weekly cashback
- `total_referrals` (integer) - Number of successful referrals
- `eth_deposit_address` (text) - Ethereum address for card funding
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Stored in Supabase:** ✅ Yes

---

#### `wallets`
Stores wallet information for users.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → users.id)
- `flare_wallet_address` (text) - Wallet address (plain text)
- `flare_private_key` (text) - Encrypted private key (AES encryption)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Stored in Supabase:** ✅ Yes
- Address: **Plain text**
- Private Key: **Encrypted** (AES encryption)

---

#### `cards`
Stores minimal card reference information (NOT full card details).

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → users.id)
- `card_code` (text) - Cashwyre card code (set after card creation, used to fetch details)
- `customer_code` (text) - Cashwyre customer code
- `card_name` (text) - User-defined card name (for display only)
- `card_brand` (text) - Always "visa" (hardcoded)
- `card_type` (text) - Always "physical" (hardcoded)
- `card_wallet_address` (text) - Ethereum address for this card (for payment tracking)
- `status` (text) - "processing", "active", "frozen", "cancelled" (basic status only)
- `balance` (numeric) - Card balance in USD (updated from webhooks, may be stale)
- `last4` (text) - Last 4 digits of card (updated from webhooks, may be stale)
- `expiry_on` (text) - Card expiry date (updated from webhooks, may be stale)
- `form_data` (jsonb) - Temporary form data stored during card creation (used for Cashwyre API call)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Stored in Supabase:** ⚠️ Minimal Reference Only
- **Supabase stores:** Only `card_code` and basic reference fields
- **Full card details are ALWAYS fetched from Cashwyre API** when needed
- `form_data` is temporary and used only during card creation process
- Balance, last4, expiry may be updated from webhooks but should be fetched from Cashwyre for accuracy

---

#### `transactions`
Stores all transaction records.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → users.id)
- `card_id` (uuid, foreign key → cards.id, nullable)
- `type` (text) - Transaction type:
  - `card_creation` - Card creation payment
  - `top_up` - Card top-up
  - `card_purchase` - Card transaction
  - `flare_send` - Flare wallet send
  - `flare_receive` - Flare wallet receive
  - `bridge` - Bridge transaction
- `amount` (numeric) - Transaction amount
- `status` (text) - "pending", "success", "failed"
- `description` (text) - Transaction description
- `metadata` (jsonb) - Additional transaction data
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Stored in Supabase:** ✅ Yes
- All transactions are logged locally

---

#### `referrals`
Stores referral relationships.

**Columns:**
- `id` (uuid, primary key)
- `referrer_id` (uuid, foreign key → users.id) - User who referred
- `referred_id` (uuid, foreign key → users.id) - User who was referred
- `referral_code_used` (text) - Referral code that was used
- `status` (text) - "pending", "completed"
- `earnings` (numeric) - Cashback earned from this referral
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Stored in Supabase:** ✅ Yes

---

#### `auth_codes`
Stores email verification codes.

**Columns:**
- `id` (uuid, primary key)
- `email` (text)
- `code` (text) - 6-digit verification code
- `expires_at` (timestamp)
- `used` (boolean)
- `created_at` (timestamp)

**Stored in Supabase:** ✅ Yes
- Codes expire after 10 minutes
- Codes are single-use

---

#### `webhook_logs`
Stores webhook events from Cashwyre.

**Columns:**
- `id` (uuid, primary key)
- `event_type` (text) - Webhook event type
- `event_data` (jsonb) - Full webhook payload
- `processed` (boolean) - Whether webhook was processed
- `error_message` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Stored in Supabase:** ✅ Yes
- All webhooks are logged for debugging

---

## 🔌 API Endpoints

### Authentication

#### `POST /api/auth/register`
Creates a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "referralCode": "john123"
}
```

**Process:**
1. Validates email and referral code format
2. Checks if email/referral code already exists
3. Creates user in `users` table
4. Generates internal wallet (address + encrypted private key)
5. Stores wallet in `wallets` table
6. Generates 6-digit verification code
7. Sends code via Resend email
8. Stores code in `auth_codes` table

**Response:**
```json
{
  "success": true,
  "message": "Account created. Please check your email for verification code.",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "referralCode": "john123"
  }
}
```

---

#### `POST /api/auth/send-code`
Resends verification code.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Process:**
1. Validates email exists
2. Generates new 6-digit code
3. Sends via Resend
4. Stores in `auth_codes` table

---

#### `POST /api/auth/verify-code`
Verifies email and logs user in.

**Request Body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Process:**
1. Validates code matches and hasn't expired
2. Marks code as used
3. Generates JWT token
4. Returns token

**Response:**
```json
{
  "success": true,
  "token": "jwt-token",
  "user": { ... }
}
```

---

#### `POST /api/auth/logout`
Logs user out (client-side token removal).

---

### Cards

#### `GET /api/cards`
Gets all cards for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "cards": [
    {
      "id": "uuid",
      "card_code": "CARD123",
      "card_name": "My Card",
      "balance": 100.00,
      "status": "active",
      ...
    }
  ]
}
```

**Stored in Supabase:** ✅ Yes

---

#### `GET /api/cards/[cardCode]`
Gets specific card details.

**Process:**
1. Verifies user owns card (checks `card_code` in Supabase)
2. Fetches full card details from Cashwyre API (`/CustomerCard/getCard`)
3. Returns combined data (Supabase reference + Cashwyre full details)

**Stored in Supabase:** ⚠️ Only reference (`card_code`)
**Full details:** Always fetched from Cashwyre API in real-time

---

#### `POST /api/cards/create`
Creates a new card.

**Request Body:**
```json
{
  "cardName": "My Card",
  "referralCode": "friend123",
  "initialAmount": 15
}
```

**Process:**
1. Validates user authentication
2. Checks user has less than 4 cards
3. Gets user's wallet from `wallets` table
4. Gets bridge quote from Bridge API
5. Signs and submits bridge transaction (Flare → Ethereum)
6. Creates Ethereum deposit address via Cashwyre API
7. Creates card record in `cards` table with status "processing"
8. Stores form data in `form_data` JSONB column
9. Creates transaction record
10. Returns success

**Note:** Card is created asynchronously. Cashwyre webhook updates card reference when ready.

**Stored in Supabase:** ⚠️ Minimal reference only
- Card reference with `card_code` (after webhook)
- Temporary `form_data` (used during creation, not stored long-term)
- Full card details are NOT stored - always fetched from Cashwyre API

---

#### `POST /api/cards/[cardCode]/topup`
Tops up a card.

**Request Body:**
```json
{
  "amount": 50
}
```

**Process:**
1. Validates user owns card
2. Gets user's wallet from `wallets` table
3. Gets bridge quote
4. Signs and submits bridge transaction
5. Creates transaction record with status "pending"
6. Returns success

**Note:** Top-up is completed when Cashwyre webhook confirms payment received.

**Stored in Supabase:** ✅ Yes (transaction record only)
- Card balance may be updated from webhook but should be fetched from Cashwyre for accuracy

---

#### `POST /api/cards/[cardCode]/freeze`
Freezes a card.

**Process:**
1. Calls Cashwyre API to freeze card
2. Updates card status in Supabase to "frozen"

**Stored in Supabase:** ✅ Yes (status update)

---

#### `POST /api/cards/[cardCode]/unfreeze`
Unfreezes a card.

**Process:**
1. Calls Cashwyre API to unfreeze card
2. Updates card status in Supabase to "active"

**Stored in Supabase:** ✅ Yes (status update)

---

#### `GET /api/cards/[cardCode]/transactions`
Gets transactions for a specific card.

**Stored in Supabase:** ✅ Yes (all transactions)

---

### Referrals

#### `GET /api/referrals/my-code`
Gets user's referral code.

**Response:**
```json
{
  "success": true,
  "referralCode": "john123"
}
```

**Stored in Supabase:** ✅ Yes (from `users.referral_code`)

---

#### `GET /api/referrals/stats`
Gets referral statistics.

**Response:**
```json
{
  "success": true,
  "weeklyEarnings": 50.00,
  "allTimeEarnings": 200.00,
  "referralCount": 5
}
```

**Stored in Supabase:** ✅ Yes (from `users` table)

---

#### `GET /api/referrals/leaderboard`
Gets weekly referral leaderboard.

**Stored in Supabase:** ✅ Yes (calculated from `users.weekly_earnings`)

---

#### `GET /api/referrals/history`
Gets user's referral history.

**Stored in Supabase:** ✅ Yes (from `referrals` table)

---

#### `POST /api/referrals/claim`
Claims cashback earnings.

**Process:**
1. Validates user has earnings
2. Transfers earnings to user's wallet
3. Resets `weekly_earnings` to 0
4. Creates transaction record

**Stored in Supabase:** ✅ Yes (earnings update, transaction)

---

#### `POST /api/cashback`
Claims cashback (alternative endpoint).

**Stored in Supabase:** ✅ Yes

---

### Wallet

#### `GET /api/wallet/balance`
Gets wallet balance.

**Stored in Supabase:** ✅ Yes (wallet address from `wallets` table)
**Balance:** Fetched from external API (not stored)

---

#### `GET /api/wallet/address`
Gets wallet address.

**Stored in Supabase:** ✅ Yes (from `wallets.flare_wallet_address`)

---

#### `GET /api/wallet/transactions`
Gets wallet transactions.

**Stored in Supabase:** ✅ Yes (from `transactions` table, filtered by type)

---

#### `POST /api/wallet/send`
Sends funds from wallet.

**Stored in Supabase:** ✅ Yes (transaction record created)

---

### User

#### `GET /api/user/profile`
Gets user profile.

**Stored in Supabase:** ✅ Yes (from `users` table)

---

### Support

#### `POST /api/support/contact`
Sends support message.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Help",
  "message": "I need help"
}
```

**Process:**
1. Formats message
2. Sends to Telegram Bot
3. Returns success

**Stored in Supabase:** ❌ No (only sent to Telegram)

---

### Webhooks

#### `POST /api/webhooks/cashwyre-card-created`
Handles card creation webhook from Cashwyre.

**Event:** `virtualcard.created.success`

**Process:**
1. Logs webhook to `webhook_logs`
2. Finds user by email
3. Finds pending card (status="processing", card_code=null)
4. Updates card with `card_code`, `customer_code`, `status="active"`, balance, last4, expiry
5. Marks webhook as processed

**Stored in Supabase:** ✅ Yes (card update, webhook log)

---

#### `POST /api/webhooks/cashwyre-payment`
Handles payment webhook from Cashwyre.

**Events:**
- `stablecoin.usdt.received.success`
- `stablecoin.usdc.received.success`

**Process:**
1. Logs webhook to `webhook_logs`
2. Finds card by `card_wallet_address`
3. If card is pending (card creation):
   - Calls Cashwyre `createCard` API with stored form data
4. If card exists (top-up):
   - Calculates top-up amount (minus fee)
   - Calls Cashwyre `topup` API
   - Updates card balance
   - Updates transaction status to "success"
5. Marks webhook as processed

**Stored in Supabase:** ✅ Yes (card balance, transaction status, webhook log)

---

## 🌐 External Services

### Cashwyre API

**Base URL:** `https://businessapi.cashwyre.com/api/v1.0`

**Endpoints Used:**
- `POST /CustomerCard/createCard` - Creates a new card (with auto-generated user data)
- `POST /CustomerCard/topup` - Tops up a card
- `POST /CustomerCard/freeze` - Freezes a card
- `POST /CustomerCard/unfreeze` - Unfreezes a card
- `POST /CustomerCard/getCard` - **Gets full card details** (called every time details are needed)
- `POST /CustomerCard/getCardTransactions` - Gets card transactions
- `POST /CustomerAddress/createAddress` - Creates Ethereum deposit address

**Important:** Card details are fetched from `/CustomerCard/getCard` every time they're needed. Supabase only stores the `card_code` reference to call this endpoint.

**Authentication:**
- Bearer token in `Authorization` header
- Uses `CASHWYRE_SECRET_KEY` from environment

**Request Format:**
```json
{
  "appId": "...",
  "businessCode": "...",
  "requestId": "KARDS...",
  ...
}
```

**Request IDs:**
- Format: `KARDS` + 12 alphanumeric characters
- Example: `KARDSa1b2c3d4e5f6`

**Stored in Supabase:** ❌ No (only `card_code` reference is stored, full details fetched from API)

---

### Resend (Email Service)

**Used For:**
- Sending 6-digit verification codes
- Email-based authentication (no passwords)

**Stored in Supabase:** ❌ No (codes are sent, not email content)

---

### Telegram Bot API

**Used For:**
- Sending support form submissions to Telegram chat/group

**Stored in Supabase:** ❌ No (messages sent directly to Telegram)

---

## 🔐 Authentication Flow

1. **Registration:**
   - User provides: firstName, lastName, email, referralCode
   - System creates user in `users` table
   - System generates wallet (address + encrypted private key)
   - System stores wallet in `wallets` table
   - System generates 6-digit code
   - System sends code via Resend email
   - System stores code in `auth_codes` table (expires in 10 minutes)

2. **Verification:**
   - User enters code from email
   - System validates code (matches, not expired, not used)
   - System marks code as used
   - System generates JWT token
   - System returns token to client

3. **Login:**
   - User requests code via `/api/auth/send-code`
   - System sends new code via Resend
   - User verifies code via `/api/auth/verify-code`
   - System returns JWT token

**Stored in Supabase:** ✅ Yes (users, wallets, auth_codes)

---

## 💳 Card Creation Flow

1. **User Initiates:**
   - User fills form: cardName, referralCode (optional), initialAmount
   - Frontend calls `POST /api/cards/create`

2. **Backend Processing:**
   - Validates user authentication
   - Checks user has < 4 cards
   - Gets user's wallet from `wallets` table
   - Gets bridge quote (Flare → Ethereum)
   - Signs and submits bridge transaction
   - Creates Ethereum address via Cashwyre API
   - Creates card record in `cards` table:
     - Status: "processing"
     - `card_code`: null (will be set by webhook)
     - `form_data`: Stores all form data as JSONB (temporary, used for API call)
     - `card_wallet_address`: Ethereum address
   - Creates transaction record (type: "card_creation", status: "pending")

3. **Payment Processing:**
   - User's funds are bridged from Flare to Ethereum
   - Funds arrive at `card_wallet_address`

4. **Webhook Trigger:**
   - Cashwyre detects payment
   - Sends webhook: `stablecoin.usdc.received.success`
   - System receives webhook at `/api/webhooks/cashwyre-payment`
   - System finds pending card by `card_wallet_address`
   - System calls Cashwyre `createCard` API with stored `form_data`:
     - Auto-generated phone number and country code (random)
     - Auto-generated address (random, based on country code)
     - Auto-generated date of birth (random)
     - User's name and email from Supabase
   - Cashwyre creates card

5. **Card Created:**
   - Cashwyre sends webhook: `virtualcard.created.success`
   - System receives webhook at `/api/webhooks/cashwyre-card-created`
   - System updates card reference:
     - `card_code`: Set from webhook (used to fetch details)
     - `status`: "active"
     - `balance`: Initial amount (may be stale, fetch from API for accuracy)
     - `last4`: Last 4 digits (may be stale, fetch from API for accuracy)
     - `expiry_on`: Expiry date (may be stale, fetch from API for accuracy)

**Stored in Supabase:** ⚠️ Minimal reference only
- Card reference with `card_code` (used to fetch details from Cashwyre)
- Transaction records
- `form_data` is temporary and used only during creation
- Auto-generated data (phone, address, DOB) is NOT stored - only sent to Cashwyre
- Full card details are always fetched from Cashwyre API when needed

---

## 💰 Top-up Flow

1. **User Initiates:**
   - User enters amount
   - Frontend calls `POST /api/cards/[cardCode]/topup`

2. **Backend Processing:**
   - Validates user owns card
   - Gets user's wallet from `wallets` table
   - Gets bridge quote
   - Signs and submits bridge transaction
   - Creates transaction record (type: "top_up", status: "pending")

3. **Payment Processing:**
   - User's funds are bridged from Flare to Ethereum
   - Funds arrive at card's `card_wallet_address`

4. **Webhook Trigger:**
   - Cashwyre detects payment
   - Sends webhook: `stablecoin.usdc.received.success`
   - System receives webhook at `/api/webhooks/cashwyre-payment`
   - System finds card by `card_wallet_address`
   - System calculates top-up amount (minus processing fee)
   - System calls Cashwyre `topup` API
   - System updates card balance (may be stale, fetch from API for accuracy)
   - System updates transaction status to "success"

**Stored in Supabase:** ✅ Yes (transaction record)
- Card balance may be updated from webhook but should be fetched from Cashwyre for accuracy

---

## 🎁 Referral System

### How It Works

1. **User Registration:**
   - User provides referral code during registration
   - System validates referral code exists
   - System creates referral record in `referrals` table:
     - `referrer_id`: User who owns the referral code
     - `referred_id`: New user
     - `status`: "pending"

2. **Card Creation:**
   - When referred user creates first card
   - System finds referral record
   - System calculates cashback (percentage of card creation fee)
   - System updates referral:
     - `status`: "completed"
     - `earnings`: Cashback amount
   - System updates referrer's stats:
     - `total_earnings`: Incremented
     - `weekly_earnings`: Incremented
     - `total_referrals`: Incremented

3. **Cashback Claim:**
   - User calls `POST /api/referrals/claim`
   - System transfers earnings to user's wallet
   - System resets `weekly_earnings` to 0
   - System creates transaction record

**Stored in Supabase:** ✅ Yes (referrals table, users stats)

---

## 📡 Webhooks

### Cashwyre Webhooks

**Webhook URLs:**
- Card Created: `/api/webhooks/cashwyre-card-created`
- Payment Received: `/api/webhooks/cashwyre-payment`

**Events:**
- `virtualcard.created.success` - Card was created
- `stablecoin.usdc.received.success` - USDC payment received
- `stablecoin.usdt.received.success` - USDT payment received

**Processing:**
1. All webhooks are logged to `webhook_logs` table
2. Webhook is processed
3. `processed` flag is set to `true`
4. Errors are logged in `error_message`

**Stored in Supabase:** ✅ Yes (all webhooks logged)

---

## ⏱️ API Call Timing & Webhook Handling

This section explains **when each API is called**, **the sequence of operations**, and **how the system waits for webhooks** in an asynchronous flow.

### 🔄 Asynchronous Flow Architecture

The system uses an **asynchronous webhook-based architecture**:
- **API calls are synchronous** (immediate response)
- **Webhook processing is asynchronous** (happens later when Cashwyre calls back)
- **No polling** - system waits passively for webhooks
- **Status tracking** via database records (status: "pending", "processing", "active", etc.)

### 📋 Card Creation: Complete API Call Sequence

#### Step 1: User Initiates Card Creation
**API Called:** `POST /api/cards/create`

**Immediate API Calls (Synchronous - All happen in this request):**

1. **Balance Check** (Flare RPC):
   - `getUSDCBalance()` - Checks user's USDC balance
   - `checkXRDForBridge()` - Checks user has ~410 XRD for bridge fees
   - **When:** Before any transactions
   - **Response Time:** ~1-2 seconds

2. **Create Ethereum Address** (Cashwyre API):
   - `POST /CustomerCryptoAddress/createCryptoAddress`
   - **When:** After validation, before transactions
   - **Response Time:** ~2-3 seconds
   - **Returns:** Ethereum address for card funding
   - **Note:** Reuses existing address if previous card creation was cancelled

3. **Send Insurance Fee** (Flare Network):
   - `buildTransferManifest()` - Builds transfer transaction
   - `signAndSubmitManifest()` - Signs and submits $10 USDC to insurance wallet
   - **When:** After Ethereum address is created
   - **Response Time:** ~3-5 seconds (transaction submission)
   - **Returns:** Transaction hash (immediate confirmation)

4. **Get Bridge Quote** (Bridge API):
   - `POST /quote` (Astrolescent Bridge API)
   - **When:** After insurance fee is sent
   - **Response Time:** ~2-4 seconds
   - **Returns:** Bridge transaction manifest
   - **Expiration:** Quote expires after some time (check API)

5. **Submit Bridge Transaction** (Flare Network):
   - `signAndSubmitManifest()` - Signs and submits bridge transaction
   - **When:** After getting bridge quote
   - **Response Time:** ~3-5 seconds (transaction submission)
   - **Returns:** Transaction hash (immediate confirmation)
   - **Note:** Transaction is submitted but funds take time to bridge

6. **Create Card Record** (Supabase):
   - `INSERT INTO cards` - Creates pending card record
   - **When:** After bridge transaction is submitted
   - **Response Time:** ~200-500ms
   - **Status:** "processing"
   - **Stores:** `form_data`, `card_wallet_address`, status

**Total Request Time:** ~15-25 seconds (synchronous wait)

**Response to User:**
```json
{
  "success": true,
  "message": "Card creation initiated. Processing...",
  "transactionHash": "..."
}
```

**At This Point:**
- ✅ Insurance fee transaction submitted (confirmed)
- ✅ Bridge transaction submitted (pending)
- ✅ Card record created in Supabase (status: "processing")
- ⏳ Waiting for bridge to complete (5-15 minutes)
- ⏳ Waiting for Cashwyre payment webhook

---

#### Step 2: Bridge Completes (External Process)
**Time:** 5-15 minutes after bridge transaction submission

**What Happens:**
- User's USDC is bridged from Flare → Ethereum
- Funds arrive at `card_wallet_address` on Ethereum network
- **No API call from our system** - this is external blockchain processing

---

#### Step 3: Cashwyre Detects Payment (Webhook Trigger)
**Webhook:** `POST /api/webhooks/cashwyre-payment`
**Event Type:** `stablecoin.usdc.received.success`

**Timing:** 
- Triggered automatically by Cashwyre when they detect USDC payment
- Usually 1-5 minutes after funds arrive on Ethereum
- **Asynchronous** - system doesn't poll, just waits

**Process:**
1. **Log Webhook** (Supabase):
   - `INSERT INTO webhook_logs` - Logs webhook event
   - **When:** Immediately when webhook arrives

2. **Find Pending Card** (Supabase):
   - `SELECT FROM cards WHERE card_wallet_address = <address> AND status = 'processing'`
   - **When:** After logging webhook

3. **Create Card** (Cashwyre API):
   - `POST /CustomerCard/createCard`
   - **When:** After finding pending card
   - **Response Time:** ~3-5 seconds
   - **Payload:**
     ```json
     {
       "requestId": "KARDS...",
       "firstName": "...",
       "lastName": "...",
       "email": "...",
       "phoneCode": "+1",  // Auto-generated randomly
       "phoneNumber": "1234567890",  // Auto-generated randomly
       "dateOfBirth": "1990-01-01",  // Auto-generated randomly
       "homeAddressNumber": "123",  // Auto-generated randomly
       "homeAddress": "Main Street",  // Auto-generated randomly
       "cardName": "...",
       "cardType": "physical",
       "cardBrand": "visa",
       "amountInUSD": 15
     }
     ```
   - **Returns:** Success (card creation started on Cashwyre side)
   - **Note:** Auto-generated data (phone, address, DOB) sent here but NOT stored in Supabase

4. **Update Webhook Status** (Supabase):
   - `UPDATE webhook_logs SET processed = true`
   - **When:** After Cashwyre API call succeeds

**At This Point:**
- ✅ Payment detected by Cashwyre
- ✅ Card creation API called to Cashwyre
- ⏳ Waiting for Cashwyre to process card creation (1-5 minutes)

---

#### Step 4: Cashwyre Creates Card (Webhook Trigger)
**Webhook:** `POST /api/webhooks/cashwyre-card-created`
**Event Type:** `virtualcard.created.success`

**Timing:**
- Triggered automatically by Cashwyre after card is created
- Usually 1-5 minutes after `createCard` API call
- **Asynchronous** - system doesn't poll, just waits

**Process:**
1. **Log Webhook** (Supabase):
   - `INSERT INTO webhook_logs` - Logs webhook event
   - **When:** Immediately when webhook arrives

2. **Find User** (Supabase):
   - `SELECT FROM users WHERE email = <email>`
   - **When:** After logging webhook

3. **Find Pending Card** (Supabase):
   - `SELECT FROM cards WHERE user_id = <id> AND status = 'processing' AND card_code IS NULL`
   - **When:** After finding user

4. **Update Card Reference** (Supabase):
   - `UPDATE cards SET card_code = <code>, customer_code = <code>, status = 'active', balance = <amount>, last4 = <last4>, expiry_on = <expiry>`
   - **When:** After finding pending card
   - **Stores:** `card_code` (used to fetch full details later)
   - **Status:** Changed to "active"
   - **Note:** Balance, last4, expiry are cached but should be fetched from API for accuracy

5. **Update Webhook Status** (Supabase):
   - `UPDATE webhook_logs SET processed = true`
   - **When:** After card update succeeds

**At This Point:**
- ✅ Card created on Cashwyre
- ✅ Card reference updated in Supabase
- ✅ `card_code` now available (can fetch full details)
- ✅ Status: "active"

**Total Time from User Request:** 15-30 minutes (mostly waiting for webhooks)

---

### 💰 Top-up: Complete API Call Sequence

#### Step 1: User Initiates Top-up
**API Called:** `POST /api/cards/[cardCode]/topup`

**Immediate API Calls (Synchronous - All happen in this request):**

1. **Verify Card Ownership** (Supabase):
   - `SELECT FROM cards WHERE card_code = <code> AND user_id = <id>`
   - **When:** Immediately
   - **Response Time:** ~200-500ms

2. **Balance Check** (Flare RPC):
   - `getUSDCBalance()` - Checks user's USDC balance
   - `checkXRDForBridge()` - Checks user has ~410 XRD for bridge fees
   - **When:** After validation
   - **Response Time:** ~1-2 seconds

3. **Get Bridge Quote** (Bridge API):
   - `POST /quote` (Astrolescent Bridge API)
   - **When:** After balance check
   - **Response Time:** ~2-4 seconds
   - **Returns:** Bridge transaction manifest
   - **Expiration:** Quote expires after some time

4. **Submit Bridge Transaction** (Flare Network):
   - `signAndSubmitManifest()` - Signs and submits bridge transaction
   - **When:** After getting bridge quote
   - **Response Time:** ~3-5 seconds
   - **Returns:** Transaction hash (immediate confirmation)

5. **Create Transaction Record** (Supabase):
   - `INSERT INTO transactions` - Creates pending transaction record
   - **When:** After bridge transaction is submitted
   - **Response Time:** ~200-500ms
   - **Status:** "pending"

**Total Request Time:** ~10-15 seconds (synchronous wait)

**Response to User:**
```json
{
  "success": true,
  "message": "Top-up initiated. Processing...",
  "transactionHash": "..."
}
```

**At This Point:**
- ✅ Bridge transaction submitted (pending)
- ✅ Transaction record created (status: "pending")
- ⏳ Waiting for bridge to complete (5-15 minutes)
- ⏳ Waiting for Cashwyre payment webhook

---

#### Step 2: Bridge Completes (External Process)
**Time:** 5-15 minutes after bridge transaction submission

**What Happens:**
- User's USDC is bridged from Flare → Ethereum
- Funds arrive at card's `card_wallet_address` on Ethereum network
- **No API call from our system** - this is external blockchain processing

---

#### Step 3: Cashwyre Detects Payment (Webhook Trigger)
**Webhook:** `POST /api/webhooks/cashwyre-payment`
**Event Type:** `stablecoin.usdc.received.success`

**Timing:**
- Triggered automatically by Cashwyre when they detect USDC payment
- Usually 1-5 minutes after funds arrive on Ethereum
- **Asynchronous** - system doesn't poll, just waits

**Process:**
1. **Log Webhook** (Supabase):
   - `INSERT INTO webhook_logs` - Logs webhook event
   - **When:** Immediately when webhook arrives

2. **Find Card** (Supabase):
   - `SELECT FROM cards WHERE card_wallet_address = <address>`
   - **When:** After logging webhook

3. **Calculate Top-up Amount** (Internal):
   - `calculateTopUpAmount(amount)` - Subtracts processing fee ($2.50)
   - **When:** After finding card
   - **Formula:** `amount - 2.50`

4. **Top-up Card** (Cashwyre API):
   - `POST /CustomerCard/topup`
   - **When:** After calculating amount
   - **Response Time:** ~3-5 seconds
   - **Payload:**
     ```json
     {
       "requestId": "KARDS...",
       "cardCode": "...",
       "amountInUSD": 47.50  // Original amount - $2.50 fee
     }
     ```
   - **Returns:** Success (top-up processed on Cashwyre)

5. **Update Card Balance** (Supabase):
   - `UPDATE cards SET balance = balance + <amount>`
   - **When:** After Cashwyre API call succeeds
   - **Note:** This is a cache - should fetch from Cashwyre API for accuracy

6. **Update Transaction Status** (Supabase):
   - `UPDATE transactions SET status = 'success', amount = <amount> WHERE card_id = <id> AND type = 'top_up' AND status = 'pending'`
   - **When:** After balance update

7. **Update Webhook Status** (Supabase):
   - `UPDATE webhook_logs SET processed = true`
   - **When:** After all updates succeed

**At This Point:**
- ✅ Payment detected by Cashwyre
- ✅ Top-up processed on Cashwyre
- ✅ Card balance updated (cached in Supabase)
- ✅ Transaction status: "success"

**Total Time from User Request:** 10-25 minutes (mostly waiting for webhooks)

---

### 📊 Fetching Card Details

**API Called:** `GET /api/cards/[cardCode]`

**Process:**
1. **Verify Ownership** (Supabase):
   - `SELECT FROM cards WHERE card_code = <code> AND user_id = <id>`
   - **When:** Immediately
   - **Response Time:** ~200-500ms
   - **Returns:** Card reference (has `card_code`)

2. **Fetch Full Details** (Cashwyre API):
   - `POST /CustomerCard/getCard`
   - **When:** After ownership verification
   - **Response Time:** ~2-4 seconds
   - **Payload:**
     ```json
     {
       "requestId": "KARDS...",
       "cardCode": "..."
     }
     ```
   - **Returns:** Full card details (balance, last4, expiry, transactions, etc.)

3. **Merge Data**:
   - Combines Supabase reference + Cashwyre full details
   - **When:** After Cashwyre API response

**Response:**
```json
{
  "success": true,
  "card": {
    // From Supabase:
    "id": "...",
    "user_id": "...",
    "card_name": "...",
    // From Cashwyre API (fresh data):
    "balance": 100.00,
    "last4": "1234",
    "expiryOn": "12/2025",
    "transactions": [...]
  }
}
```

**Key Point:** Card details are **always fetched fresh** from Cashwyre API every time they're requested. Supabase only stores the `card_code` reference.

---

### ⏰ Timeline Summary

#### Card Creation Timeline:
```
T+0s:     User clicks "Create Card"
T+0-25s:  API calls (balance check, create address, insurance fee, bridge quote, submit bridge)
T+25s:    Response to user: "Processing..."
T+5-15m:  Bridge completes (Flare → Ethereum)
T+6-20m:  Cashwyre detects payment → webhook triggers → createCard API called
T+7-25m:  Cashwyre creates card → webhook triggers → card_code stored
T+25m:    Card is active and ready to use
```

#### Top-up Timeline:
```
T+0s:     User enters amount and clicks "Top-up"
T+0-15s:  API calls (verify card, balance check, bridge quote, submit bridge)
T+15s:    Response to user: "Processing..."
T+5-15m:  Bridge completes (Flare → Ethereum)
T+6-20m:  Cashwyre detects payment → webhook triggers → topup API called
T+20m:    Top-up complete, balance updated
```

---

### 🔍 How Webhooks Are Handled

**No Active Polling:**
- System does **NOT** poll Cashwyre API for status updates
- System does **NOT** continuously check transaction status
- System **passively waits** for Cashwyre to send webhooks

**Webhook Processing:**
1. **Vercel receives webhook** → Triggers serverless function
2. **Function logs webhook** → Stores in `webhook_logs` table
3. **Function processes event** → Calls Cashwyre API if needed
4. **Function updates database** → Updates card/transaction status
5. **Function marks webhook as processed** → Sets `processed = true`

**Webhook Reliability:**
- All webhooks are logged before processing
- Failed webhooks can be reprocessed manually (check `webhook_logs` table)
- Webhook processing is idempotent (can be safely retried)

**Error Handling:**
- If webhook processing fails, error is logged in `webhook_logs.error_message`
- `processed` flag remains `false` for failed webhooks
- System can manually reprocess failed webhooks

**Webhook Endpoints:**
- `/api/webhooks/cashwyre-card-created` - Handles `virtualcard.created.success`
- `/api/webhooks/cashwyre-payment` - Handles `stablecoin.usdc.received.success` and `stablecoin.usdt.received.success`

**Webhook Configuration:**
- Webhooks must be configured in Cashwyre dashboard
- URLs point to your Vercel deployment
- Cashwyre sends webhooks automatically when events occur

---

## 💾 Data Storage

### ✅ Stored in Supabase

- **User Data:**
  - Name, email, referral code
  - Total earnings, weekly earnings, referral count
  - Ethereum deposit address
  - ❌ Phone number NOT stored
  - ❌ Address NOT stored
  - ❌ Date of birth NOT stored

- **Wallet Data:**
  - Wallet address (plain text)
  - Private key (encrypted with AES)

- **Card Data (Minimal Reference Only):**
  - `card_code` (used to fetch full details from Cashwyre)
  - Basic status ("processing", "active", "frozen")
  - User-defined card name (for display)
  - Card wallet address (Ethereum, for payment tracking)
  - Temporary `form_data` (used during creation only)
  - Balance, last4, expiry (updated from webhooks but may be stale)

- **Transactions:**
  - All transaction records
  - Amounts, status, descriptions
  - Metadata (JSONB)

- **Referrals:**
  - Referral relationships
  - Earnings per referral
  - Status

- **Auth Codes:**
  - Verification codes
  - Expiration times
  - Usage status

- **Webhook Logs:**
  - All webhook events
  - Full payloads
  - Processing status

### ❌ NOT Stored in Supabase

- **Full Card Details:**
  - Card details are ALWAYS fetched from Cashwyre API in real-time
  - Only `card_code` reference is stored in Supabase
  - Balance, last4, expiry, transactions, etc. are fetched from Cashwyre when needed
  - API endpoint: `/CustomerCard/getCard` - called every time card details are needed

- **User Contact Information:**
  - Phone number (NOT stored) - auto-generated randomly during card creation
  - Country code (NOT stored) - auto-generated randomly during card creation
  - Home address (NOT stored) - auto-generated randomly during card creation
  - Home address number (NOT stored) - auto-generated randomly during card creation
  - Date of birth (NOT stored) - auto-generated randomly during card creation
  - **Note:** These are generated on-the-fly during card creation and only sent to Cashwyre API

- **Card Form Data:**
  - `form_data` in `cards` table is temporary
  - Used only during card creation process
  - Not stored long-term

- **Cashwyre API Responses:**
  - Full API responses are not stored
  - Only `card_code` reference is extracted and stored
  - All card details fetched fresh from Cashwyre API when needed

- **Email Content:**
  - Email messages are sent but content is not stored
  - Only verification codes are stored

- **Telegram Messages:**
  - Support messages are sent to Telegram but not stored in database

- **Bridge Transaction Details:**
  - Bridge transactions are executed but detailed logs are not stored
  - Only transaction records (amount, status) are stored

- **Real-time Balances:**
  - Wallet balances are fetched from external APIs, not stored
  - Card balances may be cached from webhooks but should be fetched from Cashwyre for accuracy

---

## 🔧 Environment Variables

### Required Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cashwyre API
CASHWYRE_BASE_URL=https://businessapi.cashwyre.com/api/v1.0
CASHWYRE_SECRET_KEY=your-secret-key
CASHWYRE_BUSINESS_CODE=your-business-code
CASHWYRE_APP_ID=your-app-id

# Resend (Email)
RESEND_API_KEY=your-resend-api-key

# Telegram Bot (Support)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# JWT
JWT_SECRET=your-jwt-secret

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
```

### Optional Variables

```env
# Network Configuration
NEXT_PUBLIC_FLARE_NETWORK_ID=1
NEXT_PUBLIC_FLARE_DAPP_DEFINITION=your-dapp-definition
```

---

## 📝 Notes

- **No Passwords:** System uses email-based authentication with verification codes
- **Auto-generated Data:** Phone numbers, addresses, dates of birth are auto-generated randomly during card creation and sent to Cashwyre, but NOT stored in Supabase
- **Card Limits:** Users can have maximum 4 cards
- **Request IDs:** All Cashwyre API requests use format `KARDS` + 12 alphanumeric characters
- **Card Type:** All cards are "physical" and "visa" (hardcoded)
- **Private Key Encryption:** Wallet private keys are encrypted with AES before storage
- **Webhook Reliability:** All webhooks are logged for debugging and can be reprocessed if needed

---

## 🚀 Deployment

The application is deployed on **Vercel** as serverless functions. Each API route is a separate serverless function that:

1. Receives HTTP request
2. Authenticates user (if required)
3. Performs database operations (Supabase)
4. Calls external APIs (Cashwyre, Resend, Telegram)
5. Returns JSON response

**Database:** Supabase (PostgreSQL) - hosted separately

**Frontend:** Next.js static pages + API routes on Vercel

---

## 📚 Tech Stack Summary

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Vercel Serverless Functions (Next.js API routes)
- **Database:** Supabase (PostgreSQL)
- **Email:** Resend
- **Card Provider:** Cashwyre API
- **Support:** Telegram Bot API
- **Authentication:** JWT tokens
- **Encryption:** AES (for private keys)

---

## 🔒 Security

- Private keys are encrypted before storage
- JWT tokens for authentication
- Service role key only used server-side
- Webhook validation (should be implemented)
- SQL injection protection (Supabase handles this)
- CORS protection (Vercel handles this)

---

*This README documents the system built on Flare chain, using the same technical approach and architecture as the previous implementation.*
