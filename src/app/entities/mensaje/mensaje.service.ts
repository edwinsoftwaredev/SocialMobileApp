import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";
import { map } from "rxjs/operators";
import { IMensaje } from "~/app/shared/model/mensaje.model";
import { SERVER_API_URL } from "~/app/app.constants";
import { createRequestOption } from "~/app/shared/util/request-util";
import { DATE_FORMAT } from "~/app/shared/constants/input.constants";

type EntityResponseType = HttpResponse<IMensaje>;
type EntityArrayResponseType = HttpResponse<Array<IMensaje>>;

@Injectable({ providedIn: "root" })
export class MensajeService {
    resourceUrl = SERVER_API_URL + "api/mensajes";

    constructor(private http: HttpClient) {}

    create(mensaje: IMensaje): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(mensaje);

        return this.http
            .post<IMensaje>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    update(mensaje: IMensaje): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(mensaje);

        return this.http
            .put<IMensaje>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http
            .get<IMensaje>(`${this.resourceUrl}/${id}`, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    findMensajesGuardados(chatId: number, paginaChat: number, cantidadMensajes: number):
        Observable<HttpResponse<Array<IMensaje>>> {

        const httpParams = new HttpParams()
            .set("chatId", chatId.toString())
            .set("paginaChat", paginaChat.toString())
            .set("cantidadMensajes", cantidadMensajes.toString());

        return this.http.get<Array<IMensaje>>(`${this.resourceUrl}/mensajesGuardados`,
            { params: httpParams, observe: "response" });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);

        return this.http
            .get<Array<IMensaje>>(this.resourceUrl, { params: options, observe: "response" })
            .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: "response" });
    }

    protected convertDateFromClient(mensaje: IMensaje): IMensaje {
        // tslint:disable-next-line
        const copy: IMensaje = Object.assign({}, mensaje, {
            fechaCreacion:
                mensaje.fechaCreacion != null && mensaje.fechaCreacion.isValid() ?
                    mensaje.fechaCreacion.format(DATE_FORMAT) : null
        });

        return copy;
    }

    protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
        if (res.body) {
            res.body.fechaCreacion = res.body.fechaCreacion != null ? moment(res.body.fechaCreacion) : null;
        }

        return res;
    }

    protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
        if (res.body) {
            res.body.forEach((mensaje: IMensaje) => {
                mensaje.fechaCreacion = mensaje.fechaCreacion != null ? moment(mensaje.fechaCreacion) : null;
            });
        }

        return res;
    }
}
