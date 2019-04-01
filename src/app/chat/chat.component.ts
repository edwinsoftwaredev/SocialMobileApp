import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ChatService } from "~/app/entities/chat/chat.service";
import { IUsuario, Usuario } from "~/app/shared/model/usuario.model";
import { Chat, IChat } from "~/app/shared/model/chat.model";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { fromBase64, fromResource, ImageSource } from "tns-core-modules/image-source";
import { SocketService } from "~/app/shared/socket.service";
import { HttpResponse } from "~/@angular/common/http";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { IMessage, Message } from "~/app/shared/model/message.model";
import { IMensaje, Mensaje } from "~/app/shared/model/mensaje.model";
import { MensajeService } from "~/app/entities/mensaje/mensaje.service";
import * as moment from "moment";
import { Subscription } from "rxjs";
import { Color, Page } from "tns-core-modules/ui/page";
import { ListView } from "tns-core-modules/ui/list-view";
// tslint:disable-next-line
import { AndroidApplication, AndroidActivityEventData} from "tns-core-modules/application";
import * as utils from "tns-core-modules/utils/utils";
import { GridLayout } from "tns-core-modules/ui/layouts/grid-layout";
import { TextField } from "tns-core-modules/ui/text-field";
import { RouterExtensions } from "nativescript-angular";
import * as platform from "tns-core-modules/platform";
import { setTimeout } from "tns-core-modules/timer";

@Component({
  selector: "ns-chat",
  templateUrl: "./chat.component.html",
  moduleId: module.id
})
export class ChatComponent implements OnInit, OnDestroy {

  usuarioConectado: IUsuario;
  usuarioActual: IUsuario;
  chat: IChat;
  chatId: number = null;
  usuariosSinLeer: Array<string> = [];

  cargandoMensajes: boolean = false;
  usuariosChat: Array<IChat> = [];
  paginaMensajes = 0;
  masMensajes = true;
  mensajes: Array<IMessage> = [];
  mensajeAnterior: IMessage = null;

  suscriptionConnectingMessage: Subscription;
  suscDesconexionMessage: Subscription;
  suscMensageMessage: Subscription;
  actualChatIdSubscription: Subscription;
  destroyChatSubscription: Subscription;

  abierto: boolean = false;
  primerCargaFlag: boolean = true;

  msgInput: string;

  softInputVisible: boolean;

  appPaused: boolean = false;

  listener: android.view.ViewTreeObserver.OnGlobalLayoutListener;

  @ViewChild("mensajesListView") mensajesListView: ElementRef;
  @ViewChild("myTextField") myTextField: ElementRef<TextField>;

