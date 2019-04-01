import { Injectable } from "@angular/core";

import { Principal } from "../auth/principal.service";
import { AuthServerProvider } from "../auth/auth-jwt.service";
import { SocketService } from "~/app/shared/socket.service";
import { PanelService } from "~/app/shared/panel.service";
import { setTimeout } from "tns-core-modules/timer";
import { MuroService } from "~/app/muro/muro.service";

@Injectable({ providedIn: "root" })
export class LoginService {
    constructor(private principal: Principal,
                private authServerProvider: AuthServerProvider,
                private socketService: SocketService,
                private panelService: PanelService,
                private muroService: MuroService) {}

    login(credentials, callback?) {

        this.logout();

        let cb = null;

        if (callback) {
            cb = callback;
        } else {
            cb = () => {
                // null
            };
        }

        return new Promise((resolve, reject) => {
            this.authServerProvider.login(credentials).subscribe(
                (data) => {
                    this.principal.identity(true).then((account) => {
                        resolve(account);
                    });

                    return cb();
                },
                (err) => {
                    this.logout();
                    reject(err);

                    return cb(err);
                }
            );
        });
    }

    loginWithToken(jwt, rememberMe) {
        return this.authServerProvider.loginWithToken(jwt, rememberMe);
    }

    logout() {
        this.socketService.closeStompSocket(false);
        this.authServerProvider.logout().subscribe();
        this.principal.authenticate(null);

        setTimeout(() => {
            this.panelService.sideDrawerTransition = null;
            this.muroService.sourceDataItems.length = 0;
            this.muroService.fullPosts.length = 0;
        }, 700);
    }
}
