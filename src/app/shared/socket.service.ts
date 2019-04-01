import { Injectable } from "@angular/core";

require("nativescript-websockets");
import { SecureStorage } from "nativescript-secure-storage";
import { IUsuario } from "./model/usuario.model";
import { Observable, Subject } from "rxjs";
import { IMessage, Message } from "~/app/shared/model/message.model";
import { SERVER_API_URL } from "~/app/app.constants";

// require("nativescript-nodeify");
import * as Stomp from "stompjs";
import { UsuarioService } from "~/app/entities/usuario/usuario.service";

/*
* Se modificaron los siguientes archivos de la carpeta node_modules
* nativeScript-nodify --> https-browserify
* */

@Injectable({ providedIn: "root" })
export class SocketService {
    get usuarioActual(): string {
        return this._usuarioActual;
    }

    set usuarioActual(value: string) {
        this._usuarioActual = value;
    }
    get actualChatIdObservable(): Observable<IMessage> {
        return this._actualChatIdObservable;
    }
    get solicitudesMessage(): Array<IMessage> {
        return this._solicitudesMessage;
    }

    get usuariosSinLeer(): Array<string> {
        return this._usuariosSinLeer;
    }
    get usuarioLeidoObservable(): Observable<string> {
        return this._usuarioLeidoObservable;
    }
    get usuariosSinLeerObservable(): Observable<string> {
        return this._usuariosSinLeerObservable;
    }
    get chatMessages(): Array<IMessage> {
        return this._chatMessages;
    }
    // https://medium.com/oril/spring-boot-websockets-angular-5-f2f4b1c14cee
    // las demas referencias se encuentran la configuracion de seguridad de spring para websocket ->
    // WebSocketSecurityConfiguration.java

    destruirChatSubject: Subject<string> = new Subject<string>();
    destruirChatObservable: Observable<string> = this.destruirChatSubject.asObservable();

    stompClient: any;
    sessionId: string = null;
    private enviarMensajeConexionFlag = true;

    private connectingMessageSubject: Subject<IMessage> = new Subject<IMessage>();
    private _connectedMessages: Array<IMessage> = [];
    private _connectingMessage: Observable<IMessage> = this.connectingMessageSubject.asObservable();

    private solicitudMessageSubject: Subject<IMessage> = new Subject<IMessage>();
    private _solicitudesMessage: Array<IMessage> = [];
    private _solicitudMessage: Observable<IMessage> = this.solicitudMessageSubject.asObservable();

    private mensageMessageSubject: Subject<IMessage> = new Subject<IMessage>();
    private _chatMessages: Array<IMessage> = [];
    private _mensageMessage: Observable<IMessage> = this.mensageMessageSubject.asObservable();

    private desconexionMessageSubject: Subject<IMessage> = new Subject<IMessage>();
    private _desconexionMessage: Observable<IMessage> = this.desconexionMessageSubject.asObservable();

    private messageQueue: Array<IMessage> = [];
    private processingMessagesFlag = false;

    private usuariosSinLeerSubject: Subject<string> = new Subject<string>();
    private _usuariosSinLeerObservable: Observable<string> = this.usuariosSinLeerSubject.asObservable();
    private _usuariosSinLeer: Array<string> = [];

    private usuarioLeido: Subject<string> = new Subject<string>();
    private _usuarioLeidoObservable: Observable<string> = this.usuarioLeido.asObservable();

    private actualChatId: Subject<IMessage> = new Subject<IMessage>();
    private _actualChatIdObservable: Observable<IMessage> = this.actualChatId.asObservable();

    private _usuarioActual: string;

    private secureStorage = new SecureStorage();

    constructor() {
        // *
    }

