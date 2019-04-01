import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { AmigosComponent } from "~/app/amigos/amigos.component";

const routes: Routes = [
  { path: "",
    component: AmigosComponent
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule]
})
export class AmigosRoutingModule {
  // *
}
