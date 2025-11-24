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
    // Generate a new Ed25519 private key
    const privateKey = PrivateKey.generateNew();
    
    // Derive public key from private key
    const publicKey = privateKey.publicKey();
    
    // Derive account address from public key using RETK's address function
    const accountAddress = address(publicKey);
    
    return {
      address: accountAddress,
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
    };
  } catch (error) {
    console.error('Error generating Radix wallet:', error);
    throw new Error(`Failed to generate Radix wallet: ${error}`);
  }
}

