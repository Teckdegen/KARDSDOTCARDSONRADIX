# KARDS - Crypto Debit Card Platform

A full-stack crypto debit card platform built with Vite/React, Vercel serverless functions, Supabase, and Cashwyre API integration.

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
│  Vite/React App │ (Frontend)
│   (Vercel)      │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │        │              │              │
┌───▼───┐ ┌─▼────────┐ ┌──▼────────┐ ┌───▼──────┐
│Supabase│ │Cashwyre  │ │  Resend   │ │ Telegram │
│(Postgres)│ │   API    │ │   Email   │ │   Bot    │
└────────┘ └──────────┘ └───────────┘ └──────────┘
         │
    ┌────┴────────┐
    │             │
┌───▼─────────┐ ┌─▼──────────────┐
│  API Routes │ │ Serverless     │
│  (Vercel)   │ │ Functions      │
└─────────────┘ └────────────────┘
```

**Key Components:**
- **Frontend**: Vite with React 19, TypeScript, Tailwind CSS
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
Sends a verification code to an existing user's email address for login purposes. This endpoint is used when a user wants to log in to their existing account.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Validation Rules:**
- `email` (required): Must be a valid email format (RFC 5322 compliant)
- Email must exist in the `users` table (user must have registered first)

**Process:**
1. Validates email format using `isValidEmail()` utility function
2. Checks if email exists in `users` table
3. If email doesn't exist, returns 404 error: "Email not found. Please create an account first."
4. Generates a new 6-digit numeric code using `generateAuthCode()` (random number between 100000-999999)
5. Sets expiration time to 10 minutes from current time
6. Stores code in `auth_codes` table with fields:
   - `email`: Lowercased email address
   - `code`: 6-digit string
   - `expires_at`: Timestamp (current time + 10 minutes)
   - `used`: false
7. Sends email via Resend API using `sendAuthCode()` function
8. Returns success response

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent to your email"
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Valid email is required"
  }
  ```
- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Email not found. Please create an account first."
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "message": "Failed to generate code"
  }
  ```

**Notes:**
- Codes expire after 10 minutes
- Multiple codes can exist for the same email (only the most recent valid one is checked during verification)
- Codes are single-use (marked as `used: true` after successful verification)

---

#### `POST /api/auth/resend-code`
Resends a verification code to a user's email with rate limiting protection. This endpoint checks if a valid code was recently sent and prevents spamming by enforcing a 10-minute cooldown period.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Validation Rules:**
- `email` (required): Must be a valid email format
- Rate limiting: Cannot request new code if previous code was created less than 10 minutes ago

**Process:**
1. Validates email format
2. Checks for existing unused, unexpired code for this email
3. If valid code exists and less than 10 minutes have passed since creation:
   - Calculates remaining time until resend is allowed
   - Returns 400 error with remaining minutes and seconds
4. If code expired or 10 minutes passed:
   - Marks all previous unused codes for this email as `used: true`
   - Generates new 6-digit code
   - Sets expiration to 10 minutes from now
   - Stores code in `auth_codes` table
   - Sends email via Resend
   - Returns success

**Success Response (200):**
```json
{
  "success": true,
  "message": "New verification code sent to your email"
}
```

**Error Responses:**
- **400 Bad Request (Rate Limited):**
  ```json
  {
    "success": false,
    "message": "Please wait 5 minutes before requesting a new code",
    "canResend": false,
    "remainingSeconds": 300
  }
  ```
- **400 Bad Request (Invalid Email):**
  ```json
  {
    "success": false,
    "message": "Valid email is required"
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "message": "Failed to generate code"
  }
  ```

**Notes:**
- Provides remaining time in both minutes and seconds for user feedback
- Prevents code spam by enforcing cooldown period
- Automatically invalidates previous codes when new one is generated

---

#### `POST /api/auth/verify-code`
Verifies the email verification code and authenticates the user. Upon successful verification, generates a JWT token for subsequent authenticated requests.

**Request Body:**
```json
{
  "email": "john@example.com",
  "code": "123456"
}
```

**Validation Rules:**
- `email` (required): Must be provided
- `code` (required): Must be provided as 6-digit string
- Code must exist for the email
- Code must not be expired (`expires_at > current time`)
- Code must not be used (`used = false`)

**Process:**
1. Validates both email and code are provided
2. Queries `auth_codes` table for matching record:
   - Filters by email (lowercased)
   - Filters by exact code match
   - Filters by `used = false`
   - Filters by `expires_at > current timestamp`
   - Orders by `created_at DESC` to get most recent
   - Limits to 1 result
3. If no valid code found, returns 401 Unauthorized
4. If valid code found:
   - Marks code as used (`used = true`) in database
   - Queries `users` table to find user by email
   - If user doesn't exist, returns 404 (should not happen if using send-code first)
   - Generates JWT token using `generateToken()` with payload:
     ```json
     {
       "userId": "user-uuid",
       "email": "user@example.com"
     }
     ```
   - Returns token and user data

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkIiwiemVtYWlsIjoidXNlckBleGFtcGxlLmNvbSIsImlhdCI6MTYzMzAyNzIwMCwiZXhwIjoxNjMzMTEzNjAwfQ.signature",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Email and code are required"
  }
  ```
- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Invalid or expired code"
  }
  ```
- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Please register first"
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "message": "Internal server error"
  }
  ```

**JWT Token Details:**
- **Algorithm:** HS256 (HMAC SHA-256)
- **Payload:** Contains `userId` (UUID) and `email` (string)
- **Expiration:** Token expires after configured time (check JWT_SECRET and token expiration settings)
- **Usage:** Token must be included in `Authorization: Bearer <token>` header for authenticated requests
- **Storage:** Client stores token in `localStorage.setItem('token', token)`

**Security Notes:**
- Codes are single-use (immediately marked as used)
- Codes expire after 10 minutes
- Most recent code takes precedence if multiple exist
- Email is case-insensitive (lowercased before comparison)

---

#### `POST /api/auth/logout`
Logs the user out by invalidating the session. Note: This is primarily a client-side operation as JWT tokens are stateless. The server endpoint exists for consistency but token removal happens client-side.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{}
```
(No body required)

**Process:**
1. Client removes token from `localStorage.removeItem('token')`
2. Client redirects to `/login` page
3. Server endpoint exists but does not perform token invalidation (stateless JWT design)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Notes:**
- JWT tokens are stateless and cannot be "invalidated" server-side without a token blacklist
- For production, consider implementing a token blacklist in Redis/database if you need server-side logout
- Client-side logout is sufficient for most use cases where token expiration is used

---

### Cards

#### `GET /api/cards`
Retrieves all cards belonging to the authenticated user. Returns cards from Supabase with cached balance, last4, and expiry data. For real-time accurate data, use `GET /api/cards/[cardCode]` to fetch fresh data from Cashwyre API.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:** None (GET request)

**Process:**
1. Extracts and validates JWT token from `Authorization` header
2. Retrieves `userId` from token payload
3. Queries `cards` table:
   ```sql
   SELECT * FROM cards WHERE user_id = <userId> ORDER BY created_at DESC
   ```
4. Returns array of card records with all fields from Supabase

**Success Response (200):**
```json
{
  "success": true,
  "cards": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "card_code": "CARD123456789",
      "customer_code": "CUST123456789",
      "card_name": "My Personal Card",
      "card_brand": "visa",
      "card_type": "physical",
      "card_wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "status": "active",
      "balance": 100.50,
      "last4": "1234",
      "expiry_on": "12/2025",
      "form_data": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:35:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "card_code": "CARD987654321",
      "card_name": "Business Card",
      "status": "processing",
      "balance": null,
      "last4": null,
      "expiry_on": null,
      ...
    }
  ]
}
```

**Error Responses:**
- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized"
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "message": "Failed to fetch cards"
  }
  ```

**Status Values:**
- `"processing"`: Card creation in progress (waiting for webhooks)
- `"active"`: Card is active and ready to use
- `"frozen"`: Card has been frozen by user
- `"cancelled"`: Card creation was cancelled

**Notes:**
- Returns cards ordered by creation date (newest first)
- Balance, last4, and expiry are cached values from webhooks (may be stale)
- For accurate real-time data, use `GET /api/cards/[cardCode]`
- Cards with `status = "processing"` may have `card_code = null` until webhook completes
- `form_data` field is null for completed cards (only used during creation)

**Stored in Supabase:** ✅ Yes (all fields returned are from Supabase `cards` table)

---

#### `GET /api/cards/[cardCode]`
Retrieves detailed information for a specific card. This endpoint combines data from Supabase (reference) and Cashwyre API (real-time details) to provide complete card information including transactions.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**URL Parameters:**
- `cardCode` (path parameter): The Cashwyre card code (e.g., "CARD123456789")

**Request Body:** None (GET request)

**Process:**
1. Extracts and validates JWT token from `Authorization` header
2. Retrieves `userId` from token payload
3. Queries Supabase to find card:
   ```sql
   SELECT * FROM cards WHERE card_code = <cardCode> AND user_id = <userId>
   ```
