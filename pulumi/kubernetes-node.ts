import { BaseVM, ResourceBuilder } from "./baseVM";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { VirtualMachine } from "@muhlba91/pulumi-proxmoxve/vm/virtualMachine";
import { Output } from "@pulumi/pulumi";
import { IPv4 } from "ipaddr.js";

export class KubernetesNode
  extends BaseVM
  implements ResourceBuilder<proxmox.vm.VirtualMachine>
{
  private k8sNodeName: string;
  private ip: IPv4;

  constructor(
    private nodeIndex: number,
    protected provider: proxmox.Provider,
    protected nodeName: string,
    protected sshKey: string | Output<string>,
    protected baseImage: proxmox.storage.File,
    private datastoreId: string = "local-lvm",
  ) {
    super(provider, nodeName, sshKey, baseImage);
    this.k8sNodeName = `k8s-${nodeIndex}`;
    this.ip = new IPv4([192, 168, 1, 90 + nodeIndex]);
  }

  build(): VirtualMachine {
    const { provider, nodeName, sshKey, baseImage, datastoreId } = this;

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
