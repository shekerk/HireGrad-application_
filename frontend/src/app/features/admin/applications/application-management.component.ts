import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AdminApplication,
  ApplicationService,
  ApplicationStatus,
} from '../../../core/services/application.service';
import { JobResponse, JobService } from '../../../core/services/job.service';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

@Component({
  selector: 'app-application-management',
  imports: [CommonModule, TiltDirective],
  template: `
    <div id="appmgmt-page" class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      @if (toast(); as t) {
        <div id="appmgmt-toast" class="fixed left-1/2 top-5 z-50 -translate-x-1/2 animate-fade-in-up">
          <div class="rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg" [class.bg-emerald-500]="t.type==='success'" [class.bg-red-500]="t.type==='error'">{{ t.msg }}</div>
        </div>
      }

      <!-- header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white" style="font-family:'Bricolage Grotesque',ui-sans-serif">Application management</h1>

      </div>

      @if (loadingJobs()) {
        <p class="mt-10 text-center text-sm text-slate-400">Loading job postings…</p>
      } @else if (jobs().length === 0) {
        <div class="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <p class="text-sm text-slate-500 dark:text-slate-400">No job postings yet. Create one from the Job posting tab.</p>
        </div>
      } @else {
        <!-- job cards -->
        <div class="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          @for (job of jobs(); track job.id; let i = $index) {
            <button [id]="'appmgmt-job-card-' + job.id" appTilt type="button" (click)="selectJob(job)"
                    class="rounded-2xl border bg-white p-4 text-left shadow-sm transition animate-fade-in-up dark:bg-slate-900"
                    [class.border-brand-400]="selectedJobId() === job.id"
                    [class.ring-2]="selectedJobId() === job.id"
                    [class.ring-brand-400]="selectedJobId() === job.id"
                    [class.border-slate-200]="selectedJobId() !== job.id"
                    [class.dark:border-slate-800]="selectedJobId() !== job.id"
                    [style.animation-delay]="(i*60)+'ms'"
                    style="transform-style:preserve-3d; transition:transform .25s ease, box-shadow .3s ease">
              <div class="flex items-start gap-3">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{{ job.companyName.charAt(0) }}</span>
                <div class="min-w-0 flex-1">
                  <h3 class="truncate font-bold text-slate-900 dark:text-white">{{ job.jobTitle }}</h3>
                  <p class="truncate text-sm text-slate-500 dark:text-slate-400">{{ job.companyName }}</p>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{{ typeLabel(job.employmentType) }}</span>
                <span>📍 {{ job.location }}</span>
              </div>
              <p class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                {{ applicantCount(job.id) }} applicant{{ applicantCount(job.id) === 1 ? '' : 's' }}
              </p>
            </button>
          }
        </div>

        @if (selectedJobId() !== null) {
          <!-- stats bar -->
          <div id="appmgmt-stats-bar" class="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            <div id="appmgmt-stat-total" class="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ applications().length }}</p>
              <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Total applicants</p>
            </div>
            <div id="appmgmt-stat-selected" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <p class="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{{ selectedCount() }}</p>
              <p class="mt-1 text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80">Selected</p>
            </div>
            <div id="appmgmt-stat-rejected" class="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10">
              <p class="text-2xl font-bold text-rose-700 dark:text-rose-300">{{ rejectedCount() }}</p>
              <p class="mt-1 text-xs font-medium text-rose-700/80 dark:text-rose-300/80">Rejected</p>
            </div>
          </div>

          <!-- search + filter + reset -->
          <div id="appmgmt-filter-bar" class="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative flex-1">
              <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </span>
              <input id="appmgmt-search-input" [value]="search()" (input)="search.set($any($event.target).value)"
                     placeholder="Search by student name or roll number"
                     class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" />
            </div>
            <select id="appmgmt-branch-filter" [value]="branchFilter()" (change)="branchFilter.set($any($event.target).value)"
                    class="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <option value="">All branches</option>
              @for (b of branchOptions(); track b) { <option [value]="b">{{ b }}</option> }
            </select>
            <button id="appmgmt-reset-btn" (click)="resetFilters()"
                    class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Reset
            </button>
          </div>

          @if (loadingApps()) {
            <p class="mt-8 text-center text-sm text-slate-400">Loading applicants…</p>
          } @else if (applications().length === 0) {
            <div class="mt-6 rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <p class="text-sm text-slate-500 dark:text-slate-400">No applications received for this job posting yet.</p>
            </div>
          } @else if (filtered().length === 0) {
            <div class="mt-6 rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <p class="text-sm text-slate-500 dark:text-slate-400">No applicants match your filters.</p>
            </div>
          } @else {
            <!-- applicants table -->
            <div id="appmgmt-applicants-table-wrap" class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table id="appmgmt-applicants-table" class="w-full text-left text-sm">
                <thead class="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                  <tr>
                    <th class="px-5 py-3 font-semibold">Student</th>
                    <th class="px-5 py-3 font-semibold">Roll no.</th>
                    <th class="px-5 py-3 font-semibold">Branch</th>
                    <th class="px-5 py-3 font-semibold">CGPA</th>
                    <th class="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (app of filtered(); track app.id) {
                    <tr [id]="'appmgmt-row-' + app.id" class="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td class="px-5 py-3.5">
                        <div class="flex items-center gap-2.5">
                          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{{ initials(app.fullName) }}</span>
                          <span class="font-medium text-slate-900 dark:text-white">{{ app.fullName }}</span>
                        </div>
                      </td>
                      <td class="px-5 py-3.5 text-slate-600 dark:text-slate-300">{{ app.studentUsername }}</td>
                      <td class="px-5 py-3.5 text-slate-600 dark:text-slate-300">{{ app.branch || '—' }}</td>
                      <td class="px-5 py-3.5 text-slate-600 dark:text-slate-300">{{ app.cgpa ?? '—' }}</td>
                      <td class="px-5 py-3.5">
                        <select [id]="'appmgmt-status-' + app.id" [value]="app.status" (change)="changeStatus(app, $any($event.target).value)"
                                [disabled]="updating().has(app.id)"
                                class="rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-brand-400/30 disabled:opacity-50"
                                [class]="statusClass(app.status)">
                          <option value="APPLIED">Applied</option>
                          <option value="SELECTED">Selected</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      }
    </div>
  `,
})
export class ApplicationManagementComponent {
  private jobService = inject(JobService);
  private applicationService = inject(ApplicationService);

