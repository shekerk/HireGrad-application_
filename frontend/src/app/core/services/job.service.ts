import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

export type EmploymentType = 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME';
export type WorkMode = 'ON_SITE' | 'HYBRID' | 'REMOTE';

export interface JobRequest {
  companyName: string;
  jobTitle: string;
  location: string;
  ctcPerYear: number;
  employmentType: EmploymentType;
  workMode: WorkMode;
  minCgpa: number | null;
  requiredSkills: string[];
  description: string;
  applicationDeadline: string; // ISO local date-time from datetime-local
}

export interface JobResponse {
  id: number;
  companyName: string;
  jobTitle: string;
  location: string;
  ctcPerYear: number;
  employmentType: EmploymentType;
  workMode: WorkMode;
  minCgpa: number | null;
  requiredSkills: string[];
  description: string;
  applicationDeadline: string;
  postedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class JobService {
  private http = inject(HttpClient);

  createJob(req: JobRequest): Observable<JobResponse> {
    return this.http.post<ApiResponse<JobResponse>>(environment.apiUrl + '/api/admin/jobs', req).pipe(map((r) => r.data));
  }

  listStudentJobs(): Observable<JobResponse[]> {
    return this.http.get<ApiResponse<JobResponse[]>>(environment.apiUrl + '/api/student/jobs').pipe(map((r) => r.data));
  }

  listAdminJobs(): Observable<JobResponse[]> {
    return this.http.get<ApiResponse<JobResponse[]>>(environment.apiUrl + '/api/admin/jobs').pipe(map((r) => r.data));
  }
}