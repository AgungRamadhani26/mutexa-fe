import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { Footer } from './layout/footer/footer';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, CommonModule, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  auth = inject(AuthService);
  router = inject(Router);

  // Sembunyikan navbar & footer di halaman login
  isLoginPage() {
    return this.router.url === '/login';
  }
}
