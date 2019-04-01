import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { SearchBar } from "tns-core-modules/ui/search-bar";
import { IPerfil } from "~/app/muro/muro.component";
import { IUsuario, Usuario } from "~/app/shared/model/usuario.model";
import { IRelacion, Relacion } from "~/app/shared/model/relacion.model";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { Principal, Account } from "~/app/core";
import { RelacionService } from "~/app/entities/relacion/relacion.service";
import { HttpResponse } from "~/@angular/common/http";
import { fromBase64, ImageSource } from "tns-core-modules/image-source";
import { setTimeout, clearTimeout } from "tns-core-modules/timer";
import * as moment from "moment";
import { Subscription } from "rxjs";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import * as utils from "tns-core-modules/utils/utils";
import { ListViewEventData, RadListView } from "nativescript-ui-listview";
import { RouterExtensions } from "nativescript-angular";
import { Color } from "tns-core-modules/color";

@Component({
    selector: "Search",
    moduleId: module.id,
    templateUrl: "./search.component.html"
})
export class SearchComponent implements OnInit {

    searchProfilesSubscription: Subscription;
    filteredProfiles: ObservableArray<IPerfil> = new ObservableArray<IPerfil>([]);

    searchingSpinnerFlag: boolean;
    profiles: Array<IPerfil> = [];
    usuario: IUsuario;
    relaciones: Array<IRelacion> = [];
    solicitudesRecibidas: Array<IRelacion> = [];

    searchPhrase: string;

    idTimeout: number = null;

    @ViewChild("myRadList") myRadList: ElementRef<RadListView>;

