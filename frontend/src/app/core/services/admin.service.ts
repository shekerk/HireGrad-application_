import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

export interface AdminMe {
  username: string;
  fullName: string;
  role: 'STUDENT' | 'ADMIN';
}

export interface AdminProfileDto {
  photoUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  designation: string | null;
  instituteEmail: string | null;
  countryCode: string | null;
  phone: string | null;
  officeLocation: string | null;
  college: string | null;
  department: string | null;
  staffId: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly API =environment.apiUrl + '/api/admin';

  getMe(): Observable<AdminMe> {
    return this.http.get<ApiResponse<AdminMe>>(`${this.API}/me`).pipe(map((r) => r.data));
  }

  getProfile(): Observable<AdminProfileDto> {
    return this.http.get<ApiResponse<AdminProfileDto>>(`${this.API}/profile`).pipe(map((r) => r.data));
  }

  saveProfile(dto: AdminProfileDto): Observable<AdminProfileDto> {
    return this.http.put<ApiResponse<AdminProfileDto>>(`${this.API}/profile`, dto).pipe(map((r) => r.data));
  }
}