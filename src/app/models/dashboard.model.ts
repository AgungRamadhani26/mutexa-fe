export interface SummaryPerbulan {
  periode: string;
  saldoAkhir: number;
  totalCredit: number;
  totalDebit: number;
  freqCredit: number;
  freqDebit: number;
}

export interface DetailTransaksi {
  tanggal: string;
  keterangan: string;
  flag: string;
  jumlah: number;
}

export interface TopFreq {
  keterangan: string;
  frekuensi: number;
}
