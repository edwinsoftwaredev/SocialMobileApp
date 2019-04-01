import { NativeScriptFormsModule } from "nativescript-angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";
import { MuroRoutingModule } from "~/app/muro/muro-routing.module";
import { MuroComponent } from "~/app/muro/muro.component";
import { NewPostModalComponent } from "~/app/new-post-modal/new-post-modal.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        MuroRoutingModule,
        NativeScriptUIListViewModule,
        NativeScriptFormsModule
    ],
    declarations: [
        MuroComponent, NewPostModalComponent
    ],
    entryComponents: [
        NewPostModalComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class MuroModule { }
