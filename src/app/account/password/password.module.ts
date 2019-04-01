import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { PasswordRoutingModule } from "~/app/account/password/password-routing.module";
import { NativeScriptFormsModule } from "nativescript-angular";
import { NativeScriptUIDataFormModule } from "nativescript-ui-dataform/angular";
import { PasswordComponent } from "~/app/account/password/password.component";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    PasswordRoutingModule,
    NativeScriptFormsModule,
    NativeScriptUIDataFormModule
  ],
  declarations: [
    PasswordComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class PasswordModule {

}
