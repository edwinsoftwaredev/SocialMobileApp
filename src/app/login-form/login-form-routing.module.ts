import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { LoginFormComponent } from "~/app/login-form/login-form.component";

const routes: Routes = [
    { path: "", component: LoginFormComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class LoginFormRoutingModule { }
