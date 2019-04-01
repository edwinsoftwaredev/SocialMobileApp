import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import { Chat, IChat } from "~/app/shared/model/chat.model";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { IUsuario, Usuario } from "~/app/shared/model/usuario.model";
import { fromBase64, ImageSource } from "tns-core-modules/image-source";
import { IMessage, Message } from "~/app/shared/model/message.model";
import { HttpResponse } from "~/@angular/common/http";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";
import { SocketService } from "~/app/shared/socket.service";
import { Principal, Account } from "~/app/core";
import { ChatService } from "~/app/entities/chat/chat.service";
import { RouterExtensions } from "nativescript-angular";
import { Subscription } from "rxjs";
import * as utils from "tns-core-modules/utils/utils";
import { RadListView } from "nativescript-ui-listview";

@Component({
  selector: "Featured",
  moduleId: module.id,
  templateUrl: "./listado-chats.component.html"
})
export class ListadoChatsComponent implements OnInit, OnDestroy {

  usuariosChat: ObservableArray<IChat> = new ObservableArray<IChat>([]);
  usuariosSinLeer: Array<string> = [];
  cantMsgSinLeer: number = 0;
  usuario: IUsuario;
  chatsUsuarios: Array<string> = [];

  searchingSpinnerFlag: boolean = false;

  mensageMessageSubscription: Subscription;
  connectingMessageSubscription: Subscription;
  desconexionMessageSubscription: Subscription;
  usuarioLeidoSubscription: Subscription;
  usuariosSinLeerSubscription: Subscription;
  chatIdSubscription: Subscription;
  destroyChatSubscription: Subscription;

  @ViewChild("searchListView") searchListView: ElementRef<RadListView>;

  constructor(private usuarioService: UsuarioService,
              private socketService: SocketService,
              private principal: Principal,
              private changeDetectionRef: ChangeDetectorRef,
              private ngZone: NgZone,
              private chatService: ChatService,
              private routerExtension: RouterExtensions) {
    // Use the component constructor to inject providers.
  }

  ngOnInit(): void {
    // Init your component properties here.
    this.getUsuario();
    this.socketMessages();

    if (app.android) {
      utils.ad.dismissSoftInput(app.android.foregroundActivity);
    } else {
      utils.ios.getter(UIApplication, UIApplication.sharedApplication)
        .keyWindow
        .endEditing(true);
    }
  }

  ngOnDestroy(): void {
    this.mensageMessageSubscription.unsubscribe();
    this.connectingMessageSubscription.unsubscribe();
    this.desconexionMessageSubscription.unsubscribe();
    this.usuarioLeidoSubscription.unsubscribe();
    this.usuariosSinLeerSubscription.unsubscribe();
    this.chatIdSubscription.unsubscribe();
    this.destroyChatSubscription.unsubscribe();
  }

  getUsuario() {

    this.searchingSpinnerFlag = true;

    this.principal.identity().then((account: Account) => {
      this.usuarioService.findUsuario(account.login).subscribe(
        (res: HttpResponse<IUsuario>) => {
          this.usuario = res.body;

          this.loadAll();
        },
        (res: HttpResponse<any>) => {
          this.searchingSpinnerFlag = false;
        }
      );
    });
  }

  loadAll() {
    this.getChats();

    // obteniendo id para chat recien creado
    this.chatIdSubscription = this.socketService.actualChatIdObservable.subscribe((msg: IMessage) => {
      this.usuariosChat.forEach((chat: IChat) => {
        chat.usuarios.filter((usr: IUsuario) => usr.usuario === msg.to).map((usr: IUsuario) => {
          chat.id = msg.chat.id;
        });
      });
    });

    // destruir chat
    this.destroyChatSubscription = this.socketService.destruirChatObservable.subscribe((id: string) => {

      this.usuariosChat
        .filter((value: IChat) => !!value.id)
        .filter((value: IChat) => value.id.toString() === id)
        .map((value: IChat) => {
          value.id = null;
          value.mensajes = null;
          // this.searchListView.nativeElement.refresh();
          this.changeDetectionRef.detectChanges();

          const usuarioFrom = value.usuarios.filter((usr: IUsuario) => usr.usuario !== this.usuario.usuario)[0];

          setTimeout(() => {
            this.cantMsgSinLeer =
              this.cantMsgSinLeer -
              this.socketService.chatMessages
                .filter((message: IMessage) => message.from.usuario === usuarioFrom.usuario).length;

            this.changeDetectionRef.markForCheck();
            this.socketService.removeUsuarioSinLeerFromMensajes(usuarioFrom.usuario);

            if (this.cantMsgSinLeer < 0) {
              this.cantMsgSinLeer = 0;
            }

            if (this.usuariosSinLeer.indexOf(usuarioFrom.usuario) !== -1) {
              this.usuariosSinLeer.splice(this.usuariosSinLeer.indexOf(usuarioFrom.usuario), 1);
              // this.searchListView.nativeElement.refresh();
              this.changeDetectionRef.detectChanges();
            }

            this.changeDetectionRef.markForCheck();
          }, 500);

          this.changeDetectionRef.markForCheck();
        });

      // this.searchListView.nativeElement.refresh();
      this.changeDetectionRef.detectChanges();
    });
  }

