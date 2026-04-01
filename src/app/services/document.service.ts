import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface AccountWithDocumentsResponse {
  id: number;
  accountNumber: string;
  accountName: string;
  bankName: string;
  documentCount: number;
}

export interface DocumentListResponse {
  id: number;
  fileName: string;
  fileType: string;
  status: string;
  errorMessage: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
}

export interface DocumentUploadResponse {
  id: number;
  fileName: string;
  status: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/documents';

  getAccounts(): Observable<ApiResponse<AccountWithDocumentsResponse[]>> {
    return this.http.get<ApiResponse<AccountWithDocumentsResponse[]>>(`${this.apiUrl}/by-account`);
  }

  getDocumentsByAccount(accountId: number): Observable<ApiResponse<DocumentListResponse[]>> {
    return this.http.get<ApiResponse<DocumentListResponse[]>>(`${this.apiUrl}/by-account/${accountId}`);
  }

  uploadDocument(formData: FormData): Observable<ApiResponse<DocumentUploadResponse>> {
    return this.http.post<ApiResponse<DocumentUploadResponse>>(`${this.apiUrl}/upload`, formData);
  }
}
