import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { SummaryPerbulan } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = 'http://localhost:9091/api/dashboard';

  constructor(private http: HttpClient) {}

  getSummaryPerbulan(): Observable<ApiResponse<SummaryPerbulan[]>> {
    return this.http.get<ApiResponse<SummaryPerbulan[]>>(`${this.apiUrl}/summary-perbulan`);
  }
}
