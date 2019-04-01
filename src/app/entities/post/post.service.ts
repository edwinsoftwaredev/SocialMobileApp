import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpRequest, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";
import { map } from "rxjs/operators";
import { IPost } from "~/app/shared/model/post.model";
import { SERVER_API_URL } from "~/app/app.constants";
import { createRequestOption } from "~/app/shared/util/request-util";
import { DATE_TIME_FORMAT } from "~/app/shared/constants/input.constants";

type EntityResponseType = HttpResponse<IPost>;
type EntityArrayResponseType = HttpResponse<Array<IPost>>;

@Injectable({ providedIn: "root" })
export class PostService {
    resourceUrl = SERVER_API_URL + "api/posts";

    constructor(private http: HttpClient) {}

    create(post: IPost): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(post);

        return this.http
            .post<IPost>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    update(post: IPost): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(post);

        return this.http
            .put<IPost>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http
            .get<IPost>(`${this.resourceUrl}/${id}`, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    findAllPostsByUsuario(usuario: string): Observable<HttpResponse<Array<IPost>>> {
        return this.http
            .get(`${this.resourceUrl}/muro/${usuario}`, { observe: "response" })
            .pipe(map((res: HttpResponse<Array<IPost>>) => this.convertDateArrayFromServer(res)));
    }

    findPostWallByUsuarioId(id: number): Observable<HttpResponse<Array<IPost>>> {
        return this.http
            .get(`${this.resourceUrl}/muro/postwall-files/${id}`, { observe: "response" })
            .pipe(map((res: HttpResponse<Array<IPost>>) => this.convertDateArrayFromServer(res)));
    }

    findPostWallByUsuarioIdPageable(id: number, page: number, size: number): Observable<HttpResponse<Array<IPost>>> {
        const httpParams: HttpParams = new HttpParams()
            .set("idUsuario", id.toString())
            .set("page", page.toString())
            .set("size", size.toString());

        return this.http
            .get(`${this.resourceUrl}/muro/post-wall/pageable`, { params: httpParams, observe: "response" })
            .pipe(map((res: HttpResponse<Array<IPost>>) => this.convertDateArrayFromServer(res)));
    }

    findPostWallByUsuarioIdPageableVisitedProfile(id: number, page: number, size: number):
        Observable<HttpResponse<Array<IPost>>> {
        const httpParams: HttpParams = new HttpParams()
            .set("idUsuario", id.toString())
            .set("page", page.toString())
            .set("size", size.toString());

        return this.http
            .get(`${this.resourceUrl}/muro/postvisitedprofile`, { params: httpParams, observe: "response" })
            .pipe(map((res: HttpResponse<Array<IPost>>) => this.convertDateArrayFromServer(res)));
    }

    findAllLikesPostUsuarioByUsuario(id: number) {
        return this.http
            .get(`${this.resourceUrl}/muro/likes-usuario/${id}`, { observe: "response" })
            .pipe(map((res: HttpResponse<Array<IPost>>) => this.convertDateArrayFromServer(res)));
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);

        return this.http
            .get<Array<IPost>>(this.resourceUrl, { params: options, observe: "response" })
            .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: "response" });
    }

    deleteFullPost(id: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/full-post/${id}`, { observe: "response" });
    }

    protected convertDateFromClient(post: IPost): IPost {
        // tslint:disable-next-line
        const copy: IPost = Object.assign({}, post, {
            fechaPublicacion:
                post.fechaPublicacion != null && post.fechaPublicacion.isValid() ?
                    post.fechaPublicacion.format(DATE_TIME_FORMAT) : null
        });

        return copy;
    }

    protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
        if (res.body) {
            res.body.fechaPublicacion = res.body.fechaPublicacion != null ? moment(res.body.fechaPublicacion) : null;
        }

        return res;
    }

    protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
        if (res.body) {
            res.body.forEach((post: IPost) => {
                post.fechaPublicacion = post.fechaPublicacion != null ? moment(post.fechaPublicacion) : null;
            });
        }

        return res;
    }
}
