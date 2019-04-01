import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse, HttpParams, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";
import { map } from "rxjs/operators";
import { IUsuario } from "~/app/shared/model/usuario.model";
import { SERVER_API_URL } from "~/app/app.constants";
import { createRequestOption } from "~/app/shared/util/request-util";
import { DATE_FORMAT } from "~/app/shared/constants/input.constants";
import { DeviceToken, IDeviceToken } from "~/app/shared/model/deviceToken.model";

type EntityResponseType = HttpResponse<IUsuario>;
type EntityArrayResponseType = HttpResponse<Array<IUsuario>>;

@Injectable({ providedIn: "root" })
export class UsuarioService {

    resourceUrl = SERVER_API_URL + "api/usuarios";

    private _currentVisitedProfile: IUsuario;

    constructor(private http: HttpClient) {}

    // ////////////////////////notificaciones/////////////////////////

    createDeviceToken(deviceToken: IDeviceToken): Observable<HttpResponse<IDeviceToken>> {

        return this.http
          .post<IDeviceToken>(SERVER_API_URL + "api/devicetoken", deviceToken, { observe: "response" });

    }

    updateDeviceToken(deviceToken: IDeviceToken): Observable<HttpResponse<IDeviceToken>> {

        return this.http
          .post<IDeviceToken>(SERVER_API_URL + "api/devicetoken", deviceToken, { observe: "response" });

    }

    deleteDeviceToken(token: string, usuario: string): Observable<HttpResponse<any>> {

        const httpParams: HttpParams = new HttpParams()
          .set("token", token)
          .set("usuario", usuario);

        return this
          .http
          .delete<any>(SERVER_API_URL + "api/devicetoken", { params: httpParams, observe: "response" });

    }

    findUsuarioNotificationToken(usuario: string): Observable<HttpResponse<Array<IDeviceToken>>> {
        return this.http
          .get<Array<IDeviceToken>>(`${SERVER_API_URL}api/devicetoken/${usuario}`, {observe: "response"});
    }

    findAllUsersByToken(token: string): Observable<HttpResponse<Array<IDeviceToken>>> {
        return this.http
          .get<Array<IDeviceToken>>(`${SERVER_API_URL}api/devicetoken/finddevices/${token}`, {observe: "response"});
    }

    //////////////////////////////////////////////////////////////////

    create(usuario: IUsuario): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(usuario);

        return this.http
            .post<IUsuario>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    update(usuario: IUsuario): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(usuario);

        return this.http
            .put<IUsuario>(this.resourceUrl, copy, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    find(id: number): Observable<EntityResponseType> {
        return this.http
            .get<IUsuario>(`${this.resourceUrl}/${id}`, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    findUsuario(usuario: string): Observable<EntityResponseType> {
        return this.http
            .get(`${this.resourceUrl}/muro/${usuario}`, { observe: "response" })
            .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
    }

    findUsuarioBySearchString(searchString: string): Observable<HttpResponse<Array<IUsuario>>> {
        const httpParams: HttpParams = new HttpParams().set("searchString", searchString.toString());

        return this.http
            .get(`${this.resourceUrl}/searching`, { params: httpParams, observe: "response" })
            .pipe(map((response: HttpResponse<Array<IUsuario>>) =>
                this.convertDateArrayFromServerSearchString(response)));
    }

    findUsuarioWithChat(usuarioId: number): Observable<HttpResponse<IUsuario>> {
        const httpParams: HttpParams = new HttpParams().set("usuarioId", usuarioId.toString());

        return this.http.get<IUsuario>(`${this.resourceUrl}/chats`, { params: httpParams, observe: "response" });
    }

    convertDateArrayFromServerSearchString(response: HttpResponse<Array<IUsuario>>): HttpResponse<Array<IUsuario>> {
        if (response.body) {
            response.body.forEach((usuario: IUsuario) => {
                usuario.fechaNacimiento = usuario.fechaNacimiento != null ? moment(usuario.fechaNacimiento) : null;
                usuario.fechaRegistro = usuario.fechaRegistro != null ? moment(usuario.fechaRegistro) : null;
            });
        }

        return response;
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);

        return this.http
            .get<Array<IUsuario>>(this.resourceUrl, { params: options, observe: "response" })
            .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
    }

    delete(id: number): Observable<HttpResponse<any>> {
        return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: "response" });
    }

    protected convertDateFromClient(usuario: IUsuario): IUsuario {
        // tslint:disable-next-line
        const copy: IUsuario = Object.assign({}, usuario, {
            fechaNacimiento:
                usuario.fechaNacimiento != null && usuario.fechaNacimiento.isValid() ?
                    usuario.fechaNacimiento.format(DATE_FORMAT) : null,
            fechaRegistro:
                usuario.fechaRegistro != null && usuario.fechaRegistro.isValid() ?
                    usuario.fechaRegistro.format(DATE_FORMAT) : null
        });

        return copy;
    }

    protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
        if (res.body) {
            res.body.fechaNacimiento = res.body.fechaNacimiento != null ? moment(res.body.fechaNacimiento) : null;
            res.body.fechaRegistro = res.body.fechaRegistro != null ? moment(res.body.fechaRegistro) : null;
        }

        return res;
    }

    protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
        if (res.body) {
            res.body.forEach((usuario: IUsuario) => {
                usuario.fechaNacimiento = usuario.fechaNacimiento != null ? moment(usuario.fechaNacimiento) : null;
                usuario.fechaRegistro = usuario.fechaRegistro != null ? moment(usuario.fechaRegistro) : null;
            });
        }

        return res;
    }

    get currentVisitedProfile(): IUsuario {
        return this._currentVisitedProfile;
    }

    set currentVisitedProfile(value: IUsuario) {
        this._currentVisitedProfile = value;
    }

}