  jobs = signal<JobResponse[]>([]);
  loadingJobs = signal(true);
  applicantCounts = signal<Record<number, number>>({});

  selectedJobId = signal<number | null>(null);
  applications = signal<AdminApplication[]>([]);
  loadingApps = signal(false);
  updating = signal<Set<number>>(new Set());

  search = signal('');
  branchFilter = signal('');
  toast = signal<{ type: 'success' | 'error'; msg: string } | null>(null);

  constructor() {
    // === INTEGRATION POINT: GET /api/admin/jobs ===
    this.jobService.listAdminJobs().subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.loadingJobs.set(false);
        if (jobs.length) this.selectJob(jobs[0]);
        // prime applicant counts for every card
        jobs.forEach((j) => this.refreshCount(j.id));
      },
      error: () => this.loadingJobs.set(false),
    });
  }

  selectJob(job: JobResponse) {
    this.selectedJobId.set(job.id);
    this.search.set('');
    this.branchFilter.set('');
    this.loadingApps.set(true);
    // === INTEGRATION POINT: GET /api/admin/applications?jobId= ===
    this.applicationService.listForJob(job.id).subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.loadingApps.set(false);
        this.applicantCounts.update((m) => ({ ...m, [job.id]: apps.length }));
      },
      error: () => { this.applications.set([]); this.loadingApps.set(false); },
    });
  }

  private refreshCount(jobId: number) {
    this.applicationService.listForJob(jobId).subscribe({
      next: (apps) => this.applicantCounts.update((m) => ({ ...m, [jobId]: apps.length })),
      error: () => {},
    });
  }

  changeStatus(app: AdminApplication, status: ApplicationStatus) {
    if (app.status === status) return;
    this.updating.update((s) => new Set(s).add(app.id));
    // === INTEGRATION POINT: PATCH /api/admin/applications/{id}/status —
    // reflects immediately in the student's tracker. ===
    this.applicationService.updateStatus(app.id, status).subscribe({
      next: (updated) => {
        this.applications.update((list) => list.map((a) => (a.id === app.id ? { ...a, status: updated.status } : a)));
        this.clearUpdating(app.id);
        this.showToast('success', `${app.fullName} marked ${this.statusLabel(status)}`);
      },
      error: () => { this.clearUpdating(app.id); this.showToast('error', 'Could not update status. Please try again.'); },
    });
  }

  private clearUpdating(id: number) {
    this.updating.update((s) => { const c = new Set(s); c.delete(id); return c; });
  }

  applicantCount(jobId: number) { return this.applicantCounts()[jobId] ?? 0; }
  selectedCount = computed(() => this.applications().filter((a) => a.status === 'SELECTED').length);
  rejectedCount = computed(() => this.applications().filter((a) => a.status === 'REJECTED').length);

  branchOptions = computed(() =>
    Array.from(new Set(this.applications().map((a) => a.branch).filter((b): b is string => !!b))).sort()
  );

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const branch = this.branchFilter();
    return this.applications().filter((a) => {
      const matchesSearch = !q || [a.fullName, a.studentUsername].some((s) => (s ?? '').toLowerCase().includes(q));
      const matchesBranch = !branch || a.branch === branch;
      return matchesSearch && matchesBranch;
    });
  });

  resetFilters() { this.search.set(''); this.branchFilter.set(''); }

  initials(name: string) {
    return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';
  }
  typeLabel(t: string) { return t === 'FULL_TIME' ? 'Full-time' : t === 'INTERNSHIP' ? 'Internship' : 'Part-time'; }
  statusLabel(s: string) { return s === 'APPLIED' ? 'Applied' : s === 'SELECTED' ? 'Selected' : 'Rejected'; }
  statusClass(s: string) {
    return s === 'SELECTED'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
      : s === 'REJECTED'
        ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
        : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300';
  }

  private showToast(type: 'success' | 'error', msg: string) {
    this.toast.set({ type, msg });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