    initializeWebSocketConnection() {
        if (this.sessionId === null) {
            this.stompClient = Stomp.over(new WebSocket("url"));

            // HABILITAR SI ES NECESARIO VER LOG EN LA CONSOLA
            // this.stompClient.debug = null;

            // tslint:disable-next-line
            const that = this;

            const token = this.secureStorage.getSync({key: "authenticationToken"});

            if (this.sessionId === null) {

                console.log("conectando...");

                this.stompClient.connect(
                    { Authorization: "Bearer " + token },
                    // tslint:disable-next-line
                    function(frame) {
                        if (typeof frame.headers["user-name"] === "undefined") {
                            that.closeStompSocket(true);
                        } else {
                            if (typeof that.stompClient.ws !== "undefined") {
                                that.sessionId = that.usuarioActual;
                                that.subscribeToSocket();
                            }
                        }
                    },
                    // tslint:disable-next-line
                    function(frame) {
                        setTimeout(() => {
                            console.log("Problemas de conexion. Reconectando...");
                            that.sessionId = null;

                            const token1 = that.secureStorage.getSync({key: "authenticationToken"});

                            if (token1 !== null && typeof token1 !== "undefined") {
                                that.initializeWebSocketConnection();
                            }
                        }, 5000);
                    }
                );
            }
        }
    }

    processQueue(): void {
        while (this.messageQueue.length !== 0 && this.processingMessagesFlag === false) {
            this.processingMessagesFlag = true;

            const message: IMessage = this.messageQueue.pop();

            if (message.connectingMessage) {
                const messageIndex = this._connectedMessages.findIndex(
                    (msgDisconnect: IMessage) => msgDisconnect.from.usuario === message.from.usuario
                );

                if (messageIndex !== -1) {
                    this._connectedMessages.splice(messageIndex, 1);
                }

                this._connectedMessages.push(message);

                this.connectingMessageSubject.next(message);
            } else if (message.solicitudMessage) {
                // solicitudPendiente -- Alguien me envio una solicitud
                // solicitudAceptada -- Alguien acepto mi solicitud

                // acepteSolicitud -- se enviaran dos mensajes uno de conexion y otro de solicitudAceptada
                // esto desde el back end

                if (message.text === "solicitudPendiente") {
                    this.solicitudMessageSubject.next(message);
                    this._solicitudesMessage.push(message);
                    /*this.snackBar.openFromComponent(SnackbarSocketServiceComponent, {
                        duration: 5000
                    });*/
                } else if (message.text === "solicitudAceptada") {
                    this.solicitudMessageSubject.next(message);
                    this._solicitudesMessage.push(message);
                    /*this.snackBar.openFromComponent(SnackbarSocketServiceAceptadaComponent, {
                        duration: 5000
                    });*/
                }
            } else if (message.disconnectMessage) {
                const messageIndex = this._connectedMessages.findIndex(
                    (msgDisconnect: IMessage) => msgDisconnect.from.usuario === message.from.usuario
                );

                if (messageIndex !== -1) {
                    this._connectedMessages.splice(messageIndex, 1);
                }

                this.desconexionMessageSubject.next(message);
            } else if (message.messageMessage) {
                if (this._usuariosSinLeer.indexOf(message.from.usuario) !== -1) {
                    this._usuariosSinLeer.splice(this._usuariosSinLeer.indexOf(message.from.usuario), 1);
                }

                this._usuariosSinLeer.push(message.from.usuario);
                this.usuariosSinLeerSubject.next(message.from.usuario);

                this._chatMessages.push(message); // se inserta el mensaje del usuario conectado
                this.mensageMessageSubject.next(message);
            } else if (message.text === "MENSAJE_TIENE_CHATID") {
                this.actualChatId.next(message);
            } else if (message.text.includes("DESTRUIR_CHAT_ID_")) {
                this.destruirChatSubject.next(message.text.split("DESTRUIR_CHAT_ID_")[1]);
            } else {
                console.log("Null Message");
            }

            if (this.messageQueue.length === 0 && this.processingMessagesFlag === true) {
                this.processingMessagesFlag = false;
            }
        }
    }

