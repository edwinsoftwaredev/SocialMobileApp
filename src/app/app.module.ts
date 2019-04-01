import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptUISideDrawerModule } from "nativescript-ui-sidedrawer/angular";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { SocialProjectCoreModule } from "~/app/core";
import { HTTP_INTERCEPTORS } from "@angular/common/http";
import { AuthInterceptor } from "~/app/blocks/interceptor/auth.interceptor";
import { AuthExpiredInterceptor } from "~/app/blocks/interceptor/auth-expired.interceptor";
import { ErrorHandlerInterceptor } from "~/app/blocks/interceptor/errorhandler.interceptor";
import { NotificationInterceptor } from "~/app/blocks/interceptor/notification.interceptor";
import { ModalDialogService } from "nativescript-angular";
import { ModalRootNewPostComponent } from "~/app/new-post-modal/modal-root-new-post/modal-root-new-post.component";

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        AppRoutingModule,
        NativeScriptModule,
        NativeScriptUISideDrawerModule,
        SocialProjectCoreModule
    ],
    entryComponents: [
        ModalRootNewPostComponent
    ],
    declarations: [
        AppComponent, ModalRootNewPostComponent
    ],
    providers: [
        ModalDialogService,
        {
            // este interceptor agregar el jwt a las solicitudes, si la solicitud es null avanza
            // avanza al siguiente interceptor de solicitud HTTP
            provide: HTTP_INTERCEPTORS,
            useClass: AuthInterceptor,
            multi: true
        },
        {
            // este interceptor verifica el http resonse para ver el status si es 401 o unauthrized
            // y enviarlo de nuevo a la pantalla de login
            // si no hay un status 401 avanza al siguiente interceptor
            provide: HTTP_INTERCEPTORS,
            useClass: AuthExpiredInterceptor,
            multi: true
        },
        {
            // si por ejemplo sucede algun error en el servidor como que no se guarde un dato
            // se devolvera algun error de parte del servidor con algun status diferente a 401
            // si eso sucede este interceptor toma ese error y hace el llamado a una funcion para por
            // ejemplo mostrar un error
            provide: HTTP_INTERCEPTORS,
            useClass: ErrorHandlerInterceptor,
            multi: true
        },
        {
            // este es un interceptor de headers que busca un header costumizado por jhipster para
            // mostrar notificiones
            provide: HTTP_INTERCEPTORS,
            useClass: NotificationInterceptor,
            multi: true
        }
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class AppModule { }
