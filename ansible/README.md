# Ansible

Ansible applies the repeatable Ubuntu host baseline. The controller runs from
Ubuntu 24.04 under WSL2; managed nodes are Ubuntu Server systems reached over
key-only SSH.

## Controller installation

Install the pinned controller version in WSL:

```bash
sudo apt update
sudo apt install -y pipx
pipx ensurepath
pipx install ansible-core==2.21.1
```

The same version is recorded in `requirements.txt` for future rebuilds.

## Private inventory

Exact LAN addresses are intentionally excluded from this public repository.
Create the ignored local inventory from the example:

```bash
cd /mnt/c/Users/ethnb/Documents/Homelab/ansible
cp inventory/hosts.example.yml inventory/hosts.yml
nano inventory/hosts.yml
```

Replace `CHANGE_ME` with the address from the private inventory. Never force-add
`inventory/hosts.yml` to Git.

## SSH key

The inventory expects the dedicated controller key at:

```text
~/.ssh/homelab_ansible
```

Load its passphrase-protected private key into an agent for the current WSL
session:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/homelab_ansible
```

Only public keys may be copied to managed nodes.

## Validate connectivity

The repository is stored on a Windows-mounted filesystem, so specify the config
file explicitly rather than relying on Ansible's current-directory discovery:

```bash
cd /mnt/c/Users/ethnb/Documents/Homelab/ansible
export ANSIBLE_CONFIG="$PWD/ansible.cfg"

ansible-inventory --graph
ansible homelab -m ansible.builtin.ping
```

## Apply the baseline

Start with check mode and review the proposed changes:

```bash
ansible-playbook playbooks/baseline.yml --check --diff --ask-become-pass
```

Apply only after check mode is understood:

```bash
ansible-playbook playbooks/baseline.yml --diff --ask-become-pass
```

The play runs one host at a time. Keep an existing SSH session open during the
first application of SSH policy.

## Managed baseline

- Hostname matches the inventory name.
- Timezone is `Europe/London` and systemd time synchronisation is enabled.
- Common diagnostic and administration packages are installed.
- Unattended security updates are enabled.
- SSH permits public keys only and denies direct root login.

Network addresses, firmware, storage layout, Tailscale, and k3s are deliberately
outside this initial role. They require host-specific data or separate rollout
and recovery procedures.
