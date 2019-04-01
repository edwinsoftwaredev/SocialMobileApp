import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { PasswordComponent } from "~/app/account/password/password.component";
import { NativeScriptRouterModule } from "nativescript-angular";

const routes: Routes = [
  {
    path: "",
    component: PasswordComponent
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule]
})
export class PasswordRoutingModule {
  
}
