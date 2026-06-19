import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

export interface StudentMe {
  username: string;
  fullName: string;
  role: 'STUDENT' | 'ADMIN';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class StudentService {
  private http = inject(HttpClient);
  private readonly API =environment.apiUrl + '/api/student';

  getMe(): Observable<StudentMe> {
    return this.http.get<ApiResponse<StudentMe>>(`${this.API}/me`).pipe(map((r) => r.data));
  }
}