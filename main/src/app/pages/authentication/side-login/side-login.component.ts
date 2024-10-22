import { Component, inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from 'src/app/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent implements OnInit {
  authService = inject(AuthService);
  matSnackBar = inject(MatSnackBar);
  router = inject(Router);
  hide = true;
  form!: FormGroup;
  fb = inject(FormBuilder);

  login() {
    this.authService.login(this.form.value).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.matSnackBar.open('Login Success', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
          });
          const roles = this.authService.getRoles();
          if (roles) {
            if (roles.includes('Admin')) {
              this.router.navigate(['/']);
            } else {
              this.router.navigate(['/default']);
            }
          } else {
            this.matSnackBar.open(
              'User roles could not be determined',
              'Close',
              {
                duration: 5000,
                horizontalPosition: 'center',
              }
            );
            this.router.navigate(['/authentication/login']);
          }
        }
      },
      error: () => {
        this.matSnackBar.open('Login Failed', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
        });
        this.router.navigate(['/authentication/login']);
      },
    });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }
}
