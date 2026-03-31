import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { SummaryPerbulan } from '../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  summaryPerbulan = signal<SummaryPerbulan[]>([]);

  ngOnInit() {
    this.dashboardService.getSummaryPerbulan().subscribe({
      next: (res) => {
        if (res.success) {
          this.summaryPerbulan.set(res.data);
        }
      },
      error: (err) => {
        console.error('Error fetching summary perbulan', err);
      }
    });
  }
}
