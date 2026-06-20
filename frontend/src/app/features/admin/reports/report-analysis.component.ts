import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { PlacementReport, ReportApplication, ReportService } from '../../../core/services/report.service';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

interface Bar { label: string; value: number; sub?: string; }
interface DeptRow { label: string; placed: number; total: number; rate: number; }
interface StudentRow {
  username: string; fullName: string; rollNumber: string; department: string;
  college: string; applied: number; offers: number; rejections: number; companies: string[];
}

@Component({
  selector: 'app-report-analysis',
  imports: [CommonModule, TiltDirective],
  template: `
    <div id="report-page" class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <!-- header -->
      <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white" style="font-family:'Bricolage Grotesque',ui-sans-serif">Placement report analysis</h1>
//           <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Real-time placement outcomes across companies, colleges and departments.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="report-refresh-btn" (click)="reload()" class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
            Refresh
          </button>
          <button id="report-export-csv-btn" (click)="exportCsv()" class="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
            CSV
          </button>
          <button id="report-export-pdf-btn" (click)="print()" class="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
            PDF
          </button>
        </div>
      </div>

      @if (loading()) {
        <p class="mt-16 text-center text-sm text-slate-400">Crunching placement data…</p>
      } @else if (loadError()) {
        <p class="mt-16 text-center text-sm text-red-500">{{ loadError() }}</p>
      } @else {
        <!-- filters -->
        <div id="report-filter-bar" class="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <select id="report-dept-filter" [value]="deptFilter()" (change)="deptFilter.set($any($event.target).value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <option value="">All departments</option>
            @for (d of deptOptions(); track d) { <option [value]="d">{{ d }}</option> }
          </select>
          <select id="report-college-filter" [value]="collegeFilter()" (change)="collegeFilter.set($any($event.target).value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <option value="">All colleges / campuses</option>
            @for (c of collegeOptions(); track c) { <option [value]="c">{{ c }}</option> }
          </select>
          <select id="report-year-filter" [value]="yearFilter()" (change)="yearFilter.set($any($event.target).value)" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <option value="">All years</option>
            @for (y of yearOptions(); track y) { <option [value]="y">{{ y }}</option> }
          </select>
          <div class="relative flex-1" style="min-width:180px">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input id="report-search-input" [value]="studentQuery()" (input)="studentQuery.set($any($event.target).value)" placeholder="Search student by name or roll no."
                   class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>
          @if (hasFilters()) {
            <button id="report-clear-filters-btn" (click)="clearFilters()" class="text-xs font-medium text-brand-600 hover:underline">Clear all filters</button>
          }
        </div>

        @if (companyFilter()) {
          <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1.5 text-sm font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            Drilled into: {{ companyFilter() }}
            <button id="report-clear-company-btn" (click)="companyFilter.set('')" aria-label="Clear company" class="rounded-full p-0.5 hover:bg-brand-200/50">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        }

        <!-- KPI cards -->
        <section id="report-kpi-section" class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          @for (k of kpis(); track k.label; let i = $index) {
            <div [id]="'report-kpi-card-' + i" appTilt class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-fade-in-up dark:border-slate-800 dark:bg-slate-900"
                 [style.animation-delay]="(i*50)+'ms'" style="transform-style:preserve-3d; transition:transform .25s ease, box-shadow .3s ease">
              <p class="text-2xl font-bold text-slate-900 dark:text-white">{{ k.value }}</p>
              <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ k.label }}</p>
            </div>
          }
        </section>

        <!-- donut + department table -->
        <section class="mt-6 grid gap-4 lg:grid-cols-3">
          <!-- placed donut -->
          <div id="report-donut-card" appTilt class="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900" style="transform-style:preserve-3d; transition:transform .25s ease, box-shadow .3s ease">
            <h2 class="text-sm font-bold text-slate-900 dark:text-white">Placement status</h2>
            <div class="relative mx-auto mt-3 h-40 w-40">
              <svg viewBox="0 0 120 120" class="h-40 w-40 -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke-width="14" class="text-slate-100 dark:text-slate-800" stroke="currentColor" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#g)" stroke-width="14" stroke-linecap="round"
                        [attr.stroke-dasharray]="donutCirc" [attr.stroke-dashoffset]="donutOffset()" style="transition:stroke-dashoffset 1s ease" />
                <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#059669" /><stop offset="1" stop-color="#34d399" /></linearGradient></defs>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-3xl font-bold text-slate-900 dark:text-white">{{ placementRate() }}%</span>
                <span class="text-[11px] text-slate-400">placed</span>
              </div>
            </div>
            <div class="mt-4 flex justify-center gap-4 text-xs">
              <span class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span class="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>Placed {{ placed() }}</span>
              <span class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><span class="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></span>Unplaced {{ totalStudents() - placed() }}</span>
            </div>
          </div>

          <!-- by department -->
          <div id="report-dept-card" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h2 class="text-sm font-bold text-slate-900 dark:text-white">Placed by department</h2>
            @if (byDept().length) {
              <div class="mt-4 space-y-3">
                @for (d of byDept(); track d.label) {
                  <div class="group">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-medium text-slate-700 dark:text-slate-200">{{ d.label }}</span>
                      <span class="text-slate-400">{{ d.placed }}/{{ d.total }} · {{ d.rate }}%</span>
                    </div>
                    <div class="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
                           style="background-image:linear-gradient(90deg,#059669,#34d399)" [style.width.%]="d.rate"></div>
                    </div>
                  </div>
                }
              </div>
            } @else { <p class="mt-6 text-center text-sm text-slate-400">No department data yet.</p> }
          </div>
        </section>

        <!-- by company + by college -->
        <section class="mt-6 grid gap-4 lg:grid-cols-2">
          <!-- placements by company (clickable drilldown) -->
          <div id="report-company-card" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-bold text-slate-900 dark:text-white">Offers by company</h2>
              <span class="text-[11px] text-slate-400">tap a bar to drill in</span>
            </div>
            @if (byCompany().length) {
              <div class="mt-4 space-y-2.5">
                @for (c of byCompany(); track c.label) {
                  <button [id]="'report-company-bar-' + c.label" (click)="toggleCompany(c.label)" class="block w-full text-left">
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-medium text-slate-700 dark:text-slate-200">{{ c.label }}</span>
                      <span class="text-slate-400">{{ c.value }}</span>
                    </div>
                    <div class="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-full rounded-full transition-all duration-700 hover:brightness-110"
                           [class.ring-2]="companyFilter() === c.label" [class.ring-brand-400]="companyFilter() === c.label"
                           style="background-image:linear-gradient(90deg,#10b981,#6ee7b7)" [style.width.%]="pct(c.value, maxCompany())"></div>
                    </div>
                  </button>
                }
              </div>
            } @else { <p class="mt-6 text-center text-sm text-slate-400">No offers recorded yet.</p> }
          </div>

          <!-- placed by college / campus -->
          <div id="report-college-card" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 class="text-sm font-bold text-slate-900 dark:text-white">Placed by college / campus</h2>
            @if (byCollege().length) {
              <div class="mt-4 space-y-2.5">
                @for (c of byCollege(); track c.label) {
                  <div>
                    <div class="flex items-center justify-between text-xs">
                      <span class="font-medium text-slate-700 dark:text-slate-200">{{ c.label }}</span>
                      <span class="text-slate-400">{{ c.value }}</span>
                    </div>
                    <div class="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div class="h-full rounded-full transition-all duration-700 hover:brightness-110"
                           style="background-image:linear-gradient(90deg,#0ea5e9,#67e8f9)" [style.width.%]="pct(c.value, maxCollege())"></div>
                    </div>
                  </div>
                }
              </div>
            } @else { <p class="mt-6 text-center text-sm text-slate-400">No college data yet — students need a college on their profile.</p> }
          </div>
        </section>

        <!-- per-student table -->
        <section id="report-per-student-section" class="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900 dark:text-white">Per-student offers</h2>
            <span class="text-xs text-slate-400">{{ perStudent().length }} students · {{ multiOffer() }} with multiple offers</span>
          </div>
          @if (perStudent().length) {
            <div class="mt-4 overflow-x-auto">
              <table id="report-per-student-table" class="w-full text-left text-sm">
                <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <tr>
                    <th class="py-2 pr-3 font-semibold">Student</th>
                    <th class="py-2 px-3 font-semibold">Dept</th>
                    <th class="py-2 px-3 font-semibold">College</th>
                    <th class="py-2 px-3 font-semibold text-center">Applied</th>
                    <th class="py-2 px-3 font-semibold text-center">Offers</th>
                    <th class="py-2 px-3 font-semibold text-center">Rejected</th>
                    <th class="py-2 pl-3 font-semibold">Offers from</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (s of perStudent(); track s.username) {
                    <tr [id]="'report-student-row-' + s.username" class="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td class="py-2.5 pr-3">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-slate-900 dark:text-white">{{ s.fullName }}</span>
                          @if (s.offers >= 2) { <span class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">multi</span> }
                        </div>
                        <span class="text-xs text-slate-400">{{ s.rollNumber || s.username }}</span>
                      </td>
                      <td class="py-2.5 px-3 text-slate-600 dark:text-slate-300">{{ s.department || '—' }}</td>
                      <td class="py-2.5 px-3 text-slate-600 dark:text-slate-300">{{ s.college || '—' }}</td>
                      <td class="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">{{ s.applied }}</td>
                      <td class="py-2.5 px-3 text-center"><span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{{ s.offers }}</span></td>
                      <td class="py-2.5 px-3 text-center"><span class="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{{ s.rejections }}</span></td>
                      <td class="py-2.5 pl-3 text-xs text-slate-500 dark:text-slate-400">{{ s.companies.length ? s.companies.join(', ') : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="mt-6 text-center text-sm text-slate-400">No students match the current filters.</p>
          }
        </section>
      }
    </div>
  `,
})
export class ReportAnalysisComponent {
  private reportService = inject(ReportService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  report = signal<PlacementReport | null>(null);
  loading = signal(true);
  loadError = signal<string | null>(null);

  deptFilter = signal('');
  collegeFilter = signal('');
  yearFilter = signal('');
  companyFilter = signal('');
  studentQuery = signal('');

  readonly donutCirc = 2 * Math.PI * 50;

  constructor() { this.reload(); }

  reload() {
    this.loading.set(true);
    this.reportService.getPlacementReport().subscribe({
      next: (r) => { this.report.set(r); this.loading.set(false); },
      error: () => { this.loadError.set('Could not load the report. Please try again.'); this.loading.set(false); },
    });
  }

  private students = computed(() => this.report()?.students ?? []);
  private apps = computed(() => this.report()?.applications ?? []);

  deptOptions = computed(() => this.distinct(this.students().map((s) => s.department)));
  collegeOptions = computed(() => this.distinct(this.students().map((s) => s.college)));
  yearOptions = computed(() => this.distinct(this.students().map((s) => s.passOutYear)));

  hasFilters = computed(() => !!(this.deptFilter() || this.collegeFilter() || this.yearFilter() || this.companyFilter() || this.studentQuery()));

  // students passing the dept/college/year filters
  private matchedStudents = computed(() => {
    const d = this.deptFilter(), c = this.collegeFilter(), y = this.yearFilter();
    return this.students().filter((s) =>
      (!d || s.department === d) && (!c || s.college === c) && (!y || s.passOutYear === y));
  });
  private matchedUsernames = computed(() => new Set(this.matchedStudents().map((s) => s.username)));

  // applications limited to matched students (+ optional company drilldown)
  private filteredApps = computed(() => {
    const set = this.matchedUsernames(); const co = this.companyFilter();
    return this.apps().filter((a) => set.has(a.studentUsername) && (!co || a.company === co));
  });
  private selectedApps = computed(() => this.filteredApps().filter((a) => a.status === 'SELECTED'));
  private rejectedApps = computed(() => this.filteredApps().filter((a) => a.status === 'REJECTED'));

  totalStudents = computed(() => this.matchedStudents().length);
  private placedSet = computed(() => new Set(this.selectedApps().map((a) => a.studentUsername)));
  placed = computed(() => this.placedSet().size);
  placementRate = computed(() => this.totalStudents() ? Math.round((this.placed() / this.totalStudents()) * 100) : 0);
  multiOffer = computed(() => {
    const m = this.countBy(this.selectedApps(), (a) => a.studentUsername);
    return Object.values(m).filter((n) => n >= 2).length;
  });

  donutOffset = computed(() => this.donutCirc * (1 - this.placementRate() / 100));

  kpis = computed(() => [
    { label: 'Total students', value: this.totalStudents() },
    { label: 'Placed', value: this.placed() },
    { label: 'Placement rate', value: this.placementRate() + '%' },
    { label: 'Total offers', value: this.selectedApps().length },
    { label: 'Rejections', value: this.rejectedApps().length },
    { label: 'Multi-offer', value: this.multiOffer() },
  ]);

  byCompany = computed<Bar[]>(() => {
    const m = this.countBy(this.selectedApps(), (a) => a.company || 'Unknown');
    return this.toBars(m).slice(0, 8);
  });
  // distinct placed students per college
  byCollege = computed<Bar[]>(() => {
    const studByUser = new Map(this.students().map((s) => [s.username, s]));
    const map: Record<string, Set<string>> = {};
    for (const a of this.selectedApps()) {
      const col = studByUser.get(a.studentUsername)?.college || 'Unspecified';
      (map[col] ??= new Set()).add(a.studentUsername);
    }
    return Object.entries(map).map(([label, set]) => ({ label, value: set.size }))
      .sort((x, y) => y.value - x.value).slice(0, 8);
  });
  byDept = computed<DeptRow[]>(() => {
    const placedByUser = this.placedSet();
    const map: Record<string, { placed: Set<string>; total: number }> = {};
    for (const s of this.matchedStudents()) {
      const dep = s.department || 'Unspecified';
      const e = (map[dep] ??= { placed: new Set(), total: 0 });
      e.total++;
      if (placedByUser.has(s.username)) e.placed.add(s.username);
    }
    return Object.entries(map).map(([label, v]) => ({
      label, placed: v.placed.size, total: v.total,
      rate: v.total ? Math.round((v.placed.size / v.total) * 100) : 0,
    })).sort((a, b) => b.rate - a.rate);
  });

  perStudent = computed<StudentRow[]>(() => {
    const q = this.studentQuery().trim().toLowerCase();
    const appsByUser: Record<string, ReportApplication[]> = {};
    for (const a of this.filteredApps()) (appsByUser[a.studentUsername] ??= []).push(a);
    return this.matchedStudents()
      .map((s) => {
        const list = appsByUser[s.username] ?? [];
        const offers = list.filter((a) => a.status === 'SELECTED');
        return {
          username: s.username, fullName: s.fullName, rollNumber: s.rollNumber ?? '',
          department: s.department ?? '', college: s.college ?? '',
          applied: list.length, offers: offers.length,
          rejections: list.filter((a) => a.status === 'REJECTED').length,
          companies: offers.map((a) => a.company),
        };
      })
      .filter((s) => !q || s.fullName.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q))
      .sort((a, b) => b.offers - a.offers || b.applied - a.applied);
  });

