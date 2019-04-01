import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { MuroComponent } from "~/app/muro/muro.component";
import { NewPostModalComponent } from "~/app/new-post-modal/new-post-modal.component";

const routes: Routes = [
    { path: "",
      component: MuroComponent,
      children: [
          {
              path: "new-post-modal", component: NewPostModalComponent
          }
      ]
    }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class MuroRoutingModule { }
