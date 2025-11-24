-- KARDS Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  eth_deposit_address VARCHAR(255),
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  weekly_earnings DECIMAL(10, 2) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  radix_wallet_address VARCHAR(255) UNIQUE NOT NULL,
  radix_private_key TEXT NOT NULL, -- Encrypted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_code VARCHAR(255) UNIQUE,
  customer_code VARCHAR(255),
  card_wallet_address VARCHAR(255) UNIQUE,
  card_name VARCHAR(100),
  card_type VARCHAR(50),
  card_brand VARCHAR(50),
  status VARCHAR(50) DEFAULT 'processing',
  balance DECIMAL(10, 2) DEFAULT 0,
  last4 VARCHAR(4),
  expiry_on DATE,
  form_data JSONB, -- Store form data for webhook use
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Auth codes table
CREATE TABLE IF NOT EXISTS auth_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- radix_send, radix_receive, bridge, top_up, card_transaction, insurance_fee
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed
  reference VARCHAR(255),
  hash VARCHAR(255),
  recipient_address VARCHAR(255),
  sender_address VARCHAR(255),
  description TEXT,
  webhook_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhook logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  earnings DECIMAL(10, 2) DEFAULT 0.5,
  status VARCHAR(50) DEFAULT 'pending', -- pending, claimed
  week_ending DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cashback claims table
CREATE TABLE IF NOT EXISTS cashback_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  week_ending DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  transaction_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_radix_address ON wallets(radix_wallet_address);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_card_code ON cards(card_code);
CREATE INDEX IF NOT EXISTS idx_cards_wallet_address ON cards(card_wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card_id ON transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_codes_email_expires ON auth_codes(email, expires_at);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_week_ending ON referrals(week_ending);
CREATE INDEX IF NOT EXISTS idx_cashback_claims_user_id ON cashback_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_claims_week_ending ON cashback_claims(week_ending);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);

-- Database Functions

-- Function to increment user earnings
CREATE OR REPLACE FUNCTION increment_earnings(user_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET 
    total_earnings = total_earnings + amount,
    weekly_earnings = weekly_earnings + amount,
    total_referrals = total_referrals + 1
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update card balance
CREATE OR REPLACE FUNCTION update_card_balance(card_id UUID, amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE cards
  SET balance = balance + amount,
      updated_at = NOW()
  WHERE id = card_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp (generic for all tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update users.updated_at
CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger to auto-update cards.updated_at
CREATE TRIGGER trigger_update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger to auto-update wallets.updated_at
CREATE TRIGGER trigger_update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

