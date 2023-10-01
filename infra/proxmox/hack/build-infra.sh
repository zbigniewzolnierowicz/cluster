#!/usr/bin/env bash

SCRIPT=$(dirname $(realpath "$0"))
PULUMI_PATH=$(readlink -f "$SCRIPT/../pulumi")
ANSIBLE_PATH=$(readlink -f "$SCRIPT/../ansible")
ANSIBLE_INVENTORY_PATH="$ANSIBLE_PATH/inventory.yaml"

check_if_binaries_exist() {
    if ! command -v $1 &> /dev/null
    then
        echo -e "\e[31m[ERROR]\e[0m $1 could not be found"
        exit 1
    else
        echo -e "\e[34m[INFO]\e[0m Found $1!"
    fi
}

check_if_password() {
    if [ -z "$PASSWORD" ]
    then
        echo -e '\e[31m[ERROR]\e[0m NO PASSWORD. Export the $PASSWORD variable.'
        exit 255
    fi
}

check_if_infra_is_there() {
    check_if_password
    RESULT=`PULUMI_CONFIG_PASSPHRASE="$PASSWORD" pulumi about -j | jq -r ".currentStack.resources[]" 2> /dev/null`

    if [ -z "$RESULT" ]
    then
        return 1
    else
        return 0
    fi
}

setup_infra() {
    check_if_password
    pulumi up
}

 # @param: group
 # @param: host name
 # @param: IP address
 # @param: username
update_ansible_inventory_ip() {
    yq eval ".$1.hosts.$2.ansible_host = \"$3\"" --inplace $ANSIBLE_INVENTORY_PATH
    yq eval ".$1.hosts.$2.ansible_user = \"$4\"" --inplace $ANSIBLE_INVENTORY_PATH
}

extract_ip_from_cidr() {
    echo $1 | grep -Po '^(?:[0-9]{1,3}\.){3}[0-9]{1,3}'
}

get_container_ip() {
    check_if_password
    cd $PULUMI_PATH
    result=$(PULUMI_CONFIG_PASSPHRASE="$PASSWORD" pulumi stack output -j --show-secrets | jq -r ".$1.initialization.ipConfigs[0].ipv4.address")
    result_ip=`extract_ip_from_cidr $result`
    echo $result_ip
}

# ----- MAIN -----

check_if_binaries_exist "jq"
check_if_binaries_exist "yq"
check_if_binaries_exist "gum"

cd $PULUMI_PATH

check_if_infra_is_there
if [ $? -eq 1 ]; then
    echo -e "\e[34m[INFO]\e[0m No infrastructure."
    gum confirm 'Would you like to run `pulumi up`?'
    if [ ! $? -eq 0 ]; then
        echo -e "\e[34m[INFO]\e[0m Understood. Exiting."
        exit 1
    fi

    setup_infra
else
    echo -e "\e[34m[INFO]\e[0m Infrastructure detected."
fi

if [ ! -f "$ANSIBLE_INVENTORY_PATH" ]; then
    touch "$ANSIBLE_INVENTORY_PATH"
fi

echo -e "\e[34m[INFO]\e[0m Writing out the IP address."

update_ansible_inventory_ip "wireguard_hosts" "wireguard" $(get_container_ip "wgContainer[0]") "ubuntu"
