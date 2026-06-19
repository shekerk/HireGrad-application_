import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplicationStatus } from './application.service';
import { environment } from '../../../environments/environment.prod';

export interface ReportStudent {
  username: string;
  fullName: string;
  rollNumber: string | null;
  department: string | null;
  college: string | null;
  passOutYear: string | null;
  cgpa: number | null;
}

export interface ReportApplication {
  studentUsername: string;
  fullName: string;
  company: string;
  jobTitle: string;
  status: ApplicationStatus;
}

export interface PlacementReport {
  students: ReportStudent[];
  applications: ReportApplication[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);

  getPlacementReport(): Observable<PlacementReport> {
    return this.http
      .get<ApiResponse<PlacementReport>>(environment.apiUrl + '/api/admin/reports/placement')
      .pipe(map((r) => r.data));
  }
}
