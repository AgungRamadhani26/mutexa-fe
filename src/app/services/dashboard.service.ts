import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { SummaryPerbulan, DetailTransaksi } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  // Mengambil ringkasan saldo dan total kredit/debit per bulan (difilter berdasarkan ID Dokumen)
  getSummaryPerbulan(documentId: number): Observable<ApiResponse<SummaryPerbulan[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<SummaryPerbulan[]>>(`${this.apiUrl}/summary-perbulan`, { params });
  }

  // Mengambil detail seluruh baris transaksi riwayat mutasi dari spesifik dokumen
  getDetailSemuaTransaksi(documentId: number): Observable<ApiResponse<DetailTransaksi[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<DetailTransaksi[]>>(`${this.apiUrl}/detail-transaksi`, { params });
  }

  // Menghasilkan URL download File Excel untuk rincian transaksi dokumen terkait
  exportExcelUrl(documentId: number): string {
    return `${this.apiUrl}/export-excel?documentId=${documentId}`;
  }
}
