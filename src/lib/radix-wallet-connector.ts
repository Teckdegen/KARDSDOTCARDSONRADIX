import { RadixDappToolkit, RadixNetwork } from '@radixdlt/radix-dapp-toolkit';

export interface RadixWalletInfo {
  address: string;
  networkId?: number;
}

let rdtInstance: ReturnType<typeof RadixDappToolkit> | null = null;

function getNetworkId(): RadixNetwork {
  const envId = process.env.NEXT_PUBLIC_RADIX_NETWORK_ID;
  if (envId === '1' || envId?.toLowerCase() === 'mainnet') {
    return RadixNetwork.Mainnet;
  }
  return RadixNetwork.Stokenet;
}

function getRadixDappToolkit() {
  if (typeof window === 'undefined') {
    throw new Error('Radix dApp Toolkit can only be used in the browser');
  }

  if (rdtInstance) return rdtInstance;

  const dAppDefinitionAddress = process.env.NEXT_PUBLIC_RADIX_DAPP_DEFINITION;
  if (!dAppDefinitionAddress) {
    throw new Error(
      'NEXT_PUBLIC_RADIX_DAPP_DEFINITION is not set. Please add it to your .env.local',
    );
  }

  rdtInstance = RadixDappToolkit({
    dAppDefinitionAddress,
    networkId: getNetworkId(),
    applicationName: 'KARDS',
    applicationVersion: '1.0.0',
  });

  return rdtInstance;
}

/**
 * Check if Radix Wallet is available (via Radix dApp Toolkit)
 */
export function isRadixWalletInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    getRadixDappToolkit();
    return true;
  } catch {
    return false;
  }
}

/**
 * Connect to Radix Wallet and get the first account address
 * Uses Radix dApp Toolkit walletApi
 */
export async function connectRadixWallet(): Promise<RadixWalletInfo> {
  const rdt = getRadixDappToolkit();

  return new Promise<RadixWalletInfo>((resolve, reject) => {
    const subscription = rdt.walletApi.walletData$.subscribe((walletData: any) => {
      const accounts = walletData?.accounts ?? [];
      if (accounts.length > 0) {
        const first = accounts[0];
        subscription.unsubscribe();
        resolve({
          address: first.address,
          networkId: walletData?.networkId,
        });
      }
    });

    // Fallback timeout in case nothing happens
    setTimeout(() => {
      subscription.unsubscribe();
      reject(
        new Error(
          'No Radix accounts connected. Please use the Radix connect button or approve the connection in your wallet.',
        ),
      );
    }, 15000);
  });
}

/**
 * Sign and send a transaction using Radix dApp Toolkit
 */
export async function signAndSendTransaction(manifest: string): Promise<string> {
  const rdt = getRadixDappToolkit();

  const result: any = await rdt.walletApi.sendTransaction({
    transactionManifest: manifest,
  });

  if (result?.isErr && result.isErr()) {
    const msg =
      result.error?.message ||
      result.error ||
      'Failed to sign or submit Radix transaction';
    throw new Error(msg);
  }

  const hash =
    result?.value?.transactionIntentHash ||
    result?.value?.transactionHash ||
    result?.transactionIntentHash;

  if (!hash) {
    throw new Error('Radix transaction did not return a hash');
  }

  return hash;
}

/**
 * Get the current connected account (if any)
 */
export async function getCurrentAccount(): Promise<string | null> {
  try {
    const rdt = getRadixDappToolkit();
    return new Promise<string | null>((resolve) => {
      const subscription = rdt.walletApi.walletData$.subscribe((walletData: any) => {
        const accounts = walletData?.accounts ?? [];
        subscription.unsubscribe();
        resolve(accounts.length > 0 ? accounts[0].address : null);
      });

      setTimeout(() => {
        subscription.unsubscribe();
        resolve(null);
      }, 5000);
    });
  } catch {
    return null;
  }
}

