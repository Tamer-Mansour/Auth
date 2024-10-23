import { Component, Inject, OnInit } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { interval, take } from 'rxjs';

@Component({
  selector: 'app-countdown-snackbar',
  standalone: true,
  imports: [MatProgressBarModule],
  templateUrl: './countdown-snackbar.component.html',

})
export class CountdownSnackbarComponent implements OnInit {
  countdown: number = 10;

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {}
  ngOnInit(): void {
    const countdown$ = interval(1000).pipe(take(this.countdown));
    countdown$.subscribe({
      next: (value) => this.countdown -= 1,
      complete: () => this.data.snackBar.dismiss()
    });
  }
}
