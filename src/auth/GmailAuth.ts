import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { startCallbackServer } from './callbackServer';
import { GmailConfig } from '../types/index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, '../../config/token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export class GmailAuth {
  private oauth2Client: OAuth2Client;

  constructor(config: GmailConfig) {
    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  async authorize(): Promise<OAuth2Client> {
    try {
      const token = await this.loadToken();
      this.oauth2Client.setCredentials(token);
      return this.oauth2Client;
    } catch {
      return await this.getNewToken();
    }
  }

  private async loadToken(): Promise<any> {
    const tokenData = await fs.readFile(TOKEN_PATH, 'utf-8');
    return JSON.parse(tokenData);
  }

  private async getNewToken(): Promise<OAuth2Client> {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('\n🔐 Gmail認証が必要です');
    console.log('以下のURLをブラウザで開いて認証してください:\n');
    console.log(authUrl);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const useServer = await new Promise<boolean>((resolve) => {
      rl.question('\n自動でコールバックを受け取りますか？ (y/n): ', (answer) => {
        resolve(answer.toLowerCase() === 'y');
      });
    });

    let code: string;
    if (useServer) {
      console.log('\nブラウザで認証を完了してください...');
      code = await startCallbackServer(3000);
      console.log('\n✅ 認証コードを自動取得しました');
    } else {
      code = await new Promise<string>((resolve) => {
        rl.question('\nURLから code= の値をコピーして貼り付けてください: ', (code) => {
          resolve(code);
        });
      });
    }

    rl.close();

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    await this.saveToken(tokens);

    return this.oauth2Client;
  }

  private async saveToken(tokens: any): Promise<void> {
    await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('Token stored to', TOKEN_PATH);
  }
}
