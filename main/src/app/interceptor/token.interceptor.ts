import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { Router } from '@angular/router';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.getToken()) {
    const cloned = req.clone({
      headers: req.headers.set(
        'Authorization',
        'Bearer ' + authService.getToken()
      ),
    });
    return next(cloned).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return authService.refreshToken({
            email: authService.getUserDetail()?.email,
            token: authService.getToken() || '',
            refreshToken: authService.getRefreshToken() || '',
          }).pipe(
            switchMap(response => {
              if (response.isSuccess) {
                localStorage.setItem('user', JSON.stringify(response));
                const cloned = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${response.token}`,
                  },
                });
                return next(cloned);
              } else {
                authService.logout();
                router.navigate(['/authentication/login']);
                return throwError(() => new Error('Token refresh failed'));
              }
            }),
            catchError(() => {
              authService.logout();
              router.navigate(['/authentication/login']);
              return throwError(() => new Error('Token refresh failed'));
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
  return next(req);
};
