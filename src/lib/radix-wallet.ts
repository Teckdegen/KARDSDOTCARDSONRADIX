/**
 * Radix Wallet Generation
 * Uses Radix Engine Toolkit to generate wallet addresses and private keys
 */

import { PrivateKey, PublicKey, address, AccountAddress } from '@radixdlt/radix-engine-toolkit';

export interface RadixWallet {
  address: string;
  privateKey: string;
  publicKey: string;
}

/**
 * Generate a new Radix wallet using Radix Engine Toolkit
 */
export async function generateRadixWallet(): Promise<RadixWallet> {
  try {
    // Generate random bytes for private key (32 bytes for Ed25519)
    const crypto = await import('crypto');
    const randomBytes = crypto.randomBytes(32);
    
    // Convert Buffer to Uint8Array for RETK
    const keyBytes = new Uint8Array(randomBytes);
    
    // Create Ed25519 private key from random bytes using constructor
    const privateKey = new PrivateKey.Ed25519(keyBytes);
    
    // Derive public key from private key
    const publicKey = privateKey.publicKey();
    
    // Derive account address from public key using RETK's address function
    const accountAddressObj = address(publicKey);
    
    // Extract the address string - RETK returns an Address object with structure:
    // { kind: "Static", value: "account_rdx..." } or similar
    let accountAddress: string;
    
    if (typeof accountAddressObj === 'string') {
      accountAddress = accountAddressObj;
    } else if (accountAddressObj && typeof accountAddressObj === 'object') {
      const addrObj = accountAddressObj as any;
      
      // Try toString() first
      if (typeof addrObj.toString === 'function') {
        const str = addrObj.toString();
        if (str && str.startsWith('account_rdx')) {
          accountAddress = str;
        } else {
          // If toString doesn't give us the right format, try value property
          if (addrObj.value && typeof addrObj.value === 'string') {
            accountAddress = addrObj.value;
          } else if (addrObj.value && typeof addrObj.value === 'object' && addrObj.value.value) {
            accountAddress = addrObj.value.value;
          } else {
            accountAddress = str;
          }
        }
      } else if (addrObj.value && typeof addrObj.value === 'string') {
        accountAddress = addrObj.value;
      } else if (addrObj.value && typeof addrObj.value === 'object' && addrObj.value.value) {
        accountAddress = addrObj.value.value;
      } else {
        accountAddress = String(accountAddressObj);
      }
    } else {
      accountAddress = String(accountAddressObj);
    }
    
    // Log for debugging if address doesn't have expected format
    if (!accountAddress.startsWith('account_rdx')) {
      console.warn('Generated address does not start with account_rdx:', accountAddress);
    }
    
    return {
      address: accountAddress,
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
    };
  } catch (error) {
    console.error('Error generating Radix wallet:', error);
    throw new Error(`Failed to generate Radix wallet: ${error instanceof Error ? error.message : String(error)}`);
  }
}

