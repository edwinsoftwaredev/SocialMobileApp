import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { IUsuario } from "~/app/shared/model/usuario.model";
import { Principal, Account } from "~/app/core";
import { HttpResponse } from "~/@angular/common/http";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { fromBase64, ImageSource } from "tns-core-modules/image-source";
import { RelacionService } from "~/app/entities/relacion/relacion.service";
import { IRelacion } from "~/app/shared/model/relacion.model";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { ChatService } from "~/app/entities/chat/chat.service";
import { Chat, IChat } from "~/app/shared/model/chat.model";
import { RouterExtensions } from "nativescript-angular";
import * as utils from "tns-core-modules/utils/utils";
import * as frame from "tns-core-modules/ui/frame";
import { Color } from "tns-core-modules/ui/page";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { SearchBar } from "tns-core-modules/ui/search-bar";
import { ListViewEventData, RadListView } from "nativescript-ui-listview";

@Component({
  selector: "ns-amigos",
  templateUrl: "./amigos.component.html",
  moduleId: module.id
})
export class AmigosComponent implements OnInit {

  usuario: IUsuario;
  amigos: Array<IUsuario> = [];
  solicitudesRecibidas: Array<IRelacion> = [];
  usuarioSolicitudesEnviadas: Array<IUsuario> = [];
  spinnerFlag: boolean = false;
  usuariosChat: Array<IChat> = [];
  loaderView = null;
  searchPhrase: string;
  myItems: ObservableArray<IUsuario> = new ObservableArray<IUsuario>();

  @ViewChild("myRadList") myRadList: ElementRef<RadListView>;

  constructor(private principal: Principal,
              private usuarioService: UsuarioService,
              private relacionService: RelacionService,
              private chatService: ChatService,
              private routerExtensions: RouterExtensions) {
    // *
  }