4. If card not found, returns 404 error
5. If card found and belongs to user:
   - Extracts `card_code` from Supabase record
   - Calls Cashwyre API: `POST /CustomerCard/getCard`
   - Cashwyre request payload:
     ```json
     {
       "appId": "<CASHWYRE_APP_ID>",
       "businessCode": "<CASHWYRE_BUSINESS_CODE>",
       "requestId": "KARDSxxxxxxxxxxxx",
       "cardCode": "<cardCode>"
     }
     ```
   - Receives full card details from Cashwyre:
     ```json
     {
       "success": true,
       "data": {
         "cardCode": "CARD123456789",
         "customerCode": "CUST123456789",
         "balance": 150.75,
         "last4": "1234",
         "expiryOn": "12/2025",
         "status": "active",
         "cardName": "My Personal Card",
         "transactions": [
           {
             "id": "txn1",
             "amount": 50.00,
             "description": "Purchase at Store",
             "date": "2024-01-15T10:00:00Z",
             "type": "debit"
           }
         ],
         ...
       }
     }
     ```
6. Merges Supabase reference data with Cashwyre fresh data
7. Returns combined response

**Success Response (200):**
```json
{
  "success": true,
  "card": {
    // From Supabase (reference data):
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "card_name": "My Personal Card",
    "card_type": "physical",
    "card_brand": "visa",
    "status": "active",
    "card_wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:35:00Z",
    
    // From Cashwyre API (fresh real-time data):
    "card_code": "CARD123456789",
    "customer_code": "CUST123456789",
    "balance": 150.75,
    "last4": "1234",
    "expiryOn": "12/2025",
    "currency": "USD",
    "transactions": [
      {
        "id": "txn123",
        "amount": -50.00,
        "description": "Purchase at Amazon",
        "merchant": "Amazon",
        "date": "2024-01-15T14:30:00Z",
        "type": "debit",
        "status": "completed"
      },
      {
        "id": "txn124",
        "amount": 100.00,
        "description": "Top-up",
        "date": "2024-01-15T10:00:00Z",
        "type": "credit",
        "status": "completed"
      }
    ],
    "metadata": {
      "issuer": "Cashwyre",
      "cardNetwork": "Visa",
      ...
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Card code is required"
  }
  ```
- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized"
  }
  ```
- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Card not found"
  }
  ```
- **500 Internal Server Error (Supabase):**
  ```json
  {
    "success": false,
    "message": "Failed to fetch card"
  }
  ```
- **500 Internal Server Error (Cashwyre API):**
  ```json
  {
    "success": false,
    "message": "Failed to fetch card details from Cashwyre"
  }
  ```

**Notes:**
- **Real-time Data:** All balance, last4, expiry, and transactions are fetched fresh from Cashwyre API every time this endpoint is called
- **Ownership Verification:** System verifies card belongs to authenticated user before fetching from Cashwyre
- **Data Source:** Supabase provides reference data (card name, wallet address, creation date). Cashwyre provides all financial data (balance, transactions, expiry)
- **Transactions:** Returns complete transaction history from Cashwyre API, sorted by date (newest first)
- **Caching:** Cashwyre data is NOT cached - always fetched fresh for accuracy
- **Performance:** Endpoint may take 2-4 seconds due to Cashwyre API call

**Stored in Supabase:** ⚠️ Only reference (`card_code`, `card_name`, `user_id`, `card_wallet_address`, etc.)
**Full details:** Always fetched from Cashwyre API in real-time (never cached)

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

### Card Creation Helpers

These endpoints are used internally by the frontend during the multi-step card creation process. They provide quotes and prepare transactions before final submission.

