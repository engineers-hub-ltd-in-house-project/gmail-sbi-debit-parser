import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { startCallbackServer } from './callbackServer.js';
import { GmailConfig } from '../types/index.js';

const TOKEN_PATH = path.join(process.cwd(), 'config/token.json');
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

      // トークンの有効期限をチェック（期限の5分前に更新）
      const now = Date.now();
      const expiryBuffer = 5 * 60 * 1000; // 5分のバッファ

      if (token.expiry_date) {
        if (token.expiry_date - expiryBuffer < now) {
          // リフレッシュトークンがある場合は自動更新
          if (token.refresh_token) {
            return await this.refreshAccessToken();
          } else {
            console.log('リフレッシュトークンが見つかりません。再認証が必要です。');
            return await this.getNewToken();
          }
        }
      }

      return this.oauth2Client;
    } catch (error) {
      // ファイルが存在しない場合は新規認証
      if ((error as any).code === 'ENOENT') {
        console.log('初回認証を開始します...');
      } else {
        console.log('トークンの読み込みに失敗しました。再認証します...');
      }
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
      prompt: 'consent', // 常にリフレッシュトークンを取得
    });

    console.log('\nGmail認証が必要です');
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
      console.log('\n認証コードを自動取得しました');
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

  private async refreshAccessToken(): Promise<OAuth2Client> {
    try {
      // 現在のトークンを取得
      const currentToken = await this.loadToken();

      // リフレッシュトークンをセット
      this.oauth2Client.setCredentials({
        refresh_token: currentToken.refresh_token,
      });

      // 新しいアクセストークンを取得
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // リフレッシュトークンが新しいcredentialsに含まれない場合は、既存のものを保持
      if (!credentials.refresh_token && currentToken.refresh_token) {
        credentials.refresh_token = currentToken.refresh_token;
      }

      // 新しいトークンをセット
      this.oauth2Client.setCredentials(credentials);

      // トークンを保存
      await this.saveToken(credentials);

      return this.oauth2Client;
    } catch (error) {
      console.error('トークンの自動更新に失敗しました:', error);
      console.log('再認証が必要です...');
      return await this.getNewToken();
    }
  }

  private async saveToken(tokens: any): Promise<void> {
    await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('Token stored to', TOKEN_PATH);
  }
}
