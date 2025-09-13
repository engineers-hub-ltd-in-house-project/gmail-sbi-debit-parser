import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Transaction, EmailMessage } from '../types/index';

dayjs.extend(customParseFormat);

export class SBIDebitParser {
  private gmail: gmail_v1.Gmail;

  constructor(auth: OAuth2Client) {
    this.gmail = google.gmail({ version: 'v1', auth });
  }

  async searchDebitEmails(maxResults: number = 500): Promise<Transaction[]> {
    try {
      console.log('住信SBIネット銀行のデビットカード利用通知を検索中...');

      const query = 'subject:"【デビットカード】ご利用のお知らせ(住信SBIネット銀行)"';

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults,
      });

      if (!response.data.messages) {
        console.log('メールが見つかりませんでした。');
        return [];
      }

      console.log(`${response.data.messages.length} 件のメールを取得中...`);

      const emails = await Promise.all(
        response.data.messages.map((message) => this.getEmailDetails(message.id!))
      );

      return emails.filter((email): email is Transaction => email !== null);
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  private async getEmailDetails(messageId: string): Promise<Transaction | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      const message = response.data as EmailMessage;
      const headers = message.payload.headers;

      const date = this.getHeader(headers, 'Date');
      const body = this.extractBody(message.payload);

      const transaction = this.parseTransactionDetails(body);

      if (transaction) {
        return {
          ...transaction,
          emailId: message.id,
          emailDate: dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
        };
      }

      return null;
    } catch (error) {
      console.error(`Error getting email details for ${messageId}:`, error);
      return null;
    }
  }

  private getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
    const header = headers.find((h) => h.name === name);
    return header ? header.value : '';
  }

  private extractBody(payload: EmailMessage['payload']): string {
    let body = '';

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    } else if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return body;
  }

  private parseTransactionDetails(body: string): Omit<Transaction, 'emailId' | 'emailDate'> | null {
    try {
      const transaction: Partial<Transaction> = {};

      // 承認番号
      const authNumberMatch = body.match(/承認番号\s*：\s*(\d+)/);
      if (authNumberMatch) {
        transaction.authNumber = authNumberMatch[1];
      }

      // 利用日時
      const dateTimeMatch = body.match(/利用日時\s*：\s*(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2})/);
      if (dateTimeMatch) {
        const parsed = dayjs(dateTimeMatch[1], 'YYYY/MM/DD HH:mm:ss');
        transaction.transactionDate = parsed.format('YYYY-MM-DD');
        transaction.transactionTime = parsed.format('HH:mm:ss');
        transaction.transactionDateTime = parsed.format('YYYY-MM-DD HH:mm:ss');
      }

      // 利用加盟店
      const merchantMatch = body.match(/利用加盟店\s*：\s*([^\n\r]+)/);
      if (merchantMatch) {
        transaction.merchant = merchantMatch[1].trim();
      }

      // 引落通貨
      const currencyMatch = body.match(/引落通貨\s*：\s*([A-Z]+)/);
      if (currencyMatch) {
        transaction.currency = currencyMatch[1];
      }

      // 引落金額
      const amountMatch = body.match(/引落金額\s*：\s*([\d,]+\.?\d*)/);
      if (amountMatch) {
        transaction.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }

      // 必須項目が揃っているか確認
      if (
        transaction.transactionDateTime &&
        transaction.merchant &&
        transaction.amount !== undefined &&
        transaction.transactionDate &&
        transaction.transactionTime &&
        transaction.currency
      ) {
        return transaction as Omit<Transaction, 'emailId' | 'emailDate'>;
      }

      return null;
    } catch (error) {
      console.error('Error parsing transaction details:', error);
      return null;
    }
  }
}
