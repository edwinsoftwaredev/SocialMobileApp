import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";
import { map } from "rxjs/operators";
import { IRelacion } from "~/app/shared/model/relacion.model";
import { SERVER_API_URL } from "~/app/app.constants";
import { IUsuario } from "~/app/shared/model/usuario.model";
import { createRequestOption } from "~/app/shared/util/request-util";
import { DATE_FORMAT } from "~/app/shared/constants/input.constants";

type EntityResponseType = HttpResponse<IRelacion>;
type EntityArrayResponseType = HttpResponse<Array<IRelacion>>;

@Injectable({ providedIn: "root" })
export class RelacionService {
    resourceUrl = SERVER_API_URL + "api/relacions";

    constructor(private http: HttpClient) {}

    create(relacion: IRelacion): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(relacion);

        return this.http
            .post<IRelacion>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    update(relacion: IRelacion): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(relacion);

        return this.http
            .put<IRelacion>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http
            .get<IRelacion>(`${this.resourceUrl}/${id}`, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    findByUsuario(usuario: string): Observable<HttpResponse<Array<IRelacion>>> {
        return this.http
            .get(`${this.resourceUrl}/muro/${usuario}`, { observe: "response" })
            .pipe(map((res: HttpResponse<Array<IRelacion>>) => this.convertDateArrayFromServer(res)));
    }

    findSolicitudesRecibidasByUsuario(usuarioId: number): Observable<HttpResponse<Array<IRelacion>>> {
        const httpParams: HttpParams = new HttpParams().set("usuarioId", usuarioId.toString());

        return this.http
            .get(`${this.resourceUrl}/muro/socitudeRecibidas`, { params: httpParams, observe: "response" })
            .pipe(map((response: HttpResponse<Array<IRelacion>>) => this.convertDateArrayFromServer(response)));
    }

    deleteSolicitudEnviada(usuarioId: number, amigoId: number): Observable<HttpResponse<any>> {
        const httpParams: HttpParams = new HttpParams()
          .set("usuarioId", usuarioId.toString())
          .set("amigoId", amigoId.toString());

        return this.http
          .delete<any>(`${this.resourceUrl}/delete/solicitudenviada`, { params: httpParams, observe: "response" });
    }

    deleteSolicitudRecibida(amigoId: number, usuarioId: number): Observable<HttpResponse<any>> {
        const httpParams: HttpParams = new HttpParams()
          .set("amigoId", amigoId.toString())
          .set("usuarioId", usuarioId.toString());

        return this.http
          .delete<any>(`${this.resourceUrl}/delete/solicitudrecibida`, { params: httpParams, observe: "response" });
    }

    deleteAmigo(usuarioAmigoId: number, usuarioId: number): Observable<HttpResponse<any>> {
        const httpParams: HttpParams = new HttpParams()
          .set("usuarioAmigoId", usuarioAmigoId.toString())
          .set("usuarioId", usuarioId.toString());

        return this.http
          .delete<any>(`${this.resourceUrl}/delete/amigo`, {params: httpParams, observe: "response"});
    }

    findSolicitudesEnvidasByUsuario(usuarioId: number): Observable<HttpResponse<Array<IUsuario>>> {
        const httpParams: HttpParams = new HttpParams().set("usuarioId", usuarioId.toString());

        // no se hace el map porque no es necesario!!
        return this.http.get<Array<IUsuario>>(`${this.resourceUrl}/muro/solicitudesEnviadas`,
            { params: httpParams, observe: "response" });
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);

        return this.http
            .get<Array<IRelacion>>(this.resourceUrl, { params: options, observe: "response" })
            .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: "response" });
    }

    protected convertDateFromClient(relacion: IRelacion): IRelacion {
        // tslint:disable-next-line
        const copy: IRelacion = Object.assign({}, relacion, {
            fecha: relacion.fecha != null && relacion.fecha.isValid() ? relacion.fecha.format(DATE_FORMAT) : null
        });

        return copy;
    }

    protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
        if (res.body) {
            res.body.fecha = res.body.fecha != null ? moment(res.body.fecha) : null;
        }

        return res;
    }

    protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
        if (res.body) {
            res.body.forEach((relacion: IRelacion) => {
                relacion.fecha = relacion.fecha != null ? moment(relacion.fecha) : null;
            });
        }

        return res;
    }
}