#### `POST /api/cards/create/bridge-quote`
Gets a bridge quote for the card creation amount. This endpoint is called during card creation to get the transaction manifest needed to bridge funds from Flare to Ethereum.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "phoneCode": "+1",
  "phoneNumber": "1234567890",
  "dateOfBirth": "1990-01-01",
  "homeAddressNumber": "123",
  "homeAddress": "Main Street",
  "cardName": "My Card",
  "initialAmount": 15,
  "walletAddress": "account_tdx_2_129x9zx0x7x9zx..."
}
```

**Validation Rules:**
- `walletAddress` (required): Flare wallet address
- `initialAmount` (required): Minimum $15 USD
- Other fields are optional (used for form data storage)

**Process:**
1. Validates user authentication via JWT token
2. Gets user details from `users` table (first_name, last_name, email, eth_deposit_address)
3. Finds unused Ethereum address from previous cancelled card creations OR creates new one via Cashwyre API
4. Checks USDC balance using `getUSDCBalance(walletAddress)` - must have at least `initialAmount`
5. Checks XRD balance using `checkXRDForBridge(walletAddress)` - must have ~410 XRD for bridge fees
6. Gets bridge quote from Astrolescent Bridge API:
   ```javascript
   POST /quote
   {
     "from": "flare",
     "to": "ethereum",
     "amount": initialAmount,
     "fromAddress": walletAddress,
     "toAddress": ethAddress
   }
   ```
7. Returns bridge quote with manifest

**Success Response (200):**
```json
{
  "success": true,
  "manifest": "CALL_METHOD...",
  "quote": {
    "route": {
      "tx": {
        "manifest": "CALL_METHOD...",
        "message": "..."
      },
      "estimatedTime": 900,
      "fees": {
        "bridge": 0.5,
        "gas": 0.01
      }
    }
  },
  "ethAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Error Responses:**
- **400 Bad Request (Insufficient USDC):**
  ```json
  {
    "success": false,
    "message": "Insufficient USDC balance. You need $15 USDC. You have $10.00 USDC"
  }
  ```
- **400 Bad Request (Insufficient XRD):**
  ```json
  {
    "success": false,
    "message": "Insufficient XRD for bridge transaction. You need roughly 410 XRD. Current: 100.00 XRD"
  }
  ```
- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized"
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "message": "Failed to get bridge quote"
  }
  ```

**Notes:**
- Bridge quote expires after a certain time (check Astrolescent Bridge API documentation)
- Quote includes transaction manifest that must be signed and submitted
- Ethereum address is reused from cancelled card creations if available
- Used internally by frontend before submitting final card creation

---

#### `POST /api/cards/create/insurance-quote`
Gets the insurance fee quote and transaction manifest. This endpoint prepares the $10 insurance fee payment that must be sent before card creation.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "walletAddress": "account_tdx_2_129x9zx0x7x9zx..."
}
```

**Validation Rules:**
- `walletAddress` (required): Flare wallet address
- USDC balance must be at least $10

**Process:**
1. Validates user authentication
2. Gets insurance wallet address from `CASHBACK_WALLET_ADDRESS` environment variable
3. Checks USDC balance using `getUSDCBalance(walletAddress)` - must have at least $10
4. Builds transfer manifest using `buildTransferManifest()`:
   ```javascript
   buildTransferManifest(
     walletAddress,           // From: User's Flare wallet
     insuranceWalletAddress,  // To: Insurance wallet (CASHBACK_WALLET_ADDRESS)
     10                       // Amount: $10 USDC
   )
   ```
5. Returns manifest and payment details

**Success Response (200):**
```json
{
  "success": true,
  "manifest": "CALL_METHOD...",
  "amount": 10,
  "recipient": "account_tdx_2_129x9zx0x7x9zx..."
}
```

**Error Responses:**
- **400 Bad Request (Insufficient USDC):**
  ```json
  {
    "success": false,
    "message": "Insufficient USDC balance. You need $10 USDC. You have $5.00 USDC"
  }
  ```
- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized"
  }
  ```
- **500 Internal Server Error (Missing Config):**
  ```json
  {
    "success": false,
    "message": "Insurance wallet not configured"
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "message": "Failed to generate insurance quote"
  }
  ```

**Insurance Fee Details:**
- **Amount:** Fixed $10 USDC per card creation
- **Recipient:** Configured in `CASHBACK_WALLET_ADDRESS` environment variable
- **Purpose:** Insurance fee required by Cashwyre before card issuance
- **Timing:** Must be paid before bridge transaction is submitted
- **Transaction Type:** Direct USDC transfer on Flare network

**Notes:**
- Insurance fee is separate from the card funding amount
- Total needed for card creation = $10 insurance + initialAmount + ~410 XRD for gas
- Manifest must be signed with user's private key and submitted to Flare network
- Used internally by frontend during multi-step card creation process

---

#### `POST /api/cards/create/confirm-insurance`
Confirms that the insurance fee payment has been completed. This endpoint stores the transaction hash to track insurance payment before proceeding with card creation.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "walletAddress": "account_tdx_2_129x9zx0x7x9zx...",
  "transactionHash": "txid_129x9zx0x7x9zx..."
}
```

**Validation Rules:**
- `walletAddress` (required): Flare wallet address
- `transactionHash` (required): Transaction hash from insurance payment

**Process:**
1. Validates user authentication
2. Validates both walletAddress and transactionHash are provided
3. Stores insurance payment confirmation (implementation may vary - could use session storage, temporary table, or Redis)
4. Returns success with transaction hash

**Success Response (200):**
```json
{
  "success": true,
  "message": "Insurance payment confirmed",
  "transactionHash": "txid_129x9zx0x7x9zx..."
}
```

**Error Responses:**
- **400 Bad Request:**
  ```json
  {
    "success": false,
    "message": "Wallet address and transaction hash are required"
  }
  ```
- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized"
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "message": "Failed to confirm insurance payment"
  }
  ```

**Notes:**
- This endpoint is used to confirm insurance payment before proceeding with bridge transaction
- Transaction verification happens when creating the card (checks blockchain)
- In production, you might want to verify the transaction on-chain before confirming
- Used internally by frontend to track multi-step payment flow

---

#### `POST /api/cards/[cardCode]/topup/quote`
Gets a bridge quote for card top-up. This endpoint is called during the top-up process to get the transaction manifest needed to bridge funds from Flare to Ethereum for the card's wallet address.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**URL Parameters:**
- `cardCode` (path parameter): The Cashwyre card code

**Request Body:**
```json
{
  "amount": 50,
  "walletAddress": "account_tdx_2_129x9zx0x7x9zx..."
}
```

**Validation Rules:**
- `amount` (required): Minimum $6 USD
- `walletAddress` (required): Flare wallet address
- Card must belong to authenticated user

**Process:**
1. Validates user authentication
2. Verifies user owns the card (queries `cards` table where `card_code = cardCode AND user_id = userId`)
3. Validates amount is at least $6
4. Checks card has `card_wallet_address` (Ethereum address for receiving funds)
5. Checks USDC balance using `getUSDCBalance(walletAddress)` - must have at least `amount`
6. Checks XRD balance using `checkXRDForBridge(walletAddress)` - must have ~410 XRD for bridge fees
7. Gets bridge quote from Astrolescent Bridge API:
   ```javascript
   POST /quote
   {
     "from": "flare",
     "to": "ethereum",
     "amount": amount,
     "fromAddress": walletAddress,
     "toAddress": card.card_wallet_address
   }
   ```
8. Returns bridge quote with manifest

**Success Response (200):**
```json
{
  "success": true,
  "manifest": "CALL_METHOD...",
  "quote": {
    "route": {
      "tx": {
        "manifest": "CALL_METHOD...",
        "message": "..."
      },
      "estimatedTime": 900,
      "fees": {
        "bridge": 0.5,
        "gas": 0.01
      }
    }
  }
}
```

**Error Responses:**
- **400 Bad Request (Invalid Amount):**
  ```json
  {
    "success": false,
    "message": "Minimum top-up amount is $6 USDC"
  }
  ```
- **400 Bad Request (Insufficient USDC):**
  ```json
  {
    "success": false,
    "message": "Insufficient USDC balance. You need $50 USDC. You have $30.00 USDC"
  }
  ```
- **400 Bad Request (Insufficient XRD):**
  ```json
  {
    "success": false,
    "message": "Insufficient XRD for bridge transaction. You need roughly 410 XRD for Ethereum tx cost and bridge fee. Current: 200.00 XRD"
  }
  ```
- **401 Unauthorized:**
  ```json
  {
    "success": false,
    "message": "Unauthorized"
  }
  ```
- **404 Not Found:**
  ```json
  {
    "success": false,
    "message": "Card not found"
  }
  ```
- **500 Internal Server Error:**
  ```json
  {
    "success": false,
    "message": "Failed to get bridge quote"
  }
  ```

**Notes:**
- Bridge quote expires after a certain time (must use quote promptly)
- Quote includes transaction manifest that must be signed and submitted
- Funds are bridged to the card's `card_wallet_address` (unique Ethereum address per card)
- Processing fee of $2.50 is deducted when Cashwyre processes the top-up
- Used internally by frontend before submitting final top-up transaction

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

**Frontend:** Vite/React app deployed on Vercel
**Backend:** Vercel Serverless Functions (API routes)

---

## 📚 Tech Stack Summary

- **Frontend:** Vite, React 19, TypeScript, Tailwind CSS
- **Backend:** Vercel Serverless Functions (API routes)
- **Database:** Supabase (PostgreSQL)
- **Email:** Resend
- **Card Provider:** Cashwyre API
- **Support:** Telegram Bot API
- **Authentication:** JWT tokens
- **Encryption:** AES (for private keys)

---

## 🎨 Frontend Pages & Components

### Pages

#### `/` (Home/Splash Screen)
**Purpose:** Initial landing page with splash screen and authentication routing.

**Features:**
- Displays animated splash screen with logo
- Auto-redirects based on authentication status:
  - If token exists: Redirects to `/cards`
  - If no token: Redirects to `/login`
- Smooth transition animations

**Components Used:**
- `SplashScreen` component

---

#### `/login` (Login Page)
**Purpose:** User authentication page with email-based login.

**Features:**
- Email input field
- "Send Code" button - calls `POST /api/auth/send-code`
- Code input field (6 digits) - uses `CodeInput` component
- "Verify Code" button - calls `POST /api/auth/verify-code`
- "Resend Code" link - calls `POST /api/auth/resend-code` (with rate limiting)
- Redirects to `/cards` on successful authentication
- Link to registration page

**Components Used:**
- `GlassInput` - Styled input fields
- `GlassButton` - Styled buttons
- `CodeInput` - 6-digit code input with auto-focus
- `AnimatedBackground` - Global animated background

**API Calls:**
- `POST /api/auth/send-code`
- `POST /api/auth/verify-code`
- `POST /api/auth/resend-code`

---

#### `/register` (Registration Page)
**Purpose:** New user account creation page.

**Features:**
- First name input field
- Last name input field
- Email input field
- Referral code input field (optional)
- "Create Account" button - calls `POST /api/auth/register`
- Automatic wallet generation (backend)
- Email verification code sent after registration
- Code verification input (same flow as login)
- Redirects to `/dashboard` on successful registration and verification

**Validation:**
- Email format validation
- Referral code format validation
- Checks if referral code exists in database

**Components Used:**
- `GlassInput`
- `GlassButton`
- `CodeInput`
- `Header` - Back button

**API Calls:**
- `POST /api/auth/register`
- `POST /api/auth/verify-code`

---

#### `/dashboard` (Dashboard Page)
**Purpose:** Main user dashboard displaying wallet balance, send/receive functionality, and transaction history.

**Features:**
- **Wallet Balance Section:**
  - USDC balance display (fetched from Flare network)
  - XRD balance display (fetched from Flare network)
  - Flare wallet address display
  - QR code for receiving funds (opens in modal)
  - "Send" button - opens `SendModal`
  - "Receive" button - opens `ReceiveModal`
  
- **Wallet Activity Section:**
  - Transaction list with:
    - Transaction type (flare_send, flare_receive, bridge, top_up, card_creation, insurance_fee)
    - Amount
    - Status (pending, success, failed)
    - Description
    - Date/time
  - Scrollable list (touches bottom of screen, doesn't touch wallet balance section)
  - Real-time updates (refreshes on mount)

**Layout:**
- Full-height layout (fills entire screen)
- Vertical spacing between sections (`space-y-6`)
- Wallet balance card has `min-h-[220px]` for taller feel
- Wallet activity card positioned at bottom

**Components Used:**
- `GlassCard` - Container for wallet balance and transactions
- `GlassButton` - Send and Receive buttons
- `SendModal` - Modal for sending funds
- `ReceiveModal` - Modal for receiving funds with QR code
- `Header` - Page title (hidden, only back button shown)
- `BottomNav` - Bottom navigation bar

**API Calls:**
- `GET /api/wallet/balance` - Fetches USDC/XRD balances and wallet address
- `GET /api/wallet/transactions` - Fetches transaction history

---

#### `/cards` (Cards List Page)
**Purpose:** Displays all user's cards with quick actions.

**Features:**
- List of all user cards:
  - Card name
  - Card status (processing, active, frozen)
  - Last 4 digits (if available)
  - Balance (cached from Supabase, may be stale)
  - Expiry date (if available)
- "Create Card" button - navigates to `/cards/create`
- Click card to view details - navigates to `/cards/[cardCode]`
- Empty state when no cards exist
- Loading state while fetching cards

**Card Status Display:**
- `processing` - Shows "Processing..." badge
- `active` - Shows "Active" badge with green color
- `frozen` - Shows "Frozen" badge with red color
- `cancelled` - Shows "Cancelled" badge with gray color

**Components Used:**
- `GlassCard` - Individual card display
- `GlassButton` - Create card button
- `Header` - Page title (hidden)
- `BottomNav` - Bottom navigation

**API Calls:**
- `GET /api/cards` - Fetches all user cards

---

#### `/cards/create` (Card Creation Page)
**Purpose:** Multi-step form for creating a new debit card.

**Features:**
- **Step 1: Card Information**
  - Card name input (required)
  - Referral code input (optional)
  - Initial amount input (minimum $15, required)
  - "Next" button

- **Step 2: Review & Confirm**
  - Displays summary of entered information
  - Shows: "Contact information will be generated automatically"
  - Shows: "Address information will be generated automatically"
  - "Create Card" button - calls `POST /api/cards/create`

**Auto-Generated Fields (Backend, Not Shown to User):**
- Phone country code (random selection from all countries)
- Phone number (random, valid format for selected country)
- Date of birth (random, 25-65 years old)
- Home address number (random)
- Home address (random street name, city, country based on phone code)
- Card type: Always "physical" (hardcoded)
- Card brand: Always "visa" (hardcoded)

**Form Validation:**
- Card name: Required, non-empty
- Initial amount: Required, minimum $15
- Referral code: Optional, validated if provided (must exist in database)

**Processing Flow:**
1. User fills form and clicks "Create Card"
2. Frontend calls `POST /api/cards/create`
3. Backend validates and processes (see Card Creation Flow section)
4. User sees "Processing..." message
5. Card appears in list with status "processing"
6. Status updates to "active" when webhook completes

**Components Used:**
- `GlassInput` - Input fields
- `GlassButton` - Next and Create buttons
- `GlassCard` - Form container
- `Header` - Back button (hidden title)
- `BottomNav` - Bottom navigation

**Step Indicator:**
- Shows progress: Step 1 of 2, Step 2 of 2
- Visual indicator with active/inactive states

**API Calls:**
- `POST /api/cards/create` - Creates card (handles entire flow including bridge)

---

#### `/cards/[cardCode]` (Card Details Page)
**Purpose:** Detailed view of a specific card with full information and actions.

**Features:**
- **Card Information Display:**
  - Card name
  - Card status (active, frozen, processing)
  - Last 4 digits
  - Expiry date
  - Balance (fresh from Cashwyre API)
  
- **Quick Actions:**
  - "Freeze" button (if active) - calls `POST /api/cards/[cardCode]/freeze`
  - "Unfreeze" button (if frozen) - calls `POST /api/cards/[cardCode]/unfreeze`
  - "Top Up" button - navigates to `/cards/[cardCode]/topup`
  
- **Transaction History:**
  - List of all card transactions from Cashwyre API
  - Transaction details:
    - Date/time
    - Description/merchant
    - Amount (debit/credit)
    - Type
    - Status

**Data Source:**
- Card reference: From Supabase (`card_code`, `card_name`, `status`)
- Card details: From Cashwyre API (`balance`, `last4`, `expiryOn`, `transactions`)
- Always fetches fresh data from Cashwyre on page load

**Components Used:**
- `GlassCard` - Card information display
- `GlassButton` - Action buttons
- `Header` - Back button
- `BottomNav` - Bottom navigation

**API Calls:**
- `GET /api/cards/[cardCode]` - Fetches complete card details (Supabase + Cashwyre)
- `POST /api/cards/[cardCode]/freeze` - Freezes card
- `POST /api/cards/[cardCode]/unfreeze` - Unfreezes card

---

#### `/cards/[cardCode]/topup` (Top-up Page)
**Purpose:** Page for adding funds to a card.

**Features:**
- Amount input field (minimum $6)
- Current card balance display
- "Top Up" button - calls `POST /api/cards/[cardCode]/topup`
- Processing indicator
- Success/error messages
- Redirects to card details after successful top-up

**Validation:**
- Amount must be at least $6
- Amount must not exceed available USDC balance (checked backend)

**Components Used:**
- `GlassInput` - Amount input
- `GlassButton` - Top-up button
- `GlassCard` - Form container
- `Header` - Back button
- `BottomNav` - Bottom navigation

**API Calls:**
- `POST /api/cards/[cardCode]/topup` - Initiates top-up (handles bridge transaction)

---

#### `/referrals` (Referrals Page)
**Purpose:** Referral program dashboard with earnings, leaderboard, and referral code.

**Features:**
- **Referral Code Display:**
  - User's unique referral code (copyable)
  - Share button
  
- **Statistics Section:**
  - Weekly earnings (USDC)
  - All-time earnings (USDC)
  - Total referrals count
  
- **Leaderboard:**
  - Top referrers by weekly earnings
  - Shows rank, username, earnings
  - Scrollable list
  
- **Referral History:**
  - List of all user's referrals
  - Shows: Referred user, status (pending/completed), earnings, date
  
- **Claim Cashback Button:**
  - Transfers earnings to wallet
  - Resets weekly earnings
  - Calls `POST /api/referrals/claim`

**Mobile Layout:**
- On mobile: Cashback and stats appear above, leaderboard below
- On desktop: Multi-column layout (`lg:grid-cols-3`)

**Components Used:**
- `GlassCard` - Sections container
- `GlassButton` - Claim button, copy code button
- `Header` - Page title (hidden, only back button)
- `BottomNav` - Bottom navigation

**API Calls:**
- `GET /api/referrals/my-code` - Gets referral code
- `GET /api/referrals/stats` - Gets statistics
- `GET /api/referrals/leaderboard` - Gets leaderboard
- `GET /api/referrals/history` - Gets referral history
- `POST /api/referrals/claim` - Claims cashback

---

#### `/settings` (Settings Page)
**Purpose:** User profile and account settings.

**Features:**
- **Profile Card:**
  - User avatar (initials)
  - Full name display
  - Email address
  - User ID (first 8 characters)
  - Member since date
  
- **Settings Options:**
  - Security settings button (placeholder)
  - Notifications toggle (visual only)
  - Sign out button - opens `LogoutModal`

**Components Used:**
- `GlassCard` - Profile card
- `LogoutModal` - Confirmation modal for logout
- `Header` - Page title ("Settings")
- `BottomNav` - Bottom navigation

**API Calls:**
- `GET /api/user/profile` - Fetches user profile

---

#### `/support` (Support Page)
**Purpose:** Contact support form.

**Features:**
- Name input field
- Email input field (pre-filled if logged in)
- Subject input field
- Message textarea
- "Send Message" button - calls `POST /api/support/contact`
- Success/error messages
- Messages sent to Telegram Bot

**Components Used:**
- `GlassInput` - Input fields
- `GlassButton` - Send button
- `GlassCard` - Form container
- `Header` - Page title
- `BottomNav` - Bottom navigation

**API Calls:**
- `POST /api/support/contact` - Sends support message to Telegram

---

### Components

#### `AnimatedBackground` (Global Background)
**Purpose:** Provides animated Three.js-based particle system and card stream as global background for all pages.

**Features:**
- Three.js particle system
- Scrolling card strip animation
- Scanner effect animation
- Fixed positioning (`fixed inset-0`)
- Behind content (`z-index: -10`)
- Non-interactive (`pointer-events-none`)
- Blur effect applied via CSS

**Technical Details:**
- Uses `three` library
- Renders Canvas with particles
- CSS animations for card stream
- No user interaction (purely visual)

---

#### `BottomNav` (Bottom Navigation)
**Purpose:** Fixed bottom navigation bar for mobile navigation.

**Features:**
- Navigation items:
  - Dashboard icon
  - Cards icon
  - Referrals icon
  - Settings icon
- Active state highlighting
- Fixed position at bottom
- Glassmorphism styling

---

#### `CodeInput` (Verification Code Input)
**Purpose:** 6-digit code input component with auto-focus.

**Features:**
- 6 individual input boxes
- Auto-focuses next box on input
- Auto-focuses previous box on backspace
- Numeric-only input
- Styled with glassmorphism

---

#### `GlassButton` (Styled Button)
**Purpose:** Reusable button component with glassmorphism styling.

**Features:**
- Multiple variants (primary, secondary, danger)
- Uppercase text
- Bold font (Bangers)
- Cream borders and shadows
- Hover effects
- Disabled state

---

#### `GlassCard` (Container Card)
**Purpose:** Reusable card container with glassmorphism styling.

**Features:**
- Glass effect background
- Cream borders
- Rounded corners
- Glow effects
- Reduced variant for subtle backgrounds

---

#### `GlassInput` (Styled Input)
**Purpose:** Reusable input field with glassmorphism styling.

**Features:**
- Glass effect background
- Cream borders
- Cream text color
- Bold font
- Focus states
- Placeholder styling

---

#### `Header` (Page Header)
**Purpose:** Page header with title and back button.

**Features:**
- Back button (always shown)
- Title text (hidden per user request)
- Centered or left-aligned options
- Glass styling

---

#### `Logo` (Brand Logo)
**Purpose:** Displays the KARDS brand logo.

**Features:**
- Logo image display
- Responsive sizing
- Link to home page

---

#### `LogoutModal` (Logout Confirmation)
**Purpose:** Confirmation modal for logout action.

**Features:**
- Confirmation message
- "Cancel" button
- "Sign Out" button
- Calls logout handler on confirm
- Removes token from localStorage
- Redirects to login

---

#### `Notification` (Toast Notification)
**Purpose:** Displays temporary success/error messages.

**Features:**
- Multiple variants (success, error, warning, info)
- Auto-dismiss after timeout
- Slide-in animation
- Position options (top, bottom)

---

#### `ReceiveModal` (Receive Funds Modal)
**Purpose:** Displays wallet address and QR code for receiving funds.

**Features:**
- Large QR code (480x480 pixels, displayed as 320x320)
- Wallet address display (clickable to copy)
- No separate copy button (address itself is clickable)
- "Copied!" confirmation message
- Auto-dismisses after copy

**API Calls:**
- `GET /api/wallet/address` - Gets wallet address (passed as prop)

---

#### `SendModal` (Send Funds Modal)
**Purpose:** Modal for sending funds from wallet.

**Features:**
- Recipient address input
- Amount input
- Send button
- Validation
- Success/error messages

**API Calls:**
- `POST /api/wallet/send` - Sends funds

---

#### `SplashScreen` (Splash Screen)
**Purpose:** Animated splash screen shown on app load.

**Features:**
- Logo animation
- Loading animation
- Auto-dismisses after animation
- Calls `onFinish` callback when done

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
