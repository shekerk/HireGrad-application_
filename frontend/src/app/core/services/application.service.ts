import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export type ApplicationStatus = 'APPLIED' | 'SELECTED' | 'REJECTED';

export interface ApplyRequest {
  jobId: number;
  resumeFileName?: string | null;
}

/** A row in the student's own Application Tracker. */
export interface StudentApplication {
  id: number;
  jobId: number;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedAt: string;
}

/** A row in the admin's Application Management table. */
export interface AdminApplication {
  id: number;
  jobId: number;
  studentUsername: string; // roll number
  fullName: string;
  branch: string | null;
  cgpa: number | null;
  status: ApplicationStatus;
  appliedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);

  // === Student side ===
  apply(req: ApplyRequest): Observable<StudentApplication> {
    return this.http
      .post<ApiResponse<StudentApplication>>(environment.apiUrl + '/api/student/applications', req)
      .pipe(map((r) => r.data));
  }

  myApplications(): Observable<StudentApplication[]> {
    return this.http
      .get<ApiResponse<StudentApplication[]>>(environment.apiUrl + '/api/student/applications')
      .pipe(map((r) => r.data));
  }

  // === Admin side ===
  listForJob(jobId: number): Observable<AdminApplication[]> {
    return this.http
      .get<ApiResponse<AdminApplication[]>>(environment.apiUrl + `/api/admin/applications?jobId=${jobId}`)
      .pipe(map((r) => r.data));
  }

  updateStatus(applicationId: number, status: ApplicationStatus): Observable<AdminApplication> {
    return this.http
      .patch<ApiResponse<AdminApplication>>(environment.apiUrl + `/api/admin/applications/${applicationId}/status`, { status })
      .pipe(map((r) => r.data));
  }
}
