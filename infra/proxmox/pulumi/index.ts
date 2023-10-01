import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { resolve } from "path";
import { readFileSync } from "fs";
import { homedir } from "os";
import { WireguardVirtualMachines } from "./wireguard";

const config = new pulumi.Config("redo");
const sshKey = readFileSync(
  resolve(`${homedir()}/.ssh/${config.require("ssh-key")}`),
).toString();

const proxmoxConfig: proxmox.ProviderArgs = {
  endpoint: config.require("proxmox-host"),
  insecure: true,
  username: config.require("proxmox-username"),
  password: config.require("proxmox-password"),
};

const provider = new proxmox.Provider("proxmoxve", proxmoxConfig);

const wireguardService = new WireguardVirtualMachines(
  provider,
  "asterix",
  sshKey,
);
export const wgContainer = wireguardService.build();
