import {
    ChangeDetectorRef,
    Component,
    OnInit
} from "@angular/core";
import { RouterExtensions } from "nativescript-angular/router";
import { DrawerTransitionBase, RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { LoginService, Principal, Account } from "~/app/core";
import { IUsuario } from "~/app/shared/model/usuario.model";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { HttpResponse } from "@angular/common/http";
import { fromBase64, ImageSource } from "tns-core-modules/image-source";
import { PanelService } from "~/app/shared/panel.service";
import { GestureEventData } from "tns-core-modules/ui/gestures";
import { GridLayout } from "tns-core-modules/ui/layouts/grid-layout";
import { Color, ViewBase } from "tns-core-modules/ui/page";

@Component({
    moduleId: module.id,
    selector: "ns-app",
    templateUrl: "app.component.html"
})
export class AppComponent implements OnInit {
    usuario: IUsuario = null;
    private _sideDrawerTransition: DrawerTransitionBase;
    private picUrl: ImageSource;

    constructor(private routerExtensions: RouterExtensions,
                private loginService: LoginService,
                private principal: Principal,
                private usuarioService: UsuarioService,
                private changeDetectionRef: ChangeDetectorRef,
                private panelSevice: PanelService
    ) {
        // Use the component constructor to inject services.
    }

    ngOnInit(): void {

        this.panelSevice.selectInicioItemSideDrawerObservable.subscribe((val: boolean) => {
            this.selectInicioItem();
        });

        // Se realizaron cambios importantes a este componente
        // lo cambios se realizaron debido a que se agregaron instrucciones
        // de configuracion relacionados a garbage collector(gc).
        // este componente es generado como parte de una plantilla de inicio al momento
        // de generar el proyecto.
        // pero al agregar la configuracion relacionadas a garbage collector para
        // tener una mejor experiencia de usuario, es decir, evitar freeze en el UI,
        // se tuvo que modificar el codigo generado por el CLI de nativeScript
        // para que este componente no presente errores referentes a la configuracion
        // anteriormente mencionada -- ver el archivo package.json.

        // Que se elimino:
        // En app.component.html el componente RadSideDrawer ya no tiene la propiedad
        // que definia el tipo de transicion o animacion del RadSideDrawer.
        // Ahora esta animacion o transicion es definida en el componente del muro
        // cada vez que se hace tap al boton de menu del action bar de dicho componente.

        // Ya no es necesario validar, como se habia generado anteriormente el codigo,
        // la ruta actual para, asi determinar que item de RadListView iba a estar seleccionado.
        // ahora se hace programaticamente ver el metodo onNavItemTap() y el subject y observable
        // del servicio panel.service.ts.

        // Estos cambios se realizaron ya que al agregar la configuracion "markingMode": "none"
        // los objetos que permitian las funcionalidades anteriormente mencionadas eran recolectados
        // por el garbage collector (gb) por lo que se perdia la referencia a los mismos, por lo que,
        // se generaba continuamente el error -- ... try to using a cleared object ...---.

        // en caso de querer ver el codigo anterior ver el historial en GitHub

        this.sideDrawerTransition = null;

        this.panelSevice.refreshPanelObservable.subscribe((val: boolean) =>  {
            this.actualizarPanel();
        });

        this.autheticationState();
    }

    getSanitizedUrl(file: any, fileContentType: string): ImageSource {

        if (file.toString().charAt(0) === "d") {
            return fromBase64(file.toString().split(",")[1]);
        } else {
            return fromBase64(file);
        }

    }

    autheticationState() {
        this.principal.getAuthenticationState().subscribe((account: Account) => {
            if (account) {
                if (account.authorities.indexOf("ROLE_USER") !== -1 && account.login && account.email) {
                    this.usuarioService.findUsuario(account.login).subscribe((res: HttpResponse<IUsuario>) => {
                        this.usuario = res.body;
                        this.picUrl = this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType);
                    });
                }
            }
        });
    }

    actualizarPanel() {
        if (this.principal.isAuthenticated()) {
            this.principal.identity().then((account: Account) => {
                if (typeof account !== "undefined" && account) {
                    this.usuarioService.findUsuario(account.login).subscribe((resUsuario: HttpResponse<IUsuario>) => {
                        if (resUsuario.body) {
                            this.usuario = resUsuario.body;
                            this.picUrl =
                              this.getSanitizedUrl(this.usuario.profilePic, this.usuario.profilePicContentType);
                        }
                    });
                }
            });
        }
    }

    get sideDrawerTransition(): DrawerTransitionBase {
        return this._sideDrawerTransition;
    }

    set sideDrawerTransition(value: DrawerTransitionBase) {
        this._sideDrawerTransition = value;
    }

    selectInicioItem() {
        const inicioItem: GridLayout = (<RadSideDrawer>app.getRootView()).getViewById("inicioItem");

        inicioItem.parentNode.eachChild((child: ViewBase) => {
            if (child.id !== "separador") {
                (<GridLayout>child).style.backgroundColor = new Color("#fafafa");
                (<GridLayout>child).getChildAt(1).style.color = new Color("#708090");
            }

            return true;
        });

        inicioItem.style.backgroundColor = new Color("#30bcff");
        inicioItem.getChildAt(1).style.color = new Color("White");
    }

    onNavItemTap(navItemRoute: string, args: GestureEventData): void {

        (<GridLayout>args.object).parentNode.eachChild((child: ViewBase) => {
            if (child.id !== "separador") {
                (<GridLayout>child).style.backgroundColor = new Color("#fafafa");
                (<GridLayout>child).getChildAt(1).style.color = new Color("#708090");
            }

            return true;
        });

        (<GridLayout>args.object).style.backgroundColor = new Color("#30bcff");
        (<GridLayout>args.object).getChildAt(1).style.color = new Color("White");

        // https://github.com/NativeScript/nativescript-angular/issues/1367

        try {
            this.routerExtensions.navigate([navItemRoute], {
                transition: {
                    name: "slide"
                }
            });
        } catch (e) {
            console.log(e.toString());
        }

        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.closeDrawer();
    }
}
