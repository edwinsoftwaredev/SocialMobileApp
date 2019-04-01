export interface IDeviceToken {
  id?: number;
  usuario?: string;
  token?: string;
}

export class DeviceToken implements IDeviceToken {
  constructor(
    public id?: number,
    public usuario?: string,
    public token?: string
  ) {}
}
