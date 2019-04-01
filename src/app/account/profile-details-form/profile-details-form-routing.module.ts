import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { ProfileDetailsFormComponent } from "~/app/account/profile-details-form/profile-details-form.component";

const routes: Routes = [
  { path: "",
    component: ProfileDetailsFormComponent
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule]
})
export class ProfileDetailsFormRoutingModule {
  // *
}