  maxCompany = computed(() => Math.max(1, ...this.byCompany().map((b) => b.value)));
  maxCollege = computed(() => Math.max(1, ...this.byCollege().map((b) => b.value)));

  pct(v: number, max: number) { return max ? Math.round((v / max) * 100) : 0; }
  toggleCompany(name: string) { this.companyFilter.update((c) => (c === name ? '' : name)); }
  clearFilters() { this.deptFilter.set(''); this.collegeFilter.set(''); this.yearFilter.set(''); this.companyFilter.set(''); this.studentQuery.set(''); }

  print() { if (this.isBrowser) window.print(); }

  exportCsv() {
    if (!this.isBrowser) return;
    const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const header = ['Name', 'Roll no', 'Department', 'College', 'Applied', 'Offers', 'Rejections', 'Offers from'];
    const rows = this.perStudent().map((s) =>
      [s.fullName, s.rollNumber, s.department, s.college, s.applied, s.offers, s.rejections, s.companies.join(' | ')].map(esc).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'placement-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private distinct(arr: (string | null)[]): string[] {
    return Array.from(new Set(arr.filter((x): x is string => !!x && !!x.trim()))).sort();
  }
  private countBy<T>(arr: T[], key: (t: T) => string): Record<string, number> {
    return arr.reduce((m, t) => { const k = key(t); m[k] = (m[k] ?? 0) + 1; return m; }, {} as Record<string, number>);
  }
  private toBars(m: Record<string, number>): Bar[] {
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }
}
