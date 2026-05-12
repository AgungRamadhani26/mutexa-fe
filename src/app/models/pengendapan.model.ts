export interface PengendapanRow {
  tanggal: number;
  saldo: number;
  hari: number;
  pengendapan: number;
}

export interface PengendapanBulan {
  periode: string;
  rows: PengendapanRow[];
  totalHari: number;
  totalPengendapan: number;
  pengendapanPerBulan: number;
}

export interface Pengendapan {
  bulanList: PengendapanBulan[];
  rataRataPengendapan: number;
}
