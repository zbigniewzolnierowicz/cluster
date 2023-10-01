import * as pulumi from "@pulumi/pulumi";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { resolve } from "path";
import { readFileSync } from "fs";
import { homedir } from "os";

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

const wireguardGenerator = (nodeName: string) => {
  const baseImage = new proxmox.storage.File(
    `${nodeName}-base-image`,
    {
      contentType: "iso",
      datastoreId: "local",
      nodeName,
      sourceFile: {
        path: "http://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img",
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

  return wgContainer;
};

const wgContainer = wireguardGenerator("asterix");

export { wgContainer };
