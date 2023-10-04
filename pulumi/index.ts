import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { WireguardVirtualMachines } from "./wireguard";
import { KubernetesNode } from "./kubernetes-node";
const config = new pulumi.Config("redo");
const sshKey = config.getSecret("ssh-key");
const proxmoxProvider = new proxmox.Provider("proxmox", {
  username: config.getSecret("proxmox-username"),
  password: config.getSecret("proxmox-password"),
  insecure: true,
  endpoint: config.get("proxmox-host"),
});

if (!sshKey) throw new Error("ssh key is not set");

const baseImageGenerator = (nodeName: string) =>
  new proxmox.storage.File(
    `${nodeName}-base-image`,
    {
      contentType: "iso",
      datastoreId: "local",
      nodeName,
      sourceFile: {
        path: "https://repo.almalinux.org/almalinux/9/cloud/x86_64/images/AlmaLinux-9-GenericCloud-9.2-20230513.x86_64.qcow2",
        fileName: "ALMA9.img",
      },
    },
    { provider: proxmoxProvider },
  );

const nodes = ["asterix", "pve", "thinkcentre"] as const;

const baseImagesList: Record<string, proxmox.storage.File> = nodes.reduce(
  (acc, curr) => {
    const image = baseImageGenerator(curr);
    if (!image) throw new Error(`Failed to generate base image for ${curr}`);
    return {
      ...acc,
      [curr]: image,
    };
  },
  {},
);

const wireguardService = (nodeName: string) =>
  new WireguardVirtualMachines(
    proxmoxProvider,
    nodeName,
    sshKey,
    baseImagesList[nodeName],
  );

const k8sNode = (index: number, nodeName: string, drive?: string) =>
  new KubernetesNode(
    index,
    proxmoxProvider,
    nodeName,
    sshKey,
    baseImagesList[nodeName],
    drive,
  );

export const services: Record<(typeof nodes)[number], any[]> = {
  asterix: [
    wireguardService("asterix").build(),
    k8sNode(0, "asterix", "data-nvme").build(),
  ],
  pve: [k8sNode(1, "pve").build()],
  thinkcentre: [k8sNode(2, "thinkcentre").build()],
};
