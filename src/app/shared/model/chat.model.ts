import { Moment } from "moment";
import { IUsuario } from "./usuario.model";
import { IMensaje } from "./mensaje.model";

export interface IChat {
    id?: number;
    fechaCreacion?: Moment;
    ultimaVezVisto?: Moment;
    mensajes?: Array<IMensaje>;
    usuarios?: Array<IUsuario>;
    status?: boolean;
}

export class Chat implements IChat {
    constructor(
        public id?: number,
        public fechaCreacion?: Moment,
        public ultimaVezVisto?: Moment,
        public mensajes?: Array<IMensaje>,
        public usuarios?: Array<IUsuario> ,
        public status?: boolean
    ) {}
}
