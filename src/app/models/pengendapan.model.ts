export interface PengendapanRow {
  tanggal: number;
  saldo: number;
  hari: number;
  pengendapan: number;
  pemakaian: number;
}

export interface PengendapanBulan {
  periode: string;
  rows: PengendapanRow[];
  totalHari: number;
  totalPengendapan: number;
  pengendapanPerBulan: number;
  totalPemakaian: number;
  pemakaianPerBulan: number;
}

export interface Pengendapan {
  bulanList: PengendapanBulan[];
  rataRataPengendapan: number;
  rataRataPemakaian: number;
}
