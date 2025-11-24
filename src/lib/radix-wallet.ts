/**
 * Radix Wallet Generation
 * Uses Radix Engine Toolkit to generate wallet addresses and private keys
 */

import { PrivateKey, PublicKey, AccountAddress } from '@radixdlt/radix-engine-toolkit';

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
    // Generate a new private key
    const privateKey = PrivateKey.generateNew();
    
    // Derive public key from private key
    const publicKey = privateKey.publicKey();
    
    // Derive account address from public key
    const accountAddress = AccountAddress.fromPublicKey(publicKey);
    
    return {
      address: accountAddress.toString(),
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString(),
    };
  } catch (error) {
    console.error('Error generating Radix wallet:', error);
    throw new Error(`Failed to generate Radix wallet: ${error}`);
  }
}

