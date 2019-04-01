import { Observable } from "tns-core-modules/data/observable";
import { messaging, Message } from "nativescript-plugin-firebase/messaging";
import { alert, confirm } from "tns-core-modules/ui/dialogs";
import * as platform from "tns-core-modules/platform";
import * as applicationSettings from "tns-core-modules/application-settings";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { DeviceToken, IDeviceToken } from "~/app/shared/model/deviceToken.model";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Principal, Account } from "~/app/core";
import { IUsuario } from "~/app/shared/model/usuario.model";

const getCircularReplacer = () => {
  // tslint:disable-next-line
  const seen = new WeakSet;

  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }

    return value;
  };
};

@Injectable({providedIn: "root"})
export class PushViewModelService extends Observable {

  private static APP_REGISTERED_FOR_NOTIFICATIONS = "APP_REGISTERED_FOR_NOTIFICATIONS";

  private usuario: string;

  constructor(private usuarioService: UsuarioService,
              private principal: Principal) {
    super();
  }

  validateRegistration() {

    this.principal.identity().then((account: Account) => {
      this.usuario = account.login;

      this.usuarioService.findUsuario(this.usuario).subscribe((res: HttpResponse<IUsuario>) => {
        if (res.body) {
          this.usuarioService
            .findUsuarioNotificationToken(res.body.usuario).subscribe((resValue: HttpResponse<Array<IDeviceToken>>) => {

              if (resValue.body.length) {

                messaging.getCurrentPushToken().then((token: string) => {

                  if (token) {

                    // tslint:disable-next-line
                    for (let i = 0; i < resValue.body.length; i++) {
                      if (resValue.body[i].token === token) {
                        // el usuario ya tiene un token
                        break;
                      }

                      if (i === resValue.body.length - 1) {
                        // el usuario no tiene token para este dispositivo
                        // pero ya hay un token en el dispositivo
                        if (!applicationSettings.hasKey("notifications/" + this.usuario) &&
                          !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                          this.addUserToNotificationsApp(token, this.usuario);
                        }
                      }
                    }

                  } else {
                    if (!applicationSettings.getBoolean("notifications/" + this.usuario) &&
                      !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                      this.doRequestConsent();
                    }
                  }

                }, (err) => {
                  console.log(err);
                  if (!applicationSettings.getBoolean("notifications/" + this.usuario) &&
                    !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                    this.doRequestConsent();
                  }
                });

              } else {
                messaging.getCurrentPushToken().then((token: string) => {
                  if (token) {
                    if (!applicationSettings.hasKey("notifications/" + this.usuario) &&
                      !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                      this.addUserToNotificationsApp(token, this.usuario);
                    }
                  } else {
                    if (!applicationSettings.getBoolean("notifications/" + this.usuario) &&
                      !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                      this.doRequestConsent();
                    }
                  }
                }, (err) => {
                  console.log(err);
                  if (!applicationSettings.getBoolean("notifications/" + this.usuario) &&
                    !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                    this.doRequestConsent();
                  }
                });
              }

          }, (err: HttpResponse<any>) => {
            if (err.headers.get("content-length") === "0") {
              messaging.getCurrentPushToken().then((token: string) => {
                if (token) {
                  if (!applicationSettings.hasKey("notifications/" + this.usuario) &&
                    !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                    this.addUserToNotificationsApp(token, this.usuario);
                  }
                } else {
                  if (!applicationSettings.getBoolean("notifications/" + this.usuario) &&
                    !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                    this.doRequestConsent();
                  }
                }
              }, (rejected) => {
                console.log(rejected);
                if (!applicationSettings.getBoolean("notifications/" + this.usuario) &&
                  !applicationSettings.hasKey("noNotification/" + this.usuario)) {
                  this.doRequestConsent();
                }
              });
            }
          });
        }
      }, (err) => {
        console.log("usuario no encontrado en push view model service");
      });

    }, (error) => {
      // do nothing
    });
  }

