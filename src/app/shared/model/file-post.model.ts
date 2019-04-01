import { IPost } from "./post.model";

export interface IFilePost {
    id?: number;
    fileContentType?: string;
    file?: any;
    post?: IPost;
}

export class FilePost implements IFilePost {
    constructor(public id?: number, public fileContentType?: string, public file?: any, public post?: IPost) {}
}
