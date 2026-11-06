import { Component } from '@angular/core';
import { Viewer } from './viewer';

@Component({
  selector: 'app-root',
  imports: [Viewer],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
