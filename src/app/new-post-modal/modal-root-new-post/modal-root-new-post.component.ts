import { Component, OnInit } from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { ActivatedRoute } from "@angular/router";

@Component({
  moduleId: module.id,
  templateUrl: "./modal-root-new-post.component.html"
})
export class ModalRootNewPostComponent implements OnInit {
  constructor(
      private _routerExtensions: RouterExtensions,
      private _activeRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this._routerExtensions.navigate(["new-post-modal"], { relativeTo: this._activeRoute });
  }
}
