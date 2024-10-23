import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RedirectService } from '../services/redirect.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const matSnackBar = inject(MatSnackBar);
  const router = inject(Router);
  const redirectService = inject(RedirectService);
  const currentUrl = router.url;
  if (authService.isLoggedIn() && !authService.isTokenExpired()) {
    return true;
  }
  redirectService.setRedirectUrl(state.url);
   matSnackBar.open('You must be logged in to view this page', 'Ok', {
    duration: 3000,
  });
  authService.logout();
  router.navigate(['/authentication/login'], {
    queryParams: { redirect: currentUrl },
  });
  return false;
};