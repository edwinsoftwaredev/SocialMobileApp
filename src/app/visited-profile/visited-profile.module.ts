import { NativeScriptFormsModule } from "nativescript-angular";
import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";

import { VisitedProfileRoutingModule } from "~/app/visited-profile/visited-profile-routing.module";
import { VisitedProfileComponent } from "~/app/visited-profile/visited-profile.component";

@NgModule({
  imports: [
    NativeScriptCommonModule,
    VisitedProfileRoutingModule,
    NativeScriptUIListViewModule,
    NativeScriptFormsModule
  ],
  declarations: [
    VisitedProfileComponent
  ],
  schemas: [
    NO_ERRORS_SCHEMA
  ]
})
export class VisitedProfileModule { }
