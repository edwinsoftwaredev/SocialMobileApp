import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { LoginService } from "~/app/core";

@Injectable()
export class AuthExpiredInterceptor implements HttpInterceptor {
    constructor(private loginService: LoginService) {}

    /* en este interceptor si el servidor encuentra irregularidades en el jwt
    ** como, por ejemplo, que el token haya expirado, entonces el servidor
    ** devolvera un http response con el estatus Unathorized o 401.
    ** pipe() se usa para "mapear" de alguna forma el stream de datos que es el observable
    ** esa forma de "mapear" en este caso se logra con tap() que la finalidad de esta funcion es
    ** realizar una accion pero sin alterar el stream de datos del observable, obviamente evaluando
    ** cada dato que se encuentra en el stream en este caso posiblemete una instancia de HttpErrorResponse.
    ** si se cumple la condicion se hace el logout(); que hace que se borre el jwt del cliente.
     */

    /* Para recordar: tap() sirve para realizar una accion sin alterar o devolver algun dato como un arreglo
     ** otra opcion es map() simpre de rxjs, que sirve para para alterar los datos del stream o devolver algo
     ** diferente del stream original.
     ** como se ve el la funcion el return devuelve un tipo Observable<HttpEvent<any>> con el uso del tap()
     ** con map posiblemete seria un return devolviendo un tipo de dato diferente al anterior.
      */

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            tap(
                (event: HttpEvent<any>) => {
                    // *
                },
                (err: any) => {
                    if (err instanceof HttpErrorResponse) {
                        if (err.status === 401) {
                            this.loginService.logout();
                        }
                    }
                }
            )
        );
    }
}
