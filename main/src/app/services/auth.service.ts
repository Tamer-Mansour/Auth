import { inject, Injectable } from '@angular/core';
import { interval, Observable, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import * as jwt_decode from 'jwt-decode';
import { LoginRequest } from '../interfaces/login-request';
import { AuthResponse } from '../interfaces/auth-response';
import { RegisterRequest } from '../interfaces/register-request';
import { UserDetail } from '../interfaces/user-detail';
import { ResetPasswordRequest } from '../interfaces/reset-password-request';
import { ChangePasswordRequest } from '../interfaces/change-password-request';
import { RedirectService } from './redirect.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = 'https://localhost:44324/api/';
  private tokenCheckInterval: Subscription | null = null;
  private userKey = 'user';
  redirectService = inject(RedirectService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}User/login`, data).pipe(
      map((response: AuthResponse) => {
        if (response.isSuccess) {
          localStorage.setItem(this.userKey, JSON.stringify(response));
          this.startTokenCheck();
          const redirectUrl = this.redirectService.getRedirectUrl();
          console.log('🚀 ~ AuthService ~ redirectUrl:', redirectUrl);
          if (redirectUrl) {
            this.router.navigate([redirectUrl]);
          } else {
            this.router.navigate(['/']);
          }
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
    return token != null && !this.isTokenExpired();
  };

  public isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    const decoded = jwt_decode.jwtDecode(token);
    return Date.now() >= decoded['exp']! * 1000;
  }

  getToken = (): string | null => {
    const user = localStorage.getItem(this.userKey);
    if (!user) return null;
    const userDetail: AuthResponse = JSON.parse(user);
    return userDetail.token;
  };

  logout = (): void => {
    const currentUrl = this.router.url;
    console.log('🚀 ~ AuthService ~ currentUrl:', currentUrl);
    // this.redirectService.setRedirectUrl(currentUrl);
    localStorage.removeItem(this.userKey);
    // if (this.tokenCheckInterval) {
    //   this.tokenCheckInterval.unsubscribe();
    //   this.tokenCheckInterval = null;
    // }
    this.router.navigate(['/authentication/login']);
    // this.router.navigate(['/authentication/login'], {
    //   queryParams: { redirect: currentUrl },
    // });
  };

  logoutWithRedirect = (): void =>{
    const currentUrl = this.router.url;
    this.redirectService.setRedirectUrl(currentUrl);
    localStorage.removeItem(this.userKey);
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
      this.tokenCheckInterval = null;
    }
    this.router.navigate(['/authentication/login'], {
      queryParams: { redirect: currentUrl },
    });
  };

  private startTokenCheck(): void {
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
    }

    const token = this.getToken();
    if (token) {
      const decoded: any = jwt_decode.jwtDecode(token);
      const expiryTime = decoded['exp'] * 1000 - Date.now();
      console.log('exp: ', expiryTime);

      if (expiryTime > 0) {
        const checkTime = expiryTime - 10000;
        this.tokenCheckInterval = interval(checkTime).subscribe(() => {
          if (this.isTokenExpired()) {
            this.logoutWithRedirect();
          } else {
            this.snackBar.open('Your session will expire in 10 seconds.', 'Close', {
              duration: 12000,
            });
          }
        });
      } else {
        this.logoutWithRedirect();
      }
    }
  }

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
