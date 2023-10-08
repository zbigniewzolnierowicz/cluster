#!/usr/bin/env bash

something_unencrypted=0

shopt -s nullglob
for i in **/*.sops.yaml; do
  cat $i | yq -e .sops &> /dev/null
  if [[ $? -eq 1 ]]; then
    echo "$i is not encrypted!"
    something_unencrypted=1
  fi
done

exit $something_unencrypted
