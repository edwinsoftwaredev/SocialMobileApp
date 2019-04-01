import { Component, OnInit, ViewChild } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { IUser, LoginService, Principal, Account } from "~/app/core";
import { RouterExtensions } from "nativescript-angular";
import { IUsuario, Usuario } from "~/app/shared/model/usuario.model";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { HttpResponse } from "~/@angular/common/http";
import * as moment from "moment";
import * as BitmapFactory from "nativescript-bitmap-factory";
import * as imagepicker from "nativescript-imagepicker";
import { ImageAsset } from "tns-core-modules/image-asset";
import { fromAsset, ImageSource } from "tns-core-modules/image-source";
import { RadDataFormComponent } from "nativescript-ui-dataform/angular";
import { decode } from "typescript-base64-arraybuffer";
import { Color, Page } from "tns-core-modules/ui/page";
import * as utils from "tns-core-modules/utils/utils";
import * as frame from "tns-core-modules/ui/frame";
import { SocketService } from "~/app/shared/socket.service";
import { confirm } from "tns-core-modules/ui/dialogs";
import * as platform from "tns-core-modules/platform";
import { PanelService } from "~/app/shared/panel.service";

@Component({
  selector: "ns-profile-details-form",
  templateUrl: "./profile-details-form.component.html",
  moduleId: module.id
})
export class ProfileDetailsFormComponent implements OnInit {

  authenticated: boolean;
  usuarioRegistrado: Account;
  perfil: IUsuario;
  profilePicUrl: string;

  usuarioExiste: boolean;

  fechaNacimiento: Date;

  usuarioForm: UsuarioForm;

  formValidacion: boolean = false;

  loaderView = null;

  @ViewChild("dataForm") dataForm: RadDataFormComponent;

  private imageList: Array<ImageAsset>;

  private imagePickerContext = imagepicker.create({
    mode: "single" // use "multiple" for multiple selection
  });

