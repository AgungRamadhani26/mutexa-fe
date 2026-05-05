import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../../models/api-response.model';
import { ToastService } from '../../../services/toast.service';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagement implements OnInit {
  users = signal<UserItem[]>([]);
  isLoading = signal(false);
  showAddModal = signal(false);
  showResetModal = signal(false);
  showConfirmDeactivate = signal(false);
  showConfirmActivate = signal(false);
  selectedUserId = signal<number | null>(null);
  selectedUserToDeactivate = signal<UserItem | null>(null);
  selectedUserToActivate = signal<UserItem | null>(null);
  newPassword = '';

  registerForm: RegisterForm = { name: '', email: '', password: '', role: 'ANALYST' };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private toast: ToastService
  ) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.http.get<ApiResponse<UserItem[]>>('/api/auth/users').subscribe({
      next: (res) => { this.users.set(res.data ?? []); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); }
    });
  }

  openAddModal() {
    this.registerForm = { name: '', email: '', password: '', role: 'ANALYST' };
    this.showAddModal.set(true);
  }

  validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Format email tidak valid (contoh: nama@email.com).';
    return null;
  }

  validatePassword(password: string): string | null {
    const errors: string[] = [];
    if (!password || password.length < 8) errors.push('minimal 8 karakter');
    if (!/[A-Z]/.test(password)) errors.push('huruf besar');
    if (!/[a-z]/.test(password)) errors.push('huruf kecil');
    if (!/\d/.test(password)) errors.push('angka');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('karakter khusus');
    
    if (errors.length > 0) {
      return 'Password harus: ' + errors.join(', ') + '.';
    }
    return null;
  }

  submitRegister() {
    if (!this.registerForm.name || this.registerForm.name.trim() === '') {
      this.toast.warning('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!this.registerForm.email || this.registerForm.email.trim() === '') {
      this.toast.warning('Email tidak boleh kosong.');
      return;
    }
    
    const emailError = this.validateEmail(this.registerForm.email);
    if (emailError) {
      this.toast.warning(emailError);
      return;
    }
    
    const pwdError = this.validatePassword(this.registerForm.password);
    if (pwdError) {
      this.toast.warning(pwdError);
      return;
    }

    this.http.post<ApiResponse<UserItem>>('/api/auth/register', this.registerForm).subscribe({
      next: () => {
        this.showAddModal.set(false);
        this.toast.success('User baru berhasil ditambahkan.');
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err?.error?.message ?? 'Gagal menambahkan user.');
      }
    });
  }

  toggleActive(user: UserItem) {
    if (user.isActive) {
      // Nonaktifkan: perlu konfirmasi dulu
      this.selectedUserToDeactivate.set(user);
      this.showConfirmDeactivate.set(true);
    } else {
      // Aktifkan kembali: perlu konfirmasi juga
      this.selectedUserToActivate.set(user);
      this.showConfirmActivate.set(true);
    }
  }

  confirmActivate() {
    const user = this.selectedUserToActivate();
    if (!user) return;
    this.http.patch<ApiResponse<UserItem>>(`/api/auth/users/${user.id}/activate`, {}).subscribe({
      next: () => {
        this.showConfirmActivate.set(false);
        this.selectedUserToActivate.set(null);
        this.toast.success(`${user.name} berhasil diaktifkan kembali.`);
        this.loadUsers();
      },
      error: () => {
        this.showConfirmActivate.set(false);
        this.toast.error('Gagal mengaktifkan user.');
      }
    });
  }

  confirmDeactivate() {
    const user = this.selectedUserToDeactivate();
    if (!user) return;
    this.http.patch<ApiResponse<UserItem>>(`/api/auth/users/${user.id}/deactivate`, {}).subscribe({
      next: () => {
        this.showConfirmDeactivate.set(false);
        this.selectedUserToDeactivate.set(null);
        this.toast.success(`${user.name} berhasil dinonaktifkan.`);
        this.loadUsers();
      },
      error: () => {
        this.showConfirmDeactivate.set(false);
        this.toast.error('Gagal menonaktifkan user.');
      }
    });
  }

  openResetModal(userId: number) {
    this.selectedUserId.set(userId);
    this.newPassword = '';
    this.showResetModal.set(true);
  }

  submitResetPassword() {
    if (!this.newPassword) {
      this.toast.warning('Password tidak boleh kosong.');
      return;
    }
    
    const pwdError = this.validatePassword(this.newPassword);
    if (pwdError) {
      this.toast.warning(pwdError);
      return;
    }

    this.http.patch<ApiResponse<UserItem>>(`/api/auth/users/${this.selectedUserId()}/reset-password`,
      { newPassword: this.newPassword }).subscribe({
        next: () => {
          this.showResetModal.set(false);
          this.toast.success('Password berhasil direset.');
        },
        error: () => {
          this.toast.error('Gagal mereset password.');
        }
      });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
