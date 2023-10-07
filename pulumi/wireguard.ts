import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { BaseVM, ResourceBuilder } from "./baseVM";
import { Output, Resource } from "@pulumi/pulumi";
import { NodeConfig, NodeName, nodeConfig } from "./utils";
import { baseImagesList } from ".";

export class WireguardVirtualMachines
  extends BaseVM
  implements ResourceBuilder
{
  private config: NodeConfig;
  private name: string;
  constructor(
    protected index: number,
    protected provider: proxmox.Provider,
    protected sshKey: string | Output<string>,
  ) {
    super(provider, sshKey);
    this.name = `wg-${index.toString().padStart(2, "0")}`;
    this.config = nodeConfig.wg.hosts[this.name];
  }

  build(nodeName: NodeName): Resource {
    const { provider, sshKey } = this;
    const baseImage = baseImagesList[nodeName];

    const wgContainer = new proxmox.vm.VirtualMachine(
      this.name,
      {
        name: this.name,
        description:
          "Virtual machine running Wireguard, a VPN allowing me to access my local network",
        tags: ["small"],

        nodeName,
        vmId: 8000,
        memory: { shared: 2048 },
        disks: [
          {
            datastoreId: "data-nvme",
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
                address: `${this.config.ansible_host}/24`,
                gateway: "192.168.1.1",
              },
            },
          ],
          userAccount: {
            username: this.config.ansible_user,
            keys: [sshKey],
          },
        },

        networkDevices: [
          {
            bridge: "vmbr0",
          },
        ],

        cpu: { type: "host", cores: 2 },

        operatingSystem: { type: "l26" },

        cdrom: { enabled: false, interface: "ide3" },
        started: true,
      },
      { provider },
    );

    return wgContainer;
  }
}
