import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthUser, LoginRequest, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'hiregrad-user';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly http = inject(HttpClient);
  private readonly API = environment.apiUrl + '/api/auth';

  private readonly _user = signal<AuthUser | null>(this.restore());

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly role = computed<UserRole | null>(() => this._user()?.role ?? null);

  login(req: LoginRequest): Observable<AuthUser> {
    return this.http.post<ApiResponse<AuthUser>>(`${this.API}/login`, req).pipe(
      map((res) => res.data),
      tap((user) => this.persist(user)),
      catchError((e) => {
        const msg = e?.error?.error?.message ?? 'Login failed. Please try again.';
        return throwError(() => new Error(msg));
      })
    );
  }

  /** Student replaces their temporary password; clears the forced-change flag locally on success. */
  changePassword(newPassword: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(environment.apiUrl + '/api/student/change-password', { newPassword }).pipe(
      map(() => void 0),
      tap(() => {
        const u = this._user();
        if (u) this.persist({ ...u, mustChangePassword: false });
      }),
      catchError((e) => {
        const msg = e?.error?.error?.message ?? 'Could not change password. Please try again.';
        return throwError(() => new Error(msg));
      })
    );
  }

  logout(): void {
    this._user.set(null);
    if (this.isBrowser) localStorage.removeItem(this.STORAGE_KEY);
  }

  /** Refresh the cached user (e.g. after editing the profile name). */
  updateUser(user: AuthUser): void {
    this.persist(user);
  }

  private persist(user: AuthUser): void {
    this._user.set(user);
    if (this.isBrowser) localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  private restore(): AuthUser | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  }
}