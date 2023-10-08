default:
  just --list

infra:
  ./hack/build-infra.sh

ansible-wireguard:
  ansible-playbook ./ansible/playbooks/wg-setup.yaml -i ./nodes.config.yaml

ansible-kubernetes:
  ansible-playbook ./ansible/playbooks/kubernetes.yaml -i ./nodes.config.yaml

build:
  @just infra
  @just ansible-wireguard
