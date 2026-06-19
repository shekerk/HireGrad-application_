import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApplicationStatus } from './application.service';
import { environment } from '../../../environments/environment.prod';

export interface StudentDashboard {
  fullName: string;
  profileCompletion: number;
  missingSections: string[];
  totalApplications: number;
  inReview: number;
  selected: number;
  rejected: number;
  eligibleRoles: number;
  recentApplications: {
    companyName: string;
    jobTitle: string;
    status: ApplicationStatus;
    appliedAt: string;
  }[];
  recommendedJobs: {
    id: number;
    jobTitle: string;
    companyName: string;
    location: string;
    minCgpa: number | null;
    ctcPerYear: number | null;
    applicationDeadline: string | null;
  }[];
}

export interface AdminDashboard {
  fullName: string;
  activePostings: number;
  totalApplicants: number;
  selected: number;
  pendingReviews: number;
  rejected: number;
  placementRate: number;
  postings: {
    jobId: number;
    jobTitle: string;
    companyName: string;
    location: string;
    employmentType: string;
    applicantCount: number;
    selectedCount: number;
  }[];
  recentActivity: {
    fullName: string;
    studentUsername: string;
    jobTitle: string;
    companyName: string;
    status: ApplicationStatus;
    appliedAt: string;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getStudentDashboard(): Observable<StudentDashboard> {
    return this.http
      .get<ApiResponse<StudentDashboard>>(environment.apiUrl + '/api/student/dashboard')
      .pipe(map((r) => r.data));
  }

  getAdminDashboard(): Observable<AdminDashboard> {
    return this.http
      .get<ApiResponse<AdminDashboard>>(environment.apiUrl + '/api/admin/dashboard')
      .pipe(map((r) => r.data));
  }
}
