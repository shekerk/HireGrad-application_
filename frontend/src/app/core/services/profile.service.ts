import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';

export interface ProjectDto {
  title: string;
  description: string;
  link: string;
}

export interface LinkDto {
  type: string; // github | leetcode | linkedin | portfolio | custom
  label: string;
  url: string;
}

export interface ProfileDto {
  photoUrl: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  instituteEmail: string | null;
  personalEmail: string | null;
  countryCode: string | null;
  phone: string | null;
  address: string | null;
  skills: string[];
  tenthSchool: string | null;
  tenthPercent: string | null;
  twelfthSchool: string | null;
  twelfthPercent: string | null;
  college: string | null;
  course: string | null;
  passOutYear: string | null;
  cgpa: string | null;
  resumeFileName: string | null;
  resumeLink: string | null;
  projects: ProjectDto[];
  links: LinkDto[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: { code: string; message: string };
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl +'/api/student/profile';

  getProfile(): Observable<ProfileDto> {
    return this.http.get<ApiResponse<ProfileDto>>(this.API).pipe(map((r) => r.data));
  }

  saveProfile(dto: ProfileDto): Observable<ProfileDto> {
    return this.http.put<ApiResponse<ProfileDto>>(this.API, dto).pipe(map((r) => r.data));
  }
}