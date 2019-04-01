import { Injectable } from "@angular/core";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { IFullPost } from "~/app/muro/muro.component";

@Injectable({providedIn: "root"})
export class MuroService {

  private _fullPosts: ObservableArray<IFullPost>;
  private _sourceDataItems: ObservableArray<IFullPost>;

  constructor() {
    this._fullPosts = new ObservableArray<IFullPost>([]);
    this._sourceDataItems = new ObservableArray<IFullPost>([]);
  }

  get sourceDataItems(): ObservableArray<IFullPost> {
    return this._sourceDataItems;
  }

  set sourceDataItems(value: ObservableArray<IFullPost>) {
    this._sourceDataItems = value;
  }

  get fullPosts(): ObservableArray<IFullPost> {
    return this._fullPosts;
  }

  set fullPosts(value: ObservableArray<IFullPost>) {
    this._fullPosts = value;
  }

}
