# Cluster

My cluster, heavily ~plagiarized~ inspired by [onedr0p/flux-cluster-template](https://github.com/onedr0p/flux-cluster-template).

I liked their ansible setup, but not very much how they did everything else, also this is very much a learning experience for me. Also, heavily integrated with Pulumi.

All of the configs are either in .env or in nodes.config.yaml (which also serves as the Ansible inventory)

## Requirements

- mikefarah/yq
- jq
- charmbracelet/gum
- just

## TODO

- [ ] Create backup and restore Ansible playbooks for Wireguard
- [ ] Create backup and restore Ansible playbooks for Pi-Hole
