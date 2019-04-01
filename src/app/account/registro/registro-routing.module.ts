import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { RegistroComponent } from "~/app/account/registro/registro.component";

const routes: Routes = [
  { path: "",
    component: RegistroComponent
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule]
})
export class RegistroRoutingModule {
  // *
}
