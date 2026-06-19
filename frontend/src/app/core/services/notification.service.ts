import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DashboardService, StudentDashboard } from './dashboard.service';
import { environment } from '../../../environments/environment.prod';

export interface AppNotification {
  id: string;
  title: string;
  detail: string;
  link: string;
  icon: 'job' | 'check' | 'user';
}

/**
 * Derives student notifications from the dashboard and keeps them fresh by polling
 * (~30s). Tracks which have been seen (localStorage) for the unread badge, and emits
 * newly-arrived notifications as transient toasts. No backend change required —
 * everything is computed from GET /api/student/dashboard.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private dashboard = inject(DashboardService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly SEEN_KEY = 'hiregrad-seen-notifications';
  private readonly POLL_MS = 30_000;

  notifications = signal<AppNotification[]>([]);
  toasts = signal<AppNotification[]>([]);
  private seenIds = signal<Set<string>>(new Set(this.restoreSeen()));

  private timer: ReturnType<typeof setInterval> | null = null;
  private primed = false; // first load populates the bell without flooding toasts

  unreadCount = computed(() => this.notifications().filter((n) => !this.seenIds().has(n.id)).length);
  isUnread(id: string): boolean { return !this.seenIds().has(id); }

  /** Begin polling (call from the student layout; browser only). */
  start(): void {
    if (!this.isBrowser || this.timer) return;
    this.refresh();
    this.timer = setInterval(() => this.refresh(), this.POLL_MS);
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  refresh(): void {
    this.dashboard.getStudentDashboard().subscribe({
      next: (d) => {
        const next = this.build(d);
        // newly-appeared notifications (not previously listed and not already seen) → toast
        const prevIds = new Set(this.notifications().map((n) => n.id));
        const fresh = next.filter((n) => !prevIds.has(n.id) && !this.seenIds().has(n.id));
        this.notifications.set(next);
        if (this.primed && fresh.length) this.pushToasts(fresh);
        this.primed = true;
      },
      error: () => {},
    });
  }

  markSeen(id: string): void {
    this.seenIds.update((s) => { const c = new Set(s); c.add(id); return c; });
    this.persistSeen();
  }
  markAllSeen(): void {
    this.seenIds.update((s) => { const c = new Set(s); this.notifications().forEach((n) => c.add(n.id)); return c; });
    this.persistSeen();
  }
  dismissToast(id: string): void {
    this.toasts.update((t) => t.filter((n) => n.id !== id));
  }

  private pushToasts(fresh: AppNotification[]): void {
    this.toasts.update((t) => [...t, ...fresh]);
    fresh.forEach((n) => setTimeout(() => this.dismissToast(n.id), 7000));
  }

  /** Build the notification list from the dashboard snapshot (the 3 chosen scenarios). */
  private build(d: StudentDashboard): AppNotification[] {
    const out: AppNotification[] = [];

    // 1) profile completion (while < 100%)
    if (d.profileCompletion < 100) {
      out.push({
        id: 'profile-completion',
        icon: 'user',
        title: 'Complete your profile',
        detail: `Your profile is ${d.profileCompletion}% complete — finish it to unlock more roles.`,
        link: environment.apiUrl + '/student/profile',
      });
    }

    // 2) new eligible jobs (posted roles the student qualifies for)
    for (const j of d.recommendedJobs ?? []) {
      out.push({
        id: 'job-' + j.id,
        icon: 'job',
        title: 'New role you qualify for',
        detail: `${j.jobTitle} at ${j.companyName}`,
        link: environment.apiUrl + '/student/jobs',
      });
    }

    // 3) selected in an application
    for (const a of d.recentApplications ?? []) {
      if (a.status === 'SELECTED') {
        out.push({
          id: 'selected-' + a.companyName + '-' + a.jobTitle,
          icon: 'check',
          title: "🎉 You've been selected!",
          detail: `${a.jobTitle} at ${a.companyName}`,
          link: environment.apiUrl + '/student/tracker',
        });
      }
    }

    return out;
  }

  private restoreSeen(): string[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(this.SEEN_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch { return []; }
  }
  private persistSeen(): void {
    if (this.isBrowser) localStorage.setItem(this.SEEN_KEY, JSON.stringify([...this.seenIds()]));
  }
}
