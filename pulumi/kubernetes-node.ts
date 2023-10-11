import { BaseVM, ResourceBuilder } from "./baseVM";
import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { Output, Resource } from "@pulumi/pulumi";
import { IPv4, parse } from "ipaddr.js";
import { NodeConfig, NodeName, nodeConfig } from "./utils";
import { baseImagesList } from ".";

const DISABLE_PASSTHROUGH_FOR_THESE_INDEXES = [2];

export class KubernetesNode extends BaseVM implements ResourceBuilder {
  private k8sNodeName: string;
  private ip: IPv4;
  private config: NodeConfig;
  private passthrough: boolean;

  constructor(
    private nodeIndex: number,
    protected provider: proxmox.Provider,
    protected sshKey: string | Output<string>,
    private datastoreId: string = "local-lvm",
  ) {
    super(provider, sshKey);
    this.k8sNodeName = `k8s-${nodeIndex.toString().padStart(2, "0")}`;
    this.config = nodeConfig.kubernetes.hosts[this.k8sNodeName];
    const ip = parse(this.config.ansible_host);
    this.passthrough =
      DISABLE_PASSTHROUGH_FOR_THESE_INDEXES.includes(nodeIndex);

    if (ip.kind() !== "ipv4") {
      throw new Error("Not valid IPv4!");
    }

    this.ip = ip as IPv4;
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
        machine: "q35",

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
            username: this.config.ansible_user,
            keys: [sshKey],
          },
        },

        vga: {
          enabled: true,
          type: "serial0",
          memory: 4,
        },

        networkDevices: [
          {
            bridge: "vmbr0",
          },
        ],

        cpu: { type: "host", cores: 4 },

        operatingSystem: { type: "l26" },

        cdrom: { enabled: false, interface: "ide3" },

        hostpcis: this.passthrough
          ? [
              {
                pcie: true,
                device: "0",
                id: "0000:00:02.0",
                xvga: true,
              },
            ]
          : [],

        started: true,
      },
      { provider },
    );

    return k8sNode;
  }
}
