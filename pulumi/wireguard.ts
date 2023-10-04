import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { BaseVM, ResourceBuilder } from "./baseVM";

export class WireguardVirtualMachines
  extends BaseVM
  implements ResourceBuilder<proxmox.vm.VirtualMachine>
{
  public build() {
    const { provider, nodeName, sshKey, baseImage } = this;

    const wgContainer = new proxmox.vm.VirtualMachine(
      "wireguard",
      {
        name: "wireguard",
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
            { ipv4: { address: "192.168.1.100/24", gateway: "192.168.1.1" } },
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

        cpu: { type: "host", cores: 1 },

        operatingSystem: { type: "l26" },

        cdrom: { enabled: false, interface: "ide3" },
        started: true,
      },
      { provider },
    );

    return wgContainer;
  }
}
