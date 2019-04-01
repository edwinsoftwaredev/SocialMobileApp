import { NativeScriptFormsModule } from "nativescript-angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { AmigosComponent } from "~/app/amigos/amigos.component";
import { AmigosRoutingModule } from "~/app/amigos/amigos-routing.module";
import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    AmigosRoutingModule,
    NativeScriptUIListViewModule,
    NativeScriptFormsModule
  ],
  declarations: [
    AmigosComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class AmigosModule { }