  socketMessages(): void {

    this.usuariosSinLeer = this.socketService.usuariosSinLeer;
    this.cantMsgSinLeer = this.socketService.chatMessages.length;

    this.mensageMessageSubscription = this.socketService.mensageMessage.subscribe((message: IMessage) => {
      if (this.chatsUsuarios.indexOf(message.from.usuario) === -1) {
        this.chatsUsuarios.push(message.from.usuario);
      }

      // si el usuario me envia un mensaje y no tiene chat y lo envia primero
      let usuarioEncontrado = false;

      // tslint:disable-next-line
      for (let i = 0; i < this.usuariosChat.length; i++) {
        if (!usuarioEncontrado) {
          if (this.usuariosChat.getItem(i).usuarios.findIndex((usuario: IUsuario) =>
            usuario.usuario === message.from.usuario) !== -1) {
            usuarioEncontrado = true;

            this.usuariosChat.getItem(i).id = message.chat.id;

            this.changeDetectionRef.detectChanges();

            // this.searchListView.nativeElement.refresh();

          }
        }
      }

      usuarioEncontrado = false;

      this.cantMsgSinLeer++;
    });

    this.connectingMessageSubscription = this.socketService.connectingMessage.subscribe((message: IMessage) => {
      let usuarioEncontrado = false;

      // tslint:disable-next-line
      for (let i = 0; i < this.usuariosChat.length; i++) {
        if (!usuarioEncontrado) {
          if (this.usuariosChat.getItem(i).usuarios.findIndex((usuario: IUsuario) =>
            usuario.usuario === message.from.usuario) !== -1) {
            usuarioEncontrado = true;

            this.ngZone.run(() => {
              this.usuariosChat.getItem(i).status = true;
              this.changeDetectionRef.detectChanges();
            });

          }
        }
      }

      if (!usuarioEncontrado) {

        const staticUsuario = new Usuario(
          message.from.id,
          message.from.usuario,
          message.from.primerNombre,
          message.from.segundoNombre,
          message.from.primerApellido,
          message.from.segundoApellido,
          message.from.email,
          message.from.fechaNacimiento,
          message.from.fechaRegistro,
          message.from.profilePicContentType,
          this.getSanitizedUrl(message.from.profilePic, message.from.profilePicContentType),
          message.from.relacions,
          message.from.posts,
          message.from.chats,
          message.from.actividads
        );

        this.usuariosChat.push(new Chat(null, null, null, null, [this.usuario, staticUsuario], true));
      }

      usuarioEncontrado = false;
    });

    this.desconexionMessageSubscription = this.socketService.desconexionMessage.subscribe((message: IMessage) => {
      let usuarioEncontrado = false;

      for (let i = 0; i < this.usuariosChat.length; i++) {
        if (!usuarioEncontrado) {
          if (this.usuariosChat.getItem(i).usuarios.findIndex((usuario: IUsuario) =>
            usuario.usuario === message.from.usuario) !== -1) {
            usuarioEncontrado = true;

            this.ngZone.run(() => {
              this.usuariosChat.getItem(i).status = false;
              this.changeDetectionRef.detectChanges();
            });

            if (this.usuariosChat.getItem(i).id === null) {
              this.ngZone.run(() => {
                this.usuariosChat.splice(i, 1);
                this.changeDetectionRef.detectChanges();
              });
            }
          }
        }
      }
      usuarioEncontrado = false;
    });

    this.usuarioLeidoSubscription = this.socketService.usuarioLeidoObservable.subscribe((usuario: string) => {

      this.cantMsgSinLeer =
        this.cantMsgSinLeer -
        this.socketService.chatMessages.filter((message: IMessage) => message.from.usuario === usuario).length;

      this.socketService.removeUsuarioSinLeerFromMensajes(usuario);

      if (this.cantMsgSinLeer < 0) {
        this.cantMsgSinLeer = 0;
      }

      if (this.usuariosSinLeer.indexOf(usuario) !== -1) {
        this.ngZone.run(() => {
          this.usuariosSinLeer.splice(this.usuariosSinLeer.indexOf(usuario), 1);
          this.changeDetectionRef.detectChanges();
        });
      }
    });

    this.usuariosSinLeerSubscription = this.socketService.usuariosSinLeerObservable.subscribe((usuario: string) => {
      this.ngZone.run(() => {
        if (this.usuariosSinLeer.indexOf(usuario) === -1) {
          this.usuariosSinLeer.push(usuario);
          this.changeDetectionRef.detectChanges();
        }
      });
      this.changeDetectionRef.detectChanges();
    });
  }

