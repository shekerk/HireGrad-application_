import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LinkDto, ProfileDto, ProfileService, ProjectDto } from '../../../core/services/profile.service';
import { TiltDirective } from '../../../shared/directives/tilt.directive';

// ---- optional custom validators (return null when the field is empty) ----
function cgpaValidator(c: AbstractControl): ValidationErrors | null {
  const v = (c.value ?? '').toString().trim();
  if (!v) return null;
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(v)) return { cgpa: 'Use a number with up to 2 decimals.' };
  const n = parseFloat(v);
  if (isNaN(n) || n < 0 || n > 10) return { cgpa: 'CGPA must be between 0 and 10.' };
  return null;
}
function percentValidator(c: AbstractControl): ValidationErrors | null {
  const v = (c.value ?? '').toString().trim();
  if (!v) return null;
  const n = parseFloat(v);
  if (isNaN(n) || n < 0 || n > 100) return { percent: 'Enter a value 0–100.' };
  return null;
}
function urlValidator(c: AbstractControl): ValidationErrors | null {
  const v = (c.value ?? '').toString().trim();
  if (!v) return null;
  try { new URL(v); return null; } catch { return { url: 'Enter a valid URL (https://…).' }; }
}

@Component({
  selector: 'app-student-profile',
  imports: [CommonModule, ReactiveFormsModule, TiltDirective],
  templateUrl: './student-profile.component.html',
})
export class StudentProfileComponent {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private auth = inject(AuthService);
  private router = inject(Router);

  // dropdown sources — only IN, CA, US as requested
  readonly countryCodes = [
    { code: '+91', label: '🇮🇳 IN +91' },
    { code: '+1',  label: '🇺🇸 US +1'  },
    { code: '+1',  label: '🇨🇦 CA +1'  },
  ];
  readonly courses = ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical', 'Mechanical', 'Civil'];
  readonly passOutYears = Array.from({ length: 8 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  // form (scalar fields + validation)
  form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    middleName: [''],
    lastName: ['', Validators.required],
    instituteEmail: ['', [Validators.required, Validators.email]],
    personalEmail: ['', [Validators.required, Validators.email]],
    countryCode: ['+91'],
    phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    address: ['', Validators.required],
    tenthSchool: [''],
    tenthPercent: ['', percentValidator],
    twelfthSchool: [''],
    twelfthPercent: ['', percentValidator],
    college: [''],
    course: [''],
    passOutYear: [''],
    cgpa: ['', cgpaValidator],
    resumeLink: ['', urlValidator],
  });

  // signal-backed pieces
  photo = signal<string | null>(null);
  skills = signal<string[]>([]);
  projects = signal<ProjectDto[]>([]);
  links = signal<LinkDto[]>([]);

  // platform config: label, icon key, and an optional host the URL must contain
  readonly linkTypes: Record<string, { label: string; icon: string; match?: string }> = {
    github: { label: 'GitHub', icon: 'github', match: 'github.com' },
    leetcode: { label: 'LeetCode', icon: 'code', match: 'leetcode.com' },
    linkedin: { label: 'LinkedIn', icon: 'linkedin', match: 'linkedin.com' },
    portfolio: { label: 'Portfolio', icon: 'globe' },
    custom: { label: 'Custom', icon: 'link' },
  };
  resumeFileName = signal<string | null>(null);
  resumeObjectUrl = signal<string | null>(null);
  skillInput = signal('');

  editing = signal(false);
  loading = signal(true);
  saving = signal(false);
  academicsOpen = signal(true);
  linkError = signal<string | null>(null);
  toast = signal<{ type: 'success' | 'error'; msg: string } | null>(null);

  private snapshot: ProfileDto | null = null;

  // live form value drives the completeness ring
  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  get f() { return this.form.controls; }

  username = computed(() => this.auth.user()?.username ?? '');
  displayName = computed(() => {
    const v = this.formValue();
    const name = [v.firstName, v.middleName, v.lastName].filter(Boolean).join(' ').trim();
    return name || this.username();
  });

