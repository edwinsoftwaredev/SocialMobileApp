import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SecureStorage } from "nativescript-secure-storage";
import { SERVER_API_URL } from "~/app/app.constants";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: "root" })
export class AuthServerProvider {

    private secureStorage = new SecureStorage();

    constructor(private http: HttpClient) {}

    getToken() {
        return this.secureStorage.getSync({key: "authenticationToken"});
    }

    login(credentials): Observable<any> {
        const data = {
            username: credentials.username,
            password: credentials.password,
            rememberMe: credentials.rememberMe
        };

        return this.http.post(SERVER_API_URL + "api/authenticate", data,
            { observe: "response" })
            .pipe(map(authenticateSuccess.bind(this)));

        function authenticateSuccess(resp) {
            const bearerToken = resp.headers.get("Authorization");
            if (bearerToken && bearerToken.slice(0, 7) === "Bearer ") {
                const jwt = bearerToken.slice(7, bearerToken.length);
                this.storeAuthenticationToken(jwt, credentials.rememberMe);

                return jwt;
            }
        }
    }

    loginWithToken(jwt, rememberMe) {
        if (jwt) {
            this.storeAuthenticationToken(jwt, rememberMe);

            return Promise.resolve(jwt);
        } else {
            return Promise.reject("auth-jwt-service Promise reject"); // Put appropriate error message here
        }
    }

    storeAuthenticationToken(jwt, rememberMe) {
        if (rememberMe) {
            this.secureStorage.setSync({key: "authenticationToken", value: jwt});
        } else {
            this.secureStorage.setSync({key: "authenticationToken", value: jwt});
        }
    }

    logout(): Observable<any> {
        return new Observable((observer: any) => {
            this.secureStorage.removeSync({key: "authenticationToken"});
            observer.complete();
        });
    }
}
