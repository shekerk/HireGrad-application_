import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminProfileDto, AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

@Component({
  selector: 'app-admin-profile',
  imports: [CommonModule, ReactiveFormsModule, TiltDirective],
  template: `
    <!-- toast -->
    @if (toast(); as t) {
      <div class="fixed left-1/2 top-5 z-50 -translate-x-1/2 animate-fade-in-up">
        <div class="rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg" [class.bg-emerald-500]="t.type === 'success'" [class.bg-red-500]="t.type === 'error'">{{ t.msg }}</div>
      </div>
    }

    <div id="adm-profile-page" class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <!-- header -->
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white" style="font-family:'Bricolage Grotesque',ui-sans-serif">My profile</h1>

        </div>
        <div class="flex items-center gap-2">
          @if (!editing()) {
            <button id="adm-profile-edit-btn" (click)="enterEdit()" class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              Edit profile
            </button>
          } @else {
            <button id="adm-profile-cancel-btn" (click)="cancel()" class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            <button id="adm-profile-save-btn" (click)="save()" [disabled]="saving()" class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
              {{ saving() ? 'Saving…' : 'Save changes' }}
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <p class="mt-16 text-center text-sm text-slate-400">Loading your profile…</p>
      } @else {
        <div class="grid gap-6 lg:grid-cols-3">

          <!-- ===== LEFT SUMMARY CARD ===== -->
          <aside id="adm-profile-summary-card" appTilt class="h-fit rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm animate-fade-in-up dark:border-slate-800 dark:bg-slate-900"
                 style="transform-style:preserve-3d; transition:transform .25s ease, box-shadow .3s ease">
            <div class="relative mx-auto h-28 w-28">
              <div class="h-28 w-28 overflow-hidden rounded-full ring-4 ring-brand-100 dark:ring-brand-500/20">
                @if (photo()) {
                  <img [src]="photo()" alt="Profile photo" class="h-full w-full object-cover" />
                } @else {
                  <div class="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  </div>
                }
              </div>
              @if (editing()) {
                <label class="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition hover:bg-brand-600" title="Upload photo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                  <input id="adm-profile-photo-input" type="file" accept="image/*" class="hidden" (change)="onPhoto($event)" />
                </label>
              }
            </div>
            @if (editing() && photo()) {
              <button id="adm-profile-remove-photo-btn" (click)="photo.set(null)" class="mt-2 text-xs text-slate-400 hover:text-red-500">Remove photo</button>
            }

            <h2 class="mt-4 truncate text-lg font-bold text-slate-900 dark:text-white">{{ displayName() }}</h2>
            <p class="text-xs font-medium text-brand-600 dark:text-brand-300">{{ f.designation.value || 'Placement Cell' }}</p>
            <p class="mt-0.5 text-xs text-slate-400">{{ username() }}</p>

            <div class="mt-5 space-y-2 text-left text-sm">
              <p class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                <span class="truncate">{{ f.instituteEmail.value || 'Institute email' }}</span>
              </p>
              <p class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                <span class="truncate">{{ f.countryCode.value }} {{ f.phone.value || 'Phone' }}</span>
              </p>
              <p class="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                <span class="truncate">{{ f.officeLocation.value || 'Office location' }}</span>
              </p>
            </div>

            <button id="adm-profile-logout-btn" (click)="logout()" class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/40">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
              Logout
            </button>
          </aside>

          <!-- ===== RIGHT SECTION CARDS ===== -->
          <div class="space-y-6 lg:col-span-2">
            <form [formGroup]="form" class="space-y-6">

              <!-- Identity -->
              <section id="adm-profile-identity-section" appTilt class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-in-up dark:border-slate-800 dark:bg-slate-900"
                       style="animation-delay:80ms; transform-style:preserve-3d; transition:transform .25s ease, box-shadow .3s ease">
                <h3 class="mb-4 text-sm font-bold text-slate-900 dark:text-white">Identity</h3>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">First name</label>
                    <input id="adm-profile-first-name-input" formControlName="firstName" [class]="inputClass" [class.border-red-400]="f.firstName.invalid && f.firstName.touched" />
                    @if (f.firstName.invalid && f.firstName.touched) { <p class="mt-1 text-xs text-red-500">First name is required.</p> }
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Last name</label>
                    <input id="adm-profile-last-name-input" formControlName="lastName" [class]="inputClass" [class.border-red-400]="f.lastName.invalid && f.lastName.touched" />
                    @if (f.lastName.invalid && f.lastName.touched) { <p class="mt-1 text-xs text-red-500">Last name is required.</p> }
                  </div>
                  <div class="sm:col-span-2">
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Designation / title</label>
                    <input id="adm-profile-designation-input" formControlName="designation" placeholder="e.g. Placement Officer, T&P Coordinator" [class]="inputClass" />
                  </div>
                </div>
              </section>

              <!-- Contact -->
              <section id="adm-profile-contact-section" appTilt class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-in-up dark:border-slate-800 dark:bg-slate-900"
                       style="animation-delay:160ms; transform-style:preserve-3d; transition:transform .25s ease, box-shadow .3s ease">
                <h3 class="mb-4 text-sm font-bold text-slate-900 dark:text-white">Contact</h3>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Official / institute email</label>
                    <input id="adm-profile-email-input" formControlName="instituteEmail" type="email" [class]="inputClass" [class.border-red-400]="f.instituteEmail.invalid && f.instituteEmail.touched" />
                    @if (f.instituteEmail.invalid && f.instituteEmail.touched) { <p class="mt-1 text-xs text-red-500">Enter a valid institute email.</p> }
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Phone</label>
                    <div class="flex gap-2">
                      <select id="adm-profile-country-code-select" formControlName="countryCode" class="rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800/50">
                        @for (c of countryCodes; track c.code) { <option [value]="c.code">{{ c.label }}</option> }
                      </select>
                      <input id="adm-profile-phone-input" formControlName="phone" inputmode="numeric" [class]="inputClass" [class.border-red-400]="f.phone.invalid && f.phone.touched" />
                    </div>
                    @if (f.phone.invalid && f.phone.touched) { <p class="mt-1 text-xs text-red-500">Enter a valid phone number (7–15 digits).</p> }
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Office location <span class="font-normal normal-case text-slate-400">(optional)</span></label>
                    <input id="adm-profile-office-input" formControlName="officeLocation" placeholder="e.g. Room 204, Admin Block" [class]="inputClass" />
                  </div>
                </div>
              </section>

              <!-- Institution & role -->
              <section id="adm-profile-institution-section" appTilt class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-in-up dark:border-slate-800 dark:bg-slate-900"
                       style="animation-delay:240ms; transform-style:preserve-3d; transition:transform .25s ease, box-shadow .3s ease">
                <h3 class="mb-4 text-sm font-bold text-slate-900 dark:text-white">Institution &amp; role</h3>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">College / institution name</label>
                    <input id="adm-profile-college-input" formControlName="college" [class]="inputClass" />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Department / cell name</label>
                    <input id="adm-profile-department-input" formControlName="department" placeholder="e.g. Training &amp; Placement Cell" [class]="inputClass" />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Employee / staff ID <span class="font-normal normal-case text-slate-400">(optional)</span></label>
                    <input id="adm-profile-staff-id-input" formControlName="staffId" [class]="inputClass" />
                  </div>
                </div>
              </section>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminProfileComponent {
  private fb = inject(FormBuilder);
  private admin = inject(AdminService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly countryCodes = [
    { code: '+91', label: '🇮🇳 +91' }, { code: '+1', label: '🇺🇸 +1' },
    { code: '+44', label: '🇬🇧 +44' }, { code: '+61', label: '🇦🇺 +61' },
    { code: '+65', label: '🇸🇬 +65' }, { code: '+971', label: '🇦🇪 +971' },
  ];

  readonly inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 disabled:cursor-default disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800/50';

  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    designation: [''],
    instituteEmail: ['', [Validators.required, Validators.email]],
    countryCode: ['+91'],
    phone: ['', Validators.pattern(/^\d{7,15}$/)],
    officeLocation: [''],
    college: [''],
    department: [''],
    staffId: [''],
  });

  photo = signal<string | null>(null);
  editing = signal(false);
  loading = signal(true);
  saving = signal(false);
  toast = signal<{ type: 'success' | 'error'; msg: string } | null>(null);

  private snapshot: AdminProfileDto | null = null;

  get f() { return this.form.controls; }

  username = computed(() => this.auth.user()?.username ?? '');
  displayName = computed(() => {
    const v = this.form.getRawValue();
    const name = [v.firstName, v.lastName].filter(Boolean).join(' ').trim();
    return name || this.auth.user()?.fullName || this.username();
  });

  constructor() {
    this.admin.getProfile().subscribe({
      next: (p) => { this.patchFromDto(p); this.snapshot = this.buildDto(); this.form.disable(); this.loading.set(false); },
      error: () => { this.loading.set(false); this.enterEdit(); },
    });
  }

  enterEdit() { this.form.enable(); this.editing.set(true); }

  cancel() {
    if (this.snapshot) this.patchFromDto(this.snapshot);
    this.form.disable();
    this.editing.set(false);
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.showToast('error', 'Please fix the highlighted fields.'); return; }
    this.saving.set(true);
    this.admin.saveProfile(this.buildDto()).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.patchFromDto(saved);
        this.snapshot = this.buildDto();
        this.form.disable();
        this.editing.set(false);
        // refresh the cached display name so the sidebar / greeting update
        const u = this.auth.user();
        if (u) this.auth.updateUser({ ...u, fullName: this.displayName() });
        this.showToast('success', 'Profile saved successfully.');
      },
      error: (e) => { this.saving.set(false); this.showToast('error', e?.error?.error?.message ?? 'Could not save. Please try again.'); },
    });
  }

  onPhoto(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.photo.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }

  private patchFromDto(p: AdminProfileDto) {
    this.form.patchValue({
      firstName: p.firstName ?? '', lastName: p.lastName ?? '', designation: p.designation ?? '',
      instituteEmail: p.instituteEmail ?? '', countryCode: p.countryCode || '+91', phone: p.phone ?? '',
      officeLocation: p.officeLocation ?? '', college: p.college ?? '', department: p.department ?? '',
      staffId: p.staffId ?? '',
    });
    this.photo.set(p.photoUrl ?? null);
  }

  private buildDto(): AdminProfileDto {
    const v = this.form.getRawValue();
    return {
      photoUrl: this.photo(),
      firstName: v.firstName, lastName: v.lastName, designation: v.designation,
      instituteEmail: v.instituteEmail, countryCode: v.countryCode, phone: v.phone,
      officeLocation: v.officeLocation, college: v.college, department: v.department, staffId: v.staffId,
    };
  }

  private showToast(type: 'success' | 'error', msg: string) {
    this.toast.set({ type, msg });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
