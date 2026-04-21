/**
 * Representasi untuk API Ringkasan Saldo dan Arus Kas.
 * SOLID: SRP.
 */
export interface RingkasanSaldo {
  totalCredit: number;
  totalDebit: number;
  avgCredit: number;
  avgDebit: number;
  jumlahBulan: number;
  avgDailyBalance: number;

  // Added for Windress
  cleanedTotalCredit?: number;
  cleanedTotalDebit?: number;
  cleanedAvgCredit?: number;
  cleanedAvgDebit?: number;
}
