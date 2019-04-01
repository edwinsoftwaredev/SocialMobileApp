import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";
import { map } from "rxjs/operators";
import { IActividad } from "~/app/shared/model/actividad.model";
import { SERVER_API_URL } from "~/app/app.constants";
import { createRequestOption } from "~/app/shared/util/request-util";
import { DATE_FORMAT } from "~/app/shared/constants/input.constants";

type EntityResponseType = HttpResponse<IActividad>;
type EntityArrayResponseType = HttpResponse<Array<IActividad>>;

@Injectable({ providedIn: "root" })
export class ActividadService {
    resourceUrl = SERVER_API_URL + "api/actividads";

    constructor(private http: HttpClient) {}

    create(actividad: IActividad): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(actividad);

        return this.http
            .post<IActividad>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    update(actividad: IActividad): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(actividad);

        return this.http
            .put<IActividad>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http
            .get<IActividad>(`${this.resourceUrl}/${id}`, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);

        return this.http
            .get<Array<IActividad>>(this.resourceUrl, { params: options, observe: "response" })
            .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: "response" });
    }

    protected convertDateFromClient(actividad: IActividad): IActividad {
        // tslint:disable-next-line
        const copy: IActividad = Object.assign({}, actividad, {
            fechaInicio:
                actividad.fechaInicio != null && actividad.fechaInicio.isValid() ?
                    actividad.fechaInicio.format(DATE_FORMAT) : null,
            fechaFin: actividad.fechaFin != null && actividad.fechaFin.isValid() ?
                actividad.fechaFin.format(DATE_FORMAT) : null
        });

        return copy;
    }

    protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
        if (res.body) {
            res.body.fechaInicio = res.body.fechaInicio != null ? moment(res.body.fechaInicio) : null;
            res.body.fechaFin = res.body.fechaFin != null ? moment(res.body.fechaFin) : null;
        }

        return res;
    }

    protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
        if (res.body) {
            res.body.forEach((actividad: IActividad) => {
                actividad.fechaInicio = actividad.fechaInicio != null ? moment(actividad.fechaInicio) : null;
                actividad.fechaFin = actividad.fechaFin != null ? moment(actividad.fechaFin) : null;
            });
        }

        return res;
    }
}
