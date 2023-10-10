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
  @just ansible-kubernetes

flux-install:
  kubectl apply --kustomize ./kubernetes/bootstrap
  cat $AGE_KEY_PATH | kubectl -n flux-system create secret generic sops-age --from-file=age.agekey=/dev/stdin
  sops --decrypt ./kubernetes/flux/vars/cluster-secrets.sops.yaml | kubectl apply -f -
  sops --decrypt ./kubernetes/flux/vars/cluster-secrets-user.sops.yaml | kubectl apply -f -
  kubectl apply -f ./kubernetes/flux/vars/cluster-settings.yaml
  kubectl apply -f ./kubernetes/flux/vars/cluster-settings-user.yaml
  kubectl apply --kustomize ./kubernetes/flux/config

ansible-flux:
  ansible-playbook ./ansible/playbooks/flux-settings.yaml -i ./nodes.config.yaml
