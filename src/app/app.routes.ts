import { Routes } from '@angular/router';
import { StatisticsPage } from './statistics-page';
import { Viewer } from './viewer';

export const routes: Routes = [
  { path: '', component: Viewer },
  { path: 'statistics', component: StatisticsPage },
  { path: '**', redirectTo: '' },
];
