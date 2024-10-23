import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import * as jwt_decode from 'jwt-decode';
import { LoginRequest } from '../interfaces/login-request';
import { AuthResponse } from '../interfaces/auth-response';
import { RegisterRequest } from '../interfaces/register-request';
import { UserDetail } from '../interfaces/user-detail';
import { ResetPasswordRequest } from '../interfaces/reset-password-request';
import { ChangePasswordRequest } from '../interfaces/change-password-request';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = 'https://localhost:44324/api/';

  private userKey = 'user';

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}User/login`, data).pipe(
      map((response: AuthResponse) => {
        if (response.isSuccess) {
          localStorage.setItem(this.userKey, JSON.stringify(response));
        }
        return response;
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}User/register`, data);
  }

  isLoggedIn = (): boolean => {
    const token = this.getToken();
    if (!token) return false;
    return true;
  };

  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    const decoded = jwt_decode.jwtDecode(token);
    const isTokenExpired = Date.now() >= decoded['exp']! * 1000;
    // if (isTokenExpired) this.logout();
    return true;
  }

  getToken = (): string | null => {
    const user = localStorage.getItem(this.userKey);
    if (!user) return null;
    const userDetail: AuthResponse = JSON.parse(user);
    return userDetail.token;
  };

  logout = (): void => {
    localStorage.removeItem(this.userKey);
  };

  getUserDetail = () => {
    const token = this.getToken();
    if (!token) return null;
    const decodeToken: any = jwt_decode.jwtDecode(token);

    const userDetail = {
      id: decodeToken.nameid,
      fullName: decodeToken.name,
      email: decodeToken.email,
      roles: decodeToken.role || [],
    };
    return userDetail;
  };

  getDetail = (): Observable<UserDetail> => {
    return this.http.get<UserDetail>(`${this.apiUrl}User/Detail`);
  };

  getAll = (): Observable<UserDetail[]> =>
    this.http.get<UserDetail[]>(`${this.apiUrl}User`);

  getRoles = (): string[] | null => {
    const token = this.getToken();
    if (!token) return null;
    const decodedToken: any = jwt_decode.jwtDecode(token);
    return decodedToken.role || null;
  };

  forgotPassword = (email: string): Observable<AuthResponse> =>
    this.http.post<AuthResponse>(`${this.apiUrl}User/forgot-password`, {
      email,
    });

  resetPassword = (data: ResetPasswordRequest): Observable<AuthResponse> =>
    this.http.post<AuthResponse>(`${this.apiUrl}User/reset-password`, data);

  chnagePassword = (data: ChangePasswordRequest): Observable<AuthResponse> =>
    this.http.post<AuthResponse>(`${this.apiUrl}User/change-password`, {
      email: data.email,
      currentPassword: data.currentPassword,
      newPasseord: data.newPassword,
    });

  refreshToken = (data: {
    email: string;
    token: string;
    refreshToken: string;
  }): Observable<AuthResponse> =>
    this.http.post<AuthResponse>(`${this.apiUrl}User/refresh-token`, {
      email: data.email,
      token: data.token,
      refreshToken: data.refreshToken,
    });

  getRefreshToken = (): string | null => {
    const user = localStorage.getItem(this.userKey);
    if (!user) return null;
    const userDetail: AuthResponse = JSON.parse(user);
    return userDetail.refreshToken;
  };
}