  profileCompleteness = computed(() => {
    const v = this.formValue();
    const checks = [
      !!this.photo(), !!v.firstName, !!v.lastName, !!v.instituteEmail, !!v.personalEmail,
      !!v.phone, !!v.address, this.skills().length > 0, !!v.college, !!v.course,
      !!v.passOutYear, !!v.cgpa, (!!this.resumeFileName() || !!v.resumeLink), this.projects().length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  });

  readonly ringCircumference = 2 * Math.PI * 52;
  ringDashoffset = computed(() => this.ringCircumference * (1 - this.profileCompleteness() / 100));

  constructor() {
    // === INTEGRATION POINT: load the profile (empty object if new student) ===
    this.profileService.getProfile().subscribe({
      next: (p) => { this.applyProfile(p); this.loading.set(false); },
      error: () => { this.startNew(); this.loading.set(false); },
    });
  }

  // ---------- load / mode ----------
  private applyProfile(p: ProfileDto) {
    this.patchFromDto(p);
    this.snapshot = this.buildDto();
    if (this.isEmpty(p)) {
      this.enterEdit();        // brand-new student → open in edit mode, all blank
    } else {
      this.form.disable();     // returning student → read-only view
      this.editing.set(false);
    }
  }

  private startNew() {
    this.snapshot = this.buildDto();
    this.enterEdit();
  }

  private isEmpty(p: ProfileDto): boolean {
    return !p.firstName && !p.lastName && !p.instituteEmail && !p.personalEmail
      && (!p.skills || p.skills.length === 0) && !p.photoUrl;
  }

  enterEdit() { this.form.enable(); this.editing.set(true); }

  cancel() {
    if (this.snapshot) this.patchFromDto(this.snapshot);
    this.linkError.set(null);
    this.form.disable();
    this.editing.set(false);
  }

  private patchFromDto(p: ProfileDto) {
    this.form.patchValue({
      firstName: p.firstName ?? '', middleName: p.middleName ?? '', lastName: p.lastName ?? '',
      instituteEmail: p.instituteEmail ?? '', personalEmail: p.personalEmail ?? '',
      countryCode: p.countryCode || '+91', phone: p.phone ?? '', address: p.address ?? '',
      tenthSchool: p.tenthSchool ?? '', tenthPercent: p.tenthPercent ?? '',
      twelfthSchool: p.twelfthSchool ?? '', twelfthPercent: p.twelfthPercent ?? '',
      college: p.college ?? '', course: p.course ?? '', passOutYear: p.passOutYear ?? '',
      cgpa: p.cgpa ?? '', resumeLink: p.resumeLink ?? '',
    });
    this.photo.set(p.photoUrl ?? null);
    this.skills.set([...(p.skills ?? [])]);
    this.projects.set((p.projects ?? []).map((x) => ({ ...x })));
    this.links.set((p.links ?? []).map((x) => ({ ...x })));
    this.resumeFileName.set(p.resumeFileName ?? null);
  }

  private buildDto(): ProfileDto {
    const v = this.form.getRawValue();
    return {
      photoUrl: this.photo(),
      firstName: v.firstName, middleName: v.middleName, lastName: v.lastName,
      instituteEmail: v.instituteEmail, personalEmail: v.personalEmail,
      countryCode: v.countryCode, phone: v.phone, address: v.address,
      skills: this.skills(),
      tenthSchool: v.tenthSchool, tenthPercent: v.tenthPercent,
      twelfthSchool: v.twelfthSchool, twelfthPercent: v.twelfthPercent,
      college: v.college, course: v.course, passOutYear: v.passOutYear, cgpa: v.cgpa,
      resumeFileName: this.resumeFileName(), resumeLink: v.resumeLink,
      projects: this.projects(),
      links: this.links(),
    };
  }

  // ---------- save ----------
  save() {
    this.form.markAllAsTouched();
    this.linkError.set(null);
    if (this.form.invalid || !this.linksValid()) { this.showToast('error', 'Please fix the highlighted fields.'); return; }

    this.saving.set(true);
    // === INTEGRATION POINT: persist via PUT /api/student/profile ===
    this.profileService.saveProfile(this.buildDto()).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.patchFromDto(saved);
        this.snapshot = this.buildDto();
        this.form.disable();
        this.editing.set(false);
        this.showToast('success', 'Profile saved successfully.');
      },
      error: (e) => {
        this.saving.set(false);
        this.showToast('error', e?.error?.error?.message ?? 'Could not save. Please try again.');
      },
    });
  }

  // ---------- photo ----------
  onPhoto(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.photo.set(reader.result as string);
    reader.readAsDataURL(file);
  }
  removePhoto() { this.photo.set(null); }

  // ---------- skills ----------
  addSkill() {
    const s = this.skillInput().trim();
    if (s && !this.skills().includes(s)) this.skills.update((a) => [...a, s]);
    this.skillInput.set('');
  }
  removeSkill(s: string) { this.skills.update((a) => a.filter((x) => x !== s)); }

  // ---------- projects ----------
  addProject() { this.projects.update((p) => [...p, { title: '', description: '', link: '' }]); }
  removeProject(i: number) { this.projects.update((p) => p.filter((_, idx) => idx !== i)); }
  updateProject(i: number, field: keyof ProjectDto, value: string) {
    this.projects.update((p) => p.map((pr, idx) => (idx === i ? { ...pr, [field]: value } : pr)));
  }

  // ---------- links ----------
  /** Returns true when a unique-once link type (github, leetcode, linkedin, portfolio) is already in the list. */
  isLinkTypeAdded(type: string): boolean {
    if (type === 'custom') return false; // custom can be added multiple times
    return this.links().some((l) => l.type === type);
  }
  addLink(type: string) {
    if (this.isLinkTypeAdded(type)) return; // prevent duplicate entries for specific platforms
    const label = this.linkTypes[type]?.label ?? 'Link';
    this.links.update((a) => [...a, { type, label, url: '' }]);
  }
  removeLink(i: number) { this.links.update((a) => a.filter((_, idx) => idx !== i)); }
  updateLink(i: number, field: keyof LinkDto, value: string) {
    this.links.update((a) => a.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }
  /** Per-type URL validation — empty is allowed; otherwise must be a valid URL on the right host. */
  linkUrlError(link: LinkDto): string | null {
    const url = (link.url ?? '').trim();
    if (!url) return null;
    let parsed: URL;
    try { parsed = new URL(url); } catch { return 'Enter a valid URL (https://…).'; }
    const cfg = this.linkTypes[link.type];
    if (cfg?.match && !parsed.hostname.toLowerCase().includes(cfg.match)) {
      return `Enter a valid ${cfg.label} URL`;
    }
    return null;
  }
  linksValid = computed(() => this.links().every((l) => this.linkUrlError(l) === null));

  // ---------- resume ----------
  onResume(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.resumeFileName.set(file.name);
    const prev = this.resumeObjectUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.resumeObjectUrl.set(URL.createObjectURL(file));
  }
  removeResume() {
    const prev = this.resumeObjectUrl();
    if (prev) URL.revokeObjectURL(prev);
    this.resumeObjectUrl.set(null);
    this.resumeFileName.set(null);
  }
  saveResumeLink() {
    const ctrl = this.form.controls.resumeLink;
    const val = (ctrl.value ?? '').trim();
    if (!val) { this.linkError.set('Enter a URL first.'); return; }
    if (ctrl.invalid) { this.linkError.set('Enter a valid URL (https://…).'); return; }
    this.linkError.set(null);
    this.showToast('success', 'Resume link looks good — it saves with your profile.');
  }

  // ---------- misc ----------
  logout() { this.auth.logout(); this.router.navigate(['/login']); }

  private showToast(type: 'success' | 'error', msg: string) {
    this.toast.set({ type, msg });
    setTimeout(() => this.toast.set(null), 3000);
  }
}