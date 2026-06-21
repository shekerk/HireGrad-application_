import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CreateStudentRequest {
  username: string;
  personalEmail: string;
  instituteEmail: string;
  rollNumber: string;
  dateOfBirth: string; // yyyy-MM-dd from <input type="date">
  temporaryPassword?: string;
}

export interface CreateStudentResponse {
  id: number;
  username: string;
  fullName: string;
  rollNumber: string;
  instituteEmail: string;
  personalEmail: string;
  temporaryPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class AccountService {
  private http = inject(HttpClient);

  /** Admin provisions a student login. Returns the credentials (incl. temp password) once. */
  createStudent(req: CreateStudentRequest): Observable<CreateStudentResponse> {
    return this.http
      .post<ApiResponse<CreateStudentResponse>>(environment.apiUrl+'/api/admin/students', req)
      .pipe(map((r) => r.data));
  }
}
