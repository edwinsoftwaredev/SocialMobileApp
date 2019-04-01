import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import { LoginFormComponent } from "~/app/login-form/login-form.component";
import { LoginFormRoutingModule } from "~/app/login-form/login-form-routing.module";
import { NativeScriptFormsModule } from "nativescript-angular";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        LoginFormRoutingModule,
        NativeScriptFormsModule
    ],
    declarations: [
        LoginFormComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class LoginFormModule { }
