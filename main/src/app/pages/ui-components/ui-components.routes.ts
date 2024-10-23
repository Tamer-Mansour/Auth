import { Routes } from '@angular/router';

// ui
import { AppBadgeComponent } from './badge/badge.component';
import { AppChipsComponent } from './chips/chips.component';
import { AppListsComponent } from './lists/lists.component';
import { AppMenuComponent } from './menu/menu.component';
import { AppTooltipsComponent } from './tooltips/tooltips.component';
import { AppFormsComponent } from './forms/forms.component';
import { AppTablesComponent } from './tables/tables.component';
import { authGuard } from 'src/app/guards/auth.guard';

export const UiComponentsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'badge',
        component: AppBadgeComponent,
        canActivate: [authGuard]
      },
      {
        path: 'chips',
        component: AppChipsComponent,
        canActivate: [authGuard]
      },
      {
        path: 'lists',
        component: AppListsComponent,
        canActivate: [authGuard]
      },
      {
        path: 'menu',
        component: AppMenuComponent,
        canActivate: [authGuard]
      },
      {
        path: 'tooltips',
        component: AppTooltipsComponent,
        canActivate: [authGuard]
      },
      {
        path: 'forms',
        component: AppFormsComponent,
        canActivate: [authGuard]
      },
      {
        path: 'tables',
        component: AppTablesComponent,
        canActivate: [authGuard]
      },
    ],
  },
];
