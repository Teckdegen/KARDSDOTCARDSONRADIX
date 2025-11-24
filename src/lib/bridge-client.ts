import { BRIDGE_INPUT_TOKEN, BRIDGE_OUTPUT_TOKEN } from './radix-constants';

const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://bridge.astrolescent.com/quote';
const SLIPPAGE = parseInt(process.env.BRIDGE_SLIPPAGE || '300');

export interface BridgeQuoteRequest {
  inputAmount: number;
  inputToken: string;
  outputToken: string;
  fromAddress: string;
  toAddress: string;
  slippage: number;
  includeStreaming: boolean;
  includeTx: boolean;
}

export interface BridgeQuoteResponse {
  route: {
    tx: {
      manifest: string;
    };
    fees: {
      total: number; // Fee in USD
      [key: string]: any;
    };
    expiration: string; // Route expiration time
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Get bridge quote
 * @param inputAmount - The amount (in USDC) the user wants to fund the card with
 * @param fromAddress - User's Radix wallet address
 * @param toAddress - Card's ETH wallet address
 */
/**
 * Get bridge quote
 * @param inputAmount - The amount (in USDC) the user wants to fund the card with
 * @param fromAddress - User's Radix wallet address
 * @param toAddress - Card's ETH wallet address
 * @returns Bridge quote with manifest, fees, and expiration
 * 
 * Note: User needs roughly 410 XRD for tx cost on Ethereum side and bridge fee
 * The fee is displayed in route.fees.total (in USD)
 * Routes are valid until route.expiration time
 */
export async function getBridgeQuote(
  inputAmount: number,
  fromAddress: string,
  toAddress: string
): Promise<BridgeQuoteResponse> {
  const requestBody: BridgeQuoteRequest = {
    inputAmount, // Amount in USDC
    inputToken: BRIDGE_INPUT_TOKEN, // XRD.USDC-resource_rdx1thxj9m87sn5cc9ehgp9qxp6vzeqxtce90xm5cp33373tclyp4et4gv
    outputToken: BRIDGE_OUTPUT_TOKEN, // ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    fromAddress,
    toAddress,
    slippage: SLIPPAGE,
    includeStreaming: false,
    includeTx: true,
  };

  const response = await fetch(BRIDGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bridge API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

