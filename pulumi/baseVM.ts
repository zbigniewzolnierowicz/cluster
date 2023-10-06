import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { Output, Resource } from "@pulumi/pulumi";
import { NodeName } from "./utils";

export class BaseVM {
  constructor(
    protected provider: proxmox.Provider,
    protected sshKey: string | Output<string>,
  ) {}
}

export interface ResourceBuilder {
  build(nodeName: NodeName): Resource;
}
