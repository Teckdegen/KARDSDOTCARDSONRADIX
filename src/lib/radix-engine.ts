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

// Helper to get network ID enum
function getNetworkIdEnum(): any {
  if (!RETK) return null;
  try {
    // RETK v1.0.5 uses NetworkId enum
    return RETK.NetworkId[NETWORK_ID.toUpperCase()] || RETK.NetworkId.MAINNET;
  } catch {
    return RETK.NetworkId?.Mainnet || RETK.NetworkId?.MAINNET || 1;
  }
}

/**
 * Sign a transaction manifest with a private key
 * Uses RETK to properly build, sign, and compile the transaction
 */
export async function signTransactionManifest(
  manifest: string,
  privateKey: string
): Promise<string> {
  try {
    if (!RETK) {
      throw new Error('Radix Engine Toolkit not available');
    }

    // Parse private key - RETK stores private keys as hex strings
    // Convert hex string to Uint8Array and create Ed25519 private key
    const crypto = await import('crypto');
    
    // Remove prefix if present
    const hexKey = privateKey.replace(/^private_key_/, '');
    
    // Convert hex string to Buffer then to Uint8Array for RETK
    const buffer = Buffer.from(hexKey, 'hex');
    const keyBytes = new Uint8Array(buffer);
    
    // Create Ed25519 private key from bytes using constructor
    const privateKeyObj = new RETK.PrivateKey.Ed25519(keyBytes);
    
    const publicKey = privateKeyObj.publicKey();
    const networkId = getNetworkIdEnum();

    // Build transaction from manifest using RETK
    const transactionBuilder = await RETK.TransactionBuilder.new();
    
    // Set transaction header
    // Note: For notarization, typically you'd use a separate notary key or let the network handle it
    // Using the same key as signatory is valid for self-notarized transactions
    const headerStep = await transactionBuilder.header({
      networkId: networkId,
      startEpochInclusive: 0, // Will be set by network
      endEpochExclusive: 100000, // Will be set by network
      nonce: 0, // Will be set by network
      notaryPublicKey: publicKey, // Using signer's key as notary (self-notarized)
      notaryIsSignatory: true, // Signer is also the notary
      tipPercentage: 0,
    });

    // Set manifest
    const manifestStep = await headerStep.manifest(manifest);

    // Sign the transaction
    const signedStep = await manifestStep.sign(privateKeyObj);

    // Compile to notarized transaction
    const notarizedTx = await signedStep.notarize(privateKeyObj);

    // Convert to hex string for submission
    const compiledTx = RETK.CompiledNotarizedTransaction.fromNotarizedTransaction(notarizedTx);
    const hexString = compiledTx.toHex();

    return hexString;
  } catch (error) {
    console.error('Error signing manifest with RETK:', error);
    throw new Error(`Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`);
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
 * Uses RETK ManifestBuilder for proper manifest construction
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

    // Build manifest using Radix Engine Toolkit
    if (RETK && RETK.ManifestBuilder) {
      try {
        // ManifestBuilder should use .new() static method (similar to TransactionBuilder)
        const manifestBuilder = RETK.ManifestBuilder.new 
          ? await RETK.ManifestBuilder.new()
          : new RETK.ManifestBuilder();
        
        // Withdraw from sender's account
        // callMethod returns a builder for chaining
        const withdrawStep = manifestBuilder.callMethod(
          fromAddress,
          'withdraw',
          [
            amountInSmallestUnit.toString(),
            resourceAddress,
          ]
        );
        
        // Take from worktop - chain from withdraw step
        const worktopStep = withdrawStep.takeFromWorktop(
          amountInSmallestUnit.toString(),
          resourceAddress,
          'bucket'
        );
        
        // Deposit to recipient's account - chain from worktop step
        const depositStep = worktopStep.callMethod(
          toAddress,
          'deposit',
          ['bucket']
        );
        
        // Build and convert to string
        const manifest = depositStep.build();
        const manifestString = manifest.toString();
        
        return manifestString;
      } catch (retkError) {
        console.error('RETK manifest building error:', retkError);
        throw retkError;
      }
    }

    // Fallback: Build manifest string manually (Radix manifest format)
    // This is a simplified version - should use RETK in production
    console.warn('Using fallback manifest builder - RETK not available');
    return `CALL_METHOD ${fromAddress} withdraw ${amountInSmallestUnit.toString()} ${resourceAddress}; CALL_METHOD ${toAddress} deposit;`;
  } catch (error) {
    console.error('Error building transfer manifest:', error);
    throw new Error(`Failed to build transfer manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}
