import { Moment } from "moment";
import { IUsuario } from "./usuario.model";

export interface IActividad {
    id?: number;
    nombreActividad?: string;
    fechaInicio?: Moment;
    fechaFin?: Moment;
    usuarios?: Array<IUsuario>;
}

export class Actividad implements IActividad {
    constructor(
        public id?: number,
        public nombreActividad?: string,
        public fechaInicio?: Moment,
        public fechaFin?: Moment,
        public usuarios?: Array<IUsuario>
    ) {}
}
