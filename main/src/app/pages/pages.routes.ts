import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { authGuard } from '../guards/auth.guard';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    canActivate: [authGuard],
    data: {
      title: 'Starter',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Starter' },
      ],
    },
  },
];
