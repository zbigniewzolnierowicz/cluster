default:
    just --list

infra:
    ./hack/build-infra.sh

ansible-wireguard:
    ansible-playbook ./ansible/playbooks/wg-setup.yaml -i ./ansible/inventory.yaml

build:
    @just infra
    @just ansible-wireguard
