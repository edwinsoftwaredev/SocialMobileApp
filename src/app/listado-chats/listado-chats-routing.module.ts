import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { ListadoChatsComponent } from "~/app/listado-chats/listado-chats.component";

const routes: Routes = [
  { path: "",
    component: ListadoChatsComponent
  }
];

@NgModule({
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule]
})
export class ListadoChatsRoutingModule { }
