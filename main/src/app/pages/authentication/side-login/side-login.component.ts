import { Component, inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
} from '@angular/forms';
import {
  Router,
  RouterModule,
  RouterLink,
  ActivatedRoute,
} from '@angular/router';
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
  route = inject(ActivatedRoute);

  login() {
    this.authService.login(this.form.value).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.matSnackBar.open('Login Success', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
          });
          const roles = this.authService.getRoles();
          const redirectUrl = this.authService.redirectService.getRedirectUrl();
          if (redirectUrl) {
            this.router.navigateByUrl(redirectUrl);
          } else {
            // if (roles) {
            //   if (roles.includes('Admin')) {
            //     this.router.navigate(['/']);
            //   } else {
            //     this.router.navigate(['/']);
            //   }
            // } else {
            //   this.matSnackBar.open(
            //     'User roles could not be determined',
            //     'Close',
            //     {
            //       duration: 5000,
            //       horizontalPosition: 'center',
            //     }
            //   );
            //   this.router.navigate(['/authentication/login']);
            // }
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
    this.route.queryParams.subscribe((params) => {
      console.log('Full URL: ', this.router.url);
      console.log(
        '🚀 ~ AppSideLoginComponent ~ this.route.queryParams.subscribe ~ params:',
        params
      );
      const redirectUrl = params['redirect'];
      console.log(
        '🚀 ~ AppSideLoginComponent ~ this.route.queryParams.subscribe ~ redirectUrl:',
        redirectUrl
      );
      if (redirectUrl) {
        this.authService.redirectService.setRedirectUrl(redirectUrl);
      }
    });
  }
}
