import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import * as utils from "tns-core-modules/utils/utils";
import { IRelacion, Relacion } from "~/app/shared/model/relacion.model";
import { Principal, Account } from "~/app/core";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { IUsuario, Usuario } from "~/app/shared/model/usuario.model";
import { HttpResponse } from "@angular/common/http";
import { fromBase64, ImageSource } from "tns-core-modules/image-source";
import { RelacionService } from "~/app/entities/relacion/relacion.service";
import * as moment from "moment";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { ListViewEventData, RadListView } from "nativescript-ui-listview";
import { Color } from "tns-core-modules/color";
import { setTimeout } from "tns-core-modules/timer";
import { RouterExtensions } from "nativescript-angular";

@Component({
  selector: "ns-solicitudes",
  templateUrl: "./solicitudes.component.html",
  moduleId: module.id
}) export class SolicitudesComponent implements OnInit {

  solicitudesRecibidas: ObservableArray<IRelacion> = new ObservableArray<IRelacion>([]);
  usuarioSolicitudesEnviadas: ObservableArray<IUsuario> = new ObservableArray<IUsuario>([]);
  usuario: IUsuario = null;

  @ViewChild("myRadListSolicitudes") myRadListSolicitudes: ElementRef<RadListView>;
  @ViewChild("myRadList1Solicitudes") myRadList1Solicitudes: ElementRef<RadListView>;

  constructor(private principal: Principal,
              private usuarioService: UsuarioService,
              private relacionService: RelacionService,
              private routerExtensions: RouterExtensions) {
    // *
  }

  ngOnInit(): void {

    if (app.android) {
      utils.ad.dismissSoftInput(app.android.foregroundActivity);
    } else {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication)
        .keyWindow
        .endEditing(true);
    }

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
    this.relacionService
      .findSolicitudesEnvidasByUsuario(this.usuario.id).subscribe((res: HttpResponse<Array<IUsuario>>) => {
      if (res.body) {
        this.usuarioSolicitudesEnviadas.push(...res.body.map((usuario: IUsuario) => {
          usuario.profilePic = this.getSanitizedUrl(usuario.profilePic, usuario.profilePicContentType);

          return usuario;
        }));
      }
    });

    this.relacionService
      .findSolicitudesRecibidasByUsuario(this.usuario.id).subscribe((response: HttpResponse<Array<IRelacion>>) => {
        response.body.filter((relacion: IRelacion) => relacion.estado === false)
          .map((relacion: IRelacion) => {
            relacion.usuario.profilePic =
            this.getSanitizedUrl(relacion.usuario.profilePic, relacion.usuario.profilePicContentType);

            this.solicitudesRecibidas.push(relacion);
          });
    });
  }

  acertarSolicitudPanel(relacionParam: IRelacion) {
    const usuarioIdRelacion: IUsuario =
      new Usuario(this.usuario.id, this.usuario.usuario);

    const relacionAceptarSolicitud: IRelacion =
      new Relacion(null, relacionParam.usuario.id, true, moment(), usuarioIdRelacion);

    this.relacionService.create(relacionAceptarSolicitud).subscribe((relacionResponse: HttpResponse<IRelacion>) => {
      this.solicitudesRecibidas.splice(this.solicitudesRecibidas.indexOf(relacionParam), 1);
    });
  }

  eliminarSolicitudRecibida(relacion: IRelacion) {
    this.relacionService
      .deleteSolicitudRecibida(relacion.usuario.id, this.usuario.id).subscribe((res: HttpResponse<any>) => {
      this.solicitudesRecibidas.splice(this.solicitudesRecibidas.indexOf(relacion), 1);
      console.log("Se elimino solicitd Recibida");
    });
  }

  eliminarSolicitudEnviada(usuario: IUsuario) {
    this.relacionService.deleteSolicitudEnviada(this.usuario.id, usuario.id).subscribe((res: HttpResponse<any>) => {
      this.usuarioSolicitudesEnviadas.splice(this.usuarioSolicitudesEnviadas.indexOf(usuario), 1);
      console.log("Se elimino solicitud Enviada");
    });
  }

  onItemSelected(args: ListViewEventData) {
    const selectedItem: IRelacion = this.solicitudesRecibidas.getItem(args.index);

    this.myRadListSolicitudes
      .nativeElement
      .getViewForItem(this.myRadListSolicitudes.nativeElement.getItemAtIndex(args.index))
      .animate({
        backgroundColor: new Color("LightGray"),
        duration: 130
      });

    this.usuarioService.findUsuario(selectedItem.usuario.usuario).subscribe((res: HttpResponse<IUsuario>) => {
      res.body.profilePic = this.getSanitizedUrl(res.body.profilePic, res.body.profilePicContentType);

      this.usuarioService.currentVisitedProfile = res.body;

      setTimeout(() => {
        this.myRadListSolicitudes.nativeElement.refresh();
        this.routerExtensions.navigate(["/visited-profile"]);
      }, 50);
    });

  }

  onItemSelected1(args: ListViewEventData) {
    const selectedItem: IUsuario = this.usuarioSolicitudesEnviadas.getItem(args.index);

    this.myRadList1Solicitudes
      .nativeElement
      .getViewForItem(this.myRadList1Solicitudes.nativeElement.getItemAtIndex(args.index))
      .animate({
        backgroundColor: new Color("LightGray"),
        duration: 130
      });

    this.usuarioService.findUsuario(selectedItem.usuario).subscribe((res: HttpResponse<IUsuario>) => {
      res.body.profilePic = this.getSanitizedUrl(res.body.profilePic, res.body.profilePicContentType);

      this.usuarioService.currentVisitedProfile = res.body;

      setTimeout(() => {
        this.myRadList1Solicitudes.nativeElement.refresh();
        this.routerExtensions.navigate(["/visited-profile"]);
      }, 50);
    });

  }

  onPullToRefreshInitiated(args: ListViewEventData) {

    setTimeout(() => {

      this.relacionService
        .findSolicitudesRecibidasByUsuario(this.usuario.id).subscribe((response: HttpResponse<Array<IRelacion>>) => {

          this.solicitudesRecibidas = new ObservableArray<IRelacion>([]);

          response.body.filter((relacion: IRelacion) => relacion.estado === false)
          .map((relacion: IRelacion) => {
            relacion.usuario.profilePic =
              this.getSanitizedUrl(relacion.usuario.profilePic, relacion.usuario.profilePicContentType);

            this.solicitudesRecibidas.push(relacion);
          });
      });

      const listView = args.object;
      listView.notifyPullToRefreshFinished(true);

    }, 200);

  }

  onPullToRefreshInitiated1(args: ListViewEventData) {

    setTimeout(() => {

      this.relacionService
        .findSolicitudesEnvidasByUsuario(this.usuario.id).subscribe((res: HttpResponse<Array<IUsuario>>) => {
        if (res.body) {
          this.usuarioSolicitudesEnviadas = new ObservableArray<IUsuario>([]);

          this.usuarioSolicitudesEnviadas.push(...res.body.map((usuario: IUsuario) => {
            usuario.profilePic = this.getSanitizedUrl(usuario.profilePic, usuario.profilePicContentType);

            return usuario;
          }));
        }
      });

      const listView = args.object;
      listView.notifyPullToRefreshFinished(true);

    }, 200);

  }

  getSanitizedUrl(file: any, fileContentType: string): ImageSource {

    if (file.toString().charAt(0) === "d") {
      return fromBase64(file.toString().split(",")[1]);
    } else {
      return fromBase64(file);
    }
  }

  goBack() {
    this.routerExtensions.back();
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

}
