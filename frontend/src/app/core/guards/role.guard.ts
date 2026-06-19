import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowed: UserRole): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();

    if (role === allowed) return true;
    if (role === 'STUDENT') return router.createUrlTree(['/student']);
    if (role === 'ADMIN') return router.createUrlTree(['/admin']);
    return router.createUrlTree(['/login']);
  };
};

/**
 * Blocks student access to the portal until they have changed their
 * temporary password. Redirects to /change-password when mustChangePassword is true.
 */
export const mustChangePwdGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (user?.role === 'STUDENT' && user?.mustChangePassword) {
    return router.createUrlTree(['/change-password']);
  }
  return true;
};