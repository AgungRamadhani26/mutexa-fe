import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { EncryptionService } from '../core/services/encryption.service';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private readonly STORAGE_KEY = 'mutexa_auth';
  private encryptionService = inject(EncryptionService);

  // Signal untuk state user yang sedang login
  currentUser = signal<AuthUser | null>(this.loadFromStorage());

  isLoggedIn = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  userName = computed(() => this.currentUser()?.name ?? '');
  userRole = computed(() => this.currentUser()?.role ?? '');

  constructor(private http: HttpClient, private router: Router) { }

  login(email: string, password: string): Observable<ApiResponse<AuthUser>> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        if (response.data) {
          this.currentUser.set(response.data);
          // Simpan data dalam bentuk terenkripsi
          const encryptedData = this.encryptionService.encrypt(response.data);
          localStorage.setItem(this.STORAGE_KEY, encryptedData);
        }
      })
    );
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  private loadFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      
      // Dekripsi data saat load
      return this.encryptionService.decrypt<AuthUser>(raw);
    } catch {
      return null;
    }
  }
}
