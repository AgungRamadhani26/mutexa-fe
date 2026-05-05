import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');
  currentYear = new Date().getFullYear();

  constructor(private authService: AuthService, private router: Router) {
    // Jika sudah login, langsung redirect ke dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage.set('Email dan password wajib diisi.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message ?? 'Login gagal. Periksa email dan password Anda.';
        this.errorMessage.set(msg);
      }
    });
  }
}
