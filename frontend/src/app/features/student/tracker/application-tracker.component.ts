import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ApplicationService,
  StudentApplication,
} from '../../../core/services/application.service';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

@Component({
  selector: 'app-application-tracker',
  imports: [CommonModule, RouterLink, TiltDirective],
  template: `
    <div id="tracker-page" class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <!-- header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white" style="font-family:'Bricolage Grotesque',ui-sans-serif">Application tracker</h1>
      </div>

      <!-- summary cards -->
      <div id="tracker-summary-cards" class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        @for (card of summaryCards(); track card.label; let i = $index) {
          <div [id]="'tracker-summary-card-' + i" appTilt
               class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-fade-in-up dark:border-slate-800 dark:bg-slate-900"
               [style.animation-delay]="(i*60)+'ms'"
               style="transform-style:preserve-3d; transition:transform .25s ease, box-shadow .3s ease">
            <div class="flex items-center gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" [class]="card.iconBg">
                {{ card.icon }}
              </span>
              <div>
                <p class="text-2xl font-bold leading-none text-slate-900 dark:text-white">{{ card.value }}</p>
                <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ card.label }}</p>
              </div>
            </div>
          </div>
        }
      </div>

      @if (loading()) {
        <p class="mt-10 text-center text-sm text-slate-400">Loading your applications…</p>
      } @else if (loadError()) {
        <p class="mt-10 text-center text-sm text-red-500">{{ loadError() }}</p>
      } @else {
        <!-- search -->
        <div class="relative mt-6">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </span>
          <input id="tracker-search-input" [value]="search()" (input)="search.set($any($event.target).value)"
                 placeholder="Search by company or job title"
                 class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
        </div>

        @if (applications().length === 0) {
          <!-- empty state -->
          <div class="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <p class="text-3xl">📭</p>
            <p class="mt-3 text-sm text-slate-600 dark:text-slate-300">You haven't applied to any jobs yet.</p>
            <a id="tracker-browse-jobs-link" routerLink="/student/jobs" class="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              Check out the Jobs tab to get started!
            </a>
          </div>
        } @else if (filtered().length === 0) {
          <div class="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <p class="text-sm text-slate-500 dark:text-slate-400">No applications match "{{ search() }}".</p>
          </div>
        } @else {
          <!-- table -->
          <div id="tracker-table-wrap" class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table id="tracker-table" class="w-full text-left text-sm">
              <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th class="px-5 py-3 font-semibold">Company</th>
                  <th class="px-5 py-3 font-semibold">Job title</th>
                  <th class="px-5 py-3 font-semibold">Applied on</th>
                  <th class="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (app of filtered(); track app.id) {
                  <tr [id]="'tracker-row-' + app.id" class="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="px-5 py-3.5">
                      <div class="flex items-center gap-2.5">
                        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{{ app.companyName.charAt(0) }}</span>
                        <span class="font-medium text-slate-900 dark:text-white">{{ app.companyName }}</span>
                      </div>
                    </td>
                    <td class="px-5 py-3.5 text-slate-600 dark:text-slate-300">{{ app.jobTitle }}</td>
                    <td class="px-5 py-3.5 text-slate-500 dark:text-slate-400">{{ app.appliedAt | date:'dd MMM yyyy' }}</td>
                    <td class="px-5 py-3.5">
                      <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" [class]="statusClass(app.status)">
                        {{ statusIcon(app.status) }} {{ statusLabel(app.status) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
})
export class ApplicationTrackerComponent {
  private applicationService = inject(ApplicationService);

  applications = signal<StudentApplication[]>([]);
  loading = signal(true);
  loadError = signal<string | null>(null);
  search = signal('');

  constructor() {
    // === INTEGRATION POINT: GET /api/student/applications ===
    this.applicationService.myApplications().subscribe({
      next: (apps) => { this.applications.set(apps); this.loading.set(false); },
      error: () => { this.loadError.set('Could not load your applications. Please try again.'); this.loading.set(false); },
    });
  }

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.applications();
    return this.applications().filter((a) =>
      [a.companyName, a.jobTitle].some((s) => (s ?? '').toLowerCase().includes(q))
    );
  });

  summaryCards = computed(() => {
    const apps = this.applications();
    const count = (s: string) => apps.filter((a) => a.status === s).length;
    return [
      { label: 'Total applied', value: apps.length, icon: '📋', iconBg: 'bg-brand-100 dark:bg-brand-500/15' },
      { label: 'In review', value: count('APPLIED'), icon: '⏳', iconBg: 'bg-amber-100 dark:bg-amber-500/15' },
      { label: 'Selected', value: count('SELECTED'), icon: '✅', iconBg: 'bg-emerald-100 dark:bg-emerald-500/15' },
      { label: 'Rejected', value: count('REJECTED'), icon: '✋', iconBg: 'bg-rose-100 dark:bg-rose-500/15' },
    ];
  });

  statusLabel(s: string) { return s === 'APPLIED' ? 'Applied' : s === 'SELECTED' ? 'Selected' : 'Rejected'; }
  statusIcon(s: string) { return s === 'APPLIED' ? '✅' : s === 'SELECTED' ? '🎉' : '✋'; }
  statusClass(s: string) {
    return s === 'SELECTED'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
      : s === 'REJECTED'
        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  }
}
