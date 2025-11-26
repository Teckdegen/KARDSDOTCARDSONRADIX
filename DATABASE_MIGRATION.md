# Database Migration Notes

## Wallet Schema Changes

The `wallets` table still contains `radix_wallet_address` and `radix_private_key` columns, but these are now **unused** since we've moved to external Radix wallet connections.

### Current Status
- **radix_wallet_address**: Column exists but is no longer populated during registration
- **radix_private_key**: Column exists but is no longer populated during registration

### Optional Cleanup
If you want to remove these columns in the future, you can run:

```sql
ALTER TABLE wallets 
DROP COLUMN IF EXISTS radix_wallet_address,
DROP COLUMN IF EXISTS radix_private_key;
```

**Note**: Only do this if you're sure no existing data depends on these columns. For now, they can remain unused.

### New Flow
- Users connect their own external Radix wallets via browser extension
- Wallet addresses are stored temporarily in the frontend during transactions
- No server-side wallet storage is needed


