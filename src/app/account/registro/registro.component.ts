import { Component, OnInit, ViewChild } from "@angular/core";
import { LoginService } from "~/app/core";
import { Register } from "~/app/account/registro/register.service";
import { RouterExtensions } from "nativescript-angular";
import { HttpErrorResponse } from "~/@angular/common/http";
import { EMAIL_ALREADY_USED_TYPE, LOGIN_ALREADY_USED_TYPE } from "~/app/shared/constants/error.constants";
import { Feedback, FeedbackType } from "nativescript-feedback";
import { Color, Page } from "tns-core-modules/ui/page";
import { RadDataFormComponent } from "nativescript-ui-dataform/angular";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import * as utils from "tns-core-modules/utils/utils";
import * as frame from "tns-core-modules/ui/frame";

@Component({
  selector: "ns-registro",
  templateUrl: "./registro.component.html",
  moduleId: module.id
})
export class RegistroComponent implements OnInit {

  confirmPassword: string;
  doNotMatch: string;
  error: string;
  errorEmailExists: string;
  errorUserExists: string;
  registerAccount: RegisterAccount;
  success: boolean;
  feedBack: Feedback;
  loaderView = null;

  formValidacion: boolean = false;

  @ViewChild("dataForm") dataForm: RadDataFormComponent;

  constructor(
    private registrerServicer: Register,
    private routerExtensions: RouterExtensions,
    private loginService: LoginService,
    private page: Page
  ) {
    this.feedBack = new Feedback();
  }

  ngOnInit() {
    this.success = false;

    this.registerAccount = new RegisterAccount("",
      "",
      "",
      "",
      undefined);

    this.page.actionBarHidden = true;
  }

  validarForm(args) {
    this.dataForm.dataForm.validateAll().then((val: boolean) => {
      this.formValidacion = val;
    });
  }

  register() {
    if (this.registerAccount.password !== this.registerAccount.confirmPassword) {
      this.doNotMatch = "ERROR";
      this.feedBack.show({
        message: "La contraseña y su confirmación no coinciden!",
        type: FeedbackType.Error
      });

      // this.snackBar.open("La contraseña y su confirmación no coinciden!");
    } else {
      this.doNotMatch = null;
      this.error = null;
      this.errorUserExists = null;
      this.errorEmailExists = null;
      this.registerAccount.langkey = "en";

      if (this.registerAccount.login) {

        this.showLoaderIndicator();

        this.registrerServicer.save(this.registerAccount).subscribe(
          () => {
            this.success = true;

            const credentials: any = {
              username: this.registerAccount.login,
              password: this.registerAccount.password,
              rememberMe: false
            };

            this.loginService
              .login(credentials)
              .then(
                () => {
                  this.hideLoadingIndicator();
                  this.routerExtensions.navigate(["/profile-details-form"], {
                    transition: {
                      name: "fade"
                    }
                  });
                },
                (reason: any) => {
                  this.hideLoadingIndicator();
                  this.loginService.logout();
                }
              )
              .catch((reason: any) => {
                console.log(reason);
                this.hideLoadingIndicator();
                this.feedBack.show({
                  message: "Error en iniciando sesión. Intenta iniciar sesión.",
                  type: FeedbackType.Error,
                  duration: 5000
                });
              });

            this.hideLoadingIndicator();

            this.feedBack.show({
              message: "Te has registrado a Social. Completa tu Perfil.",
              type: FeedbackType.Success,
              duration: 5000
            });
          },
          (errorResponse) => {
            this.hideLoadingIndicator();
            this.processError(errorResponse);
          }
        );
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

  onNavItemTap(navItemRoute: string): void {
    this.routerExtensions.navigate([navItemRoute], {
      transition: {
        name: "slide"
      }
    });

    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.closeDrawer();
  }

  private processError(errorResponse: HttpErrorResponse) {
    this.success = null;
    if (errorResponse.status === 400 && errorResponse.error.type === LOGIN_ALREADY_USED_TYPE) {
      this.errorUserExists = "ERROR";
      this.feedBack.show({
        message: "Nombre de usuario ya existe! Por favor elige otro",
        type: FeedbackType.Info,
        duration: 5000
      });
    } else if (errorResponse.status === 400 && errorResponse.error.type === EMAIL_ALREADY_USED_TYPE) {
      this.errorEmailExists = "ERROR";
      this.feedBack.show({
        message: "Email ya se encuentra en uso!",
        type: FeedbackType.Info,
        duration: 5000
      });
    } else {
      this.error = "ERROR";
      this.feedBack.show({
        message: "Hubo error en el registro. Por favor intenta luego.",
        type: FeedbackType.Info,
        duration: 5000
      });
    }
  }
}

// tslint:disable-next-line
export class RegisterAccount {
  login: string;
  email: string;
  password: string;
  confirmPassword: string;
  langkey: string;

  constructor(password?: string,
              confirmPassword?: string,
              login?: string,
              email?: string,
              langkey?: string) {
    this.langkey = langkey;
    this.password = password;
    this.confirmPassword = confirmPassword;
    this.login = login;
    this.email = email;
  }

}
