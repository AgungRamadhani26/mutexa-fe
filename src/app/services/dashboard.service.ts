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

  getSummaryPerbulan(documentId: number): Observable<ApiResponse<SummaryPerbulan[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<SummaryPerbulan[]>>(`${this.apiUrl}/summary-perbulan`, { params });
  }

  getDetailSemuaTransaksi(documentId: number): Observable<ApiResponse<DetailTransaksi[]>> {
    const params = new HttpParams().set('documentId', documentId.toString());
    return this.http.get<ApiResponse<DetailTransaksi[]>>(`${this.apiUrl}/detail-transaksi`, { params });
  }

  exportExcelUrl(documentId: number): string {
    return `${this.apiUrl}/export-excel?documentId=${documentId}`;
  }
}