  addUserToNotificationsApp(token: string, usuario: string) {
    confirm({
      title: "Social te quiere enviar notificaciones",
      message: "¿Estas de acuerdo?",
      okButtonText: "Sí",
      cancelButtonText: "No"
    }).then((pushAllowed) => {
      if (pushAllowed) {
        const deviceToken: DeviceToken = new DeviceToken(null, usuario, token);
        this.usuarioService.createDeviceToken(deviceToken).subscribe((res: HttpResponse<DeviceToken>) => {
          console.log("Se agrego usuario para recibir notificaciones en este dispositivo");
        }, (err) => {
          console.log(err.toString());
        });
        applicationSettings.setBoolean(PushViewModelService.APP_REGISTERED_FOR_NOTIFICATIONS, true);
        applicationSettings.setBoolean("notifications/" + this.usuario, true);
      } else {
        applicationSettings.remove("notifications/" + this.usuario);
        applicationSettings.setBoolean("noNotification/" + this.usuario, true);
      }
    });
  }

  doRequestConsent(): void {
    confirm({
      title: "Social te quiere enviar notificaciones",
      message: "¿Estas de acuerdo?",
      okButtonText: "Sí",
      cancelButtonText: "No"
    }).then((pushAllowed) => {
      if (pushAllowed) {
        applicationSettings.setBoolean(PushViewModelService.APP_REGISTERED_FOR_NOTIFICATIONS, true);
        applicationSettings.setBoolean("notifications/" + this.usuario, true);
        this.doRegisterForPushNotifications();
      } else {
        applicationSettings.remove("notifications/" + this.usuario);
        applicationSettings.setBoolean("noNotification/" + this.usuario, true);
      }
    });
  }

  doUnregisterForPushNotifications(): void {
    confirm({
      title: "Deshabilitar notifiaciones de Social",
      message: "¿Estas de acuerdo?",
      okButtonText: "Sí",
      cancelButtonText: "No"
    }).then((pushAllowed) => {
      if (pushAllowed) {

        messaging.getCurrentPushToken()
          .then((token) => {
            this.usuarioService.findAllUsersByToken(token).subscribe((res: HttpResponse<Array<IDeviceToken>>) => {

              if (res.body.length) {

                if (res.body.length === 1) {
                  // solo hay un usuario registrado. se puede eliminar la suscripcion de notificaciones
                  messaging.unregisterForPushNotifications().then(() => {
                    this.usuarioService
                      .deleteDeviceToken(token, this.usuario).subscribe((resVal: HttpResponse<any>) => {
                      applicationSettings.remove("notifications/" + this.usuario);
                      applicationSettings.setBoolean("noNotification/" + this.usuario, true);
                      console.log("No recibira notificaciones " + resVal.body);
                    });
                  });

                } else {

                  this.usuarioService.deleteDeviceToken(token, this.usuario)
                    .subscribe((resVal1: HttpResponse<any>) => {
                      applicationSettings.remove("notifications/" + this.usuario);
                      applicationSettings.setBoolean("noNotification/" + this.usuario, true);
                      console.log("No recibira notificaciones " + res.body);
                  });

                }

              } else {
                // no hay usuarios con este token
              }
            }, (err) => {
              applicationSettings.remove("notifications/" + this.usuario);
              applicationSettings.setBoolean("noNotification/" + this.usuario, true);
              console.log("el token no tiene dispositivos");
            });
          });
      }
    });
  }

  doRegisterForPushNotifications(): void {
    messaging.registerForPushNotifications({
      onPushTokenReceivedCallback: (token: string): void => {
        console.log("Firebase plugin received a push token: " + token);
        const deviceToken: DeviceToken = new DeviceToken(null, this.usuario, token);
        this.usuarioService.createDeviceToken(deviceToken).subscribe((res: HttpResponse<DeviceToken>) => {
          console.log("se guardo el token del dispositivo");
        }, (err) => {
          console.log(err.toString());
        });
      },
      onMessageReceivedCallback: (message: Message) => {
        console.log("Push message received in push-view-model");
      },
      showNotifications: true,
      showNotificationsWhenInForeground: false
    }).then(() => console.log("Registered for push"));
  }
}
