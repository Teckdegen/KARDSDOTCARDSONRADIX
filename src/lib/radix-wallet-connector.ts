/**
 * Radix Wallet Connector
 * Handles connection to Radix Wallet browser extension
 */

declare global {
  interface Window {
    radix?: {
      request: (args: { method: string; params?: any }) => Promise<any>;
      isRadixWallet?: boolean;
    };
  }
}

export interface RadixWalletInfo {
  address: string;
  networkId?: number;
}

/**
 * Check if Radix Wallet extension is installed
 */
export function isRadixWalletInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.radix && window.radix.isRadixWallet);
}

/**
 * Connect to Radix Wallet and get account address
 */
export async function connectRadixWallet(): Promise<RadixWalletInfo> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  if (!window.radix) {
    throw new Error('Radix Wallet extension not found. Please install Radix Wallet from https://wallet.radixdlt.com/');
  }

  try {
    // Request account access
    const accounts = await window.radix.request({
      method: 'wallet_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please unlock your Radix Wallet.');
    }

    return {
      address: accounts[0],
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the connection request');
    }
    throw new Error(error.message || 'Failed to connect to Radix Wallet');
  }
}

/**
 * Sign and send a transaction using Radix Wallet
 */
export async function signAndSendTransaction(manifest: string): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('Window is not available');
  }

  if (!window.radix) {
    throw new Error('Radix Wallet extension not found');
  }

  try {
    const result = await window.radix.request({
      method: 'wallet_sendTransaction',
      params: {
        transactionManifest: manifest,
        version: 1,
      },
    });

    if (!result || !result.transactionHash) {
      throw new Error('Transaction failed or was rejected');
    }

    return result.transactionHash;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the transaction');
    }
    throw new Error(error.message || 'Failed to sign transaction');
  }
}

/**
 * Get the current connected account
 */
export async function getCurrentAccount(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.radix) {
    return null;
  }

  try {
    const accounts = await window.radix.request({
      method: 'wallet_requestAccounts',
    });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch {
    return null;
  }
}

