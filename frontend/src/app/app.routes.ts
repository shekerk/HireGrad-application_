import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard, mustChangePwdGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    // Forced password reset after a student's first login with the admin-issued temp password.
    path: 'change-password',
    canActivate: [authGuard, roleGuard('STUDENT')],
    loadComponent: () =>
      import('./features/student/auth/change-password.component').then((m) => m.ChangePasswordComponent),
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard('STUDENT'), mustChangePwdGuard],
    loadComponent: () =>
      import('./features/student/layout/student-layout.component').then(
        (m) => m.StudentLayoutComponent
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/student/home/student-home.component').then(
            (m) => m.StudentHomeComponent
          ),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/student/jobs/job-dashboard.component').then(
            (m) => m.JobDashboardComponent
          ),
      },
      {
        path: 'tracker',
        loadComponent: () =>
          import('./features/student/tracker/application-tracker.component').then(
            (m) => m.ApplicationTrackerComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/student/profile/student-profile.component').then(
            (m) => m.StudentProfileComponent
          ),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', loadComponent: () => import('./features/admin/home/admin-home.component').then((m) => m.AdminHomeComponent) },
      { path: 'jobs', loadComponent: () => import('./features/admin/jobs/job-posting.component').then((m) => m.JobPostingComponent) },
      { path: 'applications', loadComponent: () => import('./features/admin/applications/application-management.component').then((m) => m.ApplicationManagementComponent) },
      { path: 'students', loadComponent: () => import('./features/admin/students/student-account-creation.component').then((m) => m.StudentAccountCreationComponent) },
      { path: 'reports', loadComponent: () => import('./features/admin/reports/report-analysis.component').then((m) => m.ReportAnalysisComponent) },
      { path: 'profile', loadComponent: () => import('./features/admin/profile/admin-profile.component').then((m) => m.AdminProfileComponent) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];