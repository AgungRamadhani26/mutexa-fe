/**
 * Representasi data Rekening Bank dengan metrik.
 * SOLID: SRP.
 */
export interface BankAccount {
  id: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
  documentCount: number;
}
