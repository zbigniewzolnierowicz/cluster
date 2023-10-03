import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { WireguardVirtualMachines } from "./wireguard";

const config = new pulumi.Config("redo");
const sshKey = config.getSecret("ssh-key");
const proxmoxProvider = new proxmox.Provider('proxmox', {
    username: config.getSecret("proxmox-username"),
    password: config.getSecret("proxmox-password"),
    insecure: true,
    endpoint: config.get("proxmox-host")
})

if (!sshKey) throw new Error("ssh key is not set");

const wireguardService = new WireguardVirtualMachines(
  proxmoxProvider,
  "asterix",
  sshKey,
);

export const wgContainer = wireguardService.build();
