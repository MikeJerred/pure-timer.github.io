import { Component } from '@angular/core';
import { interval, Observable, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  alcoholTimer: number | null = null;
  eggTimer: number | null = null;
  allTimer: number | null = null;
  instanceTimer: number | null = null;

  private readonly dangerBuffer = 5000;
  private readonly warningBuffer = 30000;
  private readonly tickLength = 100;
  private readonly alcoholRefreshTime = 2 * 60 * 1000;
  private readonly eggRefreshTime = 5 * 60 * 1000;
  private readonly allRefreshTime = 10 * 60 * 1000;

  private stopAlcohol$ = new Subject<void>();
  private stopEgg$ = new Subject<void>();
  private stopAll$ = new Subject<void>();
  private stopInstance$ = new Subject<void>();

  constructor() {
    try {
      (navigator as any).wakeLock.request('screen');
    } catch (error) {
      // could not request wake lock
    }
  }

  isDanger(time: number | null) {
    return time !== null && time <= this.dangerBuffer + 1000;
  }

  isWarning(time: number | null) {
    return time !== null && time <= this.warningBuffer + 1000;
  }

  startAlcohol() {
    this.stopAlcohol$.next();
    this.alcoholTimer = this.alcoholRefreshTime;

    this.createTimer(this.stopAlcohol$, this.alcoholRefreshTime, 'alkahol').subscribe(timeLeft => {
      this.alcoholTimer = timeLeft;

      if (timeLeft <= 0) {
        this.startAlcohol();
      }
    });
  }

  stopAlcohol() {
    this.stopAlcohol$.next();
    this.alcoholTimer = null;
  }

  startEgg() {
    this.stopEgg$.next();
    this.eggTimer = this.eggRefreshTime;

    this.createTimer(this.stopEgg$, this.eggRefreshTime, 'Egg').subscribe(timeLeft => {
      this.eggTimer = timeLeft;

      if (timeLeft <= 0) {
        this.startEgg();
      }
    });
  }

  stopEgg() {
    this.stopEgg$.next();
    this.eggTimer = null;
  }

  startAll() {
    this.stopAll$.next();
    this.allTimer = this.allRefreshTime;

    this.createTimer(this.stopAll$, this.allRefreshTime, 'Corn').subscribe(timeLeft => {
      this.allTimer = timeLeft;

      if (timeLeft <= 0) {
        this.startAll();
      }
    });
  }

  stopAll() {
    this.stopAll$.next();
    this.allTimer = null;
  }

  startInstance() {
    if (this.instanceTimer === null) {
      this.instanceTimer = -3000;
      interval(this.tickLength)
        .pipe(
          map(ticks => ticks * this.tickLength),
          takeUntil(this.stopInstance$)
        ).subscribe(time => {
          this.instanceTimer = time - 3000;
        });
    }
  }

  stopInstance() {
    this.stopInstance$.next();
    this.instanceTimer = null;
  }

  private createTimer(stop$: Observable<void>, refreshTime: number, text: string) {
    let state = 100;

    return interval(this.tickLength).pipe(
      map(ticks => refreshTime - ticks * this.tickLength),
      tap(timeLeft => {
        if (timeLeft < this.dangerBuffer + 1000) {
          const currentState = Math.floor(timeLeft / 1000);
          if (state > currentState) {
            const speechText =
              state === 100 ? text
              : currentState > 0 ? `${currentState}`
              : 'pop ' + text;

            state = currentState;

            const utterance = new SpeechSynthesisUtterance(speechText);
            utterance.rate = 2;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          }
        }
      }),
      takeUntil(stop$)
    );
  }
}
