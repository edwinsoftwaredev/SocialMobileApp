import { NativeScriptFormsModule } from "nativescript-angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { ProfileDetailsFormComponent } from "~/app/account/profile-details-form/profile-details-form.component";
import { NativeScriptUIDataFormModule } from "nativescript-ui-dataform/angular";
import {
  ProfileDetailsFormRoutingModule
} from "~/app/account/profile-details-form/profile-details-form-routing.module";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    ProfileDetailsFormRoutingModule,
    NativeScriptFormsModule,
    NativeScriptUIDataFormModule
  ],
  declarations: [
    ProfileDetailsFormComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class ProfileDetailsFormModule { }
