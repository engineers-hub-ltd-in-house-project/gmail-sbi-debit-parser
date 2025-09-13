import dotenv from 'dotenv';
import dayjs from 'dayjs';
import { GmailAuth } from './auth/GmailAuth.js';
import { SBIDebitParser } from './parsers/SBIDebitParser.js';
import { ReportService } from './services/ReportService.js';

dotenv.config();

async function main(): Promise<void> {
  try {
    console.log('住信SBIネット銀行 デビットカード利用履歴取得システム');
    console.log('================================================\n');

    // 環境変数チェック
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Gmail API認証情報が設定されていません。.envファイルを確認してください。');
    }

    // Gmail API認証
    console.log('Gmail APIに接続中...');
    const gmailAuth = new GmailAuth({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback',
    });
    const auth = await gmailAuth.authorize();

    // パーサー初期化
    const parser = new SBIDebitParser(auth);

    // デビットカード利用通知メールを取得
    const maxResults = parseInt(process.env.MAX_RESULTS || '500');
    const transactions = await parser.searchDebitEmails(maxResults);

    if (transactions.length === 0) {
      console.log('デビットカード利用通知メールが見つかりませんでした。');
      return;
    }

    console.log(`\n${transactions.length} 件の取引を抽出しました\n`);

    // 日付順にソート（新しい順）
    transactions.sort(
      (a, b) => dayjs(b.transactionDateTime).valueOf() - dayjs(a.transactionDateTime).valueOf()
    );

    // レポート生成
    const reportService = new ReportService(process.env.OUTPUT_DIR || './output');
    const stats = reportService.calculateStats(transactions);

    // サマリー表示
    reportService.printSummary(stats, transactions);

    // CSV出力
    const { csvPath, monthlyCsvPath } = await reportService.generateReports(transactions);

    console.log(`\n詳細CSVファイルを保存しました: ${csvPath}`);
    console.log(`月別サマリーを保存しました: ${monthlyCsvPath}`);
  } catch (error) {
    console.error('\nエラーが発生しました:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// CLIとして実行された場合のみmain関数を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { GmailAuth, SBIDebitParser, ReportService };
