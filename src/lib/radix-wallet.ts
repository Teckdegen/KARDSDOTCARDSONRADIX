/**
 * Radix Wallet Generation
 * Uses Radix Engine Toolkit to generate wallet addresses and private keys
 */

import { PrivateKey, PublicKey, address } from '@radixdlt/radix-engine-toolkit';

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
    // address() expects a PublicKey object, not a string
    const accountAddressObj = address(publicKey);
    // Extract the address string - RETK returns an Address object with a value property
    const accountAddress = typeof accountAddressObj === 'string' 
      ? accountAddressObj 
      : (accountAddressObj as any).value || accountAddressObj.toString();
    
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

