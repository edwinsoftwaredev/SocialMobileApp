import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { IFilePost } from "~/app/shared/model/file-post.model";
import { SERVER_API_URL } from "~/app/app.constants";
import { createRequestOption } from "~/app/shared/util/request-util";

type EntityResponseType = HttpResponse<IFilePost>;
type EntityArrayResponseType = HttpResponse<Array<IFilePost>>;

@Injectable({ providedIn: "root" })
export class FilePostService {
    resourceUrl = SERVER_API_URL + "api/file-posts";

    constructor(private http: HttpClient) {}

    create(filePost: IFilePost): Observable<EntityResponseType> {
        return this.http.post<IFilePost>(this.resourceUrl, filePost, { observe: "response" });
    }

    update(filePost: IFilePost): Observable<EntityResponseType> {
        return this.http.put<IFilePost>(this.resourceUrl, filePost, { observe: "response" });
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http.get<IFilePost>(`${this.resourceUrl}/${id}`, { observe: "response" });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);

        return this.http.get<Array<IFilePost>>(this.resourceUrl, { params: options, observe: "response" });
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: "response" });
    }

    deleteAllFilesByPost(idPost: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/post/${idPost}`, { observe: "response" });
    }
}
