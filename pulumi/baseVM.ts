import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { Output } from "@pulumi/pulumi";

export interface ResourceBuilder<T> {
  build(): T;
}

export class BaseVM {
  constructor(
    protected provider: proxmox.Provider,
    protected nodeName: string,
    protected sshKey: string | Output<string>,
    protected baseImage: proxmox.storage.File,
  ) {}
}
