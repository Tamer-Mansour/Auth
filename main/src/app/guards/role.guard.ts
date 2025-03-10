import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const roleGuard: CanActivateFn = (route, state) => {
  const roles = route.data['roles'] as string[];
  const authService = inject(AuthService);
  const matSnackBar = inject(MatSnackBar);
  const router = inject(Router);
  
  if (!authService.isLoggedIn() || authService.isTokenExpired()) {
    matSnackBar.open('You must login to view this page.', 'Ok', {
      duration: 5000,
    });
    authService.logout();
    router.navigate(['/authentication/login']);
    return false;
  }

  const userRoles = authService.getRoles();
  if (roles.some((role) => userRoles?.includes(role))) {
    return true;
  }

  matSnackBar.open("You don't have permission to view this page.", 'Ok', {
    duration: 5000,
  });
  router.navigate(['/']);
  return false;
};
