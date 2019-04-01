import { Moment } from "moment";
import { IChat } from "./chat.model";
import { IUsuario } from "./usuario.model";

export interface IMensaje {
    id?: number;
    texto?: string;
    fechaCreacion?: Moment;
    chat?: IChat;
    usuario?: IUsuario;
}

export class Mensaje implements IMensaje {
    constructor(public id?: number,
                public texto?: string,
                public fechaCreacion?: Moment,
                public chat?: IChat,
                public usuario?: IUsuario) {}
}
