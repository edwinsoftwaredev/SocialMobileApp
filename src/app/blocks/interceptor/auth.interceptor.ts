import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { SecureStorage } from "nativescript-secure-storage";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { SERVER_API_URL } from "~/app/app.constants";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    private secureStorage = new SecureStorage();

    constructor() {
        // *
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        /* en el siguiente if: si hay algun request entonces no se cumple la condicion
        ** y se debera agregar el http header Authorization con el bearer token.
        ** si se cumple la condicion entonces el request o la solicitud sigue al siguiente interceptor
        ** que se encuentran definidos en el app.module.ts en la parte de providers, en el caso de que haya.
        */

        if (!request ||
            !request.url ||
            (/^http/.test(request.url) &&
                !(SERVER_API_URL && request.url.startsWith(SERVER_API_URL)))) {
            return next.handle(request);
        }

        const token = this.secureStorage.getSync({key: "authenticationToken"});
        if (!!token) {
            request = request.clone({
                setHeaders: {
                    Authorization: "Bearer " + token
                }
            });
        }

        return next.handle(request);
    }
}