    removeUsuarioSinLeer(usuario: string) {
        if (this._usuariosSinLeer.indexOf(usuario) !== -1) {
            this._usuariosSinLeer.splice(this._usuariosSinLeer.indexOf(usuario), 1);

            this.usuarioLeido.next(usuario);
        }
    }

    removeUsuarioSinLeerFromMensajes(usuario: string) {
        this._chatMessages = this._chatMessages.filter((message: IMessage) => message.from.usuario !== usuario);
    }

    sendMessage(message: Message): void {
        if (this.sessionId !== null) {

            const token = this.secureStorage.getSync({key: "authenticationToken"});

            this.stompClient.send("url", { Authorization: "Bearer " + token },
                JSON.stringify(message));

            const nuevoMensaje: IMessage = message;

            this._chatMessages.push(nuevoMensaje); // se inserta el mensaje del usuario actual
        }
    }

    subscribeToSocket(): void {
        if (this.getSesionId() != null) {
            const token = this.secureStorage.getSync({key: "authenticationToken"});

            // ver siguiente post para realzar subscripciones
            // tslint:disable-next-line
            // https://stackoverflow.com/questions/25646671/check-auth-while-sending-a-message-to-a-specific-user-by-using-stomp-and-websock/25647822#25647822

            this.stompClient.subscribe(
                // "/user/queue/specific-user" + "-user" + this.sessionId,
                "/user/queue/specific-user",
                (msg: any) => {
                    const message: IMessage = JSON.parse(msg.body);

                    this.messageQueue.unshift(message);

                    if (this.processingMessagesFlag === false) {
                        this.processQueue();
                    }
                },
                { Authorization: "Bearer " + token }
            );
        }
    }

    enviarMensajeConexion(): void {
        if (this.getSesionId() != null) {
            const token = this.secureStorage.getSync({key: "authenticationToken"});

            if (token != null) {
                this.stompClient.send("url", { Authorization: "Bearer " + token },
                    "conectar");
                this.enviarMensajeConexionFlag = true;
            }
        }
    }

    /*enviarMensajeConexionSinToken(): void {
        this.stompClient.send("/spring-security-socket/room/connect", {}, "conectar sin token");
    }*/

    chatClosed(usuarioActual: IUsuario, usuarioConectado: IUsuario) {

        this._chatMessages = this._chatMessages.filter((message: IMessage) => {
            if (
                (message.from.usuario === usuarioActual.usuario && message.to === usuarioConectado.usuario) ||
                (message.from.usuario === usuarioConectado.usuario && message.to === usuarioActual.usuario)
            ) {
                return false;
            } else {
                return true;
            }
        });
    }

    closeStompSocket(force?: boolean) {
        this._connectedMessages.length = 0;
        this._connectedMessages = [];
        this._chatMessages.length = 0;
        this._chatMessages = [];

        if (this.sessionId != null) {

            const token = this.secureStorage.getSync({key: "authenticationToken"});

            if (force) {
                this.stompClient.disconnect(() => {
                    console.log("socket cerrado forzado");
                    this.sessionId = null;
                    this.initializeWebSocketConnection();
                }, { Authorization: "Bearer " + token });
            } else {
                this.stompClient.disconnect(() => {
                    console.log("socket cerrado");
                    this.sessionId = null;
                }, { Authorization: "Bearer " + token });
            }

            this.sessionId = null;

            this.enviarMensajeConexionFlag = true;
        }
    }

    getSesionId(): string {
        return this.sessionId;
    }

    get connectedMessages(): Array<IMessage> {
        return this._connectedMessages;
    }

    get mensageMessage(): Observable<IMessage> {
        return this._mensageMessage;
    }
    get connectingMessage(): Observable<IMessage> {
        return this._connectingMessage;
    }

    get solicitudMessage(): Observable<IMessage> {
        return this._solicitudMessage;
    }

    get desconexionMessage(): Observable<IMessage> {
        return this._desconexionMessage;
    }
}
