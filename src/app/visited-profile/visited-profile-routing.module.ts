import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { VisitedProfileComponent } from "~/app/visited-profile/visited-profile.component";

const routes: Routes = [
  { path: "",
    component: VisitedProfileComponent
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule]
})
export class VisitedProfileRoutingModule { }
