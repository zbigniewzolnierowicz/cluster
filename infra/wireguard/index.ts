import * as pulumi from "@pulumi/pulumi";
import { proxmoxProvider } from "@zed-infra/proxmox";
import { WireguardVirtualMachines } from "./wireguard";

const config = new pulumi.Config("redo");
const sshKey = config.getSecret("ssh-key");

if (!sshKey) throw new Error("ssh key is not set");

const wireguardService = new WireguardVirtualMachines(
  proxmoxProvider,
  "asterix",
  sshKey,
);

export const wgContainer = wireguardService.build();
