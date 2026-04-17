import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { DashboardService } from '../../services/dashboard.service';
import { HttpErrorResponse } from '@angular/common/http';

import { BankAccount } from '../../models/bank-account.model';
import { MutationDocument } from '../../models/mutation-document.model';
import { SummaryPerbulan } from '../../models/summary-perbulan.model';
import { DetailTransaksi } from '../../models/detail-transaksi.model';
import { RingkasanSaldo } from '../../models/ringkasan-saldo.model';
import { TopFreq } from '../../models/top-freq.model';

/**
 * Komponen utama tampilan Dashboard mutasi.
 * Prinsip SOLID:
 * - SRP: Komponen ini sekarang lebih ramping dengan memisahkan antarmuka (interfaces)
 *   ke folder models/ sehingga file ini hanya berfokus pada logika presentasi UI.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  private documentService = inject(DocumentService);
  private dashboardService = inject(DashboardService);

  // ==========================================
  // STATE MACHINE (PENGATUR TAMPILAN)
  // Aplikasi ini menggunakan sistem 'Single Page' bergaya drill-down:
  // 1. 'accounts'  : Menampilkan daftar rekening utama
  // 2. 'documents' : Menampilkan daftar dokumen mutasi milik 1 rekening spesifik
  // 3. 'analytics' : Menampilkan visualisasi data dari 1 dokumen spesifik
  // ==========================================
  currentView = signal<'accounts' | 'documents' | 'analytics'>('accounts');
  selectedAccount = signal<BankAccount | null>(null);
  selectedDocument = signal<MutationDocument | null>(null);

  // Upload form
  showUploadForm = signal(false);
  uploadForm = {
    bankName: '',
    accountNumber: '',
    accountName: '',
    file: null as File | null,
  };
  isUploading = signal(false);

  // ==========================================
  // SEARCH & PAGINATION
  // ==========================================

  // Level 1: Account search + pagination
  accountSearch = signal('');
  accountPage = signal(1);
  accountPageSize = 5;

  filteredAccounts = computed(() => {
    const search = this.accountSearch().toLowerCase();
    return this.accounts().filter(a =>
      a.accountNumber.toLowerCase().includes(search) ||
      a.accountName.toLowerCase().includes(search) ||
      a.bankName.toLowerCase().includes(search)
    );
  });

  pagedAccounts = computed(() => {
    const start = (this.accountPage() - 1) * this.accountPageSize;
    return this.filteredAccounts().slice(start, start + this.accountPageSize);
  });

  accountTotalPages = computed(() => Math.ceil(this.filteredAccounts().length / this.accountPageSize));

  // Level 2: Document search + pagination
  docSearch = signal('');
  docPage = signal(1);
  docPageSize = 5;

  filteredDocuments = computed(() => {
    const search = this.docSearch().toLowerCase();
    return this.documents().filter(d =>
      d.fileName.toLowerCase().includes(search) ||
      d.status.toLowerCase().includes(search)
    );
  });

  pagedDocuments = computed(() => {
    const start = (this.docPage() - 1) * this.docPageSize;
    return this.filteredDocuments().slice(start, start + this.docPageSize);
  });

  docTotalPages = computed(() => Math.ceil(this.filteredDocuments().length / this.docPageSize));

  // Level 3: Transaction search + pagination
  txSearch = signal('');
  txPage = signal(1);
  txPageSize = 10;

  filterMonth = signal<string>('ALL');
  filterFlag = signal<string>('ALL');

  availableMonths = computed(() => {
    const txs = this.detailTransaksi();
    const monthsMap = new Map<string, string>();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    txs.forEach(tx => {
      if (tx.tanggal) {
        const yyyyMm = tx.tanggal.substring(0, 7); // "YYYY-MM"
        if (!monthsMap.has(yyyyMm)) {
           const parts = yyyyMm.split('-');
           if(parts.length === 2) {
             const year = parts[0];
             const monthIdx = parseInt(parts[1], 10) - 1;
             monthsMap.set(yyyyMm, `${monthNames[monthIdx]} ${year}`);
           }
        }
      }
    });

    const sortedKeys = Array.from(monthsMap.keys()).sort();
    return sortedKeys.map(k => ({ value: k, label: monthsMap.get(k) }));
  });

  filteredTransaksi = computed(() => {
    const search = this.txSearch().toLowerCase();
    const flagFilt = this.filterFlag();
    const monthFilt = this.filterMonth();

    return this.detailTransaksi().filter(tx => {
      const matchSearch = tx.keterangan.toLowerCase().includes(search) ||
                          tx.tanggal.includes(search) ||
                          tx.flag.toLowerCase().includes(search);

      const matchFlag = flagFilt === 'ALL' ? true : tx.flag === flagFilt;
      const matchMonth = monthFilt === 'ALL' ? true : tx.tanggal.startsWith(monthFilt);

      return matchSearch && matchFlag && matchMonth;
    });
  });

  pagedTransaksi = computed(() => {
    const start = (this.txPage() - 1) * this.txPageSize;
    return this.filteredTransaksi().slice(start, start + this.txPageSize);
  });

  txTotalPages = computed(() => Math.ceil(this.filteredTransaksi().length / this.txPageSize));

  // Loading states
  isLoadingAccounts = signal(false);
  isLoadingDocuments = signal(false);
  isLoadingAnalytics = signal(false);

  accounts = signal<BankAccount[]>([]);
  documents = signal<MutationDocument[]>([]);
  summaryPerbulan = signal<SummaryPerbulan[]>([]);
  detailTransaksi = signal<DetailTransaksi[]>([]);
  top10Credit = signal<DetailTransaksi[]>([]);
  top10Debit = signal<DetailTransaksi[]>([]);
  top10CreditFreq = signal<TopFreq[]>([]);
  top10DebitFreq = signal<TopFreq[]>([]);

  // Ringkasan Saldo & Arus Kas (dari backend, exclude-aware)
  ringkasanSaldo = signal<RingkasanSaldo>({
    totalCredit: 0, totalDebit: 0, avgCredit: 0, avgDebit: 0, jumlahBulan: 0, avgDailyBalance: 0
  });
  // ==========================================
  // FUNGSI INIT & PEMANGGILAN API PERTAMA
  // ==========================================
  ngOnInit(): void {
    // Saat komponen dashboard pertama kali dirender, panggil API untuk ambil daftar rekening
    this.fetchAccounts();
  }

  fetchAccounts() {
    this.isLoadingAccounts.set(true);
    // Memanggil endpoint backend '/api/documents/by-account' via DocumentService
    this.documentService.getAccounts().subscribe({
      next: (res) => {
        if (res.success) {
          // Simpan data rekening yang didapat ke dalam signal 'accounts'
          this.accounts.set(res.data as unknown as BankAccount[]);
        }
        this.isLoadingAccounts.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Failed to fetch accounts', err);
        this.isLoadingAccounts.set(false);
      }
    });
  }

  // ==========================================
  // NAVIGASI (PINDAH-PINDAH TAMPILAN/LEVEL)
  // ==========================================

  // Dipanggil ketika user mengklik tombol "Lihat Dokumen" pada sebuah baris rekening
  viewDocuments(account: BankAccount) {
    this.selectedAccount.set(account);     // Ingat rekening mana yang sedang dipilih
    this.currentView.set('documents');     // Ganti tampilan ke level 2 (Daftar Dokumen)
    this.docSearch.set('');
    this.docPage.set(1);

    this.isLoadingDocuments.set(true);
    // Memanggil API backend untuk mengambil dokumen spesifik untuk rekening ini
    this.documentService.getDocumentsByAccount(account.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.documents.set(res.data as unknown as MutationDocument[]);
        }
        this.isLoadingDocuments.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch documents', err);
        this.isLoadingDocuments.set(false);
      }
    });
  }

  // Dipanggil ketika user mengklik "Lihat Rincian" pada sebuah dokumen sukses
  viewAnalytics(doc: MutationDocument) {
    this.selectedDocument.set(doc);        // Ingat dokumen mana yang sedang dipilih
    this.currentView.set('analytics');     // Ganti tampilan ke level 3 (Dashboard Analytics)
    this.txSearch.set('');
    this.txPage.set(1);

    this.isLoadingAnalytics.set(true);

    // Ambil data visualisasi kotak-kotak dashboard dari backend untuk dokumen ini
    this.dashboardService.getSummaryPerbulan(doc.id).subscribe({
      next: (res) => {
        if (res.success) this.summaryPerbulan.set(res.data);
      },
      error: (err) => console.error(err)
    });

    // Ambil Ringkasan Saldo & Arus Kas (exclude-aware)
    this.dashboardService.getRingkasanSaldo(doc.id).subscribe({
      next: (res) => {
        if (res.success) this.ringkasanSaldo.set(res.data);
      },
      error: (err) => console.error(err)
    });

    // Ambil data Top 10 Credit Amount
    this.dashboardService.getTop10CreditAmount(doc.id).subscribe({
      next: (res) => {
        if (res.success) this.top10Credit.set(res.data);
      },
      error: (err) => console.error(err)
    });

    // Ambil data Top 10 Debit Amount
    this.dashboardService.getTop10DebitAmount(doc.id).subscribe({
      next: (res) => {
        if (res.success) this.top10Debit.set(res.data);
      },
      error: (err) => console.error(err)
    });

    // Ambil data Top 10 Credit Freq
    this.dashboardService.getTop10CreditFreq(doc.id).subscribe({
      next: (res) => {
        if (res.success) this.top10CreditFreq.set(res.data);
      },
      error: (err) => console.error(err)
    });

    // Ambil data Top 10 Debit Freq
    this.dashboardService.getTop10DebitFreq(doc.id).subscribe({
      next: (res) => {
        if (res.success) this.top10DebitFreq.set(res.data);
      },
      error: (err) => console.error(err)
    });

    // Ambil isi rincian tabel transaksi mentah untuk ditampilkan di bagian bawah
    this.dashboardService.getDetailSemuaTransaksi(doc.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.detailTransaksi.set(res.data);
          this.isLoadingAnalytics.set(false); // Sembunyikan loading setelah selesai
        }
      },
      error: (err) => {
        console.error(err);
        this.isLoadingAnalytics.set(false);
      }
    });
  }

  // Men-trigger unduhan file Excel berdasarkan dokumen yang sedang aktif
  exportExcel() {
    const doc = this.selectedDocument();
    if (doc) {
      // Periksa apakah ada transaksi yang di-exclude
      const excludedCount = this.detailTransaksi().filter(t => t.isExcluded).length;
      if (excludedCount > 0) {
        if (!confirm(`Anda telah mengecualikan (exclude) ${excludedCount} transaksi.\n\nTransaksi-transaksi ini TIDAK akan disertakan di dalam file ekspor Excel.\n\nLanjutkan mengunduh?`)) {
          return; // Batal download
        }
      }

      let url = this.dashboardService.exportExcelUrl(doc.id);
      if (this.filterMonth() !== 'ALL') {
         url += '&month=' + this.filterMonth();
      }
      if (this.filterFlag() !== 'ALL') {
         url += '&flag=' + this.filterFlag();
      }
      window.location.href = url;
    }
  }

  // Mengubah status exclude transaksi secara langsung (Optimistic UI)
  toggleExclude(tx: DetailTransaksi) {
    if (!tx.id) return;
    const oldStatus = tx.isExcluded;
    tx.isExcluded = !tx.isExcluded; // UI update seketika

    this.dashboardService.toggleExclude(tx.id).subscribe({
      next: (res) => {
        if (!res.success) tx.isExcluded = oldStatus; // Revert jika gagal
      },
      error: (err) => {
        console.error("Gagal toggle exclude", err);
        tx.isExcluded = oldStatus; // Revert jika gagal
      }
    });
  }

  // Fungsi tombol "Kembali" dari Level 2 ke Level 1
  backToAccounts() {
    this.selectedAccount.set(null);
    this.documents.set([]);
    this.currentView.set('accounts');
  }

  // Fungsi tombol "Kembali" dari Level 3 ke Level 2
  backToDocuments() {
    this.selectedDocument.set(null);
    this.summaryPerbulan.set([]);
    this.detailTransaksi.set([]);
    this.top10Credit.set([]);
    this.top10Debit.set([]);
    this.top10CreditFreq.set([]);
    this.top10DebitFreq.set([]);
    this.ringkasanSaldo.set({ totalCredit: 0, totalDebit: 0, avgCredit: 0, avgDebit: 0, jumlahBulan: 0, avgDailyBalance: 0 });
    this.currentView.set('documents');
  }

  // ==========================================
  // PAGINATION
  // ==========================================

  goToPage(type: 'account' | 'doc' | 'tx', page: number) {
    if (type === 'account') this.accountPage.set(page);
    else if (type === 'doc') this.docPage.set(page);
    else this.txPage.set(page);
  }

  getVisiblePages(currentPage: number, totalPages: number): (number | string)[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [1];
    let startPage = Math.max(2, currentPage - 2);
    let endPage = Math.min(totalPages - 1, currentPage + 2);
    
    if (currentPage <= 4) {
      endPage = 5;
    }
    if (currentPage >= totalPages - 3) {
      startPage = totalPages - 4;
    }

    if (startPage > 2) {
      pages.push('...');
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    return pages;
  }

  onSearchChange(type: 'account' | 'doc' | 'tx') {
    if (type === 'account') this.accountPage.set(1);
    else if (type === 'doc') this.docPage.set(1);
    else this.txPage.set(1);
  }

  // ==========================================
  // UPLOAD
  // ==========================================

  toggleUploadForm() {
    this.showUploadForm.update(v => !v);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadForm.file = input.files[0];
    }
  }

  submitUpload() {
    if (!this.uploadForm.file || !this.uploadForm.bankName || !this.uploadForm.accountNumber || !this.uploadForm.accountName) {
      alert("Mohon lengkapi semua isian.");
      return;
    }

    this.isUploading.set(true);

    const formData = new FormData();
    formData.append('accountId', '0'); // Backend creates or updates by account number anyway
    formData.append('accountNumber', this.uploadForm.accountNumber);
    formData.append('accountName', this.uploadForm.accountName);
    formData.append('bankName', this.uploadForm.bankName);
    if (this.uploadForm.file) {
      formData.append('file', this.uploadForm.file);
    }

    this.documentService.uploadDocument(formData).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Upload Sukses! ' + res.message);
          this.showUploadForm.set(false);
          this.uploadForm = { bankName: '', accountNumber: '', accountName: '', file: null };
          this.fetchAccounts(); // refresh list
        }
        this.isUploading.set(false);
      },
      error: (err) => {
        console.error('Upload Error:', err);
        alert('Gagal mengunggah file. ' + (err.error?.message || err.message));
        this.isUploading.set(false);
      }
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      case 'PARSING': return 'badge-warning';
      case 'UPLOADED': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'Selesai';
      case 'FAILED': return 'Gagal';
      case 'PARSING': return 'Diproses...';
      case 'UPLOADED': return 'Diunggah';
      default: return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'bi-check-circle-fill';
      case 'FAILED': return 'bi-x-circle-fill';
      case 'PARSING': return 'bi-arrow-repeat';
      default: return 'bi-question-circle';
    }
  }

  getBankBadgeClass(bank: string): string {
    switch (bank) {
      case 'BCA': return 'bank-badge-bca';
      case 'BNI': return 'bank-badge-bni';
      case 'BRI': return 'bank-badge-bri';
      case 'MANDIRI':
      case 'MANDIRI KOPRA': return 'bank-badge-mandiri';
      case 'UOB': return 'bank-badge-uob';
      default: return 'bank-badge-default';
    }
  }

  formatPeriod(start: string | null, end: string | null): string {
    if (!start || !end) return '-';
    const s = new Date(start);
    const e = new Date(end);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[s.getMonth()]} ${s.getFullYear()} - ${months[e.getMonth()]} ${e.getFullYear()}`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  formatCurrency(amount: number): string {
    return 'Rp ' + amount.toLocaleString('id-ID');
  }
}

