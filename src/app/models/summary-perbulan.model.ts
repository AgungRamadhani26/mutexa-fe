/**
 * Representasi data bulanan (omset, frekuensi).
 * SOLID: SRP (Single Responsibility Principle) - Hanya untuk entitas Summary.
 */
export interface SummaryPerbulan {
  periode: string;
  saldoAkhir: number;
  totalCredit: number;
  totalDebit: number;
  cleanedTotalCredit?: number;
  cleanedTotalDebit?: number;
  freqCredit: number;
  freqDebit: number;
  cleanedFreqCredit?: number;
  cleanedFreqDebit?: number;
}
