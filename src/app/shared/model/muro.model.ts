export interface IMuro {
    id?: number;
}

export class Muro implements IMuro {
    constructor(public id?: number) {}
}
