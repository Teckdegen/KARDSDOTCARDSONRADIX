/**
 * Radix RPC Client
 * Handles all RPC calls to Radix Gateway/Node
 */

import { USDC_RESOURCE_ADDRESS, XRD_DECIMALS, USDC_DECIMALS, MIN_USD_BALANCE, MIN_XRD_BALANCE_FOR_BRIDGE } from './radix-constants';
import { getXRDForTwoDollars } from './coingecko';

const RPC_URL = process.env.RADIX_RPC_URL!;
const NETWORK_ID = process.env.RADIX_NETWORK_ID || 'mainnet';

/**
 * Get USDC balance for an address
 */
export async function getUSDCBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${RPC_URL}/state/entity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_addresses: [address],
        network_id: NETWORK_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract USDC balance from vaults
    if (data.items && data.items[0]?.fungible_vaults) {
      const usdcVault = data.items[0].fungible_vaults.find(
        (vault: any) => vault.resource_address === USDC_RESOURCE_ADDRESS
      );
      
      if (usdcVault?.amount) {
        // Convert from smallest unit to USDC (6 decimals)
        return parseFloat(usdcVault.amount) / Math.pow(10, USDC_DECIMALS);
      }
    }

    return 0;
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    throw error;
  }
}

/**
 * Get XRD balance for an address (for gas fees)
 */
export async function getXRDBalance(address: string): Promise<number> {
  try {
    const response = await fetch(`${RPC_URL}/state/entity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_addresses: [address],
        network_id: NETWORK_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`RPC error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract XRD balance from vaults
    if (data.items && data.items[0]?.fungible_vaults) {
      const xrdVault = data.items[0].fungible_vaults.find(
        (vault: any) => vault.resource_address?.includes('xrd') || vault.resource_address?.includes('XRD')
      );
      
      if (xrdVault?.amount) {
        // Convert from smallest unit to XRD (18 decimals)
        return parseFloat(xrdVault.amount) / Math.pow(10, XRD_DECIMALS);
      }
    }

    return 0;
  } catch (error) {
    console.error('Error fetching XRD balance:', error);
    throw error;
  }
}

/**
 * Check if user has enough XRD for gas fees
 * Uses CoinGecko to get current XRD price and calculate $2 worth of XRD
 */
export async function checkXRDForGas(address: string): Promise<{ hasEnough: boolean; balance: number; required: number }> {
  const balance = await getXRDBalance(address);
  const requiredXRD = await getXRDForTwoDollars(); // Get $2 worth of XRD dynamically
  return {
    hasEnough: balance >= requiredXRD,
    balance,
    required: requiredXRD,
  };
}

/**
 * Check if user has enough XRD for bridge transactions
 * User needs roughly 410 XRD for tx cost on Ethereum side and bridge fee
 */
export async function checkXRDForBridge(address: string): Promise<{ hasEnough: boolean; balance: number }> {
  const balance = await getXRDBalance(address);
  return {
    hasEnough: balance >= MIN_XRD_BALANCE_FOR_BRIDGE,
    balance,
  };
}

/**
 * Get both USDC and XRD balances
 */
export async function getBalances(address: string): Promise<{ usdc: number; xrd: number }> {
  const [usdc, xrd] = await Promise.all([
    getUSDCBalance(address),
    getXRDBalance(address),
  ]);
  return { usdc, xrd };
}

/**
 * Submit a signed transaction to Radix network
 */
export async function submitTransaction(signedTransactionHex: string): Promise<string> {
  try {
    const response = await fetch(`${RPC_URL}/transaction/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_hex: signedTransactionHex,
        network_id: NETWORK_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transaction submission failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.transaction_id || data.tx_id || signedTransactionHex;
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txId: string): Promise<string> {
  try {
    const response = await fetch(`${RPC_URL}/transaction/status/${txId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    return data.status || 'unknown';
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return 'unknown';
  }
}

// Legacy function for backward compatibility (now returns USDC balance)
export async function getRadixBalance(address: string): Promise<number> {
  return getUSDCBalance(address);
}

