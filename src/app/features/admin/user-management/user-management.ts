import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../../../models/api-response.model';

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
  errorMessage = signal('');
  successMessage = signal('');

  registerForm: RegisterForm = { name: '', email: '', password: '', role: 'ANALYST' };

  constructor(private http: HttpClient, private router: Router) { }

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
    this.errorMessage.set('');
    this.showAddModal.set(true);
  }

  submitRegister() {
    this.http.post<ApiResponse<UserItem>>('/api/auth/register', this.registerForm).subscribe({
      next: () => {
        this.showAddModal.set(false);
        this.successMessage.set('User baru berhasil ditambahkan.');
        this.loadUsers();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => this.errorMessage.set(err?.error?.message ?? 'Gagal menambahkan user.')
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
        this.successMessage.set(`${user.name} berhasil diaktifkan kembali.`);
        this.loadUsers();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => { this.showConfirmActivate.set(false); }
    });
  }

  confirmDeactivate() {
    const user = this.selectedUserToDeactivate();
    if (!user) return;
    this.http.patch<ApiResponse<UserItem>>(`/api/auth/users/${user.id}/deactivate`, {}).subscribe({
      next: () => {
        this.showConfirmDeactivate.set(false);
        this.selectedUserToDeactivate.set(null);
        this.successMessage.set(`${user.name} berhasil dinonaktifkan.`);
        this.loadUsers();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => { this.showConfirmDeactivate.set(false); }
    });
  }

  openResetModal(userId: number) {
    this.selectedUserId.set(userId);
    this.newPassword = '';
    this.showResetModal.set(true);
  }

  submitResetPassword() {
    if (!this.newPassword) return;
    this.http.patch<ApiResponse<UserItem>>(`/api/auth/users/${this.selectedUserId()}/reset-password`,
      { newPassword: this.newPassword }).subscribe({
        next: () => {
          this.showResetModal.set(false);
          this.successMessage.set('Password berhasil direset.');
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: () => { }
      });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
