import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";
import { ListadoChatsRoutingModule } from "~/app/listado-chats/listado-chats-routing.module";
import { ListadoChatsComponent } from "~/app/listado-chats/listado-chats.component";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    ListadoChatsRoutingModule,
    NativeScriptUIListViewModule
  ],
  declarations: [
    ListadoChatsComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class ListadoChatsModule {
  // *
}