  getChats(): void {
    this.usuarioService.findUsuarioWithChat(this.usuario.id).subscribe((res: HttpResponse<IUsuario>) => {
      if (res.body) {
        this.usuariosChat.push(...res.body.chats.map((chat: IChat) => {
          chat.usuarios
            .filter((usuario: IUsuario) => usuario.usuario !== this.usuario.usuario).map((usuario1: IUsuario) => {
            usuario1.profilePic = this.getSanitizedUrl(usuario1.profilePic, usuario1.profilePicContentType);

            return usuario1;
          });

          return chat;
        }));

        this.usuariosChat =
          new ObservableArray<IChat>(this.usuariosChat.filter((chat: IChat) => chat.usuarios.length === 2));

        // usuarios que se conectaron -- sacar solo los que no tiene chat
        this.socketService.connectedMessages.map((message: IMessage) => {
          let usuarioEncontrado = false;

          // tslint:disable-next-line
          for (let i = 0; i < this.usuariosChat.length; i++) {
            if (!usuarioEncontrado) {
              if (
                this.usuariosChat.getItem(i)
                  .usuarios
                  .findIndex((usuario: IUsuario) => usuario.usuario === message.from.usuario) !== -1
              ) {
                usuarioEncontrado = true;

                this.usuariosChat.getItem(i).status = true;
              }
            }
          }

          if (!usuarioEncontrado) {

            const staticUsuario = new Usuario(
              message.from.id,
              message.from.usuario,
              message.from.primerNombre,
              message.from.segundoNombre,
              message.from.primerApellido,
              message.from.segundoApellido,
              message.from.email,
              message.from.fechaNacimiento,
              message.from.fechaRegistro,
              message.from.profilePicContentType,
              this.getSanitizedUrl(message.from.profilePic, message.from.profilePicContentType),
              message.from.relacions,
              message.from.posts,
              message.from.chats,
              message.from.actividads
            );

            this.usuariosChat.push(new Chat(null, null, null, null, [this.usuario, staticUsuario], true));
          }

          usuarioEncontrado = false;
        });
      }
    }, (error) => {
      this.searchingSpinnerFlag = false;
    }, () => {
      this.searchingSpinnerFlag = false;
    });
  }

  abrirChat(chat: IChat, usuario: IUsuario) {
    // usuario.profilePic = this.getSanitizedUrl(usuario.profilePic, usuario.profilePicContentType);

    this.chatService.usuarioSeleccionado = usuario;
    this.chatService.chatSeleccionado = chat;
    this.chatService.usuarioActual = this.usuario;

    this.routerExtension.navigate(["/chat"]);
  }

