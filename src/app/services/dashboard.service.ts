import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { SummaryPerbulan } from '../models/summary-perbulan.model';
import { DetailTransaksi } from '../models/detail-transaksi.model';
import { RingkasanSaldo } from '../models/ringkasan-saldo.model';
import { TopFreq } from '../models/top-freq.model';
/**
 * Service untuk mengambil data dashboard dari backend.
 * Prinsip SOLID:
 * - SRP: Fokus pada fetch data terkait modul Dashboard.
 * - DIP: Bergantung pada abstraksi HttpClient Angular, bukan implementasi XHR statis.
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) { }

  // Mengambil ringkasan saldo dan total kredit/debit per bulan (difilter berdasarkan ID Dokumen)
  getSummaryPerbulan(documentId: number): Observable<ApiResponse<SummaryPerbulan[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<SummaryPerbulan[]>>(`${this.apiUrl}/summary-perbulan`, { params });
  }

  // Mengambil ringkasan saldo & arus kas (total dan rata-rata, exclude-aware)
  getRingkasanSaldo(documentId: number): Observable<ApiResponse<RingkasanSaldo>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<RingkasanSaldo>>(`${this.apiUrl}/ringkasan-saldo`, { params });
  }

  // Mengambil detail seluruh baris transaksi riwayat mutasi dari spesifik dokumen
  getDetailSemuaTransaksi(documentId: number): Observable<ApiResponse<DetailTransaksi[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<DetailTransaksi[]>>(`${this.apiUrl}/detail-transaksi`, { params });
  }

  // Mengambil data top 10 credit amount
  getTop10CreditAmount(documentId: number): Observable<ApiResponse<DetailTransaksi[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<DetailTransaksi[]>>(`${this.apiUrl}/top10-credit`, { params });
  }

  // Mengambil data top 10 debit amount
  getTop10DebitAmount(documentId: number): Observable<ApiResponse<DetailTransaksi[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<DetailTransaksi[]>>(`${this.apiUrl}/top10-debit`, { params });
  }

  // Mengambil data frekuensi keterangan paling sering muncul (Kredit)
  getTop10CreditFreq(documentId: number): Observable<ApiResponse<TopFreq[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<TopFreq[]>>(`${this.apiUrl}/top10-credit-freq`, { params });
  }

  // Mengambil data frekuensi keterangan paling sering muncul (Debit)
  getTop10DebitFreq(documentId: number): Observable<ApiResponse<TopFreq[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<TopFreq[]>>(`${this.apiUrl}/top10-debit-freq`, { params });
  }

  // Menghasilkan URL download File Excel untuk rincian transaksi dokumen terkait
  exportExcelUrl(documentId: number): string {
    return `${this.apiUrl}/export-excel?documentId=${documentId}`;
  }

  // Toggle status pengecualian transaksi
  toggleExclude(transactionId: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/toggle-exclude/${transactionId}`, {});
  }
}
