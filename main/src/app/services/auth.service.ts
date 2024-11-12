import {inject, Injectable, NgZone, OnInit} from '@angular/core';
import {interval, Observable, Subscription, fromEvent, merge, timer, take, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import * as jwt_decode from 'jwt-decode';
import {LoginRequest} from '../interfaces/login-request';
import {AuthResponse} from '../interfaces/auth-response';
import {RegisterRequest} from '../interfaces/register-request';
import {UserDetail} from '../interfaces/user-detail';
import {ResetPasswordRequest} from '../interfaces/reset-password-request';
import {ChangePasswordRequest} from '../interfaces/change-password-request';
import {RedirectService} from './redirect.service';
import {Router} from '@angular/router';
import {MatSnackBar, MatSnackBarRef} from '@angular/material/snack-bar';
import {CountdownSnackbarComponent} from '../components/countdown-snackbar/countdown-snackbar.component';
import {map, switchMap, takeUntil} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl: string = 'https://localhost:44324/api/';
  private tokenCheckInterval: Subscription | null = null;
  private userKey = 'user';

  private readonly inactivityTime = 80000; // 30 seconds
  private readonly logoutCountdown = 10000; // 10 seconds
  private countdownInProgress: Subscription | null = null;
  private inactivitySubscription: Subscription | null = null;
  private snackBarRef: MatSnackBarRef<CountdownSnackbarComponent> | null = null;

  redirectService = inject(RedirectService);
  router = inject(Router);
  snackBar = inject(MatSnackBar);
  ngZone = inject(NgZone);

  constructor(private http: HttpClient) {
    // if (this.isLoggedIn()) {
    //   this.startInactivityTimer();
    // }
  }

  // ngOnInit() {
  //   if (this.isLoggedIn()) {
  //     this.startInactivityTimer();
  //   }
  // }

  // startInactivityTimer() {
  //   if (this.inactivitySubscription) {
  //     this.inactivitySubscription.unsubscribe();
  //   }
  //
  //   // Run within Angular zone to ensure UI updates happen
  //   this.ngZone.run(() => {
  //     const activityEvents$ = merge(
  //       fromEvent(document, 'mousemove'),
  //       fromEvent(document, 'click'),
  //       fromEvent(document, 'keypress')
  //     );
  //
  //     this.inactivitySubscription = activityEvents$
  //       .pipe(
  //         switchMap(() => {
  //           // Reset the countdown and snackbar on user activity
  //           if (this.countdownInProgress) {
  //             this.countdownInProgress.unsubscribe();
  //             this.countdownInProgress = null;
  //           }
  //           if (this.snackBarRef) {
  //             this.snackBarRef.dismiss();
  //             this.snackBarRef = null;
  //           }
  //           return timer(this.inactivityTime);
  //         })
  //       )
  //       .subscribe(() => {
  //         this.showInactivityWarning();
  //       });
  //   });
  // }

  // showInactivityWarning() {
  //   if (!this.isLoggedIn()) return;
  //
  //   if (this.countdownInProgress) return; // Prevent restarting countdown if already in progress
  //
  //   // Open snackbar within the Angular zone
  //   this.ngZone.run(() => {
  //     this.snackBarRef = this.snackBar.openFromComponent(CountdownSnackbarComponent, {
  //       duration: this.logoutCountdown,
  //       data: {
  //         message: 'You will be logged out in 10 seconds due to inactivity.',
  //       },
  //     });
  //   });
  //
  //   this.countdownInProgress = interval(1000)
  //     .pipe(
  //       take(this.logoutCountdown / 1000), // Run for 10 seconds
  //       tap((count) => console.log(`Logging out in ${10 - count} seconds`))
  //     )
  //     .subscribe({
  //       complete: () => {
  //         this.logoutWithRedirect();
  //       }
  //     });
  //
  //   // Listen for user activity and reset the countdown if activity is detected
  //   merge(fromEvent(document, 'mousemove'), fromEvent(document, 'click'), fromEvent(document, 'keypress')).subscribe(() => {
  //     if (this.countdownInProgress) {
  //       this.countdownInProgress.unsubscribe();
  //       this.countdownInProgress = null;
  //     }
  //
  //     // Dismiss the snackbar and reset it
  //     if (this.snackBarRef) {
  //       this.snackBarRef.dismiss();
  //       this.snackBarRef = null;
  //     }
  //
  //     // Start the inactivity timer again after resetting
  //     this.startInactivityTimer();
  //   });
  // }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}User/login`, data).pipe(
      map((response: AuthResponse) => {
        if (response.isSuccess) {
          localStorage.setItem(this.userKey, JSON.stringify(response));
          this.startTokenCheck();
          // this.startInactivityTimer();
          const redirectUrl = this.redirectService.getRedirectUrl();
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
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/authentication/login']);
  };

  logoutWithRedirect = (): void => {
    const currentUrl = this.router.url;
    this.redirectService.setRedirectUrl(currentUrl);
    localStorage.removeItem(this.userKey);
    if (this.tokenCheckInterval) {
      this.tokenCheckInterval.unsubscribe();
      this.tokenCheckInterval = null;
    }
    this.router.navigate(['/authentication/login'], {
      queryParams: {redirect: currentUrl},
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

      if (expiryTime > 0) {
        setTimeout(() => {
          if (this.isTokenExpired()) {
            this.logoutWithRedirect();
          }
        }, expiryTime);

        const countdownTime = expiryTime - 10000;
        if (countdownTime > 0) {
          setTimeout(() => {
            if (!this.isTokenExpired()) {
              this.snackBar.openFromComponent(CountdownSnackbarComponent, {
                duration: 10000,
                data: {
                  message: 'Your session will expire in 10 seconds.',
                  snackBar: this.snackBar,
                },
              });
            }
          }, countdownTime);
        }
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
