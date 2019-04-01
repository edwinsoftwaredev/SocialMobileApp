import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { DrawerTransitionBase, SlideInOnTopTransition } from "nativescript-ui-sidedrawer";
import { setInterval } from "tns-core-modules/timer";

@Injectable({providedIn: "root"})
export class PanelService {

  refreshPanelSubject: Subject<boolean> = new Subject<boolean>();
  refreshPanelObservable: Observable<boolean> = this.refreshPanelSubject.asObservable();

  refreshDrawerTransitionSubject: Subject<boolean> = new Subject<boolean>();
  refreshDrawerTransitionObservable: Observable<boolean> = this.refreshDrawerTransitionSubject.asObservable();

  selectInicioItemSideDrawerSubject: Subject<boolean> = new Subject<boolean>();
  selectInicioItemSideDrawerObservable: Observable<boolean> = this.selectInicioItemSideDrawerSubject.asObservable();

  private _sideDrawerTransition: DrawerTransitionBase;

  constructor() {
    // *
  }

  get sideDrawerTransition(): DrawerTransitionBase {
    return this._sideDrawerTransition;
  }

  set sideDrawerTransition(value: DrawerTransitionBase) {
    this._sideDrawerTransition = value;
    this.refreshDrawerTransitionSubject.next(true);
  }

  generateDrawerTransition() {
    this.sideDrawerTransition = new SlideInOnTopTransition();
  }
}
