import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import * as cloudflare from "@pulumi/cloudflare";

import { WireguardVirtualMachines } from "./wireguard";
import { KubernetesNode } from "./kubernetes-node";
import { CloudflareRecords } from "./cloudflare";
import { NodeName, baseImagesListGenerator, build, nodeConfig } from "./utils";
const config = new pulumi.Config("redo");
const sshKey = config.getSecret("ssh-key");

const proxmoxProvider = new proxmox.Provider("proxmox", {
  username: config.getSecret("proxmox-username"),
  password: config.getSecret("proxmox-password"),
  insecure: true,
  endpoint: config.get("proxmox-host"),
});

const cloudflareProvider = new cloudflare.Provider("cloudflare", {
  apiToken: process.env["CLOUDFLARE_TOKEN"],
});

if (!sshKey) throw new Error("ssh key is not set");

export const baseImagesList = baseImagesListGenerator(proxmoxProvider);

const wireguardService = (index: number) =>
  new WireguardVirtualMachines(index, proxmoxProvider, sshKey);

const k8sNode = (index: number, drive?: string) =>
  new KubernetesNode(index, proxmoxProvider, sshKey, drive);

const cloudflareRecords = new CloudflareRecords(cloudflareProvider);

type ServiceKeys = NodeName | "cloudflare";

export const services: Record<ServiceKeys, pulumi.Resource[]> = {
  ...build({
    asterix: [wireguardService(0), k8sNode(0, "data-nvme")],
    pve: [k8sNode(1)],
    thinkcentre: [k8sNode(2)],
  }),
  cloudflare: cloudflareRecords.build(),
};
