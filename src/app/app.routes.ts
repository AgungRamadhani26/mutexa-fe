import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
    },
    {
        path: 'mutasi',
        loadComponent: () => import('./features/mutasi/mutasi').then(m => m.Mutasi)
    },
    {
        path: 'analisis',
        loadComponent: () => import('./features/analisis/analisis').then(m => m.Analisis)
    },
    {
        path: 'profil',
        loadComponent: () => import('./features/profil/profil').then(m => m.Profil)
    }
];
