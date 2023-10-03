import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";

const config = new pulumi.Config("redo");

const proxmoxConfig: proxmox.ProviderArgs = {
  endpoint: config.require("proxmox-host"),
  insecure: true,
  username: config.require("proxmox-username"),
  password: config.require("proxmox-password"),
};

export const provider = new proxmox.Provider("proxmoxve", proxmoxConfig);
