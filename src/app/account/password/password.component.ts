import { Component, OnInit, ViewChild } from "@angular/core";

import { PasswordService } from "./password.service";
import { Principal } from "~/app/core";
import { RadDataFormComponent } from "nativescript-ui-dataform/angular";
import * as app from "tns-core-modules/application";
import * as utils from "tns-core-modules/utils/utils";
import * as frame from "tns-core-modules/ui/frame";
// tslint:disable-next-line
import { Color, Page } from "tns-core-modules/ui/page";
import { Feedback, FeedbackType } from "nativescript-feedback";

@Component({
    selector: "ns-password",
    templateUrl: "./password.component.html",
    moduleId: module.id
})
export class PasswordComponent implements OnInit {
    doNotMatch: string;
    account: any;
    passwordModel: PasswordModel;
    success1: boolean;

    error: string;
    success: string;

    formValidacion: boolean = false;
    loaderView = null;

    feedBack: Feedback;

    @ViewChild("dataForm") dataForm: RadDataFormComponent;

    constructor(private passwordService: PasswordService,
                private principal: Principal,
                private page: Page) {
        this.feedBack = new Feedback();
    }

    ngOnInit() {
      this.page.actionBarHidden = true;

      this.passwordModel = new PasswordModel("", "", "");

      this.success1 = false;
      this.principal.identity().then((account) => {
          this.account = account;
      });
    }

    validarForm(args) {
        this.dataForm.dataForm.validateAll().then((val: boolean) => {
            this.formValidacion = val;
        });
    }

    changePassword() {
        if (this.passwordModel.newPassword !== this.passwordModel.confirmPassword) {
            this.doNotMatch = "ERROR";
            this.feedBack.show({
                message: "Nueva contraseña y su confirmación no coinciden!",
                type: FeedbackType.Warning
            });
        } else {
            this.showLoaderIndicator();
            this.doNotMatch = null;
            this.passwordService.save(this.passwordModel.newPassword, this.passwordModel.currentPassword).subscribe(
                () => {
                    this.success1 = true;
                    this.hideLoadingIndicator();
                    this.feedBack.show({
                        message: "Se cambio la contraseña.",
                        type: FeedbackType.Success,
                        duration: 5000
                    });
                },
                () => {
                    this.success1 = false;
                    this.hideLoadingIndicator();
                    this.feedBack.show({
                        message: "Hubo un error al cambiar la contraseña",
                        type: FeedbackType.Error,
                        duration: 3000
                    });
                }
            );
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
}

// tslint:disable-next-line
export class PasswordModel {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;

    constructor(currentPassword?: string,
                newPassword?: string,
                confirmPassword?: string) {
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
        this.confirmPassword = confirmPassword;
    }
}
