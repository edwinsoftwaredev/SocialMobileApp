import { NativeScriptFormsModule } from "nativescript-angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { ChatComponent } from "./chat.component";
import { ChatRoutingModule } from "./chat-routing.module";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    ChatRoutingModule,
    NativeScriptFormsModule
  ],
  declarations: [
    ChatComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class ChatModule { }
