import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Role } from '../interfaces/role';
import { RoleCreateRequest } from '../interfaces/role-create-request';
import { environment } from 'src/environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  apiUrl: string = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRoles = (): Observable<Role[]> =>
    this.http.get<Role[]>(`${this.apiUrl}/Role`);

  createRole = (role: RoleCreateRequest): Observable<{ message: string }> =>
    this.http.post<{ message: string }>(`${this.apiUrl}/Role`, role);

  deleteRole = (id: string): Observable<{ message: string }> =>
    this.http.delete<{ message: string }>(`${this.apiUrl}/Role/${id}`);

  assignRole = (
    userId: string,
    roleId: string
  ): Observable<{ message: string }> =>
    this.http.post<{ message: string }>(`${this.apiUrl}/Role/assign`, {
      userId,
      roleId,
    });
}