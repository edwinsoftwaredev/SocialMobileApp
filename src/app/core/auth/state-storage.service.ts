import { Injectable } from "@angular/core";
import { SecureStorage } from "nativescript-secure-storage";

@Injectable({ providedIn: "root" })
export class StateStorageService {
    private secureStorage = new SecureStorage();

    constructor() {
        // constructor
    }

    getPreviousState() {
        return this.secureStorage.getSync({key: "previousState"});
    }

    resetPreviousState() {
        this.secureStorage.removeSync({key: "previousState"});
    }

    storePreviousState(previousStateName, previousStateParams) {
        const previousState = "{ name: " + previousStateName + ", params: " + previousStateParams + "}";
        this.secureStorage.setSync({key: "previousState", value: previousState});
    }

    getDestinationState() {
        return  this.secureStorage.getSync({key: "destinationState"});
    }

    storeUrl(url: string) {
        this.secureStorage.setSync({key: "previousUrl", value: url});
    }

    getUrl() {
        return this.secureStorage.getSync({key: "previousUrl"});
    }

    /*storeDestinationState(destinationState, destinationStateParams, fromState) {
        const destinationInfo = {
            destination: {
                name: destinationState.name,
                data: destinationState.data
            },
            params: destinationStateParams,
            from: {
                name: fromState.name
            }
        };
        this.$sessionStorage.store("destinationState", destinationInfo);
    }*/
}
