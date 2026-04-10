import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BankAccount } from '../models/bank-account.model';
import { MutationDocument } from '../models/mutation-document.model';
import { ApiResponse } from '../models/api-response.model';

// Aliases agar tidak break dengan method signature lama
export type AccountWithDocumentsResponse = BankAccount;
export type DocumentListResponse = MutationDocument;

export interface DocumentUploadResponse {
  id: number;
  fileName: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/documents';

  // Endpoint: Ambil daftar rekening beserta jumlah dokumen masing-masing
  getAccounts(): Observable<ApiResponse<AccountWithDocumentsResponse[]>> {
    return this.http.get<ApiResponse<AccountWithDocumentsResponse[]>>(`${this.apiUrl}/by-account`);
  }

  // Endpoint: Ambil daftar dokumen mutasi milik satu rekening berdasarkan ID
  getDocumentsByAccount(accountId: number): Observable<ApiResponse<DocumentListResponse[]>> {
    return this.http.get<ApiResponse<DocumentListResponse[]>>(`${this.apiUrl}/by-account/${accountId}`);
  }

  // Endpoint: Upload file PDF mutasi baru ke server
  uploadDocument(formData: FormData): Observable<ApiResponse<DocumentUploadResponse>> {
    return this.http.post<ApiResponse<DocumentUploadResponse>>(`${this.apiUrl}/upload`, formData);
  }
}