  constructor(private chatService: ChatService,
              private socketService: SocketService,
              private ngZone: NgZone,
              private changeDetectionRef: ChangeDetectorRef,
              private usuarioService: UsuarioService,
              private mensajeService: MensajeService,
              private page: Page,
              private routerExtensions: RouterExtensions) {

    if (app.android) {

      app.android.on(AndroidApplication.activityResumedEvent, (args: AndroidActivityEventData) => {
        setTimeout(() => {
          this.appPaused = false;

          if (this.softInputVisible) {
            this.myTextField.nativeElement.focus();
          }
        }, 200);
      });

      app.android.on(AndroidApplication.activityPausedEvent, (args: AndroidActivityEventData) => {
        if (this.softInputVisible) {
          this.appPaused = true;
          setTimeout(() => {
            this.softInputVisible = true;
          }, 600);
        }
      });

    }

    this.usuarioConectado = this.chatService.usuarioSeleccionado;
    this.usuarioActual = this.chatService.usuarioActual;

    if (!this.usuarioActual.chats) {
      this.usuarioActual.chats = undefined;
    }

    if (!this.usuarioConectado.chats) {
      this.usuarioConectado.chats = undefined;
    }

    this.chat = this.chatService.chatSeleccionado;

    if (app.android) {

      this.page.on("loaded", (args) => {

        setTimeout(() => {
          this.page.actionBar.nativeView.clearAnimation();
          const window1 = app.android.foregroundActivity.getWindow();
          window1.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
          this.page.android.setFitsSystemWindows(true);

          this.listener = new android.view.ViewTreeObserver.OnGlobalLayoutListener({
            onGlobalLayout: () => {

              // the following lines check if keyboard is shown
              // code taken from https://github.com/NathanaelA/nativescript-keyboardshowing/blob/master/index.js
              const rect = new android.graphics.Rect();
              const window = app.android.foregroundActivity.getWindow();
              app.android.foregroundActivity.getWindow().getDecorView().getWindowVisibleDisplayFrame(rect);
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
                viewTreeObserver.removeOnGlobalLayoutListener(this.listener);
              }
            }
          });

          this.page.android.getViewTreeObserver().addOnGlobalLayoutListener(this.listener);

        }, 500);

      });
    }

  }

  onFocus(args) {
    this.softInputVisible = true;
  }

  onBlur(args) {
    this.myTextField.nativeElement.android.clearFocus();
    this.softInputVisible = false;
  }

  ngOnDestroy(): void {

    // se elimina este listener, si existe, cuando por ejemplo hay un evento de goBack
    // con el boton de regresar de android

    // remove the listener so that it does not leak
    if (app.android) {
      try {

        setTimeout(() => {
          const viewTreeObserver =
            app.android.foregroundActivity.getWindow().getDecorView().getRootView().getViewTreeObserver();
          viewTreeObserver.removeOnGlobalLayoutListener(this.listener);

          this.suscriptionConnectingMessage.unsubscribe();
          this.suscDesconexionMessage.unsubscribe();
          this.suscMensageMessage.unsubscribe();
          this.actualChatIdSubscription.unsubscribe();
          this.destroyChatSubscription.unsubscribe();
        }, 500);

      } catch (e) {
        console.log(e);
      }
    }
  }

  ngOnInit() {

    (<ListView>this.mensajesListView.nativeElement).separatorColor = new Color("#d3d3d3");

    this.abierto = true;

    if (this.chat.id !== null && typeof this.chat !== "undefined") {
      this.chatId = this.chat.id;
    }

    // this.changeDetectionRef.markForCheck();

    this.getChats();

    this.usuariosSinLeer = this.socketService.usuariosSinLeer;
    this.primerCargaFlag = true;
    this.cargarMensajesAnteriores();
    this.getMessages();
  }

  getChats(): void {
    this.usuarioService.findUsuarioWithChat(this.usuarioActual.id).subscribe((res: HttpResponse<IUsuario>) => {
      if (res.body) {
        this.usuariosChat = res.body.chats;

        this.chat = this.usuariosChat.filter((chat: IChat) => {
          return chat.usuarios
            .map((usuario: IUsuario) => {
              return usuario.usuario === this.usuarioConectado.usuario;
            })
            .filter((val: boolean) => val)[0];
        })[0];

        // this.changeDetectionRef.markForCheck();

        if (typeof this.chat !== "undefined" && this.chat !== null) {
          this.chatId = this.chat.id;
          // this.changeDetectionRef.markForCheck();
        } else {
          this.chat = new Chat(null, null, null, null, [this.usuarioActual, this.usuarioConectado], false);

          this.usuariosChat.push(this.chat);

          // this.changeDetectionRef.markForCheck();
        }

        // usuarios que se conectaron -- sacar solo los que no tiene chat
        this.socketService.connectedMessages.map((message: IMessage) => {
          let usuarioEncontrado = false;

          // tslint:disable-next-line
          for (let i = 0; i < this.usuariosChat.length; i++) {
            if (!usuarioEncontrado) {
              if (
                this.usuariosChat[i].usuarios
                  .findIndex((usuario: IUsuario) => usuario.usuario === message.from.usuario) !== -1
              ) {
                usuarioEncontrado = true;

                this.usuariosChat[i].status = true;
                // this.changeDetectionRef.markForCheck();
              }
            }
          }

          if (!usuarioEncontrado) {
            this.usuariosChat.push(new Chat(null, null, null, null, [this.usuarioActual, message.from], true));
            // this.changeDetectionRef.markForCheck();
          }

          usuarioEncontrado = false;
        });
      }
    });
  }

  cargarMensajesAnteriores() {
    if (this.chatId !== null) {
      this.cargandoMensajes = true;
      // this.changeDetectionRef.markForCheck();

      this.mensajeService
        .findMensajesGuardados(this.chatId, this.paginaMensajes, 10).subscribe((res: HttpResponse<Array<IMensaje>>) => {
        if (!res.body || res.body.length === 0) {
          this.masMensajes = false;
        }

        // this.changeDetectionRef.markForCheck();

        if (res.body) {
          res.body.map((mensaje: IMensaje) => {
            const message: IMessage = new Message(
              mensaje.usuario.usuario === this.usuarioActual.usuario ? this.usuarioActual : mensaje.usuario,
              mensaje.texto,
              mensaje.usuario.usuario === this.usuarioActual.usuario
                ? this.usuarioConectado.usuario
                : this.usuarioActual.usuario,
              mensaje.fechaCreacion,
              false,
              false,
              false,
              true,
              mensaje.chat,
              mensaje
            );

            if (message.from.usuario === this.usuarioConectado.usuario) {
              message.from.profilePic =
                this.getSanitizedUrl(message.from.profilePic, message.from.profilePicContentType);
            }

            this.mensajes.unshift(message);
            (<ListView>this.mensajesListView.nativeElement).refresh();

            // separador
            // se elimina marcador anterior con la misma fecha del mensaje entrante
            if (
              this.mensajes.findIndex((msg: IMessage) => {
                if (msg.from.usuario === this.usuarioActual.usuario && msg.to === this.usuarioActual.usuario) {
                  if (
                    msg.from.usuario === this.usuarioActual.usuario &&
                    msg.to === this.usuarioActual.usuario &&
                    moment(mensaje.fechaCreacion)
                      .subtract(12, "hours")
                      .format("dddd, MMMM Do YYYY") === msg.text
                  ) {
                    return true;
                  } else {
                    return false;
                  }
                } else {
                  return false;
                }
              }) !== -1
            ) {
              this.mensajes.splice(
                this.mensajes.findIndex((msg: IMessage) => {
                  if (msg.from.usuario === this.usuarioActual.usuario && msg.to === this.usuarioActual.usuario) {
                    if (
                      msg.from.usuario === this.usuarioActual.usuario &&
                      msg.to === this.usuarioActual.usuario &&
                      moment(mensaje.fechaCreacion)
                        .subtract(12, "hours")
                        .format("dddd, MMMM Do YYYY") === msg.text
                    ) {
                      return true;
                    } else {
                      return false;
                    }
                  } else {
                    return false;
                  }
                }),
                1
              );
            }

            if (this.mensajeAnterior === null) {
              this.mensajes.unshift(
                new Message(
                  this.usuarioActual,
                  moment(mensaje.fechaCreacion)
                    .subtract(12, "hours")
                    .format("dddd, MMMM Do YYYY"),
                  this.usuarioActual.usuario,
                  mensaje.fechaCreacion,
                  false,
                  false,
                  false,
                  false,
                  mensaje.chat,
                  mensaje
                )
              );

              (<ListView>this.mensajesListView.nativeElement).refresh();
              // this.changeDetectionRef.markForCheck();
            } else {
              this.mensajes.unshift(
                new Message(
                  this.usuarioActual,
                  moment(mensaje.fechaCreacion)
                    .subtract(12, "hours")
                    .format("dddd, MMMM Do YYYY"),
                  this.usuarioActual.usuario,
                  mensaje.fechaCreacion,
                  false,
                  false,
                  false,
                  false,
                  mensaje.chat,
                  mensaje
                )
              );

              (<ListView>this.mensajesListView.nativeElement).refresh();
              // this.changeDetectionRef.markForCheck();
            }

            // no repetir imagen de perfil en chat
            if (this.mensajes.length > 2) {
              if (this.mensajes[1].from.usuario === this.usuarioConectado.usuario &&
                this.mensajes[2].from.usuario === this.usuarioConectado.usuario) {
                this.mensajes[2].from.profilePic = fromResource("transparent_background");
                (<ListView>this.mensajesListView.nativeElement).refresh();
              }
            }

            this.mensajeAnterior = message;
          });

          this.cargandoMensajes = false;
          (<ListView>this.mensajesListView.nativeElement).refresh();
          // this.changeDetectionRef.markForCheck();

          // si es la primera carga de mensajes se hace scroll hasta el fondo
          // sino entoces se hace scroll hasta el primer elemento del arreglo de mensajes
          // esto es si el usuario desea cargar mensajes anteriores
          if (this.primerCargaFlag) {
            this.primerCargaFlag = false;
            if (app.android) {
              (<ListView>this.mensajesListView.nativeElement).refresh();
              // this.changeDetectionRef.markForCheck();
              (<ListView>this.mensajesListView.nativeElement).android.smoothScrollToPosition(this.mensajes.length - 1);
              (<ListView>this.mensajesListView.nativeElement).refresh();
              // this.changeDetectionRef.markForCheck();
            } else {
              (<ListView>this.mensajesListView.nativeElement).ios.scrollToRowAtIndexPathAtScrollPositionAnimated(
                NSIndexPath.indexPathForItemInSection(this.mensajes.length - 1, 0),
                UITableViewScrollPosition.Top,
                true
              );
              (<ListView>this.mensajesListView.nativeElement).refresh();
              // this.changeDetectionRef.markForCheck();
            }
          } else {
            (<ListView>this.mensajesListView.nativeElement).refresh();
            // this.changeDetectionRef.markForCheck();
            if (!(<ListView>this.mensajesListView.nativeElement).isItemAtIndexVisible(this.mensajes.length - 1)) {
              if (app.android) {
                (<ListView>this.mensajesListView.nativeElement).android.smoothScrollToPosition(0);
                (<ListView>this.mensajesListView.nativeElement).refresh();
                // this.changeDetectionRef.markForCheck();
              } else {
                (<ListView>this.mensajesListView.nativeElement).ios.scrollToRowAtIndexPathAtScrollPositionAnimated(
                  NSIndexPath.indexPathForItemInSection(0, 0),
                  UITableViewScrollPosition.Top,
                  true
                );
                (<ListView>this.mensajesListView.nativeElement).refresh();
                // this.changeDetectionRef.markForCheck();
              }
            }
          }
        } else if (res.body.length === 0) {
          this.masMensajes = false;
          if (this.mensajes.length) {
            (<ListView>this.mensajesListView.nativeElement).refresh();
          }
          // this.changeDetectionRef.markForCheck();
        }
      }, () => {
          this.masMensajes = false;
          this.cargandoMensajes = false;
        }, () => {
          this.cargandoMensajes = false;
        }
      );

      this.paginaMensajes++;

      if (this.mensajes.length) {
        (<ListView>this.mensajesListView.nativeElement).refresh();
      }
      // this.changeDetectionRef.markForCheck();
    }
  }

  getMessages(): void {
    this.socketService.removeUsuarioSinLeer(this.usuarioConectado.usuario);
    // this.changeDetectionRef.markForCheck();

    this.actualChatIdSubscription = this.socketService.actualChatIdObservable.subscribe((msg: IMessage) => {
      this.chatId = msg.chat.id;
      // this.changeDetectionRef.markForCheck();
    });

    this.suscriptionConnectingMessage = this.socketService.connectingMessage.subscribe((message: IMessage) => {
      let usuarioEncontrado = false;

      // tslint:disable-next-line
      for (let i = 0; i < this.usuariosChat.length; i++) {
        if (!usuarioEncontrado) {
          if (this.usuariosChat[i].usuarios
            .findIndex((usuario: IUsuario) => usuario.usuario === message.from.usuario) !== -1) {
            usuarioEncontrado = true;

            this.usuariosChat[i].status = true;
            // this.changeDetectionRef.markForCheck();
          }
        }
      }

      if (!usuarioEncontrado) {
        this.usuariosChat.push(new Chat(null, null, null, null, [this.usuarioActual, message.from], true));
        // this.changeDetectionRef.markForCheck();
      }

      usuarioEncontrado = false;
    });

    this.suscDesconexionMessage = this.socketService.desconexionMessage.subscribe((message: IMessage) => {
      let usuarioEncontrado = false;

      // tslint:disable-next-line
      for (let i = 0; i < this.usuariosChat.length; i++) {
        if (!usuarioEncontrado) {
          if (this.usuariosChat[i].usuarios
            .findIndex((usuario: IUsuario) => usuario.usuario === message.from.usuario) !== -1) {
            usuarioEncontrado = true;
            this.usuariosChat[i].status = false;
            // this.changeDetectionRef.markForCheck();
          }
        }
      }

      usuarioEncontrado = false;
    });

    this.destroyChatSubscription = this.socketService.destruirChatObservable.subscribe((id: string) => {
      if (this.chatId.toString() === id) {
        this.closeChat();
        // this.changeDetectionRef.markForCheck();
      } else {
        this.usuariosChat =
          this.usuariosChat.filter((value: IChat) => value.id.toString() !== id);
        this.changeDetectionRef.markForCheck();
      }
    });

    this.socketService.chatMessages
      .filter((message: IMessage) => message.from.usuario !== this.usuarioConectado.usuario)
      .map((message: IMessage) => {
        return message;
      });

    this.suscMensageMessage = this.socketService.mensageMessage.subscribe((message: IMessage) => {
      if (
        (message.from.usuario === this.usuarioConectado.usuario && message.to === this.usuarioActual.usuario) ||
        (message.from.usuario === this.usuarioActual.usuario && message.to === this.usuarioConectado.usuario)
      ) {
        if (this.abierto) {
          this.socketService.removeUsuarioSinLeer(this.usuarioConectado.usuario);
          // this.changeDetectionRef.markForCheck();
        }

        if (message.chat.id !== null) {
          let usuarioEncontrado = false;

          // tslint:disable-next-line
          for (let i = 0; i < this.usuariosChat.length; i++) {
            if (!usuarioEncontrado) {
              if (
                this.usuariosChat[i].usuarios
                  .findIndex((usuario: IUsuario) => usuario.usuario === message.from.usuario) !== -1
              ) {
                usuarioEncontrado = true;
                this.usuariosChat[i].id = message.chat.id;
                this.usuariosChat[i].status = message.chat.status;
                this.usuariosChat[i].ultimaVezVisto = message.chat.ultimaVezVisto;
              }
            }

            // this.changeDetectionRef.markForCheck();
          }

          usuarioEncontrado = false;

          this.chat.id = message.chat.id;
          this.chat.status = message.chat.status;
          this.chat.ultimaVezVisto = message.chat.ultimaVezVisto;

          this.chatId = this.chat.id;
          // this.changeDetectionRef.markForCheck();
        }

        // se valida que el item del listview este visible
        // si esta visible se inserta el mensaje y luego se hace scroll hasta el mensaje
        // si no esta visible es porque se estan viendo mensajes bastantes anteriores y
        // solamente se se insertara el mensaje en el arreglo sin hacer scroll para no perder
        // visibilidad de los mensajes anteriores

        (<ListView>this.mensajesListView.nativeElement).refresh();
        // this.changeDetectionRef.markForCheck();

        try {

          if (!this.appPaused) {

            console.log("appActive");

            setTimeout(() => {
              if ((<ListView>this.mensajesListView.nativeElement).isItemAtIndexVisible(this.mensajes.length - 1)) {

                if (this.mensajes.length > 0) {

                  if (this.mensajes[this.mensajes.length - 1].from.usuario === this.usuarioConectado.usuario) {
                    message.from.profilePic = fromResource("transparent_background");
                    this.mensajes.push(message);
                  } else {
                    message.from.profilePic =
                      this.getSanitizedUrl(message.from.profilePic, message.from.profilePicContentType);
                    this.mensajes.push(message);
                  }

                } else {
                  message.from.profilePic =
                    this.getSanitizedUrl(message.from.profilePic, message.from.profilePicContentType);
                  this.mensajes.push(message);
                }

                if (app.android) {
                  (<ListView>this.mensajesListView.nativeElement)
                    .android
                    .smoothScrollToPosition(this.mensajes.length - 1);
                  (<ListView>this.mensajesListView.nativeElement).refresh();
                  // this.changeDetectionRef.markForCheck();
                } else {
                  (<ListView>this.mensajesListView.nativeElement).ios.scrollToRowAtIndexPathAtScrollPositionAnimated(
                    NSIndexPath.indexPathForItemInSection(this.mensajes.length - 1, 0),
                    UITableViewScrollPosition.Top,
                    true
                  );
                  (<ListView>this.mensajesListView.nativeElement).refresh();
                  // this.changeDetectionRef.markForCheck();
                }
              } else {
                message.from.profilePic =
                  this.getSanitizedUrl(message.from.profilePic, message.from.profilePicContentType);
                this.mensajes.push(message);
                (<ListView>this.mensajesListView.nativeElement).refresh();
                // this.changeDetectionRef.markForCheck();
              }
            }, 500);

          } else {
            console.log("appPaused");

            message.from.profilePic =
              this.getSanitizedUrl(message.from.profilePic, message.from.profilePicContentType);
            this.mensajes.push(message);
            (<ListView>this.mensajesListView.nativeElement).refresh();
          }

        } catch (e) {
          console.log(e.toString());
        }

        // this.changeDetectionRef.markForCheck();
      } else if (message.from.usuario !== this.usuarioActual.usuario) {
        (<ListView>this.mensajesListView.nativeElement).refresh();
        // this.changeDetectionRef.markForCheck();
      }
    });
  }

  closeChat() {
    this.ngZone.run(() => {
      this.routerExtensions.back();
    });

    /*this.routerExtensions.navigate(["/chat"], {
      transition: {
        name: "fade"
      }
    });*/
  }

  sendMsg() {
    if (typeof this.msgInput !== "undefined") {
      if (this.msgInput.length !== 0) {
        const chat: IChat = new Chat(this.chatId);

        const usuarioActualSend =
          new Usuario(
            this.usuarioActual.id,
            this.usuarioActual.usuario,
            this.usuarioActual.primerNombre,
            this.usuarioActual.segundoNombre,
            this.usuarioActual.primerApellido,
            this.usuarioActual.segundoApellido,
            this.usuarioActual.email,
            this.usuarioActual.fechaNacimiento,
            this.usuarioActual.fechaRegistro,
            this.usuarioActual.profilePicContentType,
            this.usuarioActual.profilePic,
            null,
            null,
            this.usuarioActual.chats,
            null
          );

        usuarioActualSend.chats = undefined;
        usuarioActualSend.actividads = undefined;

        const messageToSend: Message = new Message(
          usuarioActualSend,
          this.msgInput,
          this.usuarioConectado.usuario,
          moment(),
          false,
          false,
          false,
          true,
          chat,
          new Mensaje(null, this.msgInput, moment(), chat, usuarioActualSend)
        );

        this.mensajes.push(messageToSend);
        (<ListView>this.mensajesListView.nativeElement).refresh();
        // this.changeDetectionRef.markForCheck();

        if (app.android) {
          (<ListView>this.mensajesListView.nativeElement).scrollToIndex(this.mensajes.length - 1);
          (<ListView>this.mensajesListView.nativeElement).android.smoothScrollToPosition(this.mensajes.length - 1);
          (<ListView>this.mensajesListView.nativeElement).refresh();
          // this.changeDetectionRef.markForCheck();
        } else {
          (<ListView>this.mensajesListView.nativeElement).scrollToIndex(this.mensajes.length - 1);
          (<ListView>this.mensajesListView.nativeElement).ios.scrollToRowAtIndexPathAtScrollPositionAnimated(
            NSIndexPath.indexPathForItemInSection(this.mensajes.length - 1, 0),
            UITableViewScrollPosition.Top,
            true
          );
          (<ListView>this.mensajesListView.nativeElement).refresh();
          // this.changeDetectionRef.markForCheck();
        }

        this.socketService.sendMessage(messageToSend);
        this.msgInput = "";
        // this.changeDetectionRef.markForCheck();
      }
    }
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
