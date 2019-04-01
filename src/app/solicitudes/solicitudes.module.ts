import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { SolicitudesComponent } from "~/app/solicitudes/solicitudes.component";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { SolicitudesRoutingModule } from "~/app/solicitudes/solicitudes-routing.module";
import { NativeScriptFormsModule } from "nativescript-angular";

import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";

@NgModule({
  declarations: [
    SolicitudesComponent
  ],
  imports: [
    NativeScriptCommonModule,
    SolicitudesRoutingModule,
    NativeScriptFormsModule,
    NativeScriptUIListViewModule
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
}) export class SolicitudesModule {
  // *
}
