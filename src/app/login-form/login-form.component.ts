import { AfterViewInit, Component, OnInit } from "@angular/core";
import { Page, Color } from "tns-core-modules/ui/page";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { RouterExtensions } from "nativescript-angular";
import { LoginService, StateStorageService, Account } from "~/app/core";
import { Router } from "@angular/router";
import * as utils from "tns-core-modules/utils/utils";
import * as frame from "tns-core-modules/ui/frame";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { HttpErrorResponse, HttpResponse } from "~/@angular/common/http";
import { IUsuario } from "~/app/shared/model/usuario.model";
// tslint:disable-next-line
import { getRootView } from "tns-core-modules/application";
import { SecureStorage } from "nativescript-secure-storage";
import { PanelService } from "~/app/shared/panel.service";

@Component({
  selector: "ns-login-form",
  templateUrl: "./login-form.component.html",
  moduleId: module.id
})
export class LoginFormComponent implements OnInit, AfterViewInit {

  authenticationError: boolean;
  password: string;
  rememberMe: boolean;
  username: string;
  credentials: any;
  loaderView = null;
  mostrarFormulario: boolean;

  drawer: RadSideDrawer;

  private secureStorage = new SecureStorage();

  constructor(private page: Page,
              private routerExtensions: RouterExtensions,
              private loginService: LoginService,
              private router: Router,
              private stateStorageService: StateStorageService,
              private usuarioService: UsuarioService,
              private panelService: PanelService) {
  }

  // ejemplos de usos de formularios en nativescript
  // https://github.com/telerik/nativescript-ui-samples-angular/tree/master/dataform

  ngOnInit() {
    this.page.actionBarHidden = true;

    this.mostrarFormulario = false;

    setTimeout(() =>  {
      this.showLoaderIndicator();

      this.secureStorage.get({key: "authenticationToken"}).then((value) => {
        if (value) {
          this.hideLoadingIndicator();
          this.mostrarFormulario = false;
          this.routerExtensions.navigate(["/muro"], {
            transition: {
              name: "fade"
            },
            clearHistory: true
          });
        } else {
          this.mostrarFormulario = true;
          console.log("token no se encuentra");
          this.hideLoadingIndicator();
        }
      }, (err) => {
        this.hideLoadingIndicator();
        console.log("token no se encuentra");
      });

      /*if (typeof this.secureStorage.getSync({key: "authenticationToken"}) !== "undefined"
        && this.secureStorage.getSync({key: "authenticationToken"}) !== null) {
        this.hideLoadingIndicator();
        this.routerExtensions.navigate(["/muro"], {
          transition: {
            name: "fade"
          },
          clearHistory: true
        });
      } else {
        this.hideLoadingIndicator();
      }*/

    }, 300);

  }

  ngAfterViewInit(): void {
    setTimeout(() => {

      this.drawer = <RadSideDrawer>getRootView();
      this.drawer.gesturesEnabled = false;

    }, 100);
  }

  login() {

    this.showLoaderIndicator();

    this.loginService
        .login({
          username: this.username,
          password: this.password,
          rememberMe: this.rememberMe
        })
        .then((account: Account) => {
          this.authenticationError = false;
          /*if (this.router.url === "/register" ||
              /^\/activate\//.test(this.router.url) ||
              /^\/reset\//.test(this.router.url)) {

            this.routerExtensions.navigate(["/muro"]);

          }*/

          /*this.eventManager.broadcast({
            name: "authenticationSuccess",
            content: "Sending Authentication Success"
          });*/

          // previousState was set in the authExpiredInterceptor before being redirected to login modal.
          // since login is succesful, go to stored previousState and clear previousState
          const redirect = this.stateStorageService.getUrl();
          if (redirect) {

            this.stateStorageService.storeUrl(null);
            this.routerExtensions.navigate([redirect], {
              transition: {
                name: "fade"
              },
              clearHistory: true
            });

          } else {

            this.usuarioService.findUsuario(account.login).subscribe((res: HttpResponse<IUsuario>) => {
              if (res.body) {
                this.panelService.generateDrawerTransition();
                this.routerExtensions.navigate(["/muro"], {
                  transition: {
                    name: "fade"
                  },
                  clearHistory: true
                });
              } else {
                this.panelService.sideDrawerTransition = null;
                this.routerExtensions.navigate(["/login"], {
                  transition: {
                    name: "fade"
                  },
                  clearHistory: true
                });
              }

            }, (error: HttpErrorResponse) => {

              if (error.status.toString() === "404") {

                this.panelService.generateDrawerTransition();
                this.routerExtensions.navigate(["/profile-details-form"], {
                  transition: {
                    name: "fade"
                  },
                  clearHistory: true
                });
              } else {
                this.panelService.sideDrawerTransition = null;
                this.routerExtensions.navigate(["/login"], {
                  transition: {
                    name: "fade"
                  },
                  clearHistory: true
                });
              }

            });

          }

          this.hideLoadingIndicator();

        })
        .catch(() => {
          this.authenticationError = true;
          this.hideLoadingIndicator();
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

  onNavItemTap(navItemRoute: string): void {
    this.routerExtensions.navigate([navItemRoute], {
      transition: {
        name: "fade"
      }
    });

    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.closeDrawer();
  }

}
