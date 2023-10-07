import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { WireguardVirtualMachines } from "./wireguard";
import { KubernetesNode } from "./kubernetes-node";
import { NodeName, baseImagesListGenerator, build } from "./utils";
const config = new pulumi.Config("redo");
const sshKey = config.getSecret("ssh-key");

const proxmoxProvider = new proxmox.Provider("proxmox", {
  username: config.getSecret("proxmox-username"),
  password: config.getSecret("proxmox-password"),
  insecure: true,
  endpoint: config.get("proxmox-host"),
});

if (!sshKey) throw new Error("ssh key is not set");

export const baseImagesList = baseImagesListGenerator(proxmoxProvider);

const wireguardService = (index: number) =>
  new WireguardVirtualMachines(index, proxmoxProvider, sshKey);

const k8sNode = (index: number, drive?: string) =>
  new KubernetesNode(index, proxmoxProvider, sshKey, drive);

export const services: Record<NodeName, pulumi.Resource[]> = build({
  asterix: [wireguardService(0), k8sNode(0, "data-nvme")],
  pve: [k8sNode(1)],
  thinkcentre: [k8sNode(2)],
});
