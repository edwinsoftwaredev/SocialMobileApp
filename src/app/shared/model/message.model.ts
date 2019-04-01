// @ts-ignore
import { IMensaje } from "./mensaje.model";
// @ts-ignore
import { IChat } from "./chat.model";
// @ts-ignore
import { Moment } from "moment";
// @ts-ignore
import { IUsuario } from "./usuario.model";

export interface IMessage {
    from?: IUsuario;
    text?: string;
    to?: string;
    dateTime?: Moment;
    connectingMessage?: boolean;
    solicitudMessage?: boolean;
    disconnectMessage?: boolean;
    messageMessage?: boolean;
    chat?: IChat;
    mensaje?: IMensaje;
}
// @ts-ignore
export class Message implements IMessage {
    constructor(
        public from?: IUsuario,
        public text?: string,
        public to?: string,
        public dateTime?: Moment,
        public connectingMessage?: boolean,
        public solicitudMessage?: boolean,
        public disconnectMessage?: boolean,
        public messageMessage?: boolean,
        public chat?: IChat,
        public mensaje?: IMensaje
    ) {}
}
