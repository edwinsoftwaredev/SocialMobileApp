import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { LoginService } from "~/app/core";
import { RouterExtensions } from "nativescript-angular";
import { PushViewModelService } from "~/app/shared/push-view-model.service";
import * as utils from "tns-core-modules/utils/utils";

@Component({
    selector: "Settings",
    moduleId: module.id,
    templateUrl: "./settings.component.html"
})
export class SettingsComponent implements OnInit {

    constructor(private loginService: LoginService,
                private routerExtensions: RouterExtensions,
                private pushViewModelService: PushViewModelService) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        if (app.android) {
            utils.ad.dismissSoftInput(app.android.foregroundActivity);
        } else {
            utils.ios.getter(UIApplication, UIApplication.sharedApplication)
              .keyWindow
              .endEditing(true);
        }
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }

    disableNotifications() {
        this.pushViewModelService.doUnregisterForPushNotifications();
    }

    changePassword() {
        this.routerExtensions.navigate(["/password"], {
            transition: {
                name: "slide"
            }
        });
    }

    goBack() {
        this.routerExtensions.back();
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
}
