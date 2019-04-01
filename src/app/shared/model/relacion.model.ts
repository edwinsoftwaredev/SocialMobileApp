import { Moment } from "moment";
import { IUsuario } from "./usuario.model";

export interface IRelacion {
    id?: number;
    amigoId?: number;
    estado?: boolean;
    fecha?: Moment;
    usuario?: IUsuario;
}

export class Relacion implements IRelacion {
    constructor(public id?: number,
                public amigoId?: number,
                public estado?: boolean,
                public fecha?: Moment,
                public usuario?: IUsuario) {
        this.estado = this.estado || false;
    }
}
