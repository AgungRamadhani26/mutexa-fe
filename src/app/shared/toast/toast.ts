import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 10050; margin-top: 60px;">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast show align-items-center text-bg-{{ getBgClass(toast.type) }} border-0 mb-2 shadow-lg" 
             role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body fw-medium d-flex align-items-center">
              <i class="bi {{ getIcon(toast.type) }} me-2 fs-5"></i>
              {{ toast.message }}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    (click)="toastService.remove(toast.id)" aria-label="Close"></button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { pointer-events: none; }
    .toast { pointer-events: auto; opacity: 0.95; border-radius: 8px; animation: slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 0.95; }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  getBgClass(type: string): string {
    switch(type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      default: return 'primary';
    }
  }

  getIcon(type: string): string {
    switch(type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-exclamation-octagon-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      default: return 'bi-info-circle-fill';
    }
  }
}