  eliminarChat(chat: IChat) {
    // si esta conectado no se elimina solo se reinicia el chat de cero.
    if (chat.id) {
      this.chatService.delete(chat.id).subscribe((res: any) => {
        this.usuariosChat
          .filter((value: IChat) => value.id === chat.id)
          .map((value: IChat) => {
          if (value.status) {
            value.id = null;
            value.mensajes = null;
            // this.searchListView.nativeElement.refresh();

            this.changeDetectionRef.detectChanges();

            const usuarioFrom = value.usuarios.filter((usr: IUsuario) => usr.usuario !== this.usuario.usuario)[0];

            setTimeout(() => {
              this.cantMsgSinLeer =
                this.cantMsgSinLeer -
                this.socketService.chatMessages
                  .filter((message: IMessage) => message.from.usuario === usuarioFrom.usuario).length;

              this.changeDetectionRef.markForCheck();
              this.socketService.removeUsuarioSinLeerFromMensajes(usuarioFrom.usuario);

              if (this.cantMsgSinLeer < 0) {
                this.cantMsgSinLeer = 0;
              }

              if (this.usuariosSinLeer.indexOf(usuarioFrom.usuario) !== -1) {
                this.usuariosSinLeer.splice(this.usuariosSinLeer.indexOf(usuarioFrom.usuario), 1);
                this.changeDetectionRef.detectChanges();
              }

              this.changeDetectionRef.markForCheck();
            }, 500);

            this.changeDetectionRef.markForCheck();
          } else {

            const usuarioFrom = value.usuarios.filter((usr: IUsuario) => usr.usuario !== this.usuario.usuario)[0];

            setTimeout(() => {
              this.cantMsgSinLeer =
                this.cantMsgSinLeer -
                this.socketService.chatMessages
                  .filter((message: IMessage) => message.from.usuario === usuarioFrom.usuario).length;

              this.changeDetectionRef.markForCheck();
              this.socketService.removeUsuarioSinLeerFromMensajes(usuarioFrom.usuario);

              if (this.cantMsgSinLeer < 0) {
                this.cantMsgSinLeer = 0;
              }

              if (this.usuariosSinLeer.indexOf(usuarioFrom.usuario) !== -1) {
                this.usuariosSinLeer.splice(this.usuariosSinLeer.indexOf(usuarioFrom.usuario), 1);
                this.changeDetectionRef.detectChanges();
              }

              this.changeDetectionRef.markForCheck();
            }, 500);

            this.usuariosChat.splice(this.usuariosChat.indexOf(chat), 1);
            this.changeDetectionRef.markForCheck();
          }
        });
      });
    } else {
      this.usuariosChat
        .filter((value: IChat) => value.id === null)
        .map((value: IChat) => {
        if (value.status) {
          value.id = null;
          value.mensajes = null;
          // this.searchListView.nativeElement.refresh();

          this.changeDetectionRef.detectChanges();

          const usuarioFrom = value.usuarios.filter((usr: IUsuario) => usr.usuario !== this.usuario.usuario)[0];

          setTimeout(() => {
            this.cantMsgSinLeer =
              this.cantMsgSinLeer -
              this.socketService.chatMessages
                .filter((message: IMessage) => message.from.usuario === usuarioFrom.usuario).length;

            this.changeDetectionRef.markForCheck();
            this.socketService.removeUsuarioSinLeerFromMensajes(usuarioFrom.usuario);

            if (this.cantMsgSinLeer < 0) {
              this.cantMsgSinLeer = 0;
            }

            if (this.usuariosSinLeer.indexOf(usuarioFrom.usuario) !== -1) {
              this.usuariosSinLeer.splice(this.usuariosSinLeer.indexOf(usuarioFrom.usuario), 1);
              this.changeDetectionRef.detectChanges();
            }

            this.changeDetectionRef.markForCheck();
          }, 500);

          this.changeDetectionRef.markForCheck();
        } else {

          const usuarioFrom = value.usuarios.filter((usr: IUsuario) => usr.usuario !== this.usuario.usuario)[0];

          setTimeout(() => {
            this.cantMsgSinLeer =
              this.cantMsgSinLeer -
              this.socketService.chatMessages
                .filter((message: IMessage) => message.from.usuario === usuarioFrom.usuario).length;

            this.changeDetectionRef.markForCheck();
            this.socketService.removeUsuarioSinLeerFromMensajes(usuarioFrom.usuario);

            if (this.cantMsgSinLeer < 0) {
              this.cantMsgSinLeer = 0;
            }

            if (this.usuariosSinLeer.indexOf(usuarioFrom.usuario) !== -1) {
              this.usuariosSinLeer.splice(this.usuariosSinLeer.indexOf(usuarioFrom.usuario), 1);
              this.changeDetectionRef.detectChanges();
            }

            this.changeDetectionRef.markForCheck();
          }, 500);

          this.usuariosChat.splice(this.usuariosChat.indexOf(chat), 1);
          this.changeDetectionRef.markForCheck();
        }
      });
    }

    if (this.usuariosChat.length) {
      // this.searchListView.nativeElement.refresh();

      this.changeDetectionRef.detectChanges();
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
    this.routerExtension.back();
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>app.getRootView();
    sideDrawer.showDrawer();
  }
}
