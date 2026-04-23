import { Component, signal, computed, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
import { ApiResponse } from '../../models/api-response.model';

/**
 * Komponen utama tampilan Dashboard mutasi.
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
  private platformId = inject(PLATFORM_ID);

  // ==========================================
  // STATE MACHINE (PENGATUR TAMPILAN)
  // ==========================================
  currentView = signal<'accounts' | 'documents' | 'analytics'>('accounts');
  activeTab = signal<'ringkasan' | 'anomali' | 'log'>('ringkasan');
  isWindressActive = signal<boolean>(false);
  selectedAccount = signal<BankAccount | null>(null);
  selectedDocument = signal<MutationDocument | null>(null);

  // Modal Flags
  showAfterCreditModal = signal<boolean>(false);
  showAfterDebitModal = signal<boolean>(false);

  // Upload form
  showUploadForm = signal<boolean>(false);
  uploadForm = {
    bankName: '',
    accountNumber: '',
    accountName: '',
    file: null as File | null,
  };
  isUploading = signal<boolean>(false);

  // Level 1: Account
  accountSearch = signal<string>('');
  accountPage = signal<number>(1);
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

  // Level 2: Document
  docSearch = signal<string>('');
  docPage = signal<number>(1);
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

  // Level 3: Transaction
  txSearch = signal<string>('');
  txPage = signal<number>(1);
  txPageSize = 10;

  filterMonth = signal<string>('ALL');
  filterFlag = signal<string>('ALL');

  availableMonths = computed(() => {
    const txs = this.detailTransaksi();
    const monthsMap = new Map<string, string>();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    txs.forEach(tx => {
      if (tx.tanggal) {
        const yyyyMm = tx.tanggal.substring(0, 7);
        if (!monthsMap.has(yyyyMm)) {
          const parts = yyyyMm.split('-');
          if (parts.length === 2) {
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

  // Category Pagination
  taxPage = signal<number>(1);
  adminPage = signal<number>(1);
  interestPage = signal<number>(1);
  categoryPageSize = 5;

  currentTaxData = computed(() => this.taxTransactions());
  pagedTax = computed(() => {
    const start = (this.taxPage() - 1) * this.categoryPageSize;
    return this.currentTaxData().slice(start, start + this.categoryPageSize);
  });
  taxTotalPages = computed(() => Math.ceil(this.currentTaxData().length / this.categoryPageSize));

  currentAdminData = computed(() => this.adminTransactions());
  pagedAdmin = computed(() => {
    const start = (this.adminPage() - 1) * this.categoryPageSize;
    return this.currentAdminData().slice(start, start + this.categoryPageSize);
  });
  adminTotalPages = computed(() => Math.ceil(this.currentAdminData().length / this.categoryPageSize));

  currentInterestData = computed(() => this.interestTransactions());
  pagedInterest = computed(() => {
    const start = (this.interestPage() - 1) * this.categoryPageSize;
    return this.currentInterestData().slice(start, start + this.categoryPageSize);
  });
  interestTotalPages = computed(() => Math.ceil(this.currentInterestData().length / this.categoryPageSize));

  // Loading states
  isLoadingAccounts = signal<boolean>(false);
  isLoadingDocuments = signal<boolean>(false);
  isLoadingAnalytics = signal<boolean>(false);

  accounts = signal<BankAccount[]>([]);
  documents = signal<MutationDocument[]>([]);
  summaryPerbulan = signal<SummaryPerbulan[]>([]);
  detailTransaksi = signal<DetailTransaksi[]>([]);
  top10Credit = signal<DetailTransaksi[]>([]);
  top10Debit = signal<DetailTransaksi[]>([]);
  top10CreditFreq = signal<TopFreq[]>([]);
  top10DebitFreq = signal<TopFreq[]>([]);
  top10CreditFreqCleaned = signal<TopFreq[]>([]);
  top10DebitFreqCleaned = signal<TopFreq[]>([]);
  adminTransactions = signal<DetailTransaksi[]>([]);
  taxTransactions = signal<DetailTransaksi[]>([]);
  interestTransactions = signal<DetailTransaksi[]>([]);
  anomalyCreditTransactions = signal<DetailTransaksi[]>([]);
  anomalyDebitTransactions = signal<DetailTransaksi[]>([]);

  ringkasanSaldo = signal<RingkasanSaldo>({
    totalCredit: 0, totalDebit: 0, avgCredit: 0, avgDebit: 0, jumlahBulan: 0, avgDailyBalance: 0
  });

  top10CreditCleaned = signal<DetailTransaksi[]>([]);
  top10DebitCleaned = signal<DetailTransaksi[]>([]);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.fetchAccounts();
    }
  }

  fetchAccounts() {
    this.isLoadingAccounts.set(true);
    this.documentService.getAccounts().subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) this.accounts.set(res.data as unknown as BankAccount[]);
        this.isLoadingAccounts.set(false);
      },
      error: () => this.isLoadingAccounts.set(false)
    });
  }

  getCategoryRowClass(category?: string): string {
    if (!category) return '';
    switch (category) {
      case 'ADMIN': return 'row-admin';
      case 'TAX': return 'row-tax';
      case 'INTEREST': return 'row-interest';
      default: return '';
    }
  }

  viewDocuments(account: BankAccount) {
    this.selectedAccount.set(account);
    this.currentView.set('documents');
    this.isLoadingDocuments.set(true);
    this.documentService.getDocumentsByAccount(account.id).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) this.documents.set(res.data as unknown as MutationDocument[]);
        this.isLoadingDocuments.set(false);
      },
      error: () => this.isLoadingDocuments.set(false)
    });
  }

  viewAnalytics(doc: MutationDocument) {
    this.selectedDocument.set(doc);
    this.currentView.set('analytics');
    this.isLoadingAnalytics.set(true);
    this.activeTab.set('ringkasan');
    this.isWindressActive.set(false);
    this.refreshAllDashboardData(doc.id);
  }

  refreshAllDashboardData(documentId: number) {
    this.dashboardService.getSummaryPerbulan(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.summaryPerbulan.set(res.data); });
    this.dashboardService.getRingkasanSaldo(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.ringkasanSaldo.set(res.data); });
    this.dashboardService.getTop10CreditAmount(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.top10Credit.set(res.data); });
    this.dashboardService.getTop10DebitAmount(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.top10Debit.set(res.data); });
    this.dashboardService.getTop10CreditFreq(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.top10CreditFreq.set(res.data); });
    this.dashboardService.getTop10DebitFreq(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.top10DebitFreq.set(res.data); });
    this.dashboardService.getAdminTransactions(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.adminTransactions.set(res.data); });
    this.dashboardService.getTaxTransactions(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.taxTransactions.set(res.data); });
    this.dashboardService.getInterestTransactions(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.interestTransactions.set(res.data); });
    this.dashboardService.getAnomalyCreditTransactions(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.anomalyCreditTransactions.set(res.data); });
    this.dashboardService.getAnomalyDebitTransactions(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.anomalyDebitTransactions.set(res.data); });
    this.dashboardService.getTop10CreditAmountCleaned(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.top10CreditCleaned.set(res.data); });
    this.dashboardService.getTop10DebitAmountCleaned(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.top10DebitCleaned.set(res.data); });
    this.dashboardService.getTop10CreditFreqCleaned(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.top10CreditFreqCleaned.set(res.data); });
    this.dashboardService.getTop10DebitFreqCleaned(documentId).subscribe((res: ApiResponse<any>) => { if (res.success) this.top10DebitFreqCleaned.set(res.data); });

    this.dashboardService.getDetailSemuaTransaksi(documentId).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) this.detailTransaksi.set(res.data);
        this.isLoadingAnalytics.set(false);
      },
      error: () => this.isLoadingAnalytics.set(false)
    });
  }

  calculateDiff(before: number, after?: number): number { return (after || 0) - (before || 0); }
  calculatePercentage(before: number, after?: number): number {
    if (!before || before === 0) return 0;
    return ((after || 0) - before) / before * 100;
  }

  applyWindress() { this.isWindressActive.update((v: boolean) => !v); }

  exportExcel() {
    const doc = this.selectedDocument();
    if (doc) {
      let url = this.dashboardService.exportExcelUrl(doc.id);
      if (this.filterMonth() !== 'ALL') url += '&month=' + this.filterMonth();
      if (this.filterFlag() !== 'ALL') url += '&flag=' + this.filterFlag();
      window.location.href = url;
    }
  }

  toggleExclude(tx: DetailTransaksi) {
    if (!tx.id) return;
    const oldStatus = tx.isExcluded;
    tx.isExcluded = !tx.isExcluded;

    this.dashboardService.toggleExclude(tx.id).subscribe({
      next: (res: ApiResponse<any>) => {
        if (!res.success) tx.isExcluded = oldStatus;
        else {
          const doc = this.selectedDocument();
          if (doc) {
            this.refreshAllDashboardData(doc.id);
          }
        }
      },
      error: () => { tx.isExcluded = oldStatus; }
    });
  }

  backToAccounts() {
    this.selectedAccount.set(null);
    this.documents.set([]);
    this.currentView.set('accounts');
  }

  backToDocuments() {
    this.selectedDocument.set(null);
    this.summaryPerbulan.set([]);
    this.detailTransaksi.set([]);
    this.top10Credit.set([]);
    this.top10Debit.set([]);
    this.top10CreditFreq.set([]);
    this.top10DebitFreq.set([]);
    this.top10CreditFreqCleaned.set([]);
    this.top10DebitFreqCleaned.set([]);
    this.adminTransactions.set([]);
    this.taxTransactions.set([]);
    this.interestTransactions.set([]);
    this.currentView.set('documents');
  }

  goToPage(type: string, page: number) {
    if (type === 'account') this.accountPage.set(page);
    else if (type === 'doc') this.docPage.set(page);
    else if (type === 'tx') this.txPage.set(page);
    else if (type === 'tax') this.taxPage.set(page);
    else if (type === 'admin') this.adminPage.set(page);
    else if (type === 'interest') this.interestPage.set(page);
  }

  getVisiblePages(currentPage: number, totalPages: number): (number | string)[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }

  onSearchChange(type: string) {
    if (type === 'account') this.accountPage.set(1);
    else if (type === 'doc') this.docPage.set(1);
    else this.txPage.set(1);
  }

  toggleUploadForm() { this.showUploadForm.update((v: boolean) => !v); }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.uploadForm.file = input.files[0];
  }

  submitUpload() {
    if (!this.uploadForm.file || !this.uploadForm.bankName) {
      alert("Lengkapi data!"); return;
    }
    this.isUploading.set(true);
    const formData = new FormData();
    formData.append('accountId', '0');
    formData.append('accountNumber', this.uploadForm.accountNumber);
    formData.append('accountName', this.uploadForm.accountName);
    formData.append('bankName', this.uploadForm.bankName);
    formData.append('file', this.uploadForm.file);

    this.documentService.uploadDocument(formData).subscribe({
      next: (res: ApiResponse<any>) => {
        if (res.success) {
          alert('Berhasil!'); this.showUploadForm.set(false); this.fetchAccounts();
        }
        this.isUploading.set(false);
      },
      error: () => this.isUploading.set(false)
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      case 'PARSING': return 'badge-warning';
      default: return 'badge-secondary';
    }
  }

  getStatusLabel(status: string): string {
    return status === 'SUCCESS' ? 'Selesai' : (status === 'FAILED' ? 'Gagal' : 'Proses');
  }

  getStatusIcon(status: string): string {
    return status === 'SUCCESS' ? 'bi-check-circle-fill' : (status === 'FAILED' ? 'bi-x-circle-fill' : 'bi-arrow-repeat');
  }

  getBankBadgeClass(bank: string): string {
    return 'bank-badge-' + bank.toLowerCase().replace(' ', '-');
  }

  formatPeriod(start: string | null, end: string | null): string {
    if (!start || !end) return '-';
    const s = new Date(start), e = new Date(end);
    return `${s.getMonth() + 1}/${s.getFullYear()} - ${e.getMonth() + 1}/${e.getFullYear()}`;
  }

  formatDate(d: string): string { return new Date(d).toLocaleDateString(); }
  formatCurrency(a: number): string { return 'Rp ' + a.toLocaleString('id-ID'); }
}
