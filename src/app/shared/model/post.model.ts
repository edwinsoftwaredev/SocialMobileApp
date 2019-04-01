import { Moment } from "moment";
import { IFilePost } from "./file-post.model";
import { ILike } from "./like.model";
import { IUsuario } from "./usuario.model";

export interface IPost {
    id?: number;
    texto?: string;
    url?: string;
    fechaPublicacion?: Moment;
    filePosts?: Array<IFilePost>;
    likes?: Array<ILike>;
    usuario?: IUsuario;
}

export class Post implements IPost {
    constructor(
        public id?: number,
        public texto?: string,
        public url?: string,
        public fechaPublicacion?: Moment,
        public filePosts?: Array<IFilePost>,
        public likes?: Array<ILike>,
        public usuario?: IUsuario
    ) {}
}
