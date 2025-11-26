/**
 * Radix Wallet Generation
 * Uses Radix Engine Toolkit to generate wallet addresses and private keys
 */

import { PrivateKey, PublicKey, address } from '@radixdlt/radix-engine-toolkit';
import { bech32 as bech32Encoder } from 'bech32';

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
    // address() expects a string or number, so convert public key to string
    const publicKeyString = publicKey.toString();
    const accountAddressObj = address(publicKeyString);
    
    // Extract the hash from the address object
    // RETK returns: { kind: "Address", value: { kind: "Static", value: "hex_string" } }
    let hashHex: string;
    if (typeof accountAddressObj === 'string') {
      hashHex = accountAddressObj;
    } else if (accountAddressObj && typeof accountAddressObj === 'object') {
      const addrObj = accountAddressObj as any;
      if (addrObj.value && addrObj.value.value && typeof addrObj.value.value === 'string') {
        hashHex = addrObj.value.value;
      } else if (addrObj.value && typeof addrObj.value === 'string') {
        hashHex = addrObj.value;
      } else {
        throw new Error('Unable to extract hash from address object');
      }
    } else {
      throw new Error('Invalid address object returned from RETK');
    }
    
    // Convert hex hash to bytes
    const hashBytes = Buffer.from(hashHex, 'hex');
    
    // Encode as bech32 with Radix account address prefix
    // Radix account addresses use HRP "account_rdx" and version byte 0x01
    const words = bech32Encoder.toWords(hashBytes);
    // Prepend version byte (0x01 for account addresses)
    const versionByte = 0x01;
    const wordsWithVersion = [versionByte, ...words];
    const accountAddress = bech32Encoder.encode('account_rdx', wordsWithVersion);
    
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

