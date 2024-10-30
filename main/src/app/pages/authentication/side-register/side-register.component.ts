import { Component, inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { RoleService } from "../../../services/role.service";
import { Role } from "../../../interfaces/role";
import { Observable } from "rxjs";
import { AuthService } from "../../../services/auth.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { HttpErrorResponse } from "@angular/common/http";
import { CommonModule } from '@angular/common'; // Import CommonModule

@Component({
  selector: 'app-side-register',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, CommonModule], // Add CommonModule here
  templateUrl: './side-register.component.html',
})
export class AppSideRegisterComponent implements OnInit {
  roleService = inject(RoleService);
  roles$!: Observable<Role[]>;
  authService = inject(AuthService);
  matSnackBar = inject(MatSnackBar);
  router = inject(Router);
  hidePassword = true;
  hideConfirmPassword = true;
  registerform!: FormGroup;
  fb = inject(FormBuilder);
  errors!: ValidationErrors[];

  constructor() {}

  register() {
    this.authService.register(this.registerform.value).subscribe({
      next: (response) => {
        console.log(response);
        this.matSnackBar.open(response.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
        });
        this.router.navigate(['/authentication/login']);
      },
      error: (err: HttpErrorResponse) => {
        if (err!.status === 400) {
          this.errors = err!.error;
          this.matSnackBar.open('Validation error', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
          });
        }
        complete: () => console.log('Register success');
      },
    });
  }

  ngOnInit(): void {
    this.registerform = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]],
        fullName: ['', [Validators.required]],
        roles: [''],
      },
      {
        validator: this.passwordMatchValidator,
      }
    );
    this.roles$ = this.roleService.getRoles();
  }

  private passwordMatchValidator(
    control: AbstractControl
  ): { [key: string]: boolean } | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }
}
