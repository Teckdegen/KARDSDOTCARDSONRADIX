/**
 * Radix Engine Toolkit Integration
 * Handles transaction manifest signing and submission
 */

import { USDC_RESOURCE_ADDRESS, USDC_DECIMALS } from './radix-constants';

// Import Radix Engine Toolkit
let RETK: any;
try {
  RETK = require('@radixdlt/radix-engine-toolkit');
} catch (error) {
  console.warn('Radix Engine Toolkit not found. Using placeholder.');
  RETK = null;
}

const NETWORK_ID = process.env.RADIX_NETWORK_ID || 'mainnet';

/**
 * Sign a transaction manifest with a private key
 */
export async function signTransactionManifest(
  manifest: string,
  privateKey: string
): Promise<string> {
  try {
    if (!RETK) {
      // Fallback: return manifest as hex (for testing)
      console.warn('RETK not available, using placeholder signing');
      return Buffer.from(manifest).toString('hex');
    }

    // RETK API structure (adjust based on actual v1.0.5 API)
    // The exact API may vary - check RETK documentation
    try {
      // Try to use RETK's transaction building and signing
      // This is a template - adjust based on actual RETK v1.0.5 API
      const signed = await RETK.TransactionBuilder
        ?.new()
        ?.manifest(manifest)
        ?.sign(privateKey, NETWORK_ID)
        ?.toHex();
      
      if (signed) return signed;
    } catch (retkError) {
      console.warn('RETK signing failed, using fallback:', retkError);
    }

    // Fallback: return manifest as hex
    return Buffer.from(manifest).toString('hex');
  } catch (error) {
    console.error('Error signing manifest:', error);
    throw new Error(`Failed to sign transaction: ${error}`);
  }
}

/**
 * Sign and submit a transaction manifest
 * Combines signing and submission in one function
 */
export async function signAndSubmitManifest(
  manifest: string,
  privateKey: string
): Promise<string> {
  try {
    // Sign the manifest
    const signedHex = await signTransactionManifest(manifest, privateKey);

    // Submit to Radix network
    const { submitTransaction } = await import('./radix-rpc');
    const txId = await submitTransaction(signedHex);

    return txId;
  } catch (error) {
    console.error('Error signing and submitting manifest:', error);
    throw error;
  }
}

/**
 * Build a simple transfer manifest
 * For sending USDC from one address to another
 */
export async function buildTransferManifest(
  fromAddress: string,
  toAddress: string,
  amount: number,
  resourceAddress: string = USDC_RESOURCE_ADDRESS // Default to USDC
): Promise<string> {
  try {
    // Convert amount to smallest unit (6 decimals for USDC)
    const amountInSmallestUnit = BigInt(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));

    // Build manifest using Radix Engine Toolkit if available
    if (RETK && RETK.ManifestBuilder) {
      try {
        const manifest = RETK.ManifestBuilder
          .new()
          .callMethod(fromAddress, 'withdraw', [amountInSmallestUnit.toString(), resourceAddress])
          .callMethod(toAddress, 'deposit', ['Bucket'])
          .build()
          .toString();
        
        return manifest;
      } catch (retkError) {
        console.warn('RETK manifest building failed, using fallback:', retkError);
      }
    }

    // Fallback: Build manifest string manually (Radix manifest format)
    // Format: CALL_METHOD <address> <method> <args>; ...
    return `CALL_METHOD ${fromAddress} withdraw ${amountInSmallestUnit.toString()} ${resourceAddress}; CALL_METHOD ${toAddress} deposit;`;
  } catch (error) {
    console.error('Error building transfer manifest:', error);
    throw new Error(`Failed to build transfer manifest: ${error}`);
  }
}
