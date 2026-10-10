import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MotionPrefService } from './motion-pref';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<div class="progress" aria-hidden="true"></div><router-outlet />',
})
export class App {
  private readonly motionPref = inject(MotionPrefService);
}
