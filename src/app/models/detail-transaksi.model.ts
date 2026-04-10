/**
 * Representasi transaksi individual (tabel transaksi).
 * SOLID: SRP (Single Responsibility Principle).
 */
export interface DetailTransaksi {
  id?: number;
  tanggal: string;
  keterangan: string;
  flag: string;
  jumlah: number;
  isExcluded?: boolean;
}