  ngOnInit() {
    this.getUsuario();

    if (app.android) {
      utils.ad.dismissSoftInput(app.android.foregroundActivity);
    } else {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication)
        .keyWindow
        .endEditing(true);
    }
  }

  getUsuario() {
    this.principal.identity().then((account: Account) => {
      this.usuarioService.findUsuario(account.login).subscribe(
        (res: HttpResponse<IUsuario>) => {
          this.usuario = res.body;

          // esto se hace para que al enviar el usuario no se envie un arreglo vacio de
          // actividades sino que vaya el valor sin definirse
          if (this.usuario.actividads.length === 0) {
            this.usuario.actividads = null;
          }

          this.loadAll();
        },
        (res: HttpResponse<any>) => {
          console.log(res.headers.get("content-length") === "0");
        }
      );
    });
  }

  loadAll() {

    this.spinnerFlag = true;

    this.relacionService.findSolicitudesRecibidasByUsuario(this.usuario.id)
      .subscribe((response: HttpResponse<Array<IRelacion>>) => {
        if (response.body.length !== 0) {

          this.solicitudesRecibidas = response.body;

          // obtener amigo del usuario
          this.amigos = this.solicitudesRecibidas
            .filter((relacion: IRelacion) => relacion.estado === true).map((relacion: IRelacion) => {

              // relacion.usuario.profilePic =
              //  this.getSanitizedUrl(relacion.usuario.profilePic, relacion.usuario.profilePicContentType);

              relacion.usuario.profilePic =
                this.getSanitizedUrl(relacion.usuario.profilePic, relacion.usuario.profilePicContentType);

              return relacion.usuario;
            });

          this.spinnerFlag = false;

          this.myItems.push(...this.amigos);

          this.myRadList.nativeElement.resumeUpdates(false);

        } else {
          this.spinnerFlag = false;
        }

      }, () => {
        console.log("Error");
        this.spinnerFlag = false;
      }, () => {
        this.spinnerFlag = false;
      }
    );

  }

  getSanitizedUrl(file: any, fileContentType: string): ImageSource {

    if (file.toString().charAt(0) === "d") {
      return fromBase64(file.toString().split(",")[1]);
    } else {
      return fromBase64(file);
    }

  }

  onTextChanged(args) {
    const searchBar = <SearchBar>args.object;

    if (typeof searchBar.text !== "undefined") {
      const searchValue = searchBar.text.toLowerCase();

      this.myItems = new ObservableArray<IUsuario>();
      if (searchValue !== "") {

        // tslint:disable-next-line
        for (let i = 0; i < this.amigos.length; i++) {
          if ((this.amigos[i].primerNombre.toLowerCase() + " " + this.amigos[i].primerApellido.toLowerCase())
            .includes(searchValue.toLowerCase())) {
            this.myItems.push(this.amigos[i]);
          }
        }
      } else {
        this.myItems = new ObservableArray<IUsuario>();
        this.amigos.forEach((item) => {
          this.myItems.push(item);
        });
      }
    }
  }

  onItemSelected(args: ListViewEventData) {
    const selectedItem: IUsuario = this.myItems.getItem(args.index);

    this.myRadList
      .nativeElement
      .getViewForItem(this.myRadList.nativeElement.getItemAtIndex(args.index))
      .animate({
        backgroundColor: new Color("LightGray"),
        duration: 130
      });

    this.usuarioService.currentVisitedProfile = selectedItem;

    setTimeout(() => {
      this.myRadList.nativeElement.refresh();
      this.routerExtensions.navigate(["/visited-profile"]);
    }, 50);
  }

  onSubmit(args) {
    const searchBar = <SearchBar>args.object;

    if (typeof searchBar.text !== "undefined") {
      const searchValue = searchBar.text.toLowerCase();

      this.myItems = new ObservableArray<IUsuario>();
      if (searchValue !== "") {

        // tslint:disable-next-line
        for (let i = 0; i < this.amigos.length; i++) {
          if ((this.amigos[i].primerNombre.toLowerCase() + " " + this.amigos[i].primerApellido.toLowerCase())
            .includes(searchValue.toLowerCase())) {
            this.myItems.push(this.amigos[i]);
          }
        }
      }
    }
  }

  abrirPanelMensajesAmigos(usuario: IUsuario) {

    this.showLoaderIndicator();

    this.usuarioService.findUsuarioWithChat(this.usuario.id).subscribe((res: HttpResponse<IUsuario>) => {

      if (res.body) {
        this.usuariosChat.push(...res.body.chats.map((chat: IChat) => {
          chat.usuarios
            .filter((usuario1: IUsuario) => usuario1.usuario !== this.usuario.usuario).map((usuario2: IUsuario) => {
            usuario2.profilePic = this.getSanitizedUrl(usuario2.profilePic, usuario2.profilePicContentType);

            return usuario2;
          });

          return chat;
        }));
      }

    }, () => {

      this.hideLoadingIndicator();

    }, () => {

      let usuarioEncontrado = false;
      let chat: IChat = null;

      // tslint:disable-next-line
      for (let i = 0; i < this.usuariosChat.length; i++) {
        if (!usuarioEncontrado) {
          if (this.usuariosChat[i].usuarios
            .findIndex((usr: IUsuario) => usr.usuario === usuario.usuario) !== -1) {
            usuarioEncontrado = true;
            chat = this.usuariosChat[i];
          }
        }
      }

      // se supone que el usuario tuvo que estar en el arreglo para desconectarse
      if (!usuarioEncontrado) {
        chat = new Chat(null,
          null,
          null,
          null,
          [this.usuario, usuario], false);
        // this.usuariosChat.push(chat);
      }

      this.chatService.usuarioSeleccionado = usuario;
      this.chatService.chatSeleccionado = chat;
      this.chatService.usuarioActual = this.usuario;

      this.hideLoadingIndicator();

      this.routerExtensions.navigate(["/chat"]);

    });
  }

  eliminarAmigo(usuario: IUsuario) {
    this.relacionService.deleteAmigo(usuario.id, this.usuario.id).subscribe((res: HttpResponse<any>) => {
      this.myItems.splice(this.myItems.indexOf(usuario), 1);
      console.log("Amigo Eliminado");
    });
  }

  showLoaderIndicator() {

    if (this.loaderView) {
      return;
    }

    if (!app.android) {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication).beginIgnoringInteractionEvents();

      const currentView = frame.topmost().ios.controller.view;
      this.loaderView = UIView.alloc().initWithFrame(CGRectMake(0, 0, 90, 90));
      this.loaderView.center = currentView.center;
      this.loaderView.layer.cornerRadius = 4;
      this.loaderView.backgroundColor = new Color("#CC000000").ios;

      const indicator =
        UIActivityIndicatorView.alloc().initWithActivityIndicatorStyle(UIActivityIndicatorViewStyle.WhiteLarge);
      indicator.center = CGPointMake(45, 45);

      this.loaderView.addSubview(indicator);
      currentView.addSubview(this.loaderView);

      indicator.startAnimating();
    } else {
      this.loaderView = android.app.ProgressDialog.show(app.android.foregroundActivity,
        "",
        "Loading...");
    }

  }

  hideLoadingIndicator() {
    if (!this.loaderView) {
      return;
    }

    if (!app.android) {
      this.loaderView.removeFromSuperview();
      utils.ios.getter(UIApplication, UIApplication.sharedApplication).endIgnoringInteractionEvents();
    }

    if (app.android) {
      this.loaderView.dismiss();
    }

    this.loaderView = null;
  }

  goBack() {
    this.routerExtensions.back();
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }

}
