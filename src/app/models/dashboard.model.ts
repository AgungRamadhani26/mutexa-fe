export interface SummaryPerbulan {
  periode: string;
  saldoAkhir: number;
  totalCredit: number;
  totalDebit: number;
  freqCredit: number;
  freqDebit: number;
}

export interface DetailTransaksi {
  id?: number;
  tanggal: string;
  keterangan: string;
  flag: string;
  jumlah: number;
  isExcluded?: boolean;
}

export interface TopFreq {
  keterangan: string;
  frekuensi: number;
}
