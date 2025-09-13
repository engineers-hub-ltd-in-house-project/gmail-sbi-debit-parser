import { ReportService } from '../../src/services/ReportService';
import { Transaction } from '../../src/types';

describe('ReportService', () => {
  let reportService: ReportService;

  beforeEach(() => {
    reportService = new ReportService('./test-output');
  });

  describe('calculateStats', () => {
    it('should calculate statistics correctly', () => {
      const transactions: Transaction[] = [
        {
          transactionDate: '2025-09-07',
          transactionTime: '08:44:40',
          transactionDateTime: '2025-09-07 08:44:40',
          merchant: 'SEVEN-ELEVEN',
          amount: 446,
          currency: 'JPY',
          authNumber: '204183',
        },
        {
          transactionDate: '2025-09-07',
          transactionTime: '10:30:00',
          transactionDateTime: '2025-09-07 10:30:00',
          merchant: 'LAWSON',
          amount: 220,
          currency: 'JPY',
          authNumber: '123456',
        },
        {
          transactionDate: '2025-09-08',
          transactionTime: '15:00:00',
          transactionDateTime: '2025-09-08 15:00:00',
          merchant: 'SEVEN-ELEVEN',
          amount: 580,
          currency: 'JPY',
          authNumber: '789012',
        },
      ];

      const stats = reportService.calculateStats(transactions);

      expect(stats.count).toBe(3);
      expect(stats.totalAmount).toBe(1246);
      expect(stats.merchants['SEVEN-ELEVEN'].count).toBe(2);
      expect(stats.merchants['SEVEN-ELEVEN'].total).toBe(1026);
      expect(stats.merchants['LAWSON'].count).toBe(1);
      expect(stats.merchants['LAWSON'].total).toBe(220);
      expect(stats.dailyTotals['2025-09-07'].count).toBe(2);
      expect(stats.dailyTotals['2025-09-07'].total).toBe(666);
    });

    it('should handle empty transactions array', () => {
      const stats = reportService.calculateStats([]);

      expect(stats.count).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(Object.keys(stats.merchants)).toHaveLength(0);
      expect(Object.keys(stats.dailyTotals)).toHaveLength(0);
    });
  });
});