    constructor(private usuarioService: UsuarioService,
                private principal: Principal,
                private relacionService: RelacionService,
                private chageDetectionRef: ChangeDetectorRef,
                private routerExtensions: RouterExtensions) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        this.principal.identity().then((account: Account) => {
            this.usuarioService.findUsuario(account.login).subscribe((res: HttpResponse<IUsuario>) => {
                if (res.body) {
                    this.usuario = res.body;
                    this.loadAll();
                }
            });
        });
    }

    loadAll() {
        this.relacionService.findByUsuario(this.usuario.usuario).subscribe((res: HttpResponse<Array<IRelacion>>) => {
            this.relaciones = res.body;

            // this.relaciones contiene las solicitudes enviadas, es decir,
            // aquellas relaciones(registro) con estado = false
            // y tambien contiene aquellas relaciones(registro) donde define que el usuario es amigo de otro
            // es decir, donde el estado es = true
        });

        this.relacionService.findSolicitudesRecibidasByUsuario(this.usuario.id)
          .subscribe((response: HttpResponse<Array<IRelacion>>) => {
            this.solicitudesRecibidas = response.body;

            // obtener amigo del usuario

            this.solicitudesRecibidas = this.solicitudesRecibidas
              .filter((relacion: IRelacion) => relacion.estado === false)
              .map((relacion: IRelacion) => {
                  relacion.usuario.profilePic =
                    this.getSanitizedUrl(relacion.usuario.profilePic, relacion.usuario.profilePicContentType);

                  return relacion;
              });
        });
    }

    _filterProfiles(searchString: string) {
        const filterValue = searchString.toLowerCase().replace(/\s/g, "");

        // llenar el arreglo profiles con los perfiles de la base
        // para lograr un mejor filtrado concatenar el primer segundo nombre y primer segundo apellido sin espacios
        // ejemplo: edwingerardomartinezpaz

        if (searchString.length !== 0) {
            if (this.searchProfilesSubscription) {
                this.searchProfilesSubscription.unsubscribe();
                this.filteredProfiles.splice(0);
                this.profiles.length = 0;
                this.profiles = [];
            }

            this.searchingSpinnerFlag = true;

            this.searchProfilesSubscription = this.usuarioService
              .findUsuarioBySearchString(filterValue)
              .subscribe((response: HttpResponse<Array<IUsuario>>) => {
                  if (response.body) {

                      if (response.body.length === 0) {
                          this.filteredProfiles.splice(0);
                          this.searchingSpinnerFlag = false;
                      }

                      response.body.forEach((usuario: IUsuario) => {
                          if (usuario.id !== this.usuario.id) {
                              this.profiles.push({
                                  firstNameLastName:
                                    usuario.primerNombre +
                                    "" +
                                    (usuario.segundoNombre ? usuario.segundoNombre : "") +
                                    "" +
                                    usuario.primerApellido +
                                    "" +
                                    (usuario.segundoApellido ? usuario.segundoApellido : ""),
                                  firstNameLastNameSpaced:
                                    usuario.primerNombre.trim() +
                                    " " +
                                    (usuario.segundoNombre ? usuario.segundoNombre.trim() : "") +
                                    " " +
                                    usuario.primerApellido.trim() +
                                    " " +
                                    (usuario.segundoApellido ? usuario.segundoApellido.trim() : ""),
                                  usuario: usuario.usuario,
                                  envieSolicitud: false,
                                  envioSolicitud: false,
                                  amigos: false,
                                  profilePicUrlSanitized:
                                    this.getSanitizedUrl(usuario.profilePic, usuario.profilePicContentType),
                                  profilePicContentType: usuario.profilePicContentType,
                                  id: usuario.id
                              });
                          }

                          this.getEstadosBarraBusqueda();
                          // determinar los estados de la relacion del usuarios con los usuarios filtrados
                      });

                      if (this.filteredProfiles.length !== 0) {
                          this.searchingSpinnerFlag = false;
                          this.filteredProfiles.splice(0).push(...this.profiles);
                      } else {
                          this.searchingSpinnerFlag = false;
                          this.filteredProfiles.push(...this.profiles);
                      }

                  } else {
                      if (this.filteredProfiles.length !== 0) {
                          this.filteredProfiles.splice(0);
                          this.searchingSpinnerFlag = false;
                      }
                  }
              }, () => {
                  if (this.filteredProfiles.length !== 0) {
                      this.filteredProfiles.splice(0);
                      this.searchingSpinnerFlag = false;
                  }
              });
        } else {
            if (this.filteredProfiles.length !== 0) {
                this.filteredProfiles.splice(0);
                this.searchingSpinnerFlag = false;
            }
        }
    }

    onSubmit(args) {
        const searchBar = <SearchBar>args.object;

        if (this.idTimeout) {
            clearTimeout(this.idTimeout);
        }

        this.idTimeout = setTimeout(() => {
            // this.chageDetectionRef.markForCheck();
            this._filterProfiles(searchBar.text.toLowerCase());
        }, 1000);
    }

    onTextChanged(args) {
        const searchBar = <SearchBar>args.object;

        if (this.idTimeout) {
            clearTimeout(this.idTimeout);
        }

        this.idTimeout = setTimeout(() => {
            // this.chageDetectionRef.markForCheck();
            this._filterProfiles(searchBar.text.toLowerCase());
        }, 1000);
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    getEstadosBarraBusqueda(): void {
        // determinar si el usuario envio solicitud o si son amigos
        this.profiles.map((perfil: IPerfil) => {
            this.relaciones
              .filter((relacion: IRelacion) => perfil.id === relacion.amigoId)
              .map((relacion: IRelacion) => {
                if (relacion.estado) {
                    perfil.amigos = true;
                } else {
                    perfil.envieSolicitud = true;
                }
            });
        });

        // determinar si al usuario le enviaron solicitud
        // se vuelve a hacer una busqueda de los usuario que ya enviaron una solicitud
        // por ejemplo si los dos usuarios estan conectados al mismos tiempo, si uno envia una solicitud a otro
        // en ese tiempo, en la barra de busqueda del otro usuario debera aparecer que tiene
        // que aceptar la solicitud en lugar
        // de enviar una solicitud

        // ESTA FUNCION DEBERIA DE TENER COMO PARAMETRO LO QUE EL USUARIO VA ESCRIBIENDO EN LA BARRA DE BUSQUEDA
        // PARA HACER RAPIDA LA BUSQUEDA Y NO CARGAR AL CLIENTE

        this.relacionService.findSolicitudesRecibidasByUsuario(this.usuario.id)
          .subscribe((response: HttpResponse<Array<IRelacion>>) => {
            this.solicitudesRecibidas = response.body;

            this.solicitudesRecibidas = this.solicitudesRecibidas
              .filter((relacion: IRelacion) => relacion.estado === false)
              .map((relacion: IRelacion) => {
                  relacion.usuario.profilePic =
                    this.getSanitizedUrl(relacion.usuario.profilePic, relacion.usuario.profilePicContentType);

                  return relacion;
              });

            this.profiles.map((perfil: IPerfil) => {
                this.solicitudesRecibidas
                  .filter((relacion: IRelacion) => perfil.id === relacion.usuario.id && relacion.estado === false)
                  .map((relacion: IRelacion) => {
                      perfil.envioSolicitud = true;
                  });
            });
        });

    }

    onItemSelected(args: ListViewEventData) {
        const selectedItem: IPerfil = this.filteredProfiles.getItem(args.index);

        this.myRadList
          .nativeElement
          .getViewForItem(this.myRadList.nativeElement.getItemAtIndex(args.index))
          .animate({
              backgroundColor: new Color("LightGray"),
              duration: 130
          });

        this.usuarioService.findUsuario(selectedItem.usuario).subscribe((res: HttpResponse<IUsuario>) => {
            res.body.profilePic = this.getSanitizedUrl(res.body.profilePic, res.body.profilePicContentType);

            this.usuarioService.currentVisitedProfile = res.body;

            setTimeout(() => {
                this.myRadList.nativeElement.refresh();
                this.routerExtensions.navigate(["/visited-profile"]);
            }, 50);
        });

    }

    enviarSolicitudBusqueda(perfil: IPerfil) {

        const usuarioIdRelacion: IUsuario = new Usuario(this.usuario.id, this.usuario.usuario);
        const relacionEnvioSolicitud: IRelacion = new Relacion(null, perfil.id, false, moment(), usuarioIdRelacion);

        this.relacionService.create(relacionEnvioSolicitud).subscribe((relacionResponse: HttpResponse<IRelacion>) => {
            perfil.envieSolicitud = true;
            perfil.amigos = false;
            perfil.envioSolicitud = false;

            this.relaciones.push(relacionResponse.body);
        });
    }

    aceptarSolicitudBusqueda(perfil: IPerfil) {

        const usuarioIdRelacion: IUsuario = new Usuario(this.usuario.id, this.usuario.usuario);
        const relacionAceptarSolicitud: IRelacion = new Relacion(null, perfil.id, true, moment(), usuarioIdRelacion);

        this.relacionService.create(relacionAceptarSolicitud).subscribe((relacionResponse: HttpResponse<IRelacion>) => {
            perfil.amigos = true;
            perfil.envioSolicitud = false;
            perfil.envieSolicitud = false;

            this.relaciones.push(relacionResponse.body);

            // aqui se cambia el estado en solicitudesRecibidas que es usado en el panel derecho
            // donde se muestran las solicitudes por aceptar

            const usuario: IUsuario = this.solicitudesRecibidas.splice(
              this.solicitudesRecibidas.indexOf(
                this.solicitudesRecibidas.filter((relacion: IRelacion) => relacion.usuario.id === perfil.id)[0]
              ),
              1
            )[0].usuario;
        });
    }

    goBack() {
        this.routerExtensions.back();
    }

    getSanitizedUrl(file: any, fileContentType: string): ImageSource {
        if (file.toString().charAt(0) === "d") {
            return fromBase64(file.toString().split(",")[1]);
        } else {
            return fromBase64(file);
        }
    }
}
