import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";
import { map } from "rxjs/operators";
import { ILike } from "~/app/shared/model/like.model";
import { SERVER_API_URL } from "~/app/app.constants";
import { createRequestOption } from "~/app/shared/util/request-util";
import { DATE_TIME_FORMAT } from "~/app/shared/constants/input.constants";

type EntityResponseType = HttpResponse<ILike>;
type EntityArrayResponseType = HttpResponse<Array<ILike>>;

@Injectable({ providedIn: "root" })
export class LikeService {
    resourceUrl = SERVER_API_URL + "api/likes";

    constructor(private http: HttpClient) {}

    create(like: ILike): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(like);

        return this.http
            .post<ILike>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    update(like: ILike): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(like);

        return this.http
            .put<ILike>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http
            .get<ILike>(`${this.resourceUrl}/${id}`, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);

        return this.http
            .get<Array<ILike>>(this.resourceUrl, { params: options, observe: "response" })
            .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: "response" });
    }

    protected convertDateFromClient(like: ILike): ILike {
        // tslint:disable-next-line
        const copy: ILike = Object.assign({}, like, {
            fechaLike: like.fechaLike != null && like.fechaLike.isValid() ?
                like.fechaLike.format(DATE_TIME_FORMAT) : null
        });

        return copy;
    }

    protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
        if (res.body) {
            res.body.fechaLike = res.body.fechaLike != null ? moment(res.body.fechaLike) : null;
        }

        return res;
    }

    protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
        if (res.body) {
            res.body.forEach((like: ILike) => {
                like.fechaLike = like.fechaLike != null ? moment(like.fechaLike) : null;
            });
        }

        return res;
    }
}
