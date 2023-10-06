import { BaseVM, ResourceBuilder } from "./baseVM";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { Output, Resource } from "@pulumi/pulumi";
import { IPv4 } from "ipaddr.js";
import { NodeName } from "./utils";
import { baseImagesList } from ".";

export class KubernetesNode extends BaseVM implements ResourceBuilder {
  private k8sNodeName: string;
  private ip: IPv4;

  constructor(
    private nodeIndex: number,
    protected provider: proxmox.Provider,
    protected sshKey: string | Output<string>,
    private datastoreId: string = "local-lvm",
  ) {
    super(provider, sshKey);
    this.k8sNodeName = `k8s-${nodeIndex}`;
    this.ip = new IPv4([192, 168, 1, 90 + nodeIndex]);
  }

  build(nodeName: NodeName): Resource {
    const { provider, sshKey, datastoreId } = this;
    const baseImage = baseImagesList[nodeName];

    const k8sNode = new proxmox.vm.VirtualMachine(
      this.k8sNodeName,
      {
        name: this.k8sNodeName,
        description: `Kubernetes node number ${this.nodeIndex}`,
        tags: ["big", "kubernetes"],

        nodeName,
        vmId: 300 + this.nodeIndex,
        memory: { dedicated: 8192 },
        disks: [
          {
            datastoreId,
            fileId: baseImage.id,
            interface: "scsi0",
            size: 20,
          },
        ],

        initialization: {
          type: "nocloud",
          ipConfigs: [
            {
              ipv4: {
                address: `${this.ip.toString()}/24`,
                gateway: "192.168.1.1",
              },
            },
          ],
          userAccount: {
            username: "admin",
            keys: [sshKey],
          },
        },

        networkDevices: [
          {
            bridge: "vmbr0",
          },
        ],

        cpu: { type: "host", cores: 4 },

        operatingSystem: { type: "l26" },

        cdrom: { enabled: false, interface: "ide3" },
        started: true,
      },
      { provider },
    );

    return k8sNode;
  }
}
