import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";

const routes: Routes = [
    { path: "", redirectTo: "/login", pathMatch: "full" },
    { path: "home", loadChildren: "./home/home.module#HomeModule" },                        // <-- no se usa
    { path: "browse", loadChildren: "./browse/browse.module#BrowseModule" },                // <-- no se usa
    { path: "search", loadChildren: "./search/search.module#SearchModule" },
    { path: "featured", loadChildren: "./featured/featured.module#FeaturedModule" },        // <-- no se usa
    { path: "settings", loadChildren: "./settings/settings.module#SettingsModule" },
    { path: "login", loadChildren: "./login-form/login-form.module#LoginFormModule" },
    { path: "muro", loadChildren: "./muro/muro.module#MuroModule" },
    { path: "registro", loadChildren: "./account/registro/registro.module#RegistroModule" },
    {
        path: "profile-details-form",
        loadChildren: "./account/profile-details-form/profile-details-form.module#ProfileDetailsFormModule"
    },
    {
        path: "listado-chats",
        loadChildren: "./listado-chats/listado-chats.module#ListadoChatsModule"
    },
    { path: "chat", loadChildren: "./chat/chat.module#ChatModule" },
    { path: "amigos", loadChildren: "./amigos/amigos.module#AmigosModule" },
    { path: "visited-profile", loadChildren: "./visited-profile/visited-profile.module#VisitedProfileModule" },
    { path: "visited-profile1", loadChildren: "./visited-profile/visited-profile.module#VisitedProfileModule" },
    { path: "solicitudes", loadChildren: "./solicitudes/solicitudes.module#SolicitudesModule" },
    { path: "password", loadChildren: "./account/password/password.module#PasswordModule" }
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
