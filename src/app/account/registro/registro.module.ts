import { NativeScriptFormsModule } from "nativescript-angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { RegistroComponent } from "~/app/account/registro/registro.component";
import { RegistroRoutingModule } from "~/app/account/registro/registro-routing.module";
import { NativeScriptUIDataFormModule } from "nativescript-ui-dataform/angular";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    RegistroRoutingModule,
    NativeScriptFormsModule,
    NativeScriptUIDataFormModule
  ],
  declarations: [
    RegistroComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class RegistroModule { }
