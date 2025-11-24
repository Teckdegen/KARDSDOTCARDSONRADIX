const BASE_URL = process.env.CASHWYRE_BASE_URL || 'https://businessapi.cashwyre.com/api/v1.0';
const SECRET_KEY = process.env.CASHWYRE_SECRET_KEY!;
const BUSINESS_CODE = process.env.CASHWYRE_BUSINESS_CODE!;
const APP_ID = process.env.CASHWYRE_APP_ID!;

interface CashwyreRequest {
  appId?: string;
  requestId: string;
  businessCode?: string;
  [key: string]: any;
}

export async function callCashwyreAPI(
  endpoint: string,
  body: CashwyreRequest,
  retries = 3
): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;
  
  // Auto-fill common fields
  const requestBody = {
    ...body,
    appId: body.appId || APP_ID,
    businessCode: body.businessCode || BUSINESS_CODE,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SECRET_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cashwyre API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

