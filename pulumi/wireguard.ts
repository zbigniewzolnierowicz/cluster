import * as proxmox from "@muhlba91/pulumi-proxmoxve";

export class WireguardVirtualMachines {
  constructor(
    private provider: proxmox.Provider,
    private nodeName: string,
    private sshKey: string,
  ) {}

  public build(): proxmox.vm.VirtualMachine[] {
    const { provider, nodeName, sshKey } = this;
    const baseImage = new proxmox.storage.File(
      `${nodeName}-base-image`,
      {
        contentType: "iso",
        datastoreId: "local",
        nodeName,
        sourceFile: {
          path: "https://cloud.debian.org/images/cloud/bookworm/latest/debian-12-nocloud-amd64.qcow2",
          fileName: "debian-12-nocloud-amd64.img",
        },
      },
      { provider },
    );

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
          },
        ],

        initialization: {
          type: "nocloud",
          ipConfigs: [
            { ipv4: { address: "192.168.1.100/24", gateway: "192.168.1.1" } },
          ],
          userAccount: {
            keys: [sshKey],
          },
        },

        networkDevices: [
          {
            bridge: "vmbr0",
          },
        ],

        operatingSystem: { type: "l26" },

        cdrom: { enabled: false, interface: "ide3" },
        started: true,
      },
      { provider },
    );

    return [wgContainer];
  }
}
