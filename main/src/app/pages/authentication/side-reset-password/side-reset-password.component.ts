import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MaterialModule } from '../../../material.module';
import { ResetPasswordRequest } from '../../../interfaces/reset-password-request';

@Component({
  selector: 'app-side-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MaterialModule,
  ],
  templateUrl: './side-reset-password.component.html',
})
export class SideResetPasswordComponent implements OnInit {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  matSnackBar = inject(MatSnackBar);
  router = inject(Router);

  resetPasswordForm!: FormGroup;
  token = ''; // Token would typically come from the route or a service

  ngOnInit(): void {
    this.resetPasswordForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      token: [this.token, [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  resetPasswordHandle() {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    const resetRequest: ResetPasswordRequest = {
      email: this.resetPasswordForm.get('email')?.value,
      token: this.resetPasswordForm.get('token')?.value,
      newPassword: this.resetPasswordForm.get('newPassword')?.value,
    };

    this.authService.resetPassword(resetRequest).subscribe({
      next: (response) => {
        this.matSnackBar.open('Password reset successful', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
        });
        this.router.navigate(['/authentication/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.matSnackBar.open('Failed to reset password', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
        });
      },
    });
  }
}