  constructor(private loginService: LoginService,
              private routerExtensions: RouterExtensions,
              private principal: Principal,
              private usuarioService: UsuarioService,
              private page: Page,
              private socketService: SocketService,
              private panelService: PanelService) {

    setTimeout(() => {

      if (app.android) {
        this.page.on("loaded", (args) => {

          this.page.actionBar.nativeView.clearAnimation();
          const window1 = app.android.startActivity.getWindow();
          window1.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
          page.android.setFitsSystemWindows(true);

          const listener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
            onGlobalLayout: () => {

              // the following lines check if keyboard is shown
              // code taken from https://github.com/NathanaelA/nativescript-keyboardshowing/blob/master/index.js
              const rect = new android.graphics.Rect();
              const window = app.android.foregroundActivity.getWindow();
              app.android.startActivity.getWindow().getDecorView().getWindowVisibleDisplayFrame(rect);
              const rootView = app.getRootView();
              const screenHeight = rootView.getMeasuredHeight();
              const missingSize = screenHeight - rect.bottom;

              if (missingSize > (screenHeight * 0.15)) { // if keyboard is shown
                // the following lines get the statusBarHeight
                // code taken from https://stackoverflow.com/questions/3407256/height-of-status-bar-in-android
                const rectangle = new android.graphics.Rect();
                window.getDecorView().getWindowVisibleDisplayFrame(rectangle);
                const statusBarHeight = rectangle.top;

                this.page.marginTop = - statusBarHeight / platform.screen.mainScreen.scale;

                // remove the listener so that it does not leak
                const viewTreeObserver = rootView.nativeView.getViewTreeObserver();
                viewTreeObserver.removeOnGlobalLayoutListener(listener);
              }
            }
          });

          this.page.android.getViewTreeObserver().addOnGlobalLayoutListener(listener);

        });
      }
    }, 500);

  }

  ngOnInit() {

    if (app.android) {
      utils.ad.dismissSoftInput(app.android.foregroundActivity);
    } else {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication)
        .keyWindow
        .endEditing(true);
    }

    this.page.actionBarHidden = true;

    this.showLoaderIndicator();

    this.authenticated = this.isAuthenticated();

    if (this.authenticated) {

      this.perfil = new Usuario();
      /*this.usuarioForm = new UsuarioForm("",
        "",
        "",
        "",
        "2000-01-01");*/

      this.perfil.profilePic = null;

      this.principal.identity().then((account: Account) => {

        this.usuarioRegistrado = account;

        this.usuarioService.findUsuario(account.login).subscribe((res: HttpResponse<IUsuario>) => {

          if (res.body) {

            this.perfil = res.body;

            this.usuarioForm = new UsuarioForm(this.perfil.primerNombre,
              this.perfil.segundoNombre,
              this.perfil.primerApellido,
              this.perfil.segundoApellido,
              this.perfil.fechaNacimiento.format("YYYY-MM-DD"));

            /*this.usuarioForm.primerNombre = this.perfil.primerNombre;
            this.usuarioForm.segundoNombre = this.perfil.segundoNombre;
            this.usuarioForm.primerApellido = this.perfil.primerApellido;
            this.usuarioForm.segundoApellido = this.perfil.segundoApellido;
            this.usuarioForm.fechaNacimiento = this.perfil.fechaNacimiento.format("YYYY-MM-DD");*/

            this.profilePicUrl =
              this.getSanitizedUrl(this.perfil.profilePic, this.perfil.profilePicContentType);

            if (res.body.actividads) {
              this.perfil.actividads = res.body.actividads;
            } else {
              this.perfil.actividads = [];
            }

            if (res.body.chats) {
              this.perfil.chats = res.body.chats;
            } else {
              this.perfil.chats = [];
            }

            if (res.body.posts) {
              this.perfil.posts = res.body.posts;
            } else {
              this.perfil.posts = [];
            }

            if (res.body.actividads) {
              this.perfil.actividads = res.body.actividads;
            } else {
              this.perfil.actividads = [];
            }

            this.fechaNacimiento = new Date(this.perfil.fechaNacimiento.format("YYYY-MM-DD"));

            this.usuarioExiste = true;

            this.hideLoadingIndicator();

          } else {
            this.perfil.usuario = account.login;
            this.perfil.email = account.email;

            this.usuarioForm = new UsuarioForm("",
              "",
              "",
              "",
              "2000-01-01");

            this.hideLoadingIndicator();
          }

        }, () => {
          this.perfil.usuario = account.login;
          this.perfil.email = account.email;

          this.usuarioForm = new UsuarioForm("",
            "",
            "",
            "",
            "2000-01-01");

          this.hideLoadingIndicator();
        });

        this.perfil.usuario = account.login;
        this.perfil.email = account.email;

        this.hideLoadingIndicator();
      });

      // this.perfil = new Usuario(); // hay que agregar los datos de la pantalla anterior de registro
    } else {
      this.hideLoadingIndicator();
      this.routerExtensions.navigate(["/login"], {
        transition: {
          name: "slide"
        },
        clearHistory: true
      });
      // verificar si es necesaria este codigo
      /*this.routerExtensions.navigate([""]).then((val) => {
        this.routerExtensions.navigate(["/muro"]);
      });*/
    }
  }

  validarForm(args) {
    this.dataForm.dataForm.validateAll().then((val: boolean) => {

      // se valida que tambien se haya agregado la foto de perfil
      if (this.profilePicUrl) {
        this.formValidacion = val;
      } else {
        this.formValidacion = false;
      }

    });
  }

  seleccionarImagenPerfil() {

    if (app.android) {
      utils.ad.dismissSoftInput(app.android.foregroundActivity);
    } else {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication)
        .keyWindow
        .endEditing(true);
    }

    this.imagePickerContext
      .authorize()
      .then(() => {
        return this.imagePickerContext.present();
      })
      .then((selection) => {
        selection.forEach((selected) => {
          // this.showLoaderIndicator();

          // process the selected image
          fromAsset(selected).then((image: ImageSource) => {

            let image2: ImageSource = null;

            const bmp = BitmapFactory.create(image.width, image.height);

            bmp.dispose((bmp1) => {
              bmp1.insert(BitmapFactory.makeMutable(image));

              // una forma de compresion seria decodificar a uint8array ver el tamaños del arreglo
              // y si es mayor a 75000 bytes bajar calidad de la imagen --> hacerlo recursivamente

              let bmp2 = null;

              if (image.height > 400) {
                bmp2 = bmp1.resizeHeight(400);
              }

              if (image.width > 900) {
                bmp2 = bmp1.resizeWidth(900);
              }

              if (image.height <= 400 && image.width <= 900) {
                bmp2 = bmp1;
              }

              image2 = bmp2.toImageSource();

              this.profilePicUrl = "data:" + "image/jpeg;base64," + image2.toBase64String("jpeg", 80);

              this.validarForm(null);

            });
          });
        });
        this.imageList = selection;
      }).catch((e)  => {
      console.log(e);
    });
  }

  deleteProfile() {

    const options = {
      title: "Social",
      message: "¿Estás seguro que deseas eliminar tu perfil de Social?",
      okButtonText: "Sí",
      cancelButtonText: "No"
    };

    confirm(options).then((result: boolean) => {
      if (result) {
        this.socketService.closeStompSocket(false);

        this.usuarioService.delete(this.perfil.id).subscribe((res: HttpResponse<any>) => {
          this.loginService.logout();
          this.routerExtensions.navigate(["/login"], {
            transition: {
              name: "fade"
            },
            clearHistory: true
          });
        });
      }
    });
  }

  guardarPerfil() {

    if (this.usuarioForm.primerNombre) {

      this.showLoaderIndicator();

      this.perfil.primerNombre = this.usuarioForm.primerNombre;
      this.perfil.segundoNombre = this.usuarioForm.segundoNombre;
      this.perfil.primerApellido = this.usuarioForm.primerApellido;
      this.perfil.segundoApellido = this.usuarioForm.segundoApellido;

      this.perfil.fechaNacimiento = moment(this.usuarioForm.fechaNacimiento);

      if (this.profilePicUrl) {
        this.perfil.profilePic = Array.from(decode(this.profilePicUrl.toString().split(",")[1]));
        this.perfil.profilePicContentType = "image/jpeg";
      }

      if (this.usuarioExiste) {

        this.usuarioService.update(this.perfil).subscribe((usuario: HttpResponse<IUsuario>) => {
          this.hideLoadingIndicator();

          this.panelService.refreshPanelSubject.next(true);

          this.routerExtensions.back();
          /*this.routerExtensions.navigate(["/muro"], {
            transition: {
              name: "slide"
            }
          });*/
        }, () => {
          this.showLoaderIndicator();
          this.loginService.logout();

          this.routerExtensions.navigate(["/login"], {
            transition: {
              name: "fade"
            },
            clearHistory: true
          });
        });

        // subject para actualizar sidedrawer

      } else {

        this.perfil.relacions = [];
        this.perfil.posts = [];
        this.perfil.fechaRegistro = moment();
        this.perfil.chats = [];
        this.perfil.actividads = [];

        this.usuarioService.create(this.perfil).subscribe((usuario: HttpResponse<IUsuario>) => {
          this.hideLoadingIndicator();

          this.socketService.usuarioActual = usuario.body.usuario;
          this.socketService.initializeWebSocketConnection();

          this.panelService.refreshPanelSubject.next(true);

          this.routerExtensions.navigate(["/muro"], {
              transition: {
                name: "slide"
              },
              clearHistory: true
          });
        }, () => {
          this.hideLoadingIndicator();
          this.loginService.logout();
          this.routerExtensions.navigate(["/login"], {
            transition: {
              name: "fade"
            },
            clearHistory: true
          });
        });

        // subject para actualizar sidedrawer
      }
    }
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

  cancelar() {
    if (this.usuarioExiste) {
      this.routerExtensions.back();
      /*this.routerExtensions.navigate(["/muro"], {
        transition: {
          name: "slide"
        },
        clearHistory: true
      });*/
    } else {
      this.loginService.logout();
      this.routerExtensions.navigate(["/login"], {
        transition: {
          name: "fade"
        },
        clearHistory: true
      });
    }
  }

  getSanitizedUrl(file: any, fileContentType: string) {
    if (file.toString().charAt(0) === "d") {
      return file.toString();
    } else {
      return "data:" + fileContentType + ";base64," + file;
    }
  }

  logOut() {
    this.loginService.logout();
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.closeDrawer();
    this.routerExtensions.navigate(["/login"], {
      transition: {
        name: "fade"
      },
      clearHistory: true
    });
  }

  isAuthenticated(): boolean {
    return this.principal.isAuthenticated();
  }
}

// tslint:disable-next-line
export class UsuarioForm {

  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;

  constructor(primerNombre: string,
              segundoNombre: string,
              primerApellido: string,
              segundoApellido: string,
              fechaNacimiento: string) {
    this.primerNombre = primerNombre;
    this.segundoNombre = segundoNombre;
    this.primerApellido = primerApellido;
    this.segundoApellido = segundoApellido;
    this.fechaNacimiento = fechaNacimiento;
  }

}
