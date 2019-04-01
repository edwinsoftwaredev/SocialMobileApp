import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { SolicitudesComponent } from "~/app/solicitudes/solicitudes.component";
import { NativeScriptRouterModule } from "nativescript-angular/router";

const routes: Routes = [
  {path: "", component: SolicitudesComponent}
];

@NgModule({
    imports: [
      NativeScriptRouterModule.forChild(routes)
    ],
    exports: [
      NativeScriptRouterModule
    ]
}) export class SolicitudesRoutingModule {

}
