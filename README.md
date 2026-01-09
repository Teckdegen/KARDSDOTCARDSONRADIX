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
- `radix_wallet_address` (text) - Wallet address (plain text)
- `radix_private_key` (text) - Encrypted private key (AES encryption)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Stored in Supabase:** ✅ Yes
- Address: **Plain text**
- Private Key: **Encrypted** (AES encryption)

---

#### `cards`
Stores card information.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → users.id)
- `card_code` (text) - Cashwyre card code (set after card creation)
- `customer_code` (text) - Cashwyre customer code
- `card_name` (text) - User-defined card name
- `card_brand` (text) - Always "visa"
- `card_type` (text) - Always "physical"
- `card_wallet_address` (text) - Ethereum address for this card
- `status` (text) - "processing", "active", "frozen", "cancelled"
- `balance` (numeric) - Card balance in USD
- `last4` (text) - Last 4 digits of card
- `expiry_on` (text) - Card expiry date
- `form_data` (jsonb) - Stored form data during card creation
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Stored in Supabase:** ✅ Yes
- All card metadata is stored locally
- Card codes come from Cashwyre webhooks

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
  - `radix_send` - Radix wallet send
  - `radix_receive` - Radix wallet receive
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

**Stored in Supabase:** ✅ Yes

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
4. Gets bridge quote from Astrolescent Bridge API
5. Signs and submits bridge transaction (Radix → Ethereum)
6. Creates Ethereum deposit address via Cashwyre API
7. Creates card record in `cards` table with status "processing"
8. Stores form data in `form_data` JSONB column
9. Creates transaction record
10. Returns success

**Note:** Card is created asynchronously. Cashwyre webhook updates card when ready.

**Stored in Supabase:** ✅ Yes (card metadata, form data)

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

**Stored in Supabase:** ✅ Yes (transaction record)

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

**Stored in Supabase:** ✅ Yes (from `wallets.radix_wallet_address`)

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
- `POST /CustomerCard/createCard` - Creates a new card
- `POST /CustomerCard/topup` - Tops up a card
- `POST /CustomerCard/freeze` - Freezes a card
- `POST /CustomerCard/unfreeze` - Unfreezes a card
- `POST /CustomerCard/getCardDetails` - Gets card details
- `POST /CustomerCard/getCardTransactions` - Gets card transactions
- `POST /CustomerAddress/createAddress` - Creates Ethereum deposit address

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

**Stored in Supabase:** ❌ No (only API responses are used, not stored)

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
   - Gets bridge quote (Radix → Ethereum)
   - Signs and submits bridge transaction
   - Creates Ethereum address via Cashwyre API
   - Creates card record in `cards` table:
     - Status: "processing"
     - `card_code`: null (will be set by webhook)
     - `form_data`: Stores all form data as JSONB
     - `card_wallet_address`: Ethereum address
   - Creates transaction record (type: "card_creation", status: "pending")

3. **Payment Processing:**
   - User's funds are bridged from Radix to Ethereum
   - Funds arrive at `card_wallet_address`

4. **Webhook Trigger:**
   - Cashwyre detects payment
   - Sends webhook: `stablecoin.usdc.received.success`
   - System receives webhook at `/api/webhooks/cashwyre-payment`
   - System finds pending card by `card_wallet_address`
   - System calls Cashwyre `createCard` API with stored `form_data`
   - Cashwyre creates card

5. **Card Created:**
   - Cashwyre sends webhook: `virtualcard.created.success`
   - System receives webhook at `/api/webhooks/cashwyre-card-created`
   - System updates card:
     - `card_code`: Set from webhook
     - `status`: "active"
     - `balance`: Initial amount
     - `last4`: Last 4 digits
     - `expiry_on`: Expiry date

**Stored in Supabase:** ✅ Yes (card metadata, form_data, transactions)

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
   - User's funds are bridged from Radix to Ethereum
   - Funds arrive at card's `card_wallet_address`

4. **Webhook Trigger:**
   - Cashwyre detects payment
   - Sends webhook: `stablecoin.usdc.received.success`
   - System receives webhook at `/api/webhooks/cashwyre-payment`
   - System finds card by `card_wallet_address`
   - System calculates top-up amount (minus processing fee)
   - System calls Cashwyre `topup` API
   - System updates card balance
   - System updates transaction status to "success"

**Stored in Supabase:** ✅ Yes (card balance, transaction status)

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

## 💾 Data Storage

### ✅ Stored in Supabase

- **User Data:**
  - Name, email, referral code
  - Total earnings, weekly earnings, referral count
  - Ethereum deposit address

- **Wallet Data:**
  - Wallet address (plain text)
  - Private key (encrypted with AES)

- **Card Data:**
  - All card metadata (name, code, balance, status, etc.)
  - Form data (stored as JSONB during creation)
  - Card wallet address (Ethereum)

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

- **Cashwyre API Responses:**
  - API responses are used but not stored
  - Only metadata extracted from responses is stored

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
  - Card balances are stored (from Cashwyre webhooks)

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
NEXT_PUBLIC_RADIX_NETWORK_ID=1
NEXT_PUBLIC_RADIX_DAPP_DEFINITION=your-dapp-definition
```

---

## 📝 Notes

- **No Passwords:** System uses email-based authentication with verification codes
- **Auto-generated Data:** Phone numbers, addresses, dates of birth are auto-generated during card creation
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

*This README excludes Radix blockchain implementation details as requested.*
