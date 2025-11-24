/**
 * CoinGecko API client for fetching cryptocurrency prices
 * Used to get real-time XRD price for balance checks
 */

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
  };
}

/**
 * Get current XRD price in USD
 * @returns Price of 1 XRD in USD
 */
export async function getXRDPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/simple/price?ids=radix&vs_currencies=usd`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Cache for 1 minute to avoid rate limits
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }

    const data: CoinGeckoPriceResponse = await response.json();
    
    if (!data.radix || !data.radix.usd) {
      throw new Error('XRD price not found in CoinGecko response');
    }

    return data.radix.usd;
  } catch (error) {
    console.error('Error fetching XRD price from CoinGecko:', error);
    // Fallback to a default price if API fails (approximate)
    // This ensures the system still works if CoinGecko is down
    return 0.05; // Approximate XRD price as fallback
  }
}

/**
 * Calculate how many XRD equals a specific USD amount
 * @param usdAmount USD amount to convert
 * @returns Number of XRD equivalent to the USD amount
 */
export async function getXRDForUSD(usdAmount: number): Promise<number> {
  const xrdPrice = await getXRDPrice();
  return usdAmount / xrdPrice;
}

/**
 * Get XRD amount equivalent to $2 USD
 * Used for minimum balance checks
 * @returns Number of XRD equivalent to $2
 */
export async function getXRDForTwoDollars(): Promise<number> {
  return getXRDForUSD(2);
}

