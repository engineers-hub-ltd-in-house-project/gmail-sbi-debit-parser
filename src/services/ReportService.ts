import { stringify } from 'csv-stringify/sync';
import fs from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import { Transaction, TransactionStats, MonthlyData } from '../types/index';

export class ReportService {
  private outputDir: string;

  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
  }

  async generateReports(
    transactions: Transaction[]
  ): Promise<{ csvPath: string; monthlyCsvPath: string }> {
    await fs.mkdir(this.outputDir, { recursive: true });

    const timestamp = dayjs().format('YYYYMMDD_HHmmss');

    // 詳細CSV
    const csvPath = await this.generateDetailedCSV(transactions, timestamp);

    // 月別サマリーCSV
    const monthlyCsvPath = await this.generateMonthlySummaryCSV(transactions, timestamp);

    return { csvPath, monthlyCsvPath };
  }

  private async generateDetailedCSV(
    transactions: Transaction[],
    timestamp: string
  ): Promise<string> {
    const csvPath = path.join(this.outputDir, `sbi_debit_${timestamp}.csv`);

    const csvData = transactions.map((t) => ({
      利用日: t.transactionDate,
      利用時刻: t.transactionTime,
      利用加盟店: t.merchant,
      金額: t.amount,
      通貨: t.currency || 'JPY',
      承認番号: t.authNumber || '',
      メール受信日時: t.emailDate || '',
    }));

    const csv = stringify(csvData, { header: true, bom: true });
    await fs.writeFile(csvPath, csv, 'utf-8');

    return csvPath;
  }

  private async generateMonthlySummaryCSV(
    transactions: Transaction[],
    timestamp: string
  ): Promise<string> {
    const monthlySummaryPath = path.join(this.outputDir, `sbi_debit_monthly_${timestamp}.csv`);
    const monthlyData: Record<string, MonthlyData> = {};

    transactions.forEach((t) => {
      const month = dayjs(t.transactionDate).format('YYYY-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, total: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].total += t.amount;
    });

    const monthlyCsvData = Object.entries(monthlyData)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => ({
        年月: month,
        利用回数: data.count,
        合計金額: data.total,
        平均金額: Math.round(data.total / data.count),
      }));

    const monthlyCsv = stringify(monthlyCsvData, { header: true, bom: true });
    await fs.writeFile(monthlySummaryPath, monthlyCsv, 'utf-8');

    return monthlySummaryPath;
  }

  calculateStats(transactions: Transaction[]): TransactionStats {
    const stats: TransactionStats = {
      totalAmount: 0,
      count: transactions.length,
      merchants: {},
      dailyTotals: {},
    };

    transactions.forEach((t) => {
      stats.totalAmount += t.amount;

      // 加盟店別集計
      if (!stats.merchants[t.merchant]) {
        stats.merchants[t.merchant] = { count: 0, total: 0 };
      }
      stats.merchants[t.merchant].count++;
      stats.merchants[t.merchant].total += t.amount;

      // 日別集計
      if (!stats.dailyTotals[t.transactionDate]) {
        stats.dailyTotals[t.transactionDate] = { count: 0, total: 0 };
      }
      stats.dailyTotals[t.transactionDate].count++;
      stats.dailyTotals[t.transactionDate].total += t.amount;
    });

    return stats;
  }

  printSummary(stats: TransactionStats, transactions: Transaction[]): void {
    console.log('📊 利用サマリー');
    console.log('================');
    console.log(`総利用回数: ${stats.count} 回`);
    console.log(`総利用金額: ¥${stats.totalAmount.toLocaleString()}`);
    console.log(`平均利用額: ¥${Math.round(stats.totalAmount / stats.count).toLocaleString()}`);

    // よく使う加盟店TOP5
    console.log('\n🏪 利用回数TOP5加盟店:');
    const topMerchants = Object.entries(stats.merchants)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    topMerchants.forEach(([merchant, data]) => {
      console.log(`  ${merchant}: ${data.count}回 (¥${data.total.toLocaleString()})`);
    });

    // 最近の利用
    console.log('\n📅 最近の利用 (直近5件):');
    transactions.slice(0, 5).forEach((t) => {
      console.log(`  ${t.transactionDate} ${t.merchant}: ¥${t.amount.toLocaleString()}`);
    });
  }
}
