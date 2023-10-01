# Cluster

## Requirements

- yq
- jq
- charmbracelet/gum

## Steps

1. Prepare the LXC container templates
    - TODO: Create ansible playbook for customizing Alma Linux
        - based on: https://github.com/DMunkov/customize_pve_lxc_template
2. Deploy the infrastructure
    - When running on a fresh system, simply run `just build` and answer `yes` when asked whether you want to run `pulumi up`
