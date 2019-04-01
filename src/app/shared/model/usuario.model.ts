import { Moment } from "moment";
import { IRelacion } from "./relacion.model";
import { IPost } from "./post.model";
import { IChat } from "./chat.model";
import { IActividad } from "./actividad.model";

export interface IUsuario {
    id?: number;
    usuario?: string;
    primerNombre?: string;
    segundoNombre?: string;
    primerApellido?: string;
    segundoApellido?: string;
    email?: string;
    fechaNacimiento?: Moment;
    fechaRegistro?: Moment;
    profilePicContentType?: string;
    profilePic?: any;
    relacions?: Array<IRelacion>;
    posts?: Array<IPost>;
    chats?: Array<IChat>;
    actividads?: Array<IActividad>;
}

export class Usuario implements IUsuario {
    constructor(
        public id?: number,
        public usuario?: string,
        public primerNombre?: string,
        public segundoNombre?: string,
        public primerApellido?: string,
        public segundoApellido?: string,
        public email?: string,
        public fechaNacimiento?: Moment,
        public fechaRegistro?: Moment,
        public profilePicContentType?: string,
        public profilePic?: any,
        public relacions?: Array<IRelacion>,
        public posts?: Array<IPost>,
        public chats?: Array<IChat>,
        public actividads?: Array<IActividad>
    ) {}
}
