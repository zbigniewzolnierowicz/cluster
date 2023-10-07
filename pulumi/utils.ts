import * as proxmox from "@muhlba91/pulumi-proxmoxve";
import { ResourceBuilder } from "./baseVM";
import { Resource } from "@pulumi/pulumi";
import { parse } from "yaml";
import { readFileSync } from "fs";

export const nodes = ["asterix", "pve", "thinkcentre"] as const;
export type NodeName = (typeof nodes)[number];

const baseImageGenerator =
  (provider: proxmox.Provider) => (nodeName: NodeName) =>
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
      { provider },
    );

export const baseImagesListGenerator = (
  provider: proxmox.Provider,
): Record<NodeName, proxmox.storage.File> => {
  const baseImagesGen = baseImageGenerator(provider);
  return nodes.reduce(
    (acc, curr) => {
      const image = baseImagesGen(curr);
      if (!image) throw new Error(`Failed to generate base image for ${curr}`);
      return { ...acc, [curr]: image };
    },
    {} as Record<NodeName, proxmox.storage.File>,
  );
};

export const build = (
  services: Record<NodeName, ResourceBuilder[]>,
): Record<NodeName, Resource[]> => {
  return nodes.reduce(
    (acc, nodeName) => {
      acc[nodeName] = services[nodeName].map((resource) =>
        resource.build(nodeName),
      );
      return acc;
    },
    {} as Record<NodeName, Resource[]>,
  );
};

export interface NodeConfig {
  ansible_user: string;
  ansible_host: string;
}

export type NodeGroup = Record<string, NodeConfig>;

export const nodeConfig: Record<string, { hosts: NodeGroup }> = parse(
  readFileSync("../nodes.config.yaml").toString(),
);
