import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";

import { IUser } from "./user.model";
import { SERVER_API_URL } from "~/app/app.constants";
import { createRequestOption } from "~/app/shared/util/request-util";

@Injectable({ providedIn: "root" })
export class UserService {

    resourceUrl = SERVER_API_URL + "api/users";

    constructor(private http: HttpClient) {}

    create(user: IUser): Observable<HttpResponse<IUser>> {
        return this.http.post<IUser>(this.resourceUrl, user, { observe: "response" });
    }

    update(user: IUser): Observable<HttpResponse<IUser>> {
        return this.http.put<IUser>(this.resourceUrl, user, { observe: "response" });
    }

    find(login: string): Observable<HttpResponse<IUser>> {
        return this.http.get<IUser>(`${this.resourceUrl}/${login}`, { observe: "response" });
    }

    query(req?: any): Observable<HttpResponse<Array<IUser>>> {
        const options = createRequestOption(req);

        return this.http.get<Array<IUser>>(this.resourceUrl, { params: options, observe: "response" });
    }

    delete(login: string): Observable<HttpResponse<any>> {
        return this.http.delete(`${this.resourceUrl}/${login}`, { observe: "response" });
    }

    authorities(): Observable<Array<string>> {
        return this.http.get<Array<string>>(SERVER_API_URL + "api/users/authorities");
    }
}
