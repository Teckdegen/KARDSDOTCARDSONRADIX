/**
 * Radix Network Constants
 */

// USDC Resource Address on Radix
export const USDC_RESOURCE_ADDRESS = 'resource_rdx1thxj9m87sn5cc9ehgp9qxp6vzeqxtce90xm5cp33373tclyp4et4gv';

// Bridge Token Formats
export const BRIDGE_INPUT_TOKEN = `XRD.USDC-${USDC_RESOURCE_ADDRESS}`;
export const BRIDGE_OUTPUT_TOKEN = 'ETH.USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // Ethereum USDC

// Minimum USD amount required (XRD amount calculated dynamically via CoinGecko)
export const MIN_USD_BALANCE = 2; // $2 USD worth of XRD required

// Minimum XRD balance required for bridge transactions (in XRD)
// User needs roughly 410 XRD for tx cost on Ethereum side and bridge fee
export const MIN_XRD_BALANCE_FOR_BRIDGE = 410; // ~410 XRD for bridge transactions

// USDC decimals (typically 6 for USDC)
export const USDC_DECIMALS = 6;

// XRD decimals
export const XRD_DECIMALS = 18;

