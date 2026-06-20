import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService, CreateStudentResponse } from '../../../core/services/account.service';

/** A credential issued at account creation, kept client-side so the admin can re-share it.
 *  (The backend only ever returns the temp password once, at creation.) */
interface IssuedCredential {
  username: string;
  rollNumber: string;
  temporaryPassword: string;
  instituteEmail: string;
  createdAt: string;
}

@Component({
  selector: 'app-student-account-creation',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div id="signup-page" class="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      <!-- header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white" style="font-family:'Bricolage Grotesque',ui-sans-serif">Student signup</h1>
//         <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
//           Provision a login for a student. Share the username and temporary password with them — they'll be asked to set their own password on first sign-in.
//         </p>
      </div>

      @if (errorMsg()) {
        <div id="signup-error" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {{ errorMsg() }}
        </div>
      }

      <form id="signup-form" [formGroup]="form" (ngSubmit)="submit()"
            class="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
          <input id="signup-username-input" formControlName="username" placeholder="e.g. rahul2026"
                 class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          @if (f.username.touched && f.username.invalid) { <p class="mt-1 text-xs text-red-500">Username is required.</p> }
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Personal email</label>
            <input id="signup-personal-email-input" formControlName="personalEmail" type="email" placeholder="student@gmail.com"
                   class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            @if (f.personalEmail.touched && f.personalEmail.invalid) { <p class="mt-1 text-xs text-red-500">Enter a valid personal email.</p> }
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Institute email</label>
            <input id="signup-institute-email-input" formControlName="instituteEmail" type="email" placeholder="student@iit.ac.in"
                   class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            @if (f.instituteEmail.touched && f.instituteEmail.invalid) { <p class="mt-1 text-xs text-red-500">Enter a valid institute email.</p> }
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Roll number</label>
            <input id="signup-roll-number-input" formControlName="rollNumber" placeholder="e.g. CS21B045"
                   class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            @if (f.rollNumber.touched && f.rollNumber.invalid) { <p class="mt-1 text-xs text-red-500">Roll number is required.</p> }
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date of birth</label>
            <input id="signup-dob-input" formControlName="dateOfBirth" type="date" [max]="today"
                   class="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            @if (f.dateOfBirth.touched && f.dateOfBirth.invalid) { <p class="mt-1 text-xs text-red-500">Date of birth is required.</p> }
          </div>
        </div>

        <!-- generated temporary password -->
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Temporary password</label>
          <div class="flex items-center gap-2">
            <input id="signup-temp-password-input" [value]="tempPassword()" readonly
                   class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 font-mono text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            <button id="signup-generate-password-btn" type="button" (click)="regeneratePassword()"
                    class="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Generate
            </button>
          </div>
          <p class="mt-1 text-xs text-slate-400">Auto-generated. The student must change it on first login.</p>
        </div>

        <!-- captcha -->
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Captcha</label>
          <div class="flex items-center gap-2">
            <span class="select-none rounded-xl bg-slate-800 px-4 py-2.5 font-mono text-lg italic tracking-[0.3em] text-emerald-300 line-through decoration-slate-500"
                  style="background-image:repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(255,255,255,.05) 6px,rgba(255,255,255,.05) 12px)">{{ captcha() }}</span>
            <button id="signup-refresh-captcha-btn" type="button" (click)="refreshCaptcha()" aria-label="Refresh captcha"
                    class="shrink-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              ↻
            </button>
          </div>
          <input id="signup-captcha-input" [value]="captchaInput()" (input)="captchaInput.set($any($event.target).value)"
                 placeholder="Type the characters above"
                 class="mt-2 w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          @if (captchaError()) { <p class="mt-1 text-xs text-red-500">Captcha does not match. Try again.</p> }
        </div>

        <button id="signup-create-btn" type="submit" [disabled]="submitting()"
                class="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60">
          {{ submitting() ? 'Creating account…' : 'Create student account' }}
        </button>
      </form>

      <!-- ===== issued credentials (saved automatically after each creation) ===== -->
      <div id="signup-credentials-card" class="mt-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-500/20 dark:bg-slate-900">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">Issued credentials</h2>
            <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{{ saved().length }}</span>
          </div>
          @if (saved().length) {
            <button id="signup-clear-all-btn" (click)="clearSaved()" class="text-xs font-medium text-slate-400 transition hover:text-red-500">Clear all</button>
          }
        </div>
        <p class="mt-1 text-xs text-slate-400">Saved on this device so you can re-share. Temporary passwords are shown until the student changes them.</p>

        @if (saved().length) {
          <!-- search / filter -->
          <div class="relative mt-4">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            </span>
            <input id="signup-cred-search-input" [value]="search()" (input)="search.set($any($event.target).value)"
                   placeholder="Filter by name (username) or roll number"
                   class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          </div>

          @if (filtered().length) {
            <div id="signup-cred-table-wrap" class="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table id="signup-cred-table" class="w-full text-left text-sm">
                <thead class="border-b border-slate-200 bg-emerald-50 text-xs uppercase tracking-wide text-emerald-700 dark:border-slate-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <tr>
                    <th class="px-4 py-3 font-semibold">Roll no.</th>
                    <th class="px-4 py-3 font-semibold">Username</th>
                    <th class="px-4 py-3 font-semibold">Temp password</th>
                    <th class="px-4 py-3 font-semibold">Created</th>
                    <th class="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  @for (c of filtered(); track c.username) {
                    <tr [id]="'signup-cred-row-' + c.username" class="transition hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5">
                      <td class="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{{ c.rollNumber }}</td>
                      <td class="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">{{ c.username }}</td>
                      <td class="px-4 py-3 font-mono font-semibold text-emerald-700 dark:text-emerald-300">{{ c.temporaryPassword }}</td>
                      <td class="px-4 py-3 text-slate-400">{{ c.createdAt | date:'dd MMM, HH:mm' }}</td>
                      <td class="px-4 py-3 text-right">
                        <button [id]="'signup-copy-btn-' + c.username" (click)="copy(c)" class="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300">
                          {{ copiedFor() === c.username ? 'Copied ✓' : 'Copy' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="mt-4 text-center text-sm text-slate-400">No credentials match "{{ search() }}".</p>
          }
        } @else {
          <p class="mt-4 rounded-2xl border border-dashed border-slate-300 py-8 text-center text-sm text-slate-400 dark:border-slate-700">
            No accounts created yet. Credentials will be listed here automatically.
          </p>
        }
      </div>
    </div>

    <!-- success popup — click anywhere to dismiss -->
    @if (created(); as c) {
      <div id="signup-success-popup" (click)="dismissPopup()"
           class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
        <div id="signup-success-popup-card" class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl animate-fade-in-up dark:border-slate-700 dark:bg-slate-900">
          <span class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Account created successfully</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Share these credentials with the student.</p>
          <div class="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-sm dark:bg-slate-800">
            <div class="flex justify-between gap-3"><span class="text-slate-400">Username</span><span class="font-mono font-semibold text-slate-800 dark:text-slate-100">{{ c.username }}</span></div>
            <div class="flex justify-between gap-3"><span class="text-slate-400">Roll no.</span><span class="font-mono text-slate-800 dark:text-slate-100">{{ c.rollNumber }}</span></div>
            <div class="flex justify-between gap-3"><span class="text-slate-400">Temp password</span><span class="font-mono font-semibold text-emerald-700 dark:text-emerald-300">{{ c.temporaryPassword }}</span></div>
          </div>
          <p class="mt-4 text-xs text-slate-400">Saved to the list below. Click anywhere to dismiss.</p>
        </div>
      </div>
    }
  `,
})
export class StudentAccountCreationComponent {
  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly STORAGE_KEY = 'hiregradappli-issued-credentials';

  readonly today = new Date().toISOString().slice(0, 10);

  tempPassword = signal(this.genPassword());
  captcha = signal(this.genCaptcha());
  captchaInput = signal('');
  captchaError = signal(false);

  submitting = signal(false);
  errorMsg = signal<string | null>(null);
  created = signal<CreateStudentResponse | null>(null);

  // saved credentials list + live filter
  saved = signal<IssuedCredential[]>(this.restore());
  search = signal('');
  copiedFor = signal<string | null>(null);

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.saved();
    return this.saved().filter((c) =>
      [c.username, c.rollNumber].some((s) => (s ?? '').toLowerCase().includes(q))
    );
  });

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    personalEmail: ['', [Validators.required, Validators.email]],
    instituteEmail: ['', [Validators.required, Validators.email]],
    rollNumber: ['', [Validators.required]],
    dateOfBirth: ['', [Validators.required]],
  });

  get f() { return this.form.controls; }

  regeneratePassword() { this.tempPassword.set(this.genPassword()); }
  refreshCaptcha() { this.captcha.set(this.genCaptcha()); this.captchaInput.set(''); this.captchaError.set(false); }

  submit(): void {
    this.errorMsg.set(null);
    this.captchaError.set(false);
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.captchaInput().trim().toUpperCase() !== this.captcha()) { this.captchaError.set(true); return; }

    this.submitting.set(true);
    this.accountService
      .createStudent({ ...this.form.getRawValue(), temporaryPassword: this.tempPassword() })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.created.set(res);
          this.saveCredential(res);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMsg.set(err?.error?.error?.message ?? 'Could not create the account. Please try again.');
        },
      });
  }

  /** Dismiss the popup (clicking anywhere) and reset the form for the next entry. */
  dismissPopup(): void {
    this.created.set(null);
    this.form.reset();
    this.tempPassword.set(this.genPassword());
    this.refreshCaptcha();
  }

  copy(c: IssuedCredential): void {
    const text = `Username: ${c.username}\nRoll no.: ${c.rollNumber}\nTemporary password: ${c.temporaryPassword}`;
    if (this.isBrowser && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copiedFor.set(c.username);
        setTimeout(() => this.copiedFor.set(null), 1500);
      });
    }
  }

  clearSaved(): void {
    this.saved.set([]);
    this.persist();
  }

  private saveCredential(res: CreateStudentResponse): void {
    const entry: IssuedCredential = {
      username: res.username,
      rollNumber: res.rollNumber,
      temporaryPassword: res.temporaryPassword,
      instituteEmail: res.instituteEmail,
      createdAt: new Date().toISOString(),
    };
    // newest first; replace any prior entry for the same username
    this.saved.update((list) => [entry, ...list.filter((c) => c.username !== entry.username)]);
    this.persist();
  }

  private persist(): void {
    if (this.isBrowser) localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.saved()));
  }

  private restore(): IssuedCredential[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? (JSON.parse(raw) as IssuedCredential[]) : [];
    } catch {
      return [];
    }
  }

  private genPassword(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 10; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }
  private genCaptcha(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 5; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }
}
