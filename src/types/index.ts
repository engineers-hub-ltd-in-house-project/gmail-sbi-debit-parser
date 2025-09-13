export interface Transaction {
  authNumber?: string;
  transactionDate: string;
  transactionTime: string;
  transactionDateTime: string;
  merchant: string;
  currency: string;
  amount: number;
  emailId?: string;
  emailDate?: string;
}

export interface TransactionStats {
  totalAmount: number;
  count: number;
  merchants: Record<string, MerchantStats>;
  dailyTotals: Record<string, DailyStats>;
}

export interface MerchantStats {
  count: number;
  total: number;
}

export interface DailyStats {
  count: number;
  total: number;
}

export interface MonthlyData {
  count: number;
  total: number;
}

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface EmailMessage {
  id: string;
  threadId?: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
    }>;
  };
}
