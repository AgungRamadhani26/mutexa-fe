import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard),
        canActivate: [authGuard]
    },
    {
        path: 'login',
        loadComponent: () => import('./features/login/login').then(m => m.Login)
    },
    {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/user-management/user-management').then(m => m.UserManagement),
        canActivate: [authGuard, adminGuard]
    },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];
